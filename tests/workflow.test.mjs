import test from "node:test";
import assert from "node:assert/strict";
import { guides } from "./fixtures.mjs";
import { repair, inspect } from "../web/lib/model.ts";
import { withContentRevision } from "../web/lib/content-revision.ts";
import {
  fingerprint,
  validateProposal,
  approvedProposal,
  decisionMutations,
  storedExperiment,
} from "../web/lib/workflow.mjs";
const guide = withContentRevision(guides[0]);
const proposal = {
  _type: "repairProposal",
  _id: "repair-fixture",
  _rev: "proposal-rev",
  guide: { _ref: guide.id },
  fingerprint: guide.revision,
  experiment: storedExperiment(repair(guide)),
  status: "pending",
};
test("browser and build fingerprints match; metadata-only guards preserve content identity", async () => {
  assert.equal(await fingerprint(guides[0]), guide.revision);
  assert.equal(
    withContentRevision({ ...guides[0], revision: "new-rev" }).revision,
    guide.revision,
  );
  assert.notEqual(
    withContentRevision({ ...guides[0], title: "Changed" }).revision,
    guide.revision,
  );
});
test("only matching, complete, valid approved proposals are visible", () => {
  assert.deepEqual(validateProposal(guide, proposal, inspect), repair(guide));
  assert.equal(approvedProposal(guide, [proposal], inspect), null);
  assert.equal(
    approvedProposal(guide, [{ ...proposal, status: "rejected" }], inspect),
    null,
  );
  assert.equal(
    approvedProposal(
      guide,
      [{ ...proposal, status: "approved", fingerprint: "old" }],
      inspect,
    ),
    null,
  );
  assert.equal(
    approvedProposal(
      guide,
      [
        {
          ...proposal,
          status: "approved",
          experiment: storedExperiment({
            ...repair(guide),
            disabled: [guide.steps[0].id],
          }),
        },
      ],
      inspect,
    ),
    null,
  );
  assert.ok(
    approvedProposal(guide, [{ ...proposal, status: "approved" }], inspect),
  );
  assert.throws(() =>
    validateProposal(
      guide,
      {
        ...proposal,
        experiment: { ...repair(guide), versions: { unexpected: 1 } },
      },
      inspect,
    ),
  );
});
test("approval atomically guards source and proposal revisions; rejection guards proposal only", () => {
  const mutations = decisionMutations(
    proposal,
    "approved",
    [{ _id: guide.id, _rev: "source-rev" }],
    "2026-10-03T00:00:00Z",
    "nonce",
  );
  assert.equal(mutations.length, 2);
  assert.equal(mutations[0].patch.ifRevisionID, "source-rev");
  assert.equal(mutations[1].patch.ifRevisionID, "proposal-rev");
  assert.equal(mutations[1].patch.set.status, "approved");
  assert.equal(
    decisionMutations(proposal, "rejected", [], "now", "nonce").length,
    1,
  );
  assert.throws(() =>
    decisionMutations(
      { ...proposal, status: "approved" },
      "rejected",
      [],
      "now",
      "nonce",
    ),
  );
});
test("interrupted retry cannot transition a previously decided proposal", () => {
  assert.throws(() =>
    decisionMutations(
      { ...proposal, status: "rejected" },
      "approved",
      [],
      "now",
      "nonce",
    ),
  );
});
