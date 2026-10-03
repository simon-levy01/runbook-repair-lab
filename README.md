# Runbook Repair Lab

A small Next.js + Sanity app that checks fictional technical guides for missing prerequisites and incompatible major tool versions. Change starting conditions, skip steps, read explanations, and reset. Command examples are inert text; nothing executes them.

Designed and implemented with **OpenAI Codex** for DEV Sanity Challenge Path Two. No runtime AI, paid APIs, or personal/private content. MIT licensed. The parent task coordinates demo and DEV publication.

## Run and build

Requires Node.js 22.12+; tested on 24.15.

```sh
npm ci
npm --prefix web ci
npm --prefix sanity ci
npm test
npm run lint
npm run verify:backend
npm run build
npm start
```

Open http://localhost:3000. `npm start` previews the static export locally. `npm run dev` runs Next.js development mode. Studio lives separately in `sanity/`.

## Static deployment

The app uses Next.js `output: 'export'`. During each build, a server-only native HTTPS request reads the actual public Sanity dataset with an eight-second timeout and a one-megabyte response limit. This avoids persistent Next fetch-cache reuse. Invalid or unavailable content fails the build; there is no synthetic fallback. The generated HTML and client payload contain a published-content snapshot, with its build time shown in the footer.

**Content edits require rebuilding and redeploying.** The static demo does not receive real-time Sanity updates. Repairs remain entirely browser-local.

| Setting                          | Value                                  |
| -------------------------------- | -------------------------------------- |
| Project root                     | `web`                                  |
| Install                          | `npm ci`                               |
| Build                            | `npm run build`                        |
| Publish directory                | `out` (repository-relative: `web/out`) |
| Runtime                          | Static HTML/CSS/JS; no SSR worker      |
| Required environment/credentials | None                                   |

Node 24 is recommended for the build. Safe optional build variables `SANITY_PROJECT_ID` and `SANITY_DATASET` default to `ipp6nys2` and `production`. No token, login, OAuth grant, paid service or CORS change is needed. No Sites project or demo is created by this source.

## Real public backend

- Project: Runbook Repair Lab
- Project ID: `ipp6nys2`
- Dataset: `production`, public
- [Public dataset query](https://ipp6nys2.api.sanity.io/v2026-09-01/data/query/production?query=*%5B_type%20in%20%5B%22guide%22%2C%22tool%22%2C%22prerequisite%22%5D%5D)

`npm run verify:backend` checks real public data without authentication. Three guides resolve their prerequisite and tool references; baseline findings are 7, 7 and 6, and compatible conditions produce zero findings for each.

The GROQ projection explicitly excludes drafts. Runtime input validation rejects malformed content. `tool` documents store fictional releases; `prerequisite` documents declare capabilities; `guide` documents reference both and contain ordered steps with needed/produced capabilities and inclusive version intervals. A complete resolved-content fingerprint invalidates saved experiments after content changes in a new deployment.

Only enabled steps with no findings produce downstream capabilities. Later, skipped or unsuccessful steps cannot supply earlier requirements. The compatible-conditions action chooses published versions satisfying all intervals. Irreconcilable intervals or missing providers leave explained findings for an author correction.

## Browser-local experiments

Prerequisite selection, tool versions and skipped steps are saved per guide in localStorage. They survive refresh and guide switching. Invalid, stale or corrupt state returns to baseline; blocked storage leaves the current visit usable. Reset clears available prerequisites, restores starting tool versions and enables all steps. Nothing is written to Sanity.

The checker covers modeled capabilities and major-version intervals. It does not infer semver, analyze command syntax, run commands, or prove real instructions safe/correct.

## Content editing

`content/fixtures.json` contains only fictional data. The initial seed script creates missing fixture documents using Sanity-generated IDs and resolves returned references. Existing fixture titles are reused for an interrupted initial seed; this is not a migration/update tool.

The owner claimed the project and revoked the exposed setup token. Local residual copies were removed. The deployed app needs no replacement credential. Future writes require separately authorized access; do not reuse revoked credentials or create tokens automatically. Never commit environment/claim files or expose a write token to the web app.

Studio can be run with `npm --prefix sanity run dev` and the owner's normal browser sign-in. It is not deployed with the public frontend.

## Verification

`npm run test:browser` tests the exported app preview. Install Chromium with `npx playwright install chromium` if needed. Tests cover all three guide repairs, skip/re-enable, reset, reload restoration, guide isolation, corrupt/blocked storage, and 1400/768/390/320px layouts. The verified export was built from real public Sanity content, with no synthetic interception. Unit tests use clearly identified checked-in fictional fixtures.

`npm run check:secrets` scans tracked source, built browser assets and the export for credential patterns and excluded files. Generated screenshots/results and build outputs remain Git-ignored.

See [PLAN.md](PLAN.md), [BUILD_LOG.md](BUILD_LOG.md), and [VERIFICATION.md](VERIFICATION.md) for decisions and evidence.
