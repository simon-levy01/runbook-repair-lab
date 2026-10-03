export type Tool = { id: string; title: string; releases: number[] };
export type Prerequisite = {
  id: string;
  title: string;
  detail: string;
  capability: string;
};
export type Requirement = { tool: Tool; min: number; max: number };
export type Step = {
  id: string;
  title: string;
  detail: string;
  example: string;
  needs: string[];
  gives: string[];
  tools: Requirement[];
};
export type Guide = {
  id: string;
  revision: string;
  title: string;
  summary: string;
  difficulty: string;
  prerequisites: Prerequisite[];
  defaults: { tool: Tool; version: number }[];
  steps: Step[];
};
export type Experiment = {
  prerequisites: string[];
  versions: Record<string, number>;
  disabled: string[];
};
export type Finding = {
  id: string;
  step: string;
  kind: "prerequisite" | "version";
  title: string;
  detail: string;
};

export function baseline(guide: Guide): Experiment {
  return {
    prerequisites: [],
    versions: Object.fromEntries(
      guide.defaults.map((d) => [d.tool.id, d.version]),
    ),
    disabled: [],
  };
}
export function inspect(guide: Guide, experiment: Experiment): Finding[] {
  const capabilities = new Set(
    guide.prerequisites
      .filter((p) => experiment.prerequisites.includes(p.id))
      .map((p) => p.capability),
  );
  const findings: Finding[] = [];
  for (const [index, step] of guide.steps.entries()) {
    if (experiment.disabled.includes(step.id)) continue;
    for (const need of step.needs) {
      if (capabilities.has(need)) continue;
      const prerequisite = guide.prerequisites.find(
        (p) => p.capability === need,
      );
      const producer = guide.steps.find((s) => s.gives.includes(need));
      const detail = prerequisite
        ? `This step needs ${prerequisite.title.toLowerCase()}. Mark it available in the experiment to supply “${need}”.`
        : producer
          ? experiment.disabled.includes(producer.id)
            ? `“${producer.title}” supplies “${need}”, but that step is skipped. Restore it before this step.`
            : guide.steps.indexOf(producer) >= index
              ? `“${producer.title}” supplies “${need}” later in the guide. A later output cannot satisfy an earlier step.`
              : `“${producer.title}” could supply “${need}”, but its own checks failed. Resolve that earlier step first.`
          : `No prerequisite or earlier step supplies “${need}”. The published guide needs an author correction.`;
      findings.push({
        id: `${step.id}:need:${need}`,
        step: step.id,
        kind: "prerequisite",
        title: `Missing ${need.replaceAll("-", " ")}`,
        detail,
      });
    }
    for (const requirement of step.tools) {
      const version = experiment.versions[requirement.tool.id];
      if (
        !requirement.tool.releases.includes(version) ||
        version < requirement.min ||
        version > requirement.max
      ) {
        findings.push({
          id: `${step.id}:tool:${requirement.tool.id}`,
          step: step.id,
          kind: "version",
          title: `${requirement.tool.title} version conflict`,
          detail: `Selected v${version ?? "unknown"}; this step supports v${requirement.min}${requirement.min === requirement.max ? "" : `–v${requirement.max}`}. Only published releases in that interval are compatible.`,
        });
      }
    }
    // An unsuccessful step cannot manufacture capabilities for downstream steps.
    if (!findings.some((f) => f.step === step.id))
      step.gives.forEach((c) => capabilities.add(c));
  }
  return findings;
}
export function repair(guide: Guide): Experiment {
  const result = baseline(guide);
  result.prerequisites = guide.prerequisites.map((p) => p.id);
  for (const setting of guide.defaults) {
    const requirements = guide.steps
      .flatMap((s) => s.tools)
      .filter((r) => r.tool.id === setting.tool.id);
    const compatible = setting.tool.releases.find((v) =>
      requirements.every((r) => v >= r.min && v <= r.max),
    );
    if (compatible !== undefined) result.versions[setting.tool.id] = compatible;
  }
  return result;
}
export function restore(guide: Guide, raw: string | null): Experiment {
  try {
    const stored = JSON.parse(raw ?? "null");
    if (!stored || stored.revision !== guide.revision || !stored.experiment)
      return baseline(guide);
    const value = stored.experiment;
    if (
      !Array.isArray(value.prerequisites) ||
      !Array.isArray(value.disabled) ||
      !value.versions ||
      typeof value.versions !== "object" ||
      Array.isArray(value.versions)
    )
      return baseline(guide);
    if (
      !value.prerequisites.every(
        (id: unknown) =>
          typeof id === "string" &&
          guide.prerequisites.some((p) => p.id === id),
      ) ||
      !value.disabled.every(
        (id: unknown) =>
          typeof id === "string" && guide.steps.some((s) => s.id === id),
      )
    )
      return baseline(guide);
    if (
      !guide.defaults.every((d) =>
        d.tool.releases.includes(value.versions[d.tool.id]),
      )
    )
      return baseline(guide);
    return {
      prerequisites: [...new Set<string>(value.prerequisites)],
      disabled: [...new Set<string>(value.disabled)],
      versions: Object.fromEntries(
        guide.defaults.map((d) => [d.tool.id, value.versions[d.tool.id]]),
      ),
    };
  } catch {
    return baseline(guide);
  }
}
export function parseGuides(value: unknown): Guide[] {
  const text = (v: unknown): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= 2000;
  const strings = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every(text);
  const unique = (v: string[]) => new Set(v).size === v.length;
  const major = (v: unknown): v is number =>
    Number.isSafeInteger(v) && Number(v) > 0 && Number(v) <= 100;
  const tool = (v: Tool) =>
    v &&
    text(v.id) &&
    text(v.title) &&
    Array.isArray(v.releases) &&
    v.releases.length > 0 &&
    v.releases.every(major) &&
    new Set(v.releases).size === v.releases.length;
  if (!Array.isArray(value) || value.length === 0 || value.length > 20)
    throw new Error("No valid published guide library");
  for (const g of value as Guide[]) {
    if (
      !g ||
      ![g.id, g.revision, g.title, g.summary, g.difficulty].every(text) ||
      !Array.isArray(g.prerequisites) ||
      !Array.isArray(g.defaults) ||
      g.defaults.length === 0 ||
      !Array.isArray(g.steps) ||
      g.steps.length === 0 ||
      g.steps.length > 20
    )
      throw new Error("Invalid guide structure");
    if (
      !g.prerequisites.every(
        (p) => p && [p.id, p.title, p.detail, p.capability].every(text),
      ) ||
      !unique(g.prerequisites.map((p) => p.id)) ||
      !unique(g.prerequisites.map((p) => p.capability))
    )
      throw new Error("Invalid prerequisites");
    if (
      !g.defaults.every(
        (d) => d && tool(d.tool) && d.tool.releases.includes(d.version),
      ) ||
      !unique(g.defaults.map((d) => d.tool.id))
    )
      throw new Error("Invalid default releases");
    if (!unique(g.steps.map((s) => s?.id))) throw new Error("Duplicate steps");
    for (const s of g.steps) {
      if (
        !s ||
        ![s.id, s.title, s.detail, s.example].every(text) ||
        !strings(s.needs) ||
        !strings(s.gives) ||
        !unique(s.needs) ||
        !unique(s.gives) ||
        !Array.isArray(s.tools)
      )
        throw new Error("Invalid step");
      for (const r of s.tools) {
        const configured = g.defaults.find((d) => d.tool.id === r?.tool?.id);
        if (
          !r ||
          !tool(r.tool) ||
          !major(r.min) ||
          !major(r.max) ||
          r.min > r.max ||
          !configured ||
          JSON.stringify(configured.tool) !== JSON.stringify(r.tool)
        )
          throw new Error("Invalid tool requirements");
      }
    }
  }
  if (!unique((value as Guide[]).map((g) => g.id)))
    throw new Error("Duplicate guides");
  return value as Guide[];
}
