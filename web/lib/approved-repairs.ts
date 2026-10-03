import "server-only";
import { inspect, type Guide, type Experiment } from "./model";
import { approvedProposal } from "./workflow.mjs";
import { readPublicJson } from "./public-json";
import { projectId, dataset } from "./sanity";
export async function getApprovedRepairs(
  guides: Guide[],
): Promise<Record<string, Experiment>> {
  const query =
    '*[_type == "repairProposal" && status == "approved" && !(_id in path("drafts.**"))] | order(reviewedAt desc)[0...100]{_type,guide,fingerprint,status,experiment,reviewedAt}';
  const body = (await readPublicJson(
    `https://${projectId}.api.sanity.io/v2026-09-01/data/query/${dataset}?query=${encodeURIComponent(query)}`,
  )) as { result?: unknown };
  if (!Array.isArray(body.result))
    throw new Error("Invalid repair proposal response");
  return Object.fromEntries(
    guides.flatMap((guide) => {
      const proposal = approvedProposal(
        guide,
        body.result as unknown[],
        inspect,
      );
      return proposal ? [[guide.id, proposal.experiment]] : [];
    }),
  );
}
