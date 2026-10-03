// Shared by Studio and the public build. No credentials or mutation client here.
/** @param {any} guide */
export function contentPayload(guide) {
  const canonical = (value) =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, canonical(value[key])]),
          )
        : value;
  return JSON.stringify(canonical({ ...guide, revision: "content-v2" }));
}
/** @param {any} guide */
export async function fingerprint(guide) {
  const bytes = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(contentPayload(guide)),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
/** @param {any} guide @param {any} proposal @param {any} inspect */
export function validateProposal(guide, proposal, inspect) {
  if (
    !proposal ||
    proposal._type !== "repairProposal" ||
    proposal.guide?._ref !== guide.id ||
    proposal.fingerprint !== guide.revision
  )
    throw new Error(
      "Stale proposal: create a new proposal for current content.",
    );
  const stored = proposal.experiment;
  if (
    !stored ||
    !Array.isArray(stored.versions) ||
    stored.versions.length !==
      new Set(stored.versions.map((item) => item?.tool?._ref)).size ||
    stored.versions.some(
      (item) =>
        !item ||
        typeof item.tool?._ref !== "string" ||
        !Number.isInteger(item.version),
    )
  )
    throw new Error("Invalid structured versions.");
  const experiment = {
    ...stored,
    versions: Object.fromEntries(
      stored.versions.map((item) => [item.tool._ref, item.version]),
    ),
  };
  if (
    !experiment ||
    !Array.isArray(experiment.prerequisites) ||
    !Array.isArray(experiment.disabled) ||
    !experiment.versions ||
    typeof experiment.versions !== "object" ||
    Array.isArray(experiment.versions)
  )
    throw new Error("Invalid repair conditions.");
  const prereqs = new Set(guide.prerequisites.map((item) => item.id));
  const tools = new Map(
    guide.defaults.map((item) => [item.tool.id, item.tool]),
  );
  if (
    experiment.disabled.length ||
    experiment.prerequisites.length !==
      new Set(experiment.prerequisites).size ||
    experiment.prerequisites.some((id) => !prereqs.has(id)) ||
    Object.keys(experiment.versions).length !== tools.size ||
    Object.entries(experiment.versions).some(
      ([id, version]) => !tools.get(id)?.releases.includes(version),
    ) ||
    inspect(guide, experiment).length
  )
    throw new Error(
      "A proposal must pass every step with published tool versions.",
    );
  return experiment;
}
/** @param {any} guide @param {any[]} proposals @param {any} inspect */
export function approvedProposal(guide, proposals, inspect) {
  for (const proposal of proposals
    .filter((item) => item?.status === "approved")
    .sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt)))) {
    try {
      validateProposal(guide, proposal, inspect);
      return {
        ...proposal,
        experiment: validateProposal(guide, proposal, inspect),
      };
    } catch {
      /* Invalid/stale records never reach the public UI. */
    }
  }
  return null;
}
/** @param {any} proposal @param {'approved'|'rejected'} status @param {any[]} sources @param {string} now @param {string} nonce */
export function decisionMutations(proposal, status, sources, now, nonce) {
  if (
    proposal.status !== "pending" ||
    !proposal._rev ||
    !["approved", "rejected"].includes(status)
  )
    throw new Error(
      "Only pending proposals can be reviewed. Refresh before retrying.",
    );
  const guards =
    status === "approved"
      ? sources.map((source) => ({
          patch: {
            id: source._id,
            ifRevisionID: source._rev,
            set: { repairReviewGuard: nonce },
          },
        }))
      : [];
  return [
    ...guards,
    {
      patch: {
        id: proposal._id,
        ifRevisionID: proposal._rev,
        set: { status, reviewedAt: now },
      },
    },
  ];
}

/** @param {any} experiment */
export function storedExperiment(experiment) {
  return {
    ...experiment,
    versions: Object.entries(experiment.versions).map(([id, version]) => ({
      _key: id,
      _type: "repairVersion",
      tool: { _type: "reference", _ref: id },
      version,
    })),
  };
}

/** Owner-only diagnostic: impossible revision preconditions guarantee rollback.
 * @param {any} source @param {any} proposal @param {string} target @param {string} nonce
 */
export function staleGuardMutations(source, proposal, target, nonce) {
  if (
    !source?._rev ||
    !proposal?._rev ||
    proposal.status !== "approved" ||
    proposal.guide?._ref !== source._id ||
    !["source", "proposal"].includes(target)
  )
    throw new Error("Invalid stale guard check");
  return [
    {
      patch: {
        id: source._id,
        ifRevisionID:
          source._rev + (target === "source" ? "-intentionally-stale" : ""),
        set: { repairReviewGuard: nonce },
      },
    },
    {
      patch: {
        id: proposal._id,
        ifRevisionID:
          proposal._rev + (target === "proposal" ? "-intentionally-stale" : ""),
        set: { status: proposal.status },
      },
    },
  ];
}
