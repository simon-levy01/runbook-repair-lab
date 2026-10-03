import { readFileSync } from "node:fs";
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
export const guides = fixture.guide
  .map(({ key, steps, prerequisites: refs, defaults, ...doc }) => ({
    ...doc,
    id: key,
    revision: "offline-fixture-v1",
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
  }))
  .sort((a, b) => a.title.localeCompare(b.title));
