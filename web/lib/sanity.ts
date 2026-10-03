import { query } from "./query";
import "server-only";
import { parseGuides } from "./model";
import { withContentRevision } from "./content-revision";
import { readPublicJson } from "./public-json";
// Published documents only. No credential is read or sent by the web app.
export const projectId = process.env.SANITY_PROJECT_ID ?? "ipp6nys2";
export const dataset = process.env.SANITY_DATASET ?? "production";
export const publicDatasetUrl = `https://${projectId}.api.sanity.io/v2026-09-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
export async function getGuides() {
  if (!/^[a-z0-9]{8}$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset))
    throw new Error("Invalid Sanity configuration");
  const body = (await readPublicJson(publicDatasetUrl)) as { result?: unknown };
  return parseGuides(body?.result).map(withContentRevision);
}
