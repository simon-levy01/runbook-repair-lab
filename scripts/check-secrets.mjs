import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
const root = resolve(".");
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const violations = [];
function inspect(file) {
  const path = resolve(root, file);
  if (!statSync(path).isFile()) return;
  const body = readFileSync(path).toString("utf8");
  const patterns = [
    /(?:^|[^a-zA-Z0-9])sk[a-zA-Z0-9]{60,}/m,
    /https?:\/\/[^\s"'<>]*\/(?:claim|claim-project)[^\s"'<>]*[?/#][^\s"'<>]{20,}/i,
    /NEXT_PUBLIC_[A-Z_]*(?:TOKEN|SECRET|WRITE_KEY)\s*=/,
  ];
  if (patterns.some((p) => p.test(body))) violations.push(file);
}
for (const file of files) {
  if (
    /(^|\/)(?:\.env(?:\..*)?|.*claim.*|.*\.log)$/.test(file) &&
    !file.endsWith(".env.example")
  )
    violations.push(file);
  if (/(^|\/)(?:node_modules|\.next|out|dist|output)\//.test(file))
    violations.push(file);
  inspect(file);
}
let browserFiles = 0;
function walk(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const path = resolve(folder, item.name);
    if (item.isDirectory()) walk(path);
    else {
      inspect(relative(root, path));
      browserFiles++;
    }
  }
}
walk(resolve(root, "web/.next/static"));
walk(resolve(root, "web/out"));
if (violations.length) {
  console.error(
    "Secret/artifact scan found suspect file paths (values withheld):",
    JSON.stringify([...new Set(violations)]),
  );
  process.exit(1);
}
console.log(
  `Secret-pattern and artifact exclusion checks passed for ${files.length} tracked source files and ${browserFiles} built browser assets. Credential values were not read or printed.`,
);
