import { readFileSync } from "node:fs";
// Node's --env-file loads the protected Studio configuration. Nothing secret is logged.
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const token = process.env.SANITY_AUTH_TOKEN;
if (!projectId || !dataset || !token)
  throw new Error("Run with --env-file=sanity/.env.local");
const base = `https://${projectId}.api.sanity.io/v2026-09-01/data`;
async function mutate(doc) {
  const response = await fetch(`${base}/mutate/${dataset}?returnIds=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mutations: [{ create: doc }] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Sanity seed failed (${response.status}); response omitted`,
    );
  return (await response.json()).results[0].id;
}
const content = JSON.parse(
  readFileSync(new URL("../content/fixtures.json", import.meta.url), "utf8"),
);
const existingResponse = await fetch(
  `${base}/query/${dataset}?query=${encodeURIComponent('*[_type in ["tool","prerequisite","guide"]]{_id,_type,title}')}`,
  { signal: AbortSignal.timeout(15000) },
);
if (!existingResponse.ok)
  throw new Error("Cannot inspect existing fixture documents");
const existing = (await existingResponse.json()).result;
const ids = {};
for (const type of ["tool", "prerequisite", "guide"]) {
  for (const item of content[type]) {
    const { key, ...original } = item;
    const doc = JSON.parse(
      JSON.stringify(original).replaceAll(/"\$ref:([a-z0-9-]+)"/g, (_, ref) =>
        JSON.stringify(ids[ref]),
      ),
    );
    if (JSON.stringify(doc).includes("undefined"))
      throw new Error("Unresolved fixture reference");
    const matching = existing.filter(
      (d) => d._type === type && d.title === doc.title,
    );
    if (matching.length > 1)
      throw new Error("Duplicate fixture title; inspect manually");
    ids[key] = matching[0]?._id ?? (await mutate({ _type: type, ...doc }));
  }
}
console.log(
  `Seed verified: ${Object.keys(ids).length} fictional documents in ${projectId}/${dataset}. No credentials logged.`,
);
