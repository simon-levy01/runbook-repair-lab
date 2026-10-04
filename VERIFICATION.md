# Verification record

## Actual public Sanity evidence

Project `ipp6nys2`, public dataset `production`, contains 3 fictional tools, 4 prerequisites and 3 guides. The owner claimed the project and confirmed setup-token deletion on October 3, 2026. The revoked environment entry and this project's local CLI recovery record were removed; unrelated configuration was preserved. No replacement credential was created or used.

`npm run verify:backend` passed with `authenticated: false`:

| Guide                  | Actual Sanity document ID | Steps | Baseline findings | Repaired findings |
| ---------------------- | ------------------------- | ----- | ----------------- | ----------------- |
| Build a paper town     | cpzPQInBrCoN3lSGL6JQrG    | 3     | 7                 | 0                 |
| Light a lantern garden | gu4Ycht4w1LZ0sMorlizai    | 3     | 7                 | 0                 |
| Stitch a pocket atlas  | cpzPQInBrCoN3lSGL6JRAg    | 3     | 6                 | 0                 |

## Build and checks

- 15 deterministic unit tests passed: baseline/repair, inclusive release boundaries, missing/unknown capabilities, skipped/later/failed producers, conflicting release intervals, corrupt/stale stored state and referenced-content changes.
- Web lint and TypeScript passed. Standalone Studio TypeScript passed.
- Clean Next.js static export passed using fresh real public Sanity HTTPS reads at build time. Exported HTML contains all three actual document IDs and snapshot disclosure. No synthetic loader/interception was used.
- A read against a nonexistent dataset in the same project caused the build to fail as expected. A valid dataset was then rebuilt successfully. Invalid/unavailable content cannot produce a successful replacement export.
- Independent review verified the complete content fingerprint, hydration/persistence path, static export conversion, bounded HTTPS read and local preview server. No material blockers remained.

## Historical baseline browser evidence

Final browser results are generated under ignored `output/playwright/`. This suite targets the export built from real public Sanity data. It covers all guide repairs, skipped-step propagation, re-enable/reset, interrupted reload, guide isolation, corrupt/blocked storage and 1400/768/390/320px desktop/tablet/mobile overflow. It verifies actual Sanity document IDs in browser-local state. All five workflow groups passed on the real Sanity snapshot; actual document IDs matched, browser page errors were zero.

Desktop and mobile screenshots are inspected for layout, type size, explanation readability, colors and usable controls. Mobile repair controls precede the ordered steps.

Earlier offline QA used clearly identified synthetic fixtures while credential-dependent work was paused; that evidence is historical and is not presented as actual backend verification. The obsolete synthetic runtime preload was removed.

## Secret exclusion and deployment

Environment/claim files, CLI logs, generated output, node_modules, `.next` and `out` are excluded from Git. Secret-pattern/exclusion checks passed for 48 tracked source files and 38 generated browser/export files, without displaying credential values. The source is MIT licensed and truthfully credits OpenAI Codex.

Deployment is static: root `web`, install `npm ci`, build `npm run build`, publish `out`. No runtime SSR worker, Sanity write token, AI key, OAuth grant or CORS change is required. Each build performs a fresh public Sanity read; content edits require rebuilding/redeploying. The displayed timestamp is the snapshot build time. The parent owns demo and DEV publication.

The original authenticated Sanity CLI document-validation run was interrupted and is not claimed as passing. Public response contract validation, schema typecheck and actual frontend verification replace that credential-dependent check.

## Historical owner workflow extension verification (before sign-in)

`npm test`: 19 passed, zero failed, including browser/Node fingerprint parity, semantic/reference changes, valid/invalid/stale proposals, required enabled steps, pending-only decisions, atomic source/proposal revision guards and interrupted decision retries. `npm run lint`, fresh actual-backend Next static export, Studio typecheck and `npm --prefix sanity run build` passed. The then-current public dataset had no repairProposal documents; the six-group browser suite accepted that absence as a passing state.

`node scripts/verify-workflow.mjs`: public proposal count 0; valid unauthenticated same-value guide patch denied with HTTP 403, changed documents 0. No credential sent. Invalid/nonexistent mutation targets were not used as permission evidence.

Independent read-only review found no material source blocker. **At that stage, live signed-in proposal creation, approval and rejection were pending the owner's browser sign-in.** Source code provides a custom Studio workflow; it does not integrate Sanity App SDK or native Workflows.

## Completed authenticated owner verification

The pending owner sign-in blocker above is resolved. Normal authenticated Studio UI created two genuine pending proposals, approved paper town and rejected lantern garden. Public reads verified both IDs, matching fingerprints and the approved-only projection. Windows accessibility InvokePattern stayed confined to the dedicated Studio window, without foreground focus, mouse or keyboard input. No session data was copied or extracted.

Both live stale transaction tests returned409 and direct document reads confirmed unchanged source/proposal revisions, including rollback of the first patch when the second revision check failed. The rebuilt actual public snapshot loaded the owner-approved repair, passed all three steps and reset; rejected repair was excluded.20 unit tests and six real-data browser groups passed with no page errors. See docs/workflow-evidence.json and docs/repair-workflow.md for exact IDs, public audit link and screenshots. The verification script includes a denied anonymous same-value write test(403), in addition to public reads.

That earlier browser suite did not require an approved action and did not assert garden exclusion. A separate public-app screenshot/check script verified rejection exclusion. The automated evidence gap is closed by the stricter regression below.

## 2026-10-04 strict approval regression

The same final suite passed locally against a fresh public-Sanity build and on https://runbook-repair-lab.simonlevy00.chatgpt.site: seven positive groups per target, three negative controls per target, and zero uncaught page exceptions across the main and storage-denied contexts. Paper town must expose exactly one owner-approved action; clicking it must yield three passing steps and zero findings, and Reset must restore findings. Lantern garden and pocket atlas must expose no approved action. Public GET audit queries explicitly confirmed paper approved, lantern rejected, and no atlas proposal.

Each negative control calls the same live-page count assertion with a wrong expectation: paper absent, lantern present, or atlas present. Only an AssertionError with the expected operator and actual/expected counts qualifies; navigation errors and timeouts do not pass. These controls deliberately catch the assertion failures; they do not alter the DOM or dataset.

`npm test` passed all20 unit tests; lint, the fresh Next.js export and Studio typecheck passed. Production code and schemas were unchanged. No Studio decisions, Sanity mutations, credentials, access changes or deployment were used in this round; `verify:workflow` was not run because it attempts a mutation. Reports and screenshots live under ignored `output/playwright/local/` and `output/playwright/hosted/`; [safe consolidated evidence](docs/approval-regression-evidence.json) records both completed runs. The `pageErrors` metric records uncaught JavaScript page exceptions.
