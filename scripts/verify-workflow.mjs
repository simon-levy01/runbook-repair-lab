import { request } from "node:https";
import assert from "node:assert/strict";
const project = "ipp6nys2";
const root = `https://${project}.api.sanity.io/v2026-09-01/data`;
const result = await fetch(
  `${root}/query/production?query=${encodeURIComponent('*[_type == "repairProposal" && !(_id in path("drafts.**"))]{_id,status,fingerprint,guide,experiment}')}`,
  { signal: AbortSignal.timeout(8000) },
);
assert.equal(result.status, 200);
const body = await result.json();
assert.ok(Array.isArray(body.result));
console.log(
  JSON.stringify({
    project,
    dataset: "production",
    liveProposalCount: body.result.length,
    statuses: body.result.map((item) => item.status),
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
