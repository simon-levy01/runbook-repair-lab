import assert from "node:assert/strict";
import { query } from "../web/lib/query.ts";
import { parseGuides, baseline, inspect, repair } from "../web/lib/model.ts";
const projectId = process.env.SANITY_PROJECT_ID ?? "ipp6nys2";
const dataset = process.env.SANITY_DATASET ?? "production";
if (!/^[a-z0-9]{8}$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset))
  throw new Error("Invalid public metadata");
const url = `https://${projectId}.api.sanity.io/v2026-09-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
assert.equal(
  response.status,
  200,
  "Published dataset must be readable without any credential",
);
const guides = parseGuides((await response.json()).result);
assert.equal(guides.length, 3, "Expected three published fictional guides");
for (const guide of guides) {
  assert.equal(guide.steps.length, 3);
  assert.ok(inspect(guide, baseline(guide)).length > 0);
  assert.deepEqual(inspect(guide, repair(guide)), []);
}
console.log(
  JSON.stringify(
    {
      projectId,
      dataset,
      authenticated: false,
      guides: guides.map((g) => ({
        id: g.id,
        title: g.title,
        steps: g.steps.length,
        baselineFindings: inspect(g, baseline(g)).length,
        repairedFindings: inspect(g, repair(g)).length,
      })),
      status: "Public backend contract and deterministic checks passed",
    },
    null,
    2,
  ),
);
