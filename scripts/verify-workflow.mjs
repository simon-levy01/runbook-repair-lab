import { request } from "node:https";
import assert from "node:assert/strict";
import { query } from "../web/lib/query.ts";
import { parseGuides, inspect } from "../web/lib/model.ts";
import { withContentRevision } from "../web/lib/content-revision.ts";
import { approvedProposal, validateProposal } from "../web/lib/workflow.mjs";
const project = "ipp6nys2";
const root = `https://${project}.api.sanity.io/v2026-09-01/data`;
const result = await fetch(
  `${root}/query/production?query=${encodeURIComponent('*[_type == "repairProposal" && !(_id in path("drafts.**"))]{_id,_type,title,status,fingerprint,guide,experiment,reviewedAt}')}`,
  { signal: AbortSignal.timeout(8000) },
);
assert.equal(result.status, 200);
const body = await result.json();
assert.ok(Array.isArray(body.result));
const guidesResponse = await fetch(
  `${root}/query/production?query=${encodeURIComponent(query)}`,
  { signal: AbortSignal.timeout(8000) },
);
assert.equal(guidesResponse.status, 200);
const guides = parseGuides((await guidesResponse.json()).result).map(
  withContentRevision,
);
const projection = guides.map((guide) => ({
  guideId: guide.id,
  title: guide.title,
  approvedProposalId:
    approvedProposal(guide, body.result, inspect)?._id ?? null,
}));
const proposals = body.result.map((proposal) => {
  const guide = guides.find((item) => item.id === proposal.guide?._ref);
  let valid = false;
  try {
    validateProposal(guide, proposal, inspect);
    valid = true;
  } catch {}
  return {
    id: proposal._id,
    guideId: proposal.guide?._ref,
    status: proposal.status,
    validForCurrentContent: valid,
  };
});
for (const guide of guides) {
  const approved = approvedProposal(guide, body.result, inspect);
  if (approved) {
    assert.equal(inspect(guide, approved.experiment).length, 0);
    assert.equal(
      approvedProposal(
        { ...guide, revision: "intentionally-stale" },
        body.result,
        inspect,
      ),
      null,
    );
    assert.equal(
      approvedProposal(
        withContentRevision({ ...guide, title: guide.title + " changed" }),
        body.result,
        inspect,
      ),
      null,
    );
  }
}
console.log(
  JSON.stringify({
    project,
    dataset: "production",
    liveProposalCount: body.result.length,
    statuses: body.result.map((item) => item.status),
    proposals,
    publicApprovedProjection: projection,
  }),
);
// Valid same-value patch exercises write authorization without changing modeled content.
// Invalid revisions/nonexistent documents are checked before permissions and are inconclusive.
const sourceResponse = await fetch(
  `${root}/query/production?query=${encodeURIComponent('*[_id == "cpzPQInBrCoN3lSGL6JQrG"][0]{_id,_rev,title}')}`,
  { signal: AbortSignal.timeout(8000) },
);
assert.equal(sourceResponse.status, 200);
const source = (await sourceResponse.json()).result;
const status = await new Promise((resolve, reject) => {
  const req = request(
    `${root}/mutate/production`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      timeout: 8000,
    },
    (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode));
    },
  );
  req.on("error", reject);
  req.on("timeout", () => req.destroy(new Error("Timed out")));
  req.end(
    JSON.stringify({
      mutations: [
        {
          patch: {
            id: source._id,
            ifRevisionID: source._rev,
            set: { title: source.title },
          },
        },
      ],
    }),
  );
});
assert.ok(
  status === 401 || status === 403,
  `Anonymous mutation must be denied, got ${status}`,
);
console.log(
  JSON.stringify({
    anonymousSameValuePatchStatus: status,
    changedDocuments: 0,
  }),
);
