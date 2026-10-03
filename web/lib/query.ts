export const query = `*[_type == "guide" && !(_id in path("drafts.**"))] | order(title asc)[0...20]{
  "id": _id, "revision": _rev, title, summary, difficulty,
  "prerequisites": prerequisites[]->{"id": _id, title, detail, capability},
  "defaults": defaults[]{version, "tool": tool->{"id": _id, title, releases}},
  "steps": steps[]{"id": _key, title, detail, example, needs, gives,
    "tools": tools[]{min, max, "tool": tool->{"id": _id, title, releases}}}
}`;
