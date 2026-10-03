# Runbook Repair Lab

A small Next.js + Sanity app that checks fictional technical guides for missing prerequisites and incompatible tool major versions. Try different starting conditions, skip steps, read explanations, and reset. Command examples are inert text; nothing executes them.

Designed and implemented with **OpenAI Codex** for the DEV Sanity Challenge's Path Two. No runtime AI, paid API, or personal/private content is used. Source is MIT licensed. This repository does not publish a contest entry or demo automatically.

## Run

Requires Node.js 22.12+ (built and tested with Node.js 24.15).

```sh
npm ci
npm --prefix web ci
npm --prefix sanity ci
npm test
npm run lint
npm run build
npm start
```

Open http://localhost:3000. The web app queries the public Sanity backend from the server. No token, login or CORS change is needed. Sanity Studio is a separate sibling app in `sanity/`; it is not embedded in the public frontend.

## Public backend

- Project: Runbook Repair Lab
- Project ID: `ipp6nys2`
- Dataset: `production`, public
- [Public dataset query](https://ipp6nys2.api.sanity.io/v2026-09-01/data/query/production?query=*%5B_type%20in%20%5B%22guide%22%2C%22tool%22%2C%22prerequisite%22%5D%5D)

After ownership claim and setup-token revocation are confirmed, run `npm run verify:backend` to check the actual public dataset without authentication. No further backend writes are needed.

The app explicitly excludes drafts and projects fields with GROQ. It validates the resolved content before rendering. A content outage shows an unavailable state, not a mock library. Public content can be cached for up to 60 seconds.

`tool` documents store fictional major releases. `prerequisite` documents declare capabilities. `guide` documents reference both and contain ordered steps with needed/produced capabilities and inclusive version intervals. References share tool definitions across guides. The app hashes complete resolved content so edits to referenced documents invalidate old experiments.

Only an enabled step with no findings supplies capabilities to downstream steps. A later or skipped step cannot satisfy an earlier dependency. The compatible-conditions action chooses published releases satisfying every step's interval. If intervals cannot be reconciled or a provider is missing, it keeps the remaining findings and explains that an author correction is needed.

## Experiments

Prerequisites, selected tool versions and skipped steps are stored in this browser's localStorage per guide and content fingerprint. They survive refresh and guide switching. Invalid, stale or corrupt state returns to the baseline. Blocked storage leaves the lab usable for the current visit. Reset restores the published starting versions, clears available prerequisites, and enables all steps. Nothing is written back to Sanity.

The checker handles modeled capabilities and major version intervals. It does not infer semver, analyze command syntax, run commands, or prove a real runbook is safe/correct.

## Content editing and seeding

The sample data in `content/fixtures.json` is wholly fictional. `scripts/seed.mjs` creates missing fixture documents with Sanity-generated IDs and resolves references from returned IDs. Matching existing fixture titles are reused, so the script is suitable for an initial seed or resuming an interrupted initial seed; it is not a content migration or update tool.

The seed script needs a protected server-side `sanity/.env.local` containing `SANITY_PROJECT_ID`, `SANITY_DATASET` and a write credential. Never commit credentials or ownership-claim links, put them in a public environment variable, or provide them to the web deployment. Project writes are paused until the exposed setup token has been revoked by the owner. Do not reuse it or create a replacement without separate approval.

Once owned, Studio can be run with `npm --prefix sanity run dev` and the owner's normal Sanity browser sign-in. Do not put a write token in the public Studio bundle.

## Browser verification

`npm run test:browser` runs `tests/browser.mjs` against the production server at localhost:3000. Install Chromium with `npx playwright install chromium` if needed. The test covers all guide repairs, skip/re-enable, reset, persistence across reload/guide changes, corrupt/blocked storage, and desktop/mobile/tablet overflow. Set `TEST_FAILURE_URL` to a separately configured unavailable server to test the error UI.

For independent offline checks only, a test preload in `tests/offline-fetch.mjs` intercepts the server's public Sanity query and returns the checked-in fictional fixtures:

```sh
cd web
node --import ../tests/offline-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
```

Set `TEST_MODE=offline-synthetic-fixtures` when running the browser test against that server. This harness is never imported by application code or used in deployment. Offline evidence does not prove live-backend rendering. Screenshots and QA results are generated in ignored `output/playwright/`.

## Deployment handoff

Deploy **`web/`** as a Next.js app, with build command `npm run build`. The default read-only Sanity configuration is public metadata, already in code. Optional server variables `SANITY_PROJECT_ID` and `SANITY_DATASET` can point to another public dataset. No write token or runtime AI key is required. Do not deploy the offline test preload. The parent task owns the public demo and DEV article.

See [PLAN.md](PLAN.md), [BUILD_LOG.md](BUILD_LOG.md) and [VERIFICATION.md](VERIFICATION.md) for design decisions and factual verification evidence.
