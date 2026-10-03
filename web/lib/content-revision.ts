import { createHash } from "node:crypto";
import type { Guide } from "./model";
// Includes resolved reference content so reference-only edits invalidate local experiments.
export function withContentRevision(guide: Guide): Guide {
  return {
    ...guide,
    revision: createHash("sha256").update(JSON.stringify(guide)).digest("hex"),
  };
}
