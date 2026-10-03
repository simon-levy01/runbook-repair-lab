import { createHash } from "node:crypto";
import type { Guide } from "./model";
import { contentPayload } from "./workflow.mjs";
// Hash modeled content, independent of metadata-only transaction guards.
export function withContentRevision(guide: Guide): Guide {
  return {
    ...guide,
    revision: createHash("sha256").update(contentPayload(guide)).digest("hex"),
  };
}
