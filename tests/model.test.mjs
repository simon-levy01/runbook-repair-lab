import test from "node:test";
import { withContentRevision } from "../web/lib/content-revision.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  baseline,
  inspect,
  repair,
  restore,
  parseGuides,
} from "../web/lib/model.ts";
const fixture = JSON.parse(
  readFileSync(new URL("../content/fixtures.json", import.meta.url), "utf8"),
);
const tools = Object.fromEntries(
  fixture.tool.map(({ key, ...doc }) => [key, { id: key, ...doc }]),
);
const prerequisites = Object.fromEntries(
  fixture.prerequisite.map(({ key, ...doc }) => [key, { id: key, ...doc }]),
);
const ref = (v) => v._ref.slice(5);
const guides = fixture.guide.map(
  ({ key, steps, prerequisites: refs, defaults, ...doc }) => ({
    ...doc,
    id: key,
    revision: "fixture-v1",
    prerequisites: refs.map((v) => prerequisites[ref(v)]),
    defaults: defaults.map((d) => ({
      version: d.version,
      tool: tools[ref(d.tool)],
    })),
    steps: steps.map(({ _key, _type, tools: requirements, ...step }) => ({
      id: _key,
      ...step,
      tools: requirements.map((r) => ({
        tool: tools[ref(r.tool)],
        min: r.min,
        max: r.max,
      })),
    })),
  }),
);
const town = guides.find((g) => g.id === "paper-town");
test("fictional fixtures meet the backend contract", () =>
  assert.equal(parseGuides(guides).length, 3));
test("each published baseline has actionable findings; compatible conditions resolve all guides", () => {
  for (const guide of guides) {
    assert.ok(inspect(guide, baseline(guide)).length > 0);
    assert.deepEqual(inspect(guide, repair(guide)), []);
  }
});
test("each required prerequisite is checked separately", () => {
  const exp = repair(town);
  exp.prerequisites = [];
  const first = inspect(town, exp).filter((f) => f.step === town.steps[0].id);
  assert.equal(first.length, 2);
  assert.ok(first.every((f) => f.kind === "prerequisite"));
});
test("inclusive version boundaries pass, outside and nonexistent releases fail", () => {
  const exp = repair(town);
  for (const version of [2, 3]) {
    exp.versions.grove = version;
    assert.equal(
      inspect(town, exp).filter(
        (f) => f.kind === "version" && f.title.includes("Grove"),
      ).length,
      0,
    );
  }
  for (const version of [1, 4, 2.5, undefined]) {
    exp.versions.grove = version;
    assert.equal(
      inspect(town, exp).filter(
        (f) => f.kind === "version" && f.title.includes("Grove"),
      ).length,
      2,
    );
  }
});
test("failed upstream step does not supply fictional downstream outputs", () => {
  const exp = repair(town);
  exp.versions.grove = 1;
  const problems = inspect(town, exp);
  assert.ok(
    problems.some(
      (f) => f.step === "town-render" && f.detail.includes("own checks failed"),
    ),
  );
  assert.ok(
    problems.some((f) => f.step === "town-check" && f.kind === "prerequisite"),
  );
});
test("skipping a producer explains the missing dependency", () => {
  const exp = repair(town);
  exp.disabled = ["town-init"];
  assert.ok(
    inspect(town, exp).some(
      (f) => f.step === "town-render" && f.detail.includes("skipped"),
    ),
  );
});
test("a future output cannot satisfy an earlier step", () => {
  const guide = structuredClone(town);
  guide.steps[0].needs.push("town-preview");
  assert.ok(
    inspect(guide, repair(guide)).some(
      (f) => f.step === "town-init" && f.detail.includes("later in the guide"),
    ),
  );
});
test("a capability without a provider calls for author correction", () => {
  const guide = structuredClone(town);
  guide.steps[0].needs.push("unknown-capability");
  assert.ok(
    inspect(guide, repair(guide)).some((f) =>
      f.detail.includes("author correction"),
    ),
  );
});
test("mutually incompatible step versions cannot be silently repaired", () => {
  const guide = structuredClone(town);
  guide.steps[2].tools[0].min = 1;
  guide.steps[2].tools[0].max = 1;
  assert.ok(inspect(guide, repair(guide)).some((f) => f.kind === "version"));
});
test("all skipped steps produce no findings and no capabilities; original inputs are immutable", () => {
  const exp = repair(town);
  const before = JSON.stringify(town);
  exp.disabled = town.steps.map((s) => s.id);
  assert.deepEqual(inspect(town, exp), []);
  assert.equal(JSON.stringify(town), before);
});
test("interrupted experiment resumes with enabled-step and version state", () => {
  const exp = repair(town);
  exp.disabled = ["town-render"];
  assert.deepEqual(
    restore(town, JSON.stringify({ revision: town.revision, experiment: exp })),
    exp,
  );
});
test("corrupt, stale, incomplete and unknown local state safely reset", () => {
  const good = { revision: town.revision, experiment: repair(town) };
  for (const raw of [
    null,
    "not json",
    "{}",
    JSON.stringify({ ...good, revision: "old" }),
    JSON.stringify({
      ...good,
      experiment: { ...good.experiment, prerequisites: ["foreign"] },
    }),
    JSON.stringify({
      ...good,
      experiment: { ...good.experiment, disabled: ["foreign"] },
    }),
    JSON.stringify({
      ...good,
      experiment: { ...good.experiment, versions: { grove: 99, loom: 2 } },
    }),
  ])
    assert.deepEqual(restore(town, raw), baseline(town));
});
test("extra stored keys are not trusted", () => {
  const exp = {
    ...repair(town),
    versions: { ...repair(town).versions, foreign: 7 },
    foreign: "data",
  };
  assert.deepEqual(
    restore(town, JSON.stringify({ revision: town.revision, experiment: exp })),
    repair(town),
  );
});
test("invalid public content is rejected, including broken references, duplicate steps and impossible ranges", () => {
  assert.throws(() => parseGuides([]));
  assert.throws(() => parseGuides(null));
  const cases = [
    (g) => (g.defaults[0].tool = null),
    (g) => (g.steps[0].tools[0].max = 0),
    (g) => (g.steps[0].needs = null),
    (g) => (g.steps[1].id = g.steps[0].id),
    (g) => g.prerequisites.push(g.prerequisites[0]),
    (g) =>
      (g.steps[0].tools[0].tool = {
        ...g.steps[0].tools[0].tool,
        title: "Mismatched tool",
      }),
    (g) => (g.defaults[0].version = 99),
  ];
  for (const change of cases) {
    const invalid = structuredClone(town);
    change(invalid);
    assert.throws(() => parseGuides([invalid]));
  }
});

test("reference-only content changes invalidate saved experiments", () => {
  const before = withContentRevision(town);
  const raw = JSON.stringify({
    revision: before.revision,
    experiment: repair(before),
  });
  for (const change of [
    (g) => (g.prerequisites[0].capability = "new-capability"),
    (g) => g.defaults[0].tool.releases.push(4),
    (g) => (g.prerequisites[0].detail = "Changed assumptions"),
  ]) {
    const changed = structuredClone(town);
    change(changed);
    const after = withContentRevision(changed);
    assert.notEqual(after.revision, before.revision);
    assert.deepEqual(restore(after, raw), baseline(after));
  }
});
