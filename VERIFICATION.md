# Verification record

Verification is deliberately separated into actual backend evidence and offline synthetic evidence.

## Completed

- Official Sanity CLI provisioned the real public project `ipp6nys2`, dataset `production`.
- The seed API returned IDs for 10 fictional documents: 3 tools, 4 prerequisites and 3 guides. No real/personal/private content was used.
- Node deterministic tests: **15 passed, 0 failed**. Includes each baseline and repair, inclusive version endpoints, missing and unknown prerequisites, skipped/later/failed producers, impossible release intersections, corrupt/stale/extra stored properties and reference-only content changes.
- Next.js optimized production build from an empty `.next` directory and TypeScript: passed.
- Web ESLint: passed with no errors or warnings after scaffold cleanup.
- Standalone Studio TypeScript: passed (`npx tsc --noEmit`).
- Independent source review: no high severity source findings; content fingerprinting was added to invalidate experiments when referenced tools/prerequisites change. Editor remount also includes content revision to handle in-session content refreshes.

## Pending live-backend verification

A setup token redaction failure exposed write-token text in a tool result. The claim URL was not exposed. Credential-dependent work was stopped; the owner must claim the project and revoke the setup token. No replacement token is required by the public application. No credentials are included in this record.

The Sanity CLI document-validation process was interrupted and is **not** claimed as passing. Live public query/render checks and publication remain paused until revocation is confirmed. Afterward, all remaining backend verification can use unauthenticated public HTTP reads. No additional writes are needed for the implemented app.

## Offline browser evidence

The browser test runs the production bundle with a test-only fetch preload serving synthetic fixtures. Screenshots and JSON results are generated under ignored `output/playwright/`. They are not evidence of live Sanity rendering. The final offline browser suite passed all six groups: all three guide repairs/skip/reset flows; interrupted reload and guide isolation; corrupt storage; desktop 1400px, mobile 390/320px and tablet 768px overflow and controls; storage-denied mode; isolated synthetic backend outage. No browser page errors were recorded. Desktop and mobile screenshots were inspected for layout, typography, colors, finding explanations and accessible controls. Mobile controls were moved above steps and explanation font size increased.

Secret-pattern and artifact exclusion checks passed for 47 tracked source files and 13 built browser assets. Both local environment files and generated QA artifacts are Git-ignored. This offline scan checks credential patterns and tracked file exclusions; it does not read or print live credential values.

## Publication

The source is MIT licensed. GitHub push and a public demo/DEV entry have not occurred. The parent owns demo and article publication.
