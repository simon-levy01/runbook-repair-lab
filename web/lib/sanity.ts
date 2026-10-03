import { query } from "./query";
import "server-only";
import { parseGuides } from "./model";
import { withContentRevision } from "./content-revision";
// Published documents only. No credential is read or sent by the frontend.
export const projectId = process.env.SANITY_PROJECT_ID ?? "ipp6nys2";
export const dataset = process.env.SANITY_DATASET ?? "production";
export const publicDatasetUrl = `https://${projectId}.api.sanity.io/v2026-09-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
export async function getGuides() {
  if (!/^[a-z0-9]{8}$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset))
    throw new Error("Invalid Sanity configuration");
  const response = await fetch(publicDatasetUrl, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Content service unavailable");
  const body = await response.json();
  return parseGuides(body.result).map(withContentRevision);
}
