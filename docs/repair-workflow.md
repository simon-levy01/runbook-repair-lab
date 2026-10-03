# Repair proposal workflow plan and evidence

Scope: add a custom Sanity Studio review tool to the existing app. Keep public experiments local, never execute commands, and use only fictional content. No App SDK or native Sanity Workflows feature is claimed.

1. Model structured repair proposals with a guide reference, full modeled-content fingerprint, prerequisite IDs, tool references/versions and pending/approved/rejected states.
2. Use Studio's normal signed-in client. The administrator UI gates review; Sanity's existing project permissions enforce authenticated mutations. There is no server write key, anonymous submission endpoint, OAuth change, CORS change or paid service.
3. On approval, validate all enabled steps and commit source revision guards and the pending proposal transition atomically. Metadata-only repairReviewGuard writes lock all dependencies; semantic fingerprints exclude this metadata and raw revision IDs. Any modeled reference edit invalidates approval. The guard can change source revision metadata but never instructions/defaults/releases.
4. Public builds read approved proposals without authentication, independently validate their fingerprints and conditions, and expose an optional local 'Try owner-approved repair' action. Pending/rejected/stale/malformed proposals do not qualify. Rebuild/redeploy after content decisions.
5. Test compatibility, invalid structures, stale content, concurrency guards, interrupted decisions, fingerprint parity, public denied mutation, clean builds, frontend mobile/reset/storage flows and secret exclusion; request independent source review.

Owner handoff: local Studio at http://localhost:3333, project ipp6nys2. Simon signs in with the owning account, opens Repair review, creates a pending proposal and explicitly approves/rejects. Authentication stays within his browser. Do not share browser credentials, claim links or API keys. After an interrupted operation, Refresh before retrying because a server commit may already have succeeded.

Security boundary: custom client checks do not constrain a trusted project administrator who directly uses the API. Standard project members with write permissions can also bypass Studio UI through the API; adding such members changes the trust boundary. There is no claim of server-enforced per-document owner-only RBAC or native workflow enforcement. Anonymous visitors have no write access.

## Verified live owner workflow

After Simon confirmed normal Chrome sign-in, Windows UIAutomation InvokePattern operated only his dedicated Studio window, verified at localhost:3333. No foreground focus, mouse, keystrokes, browser authentication copying or credential extraction was used. Both proposals were observed pending in the genuine public dataset before their explicit decisions.

| Guide                  | Persisted decision | Public approved projection                                                          |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| Build a paper town     | Approved           | Included; three steps pass with Grove CLI v2, Loom Engine v2 and both prerequisites |
| Light a lantern garden | Rejected           | Excluded despite compatible conditions                                              |

The owner-only Verify stale guards control submitted two deliberately stale transactions. A stale source revision returned409. A stale proposal revision returned409 after a preceding source metadata patch, proving atomic rollback. Direct document reads confirmed both source/proposal revisions unchanged in each case. No modeled content changed. The diagnostic's impossible revision preconditions guarantee failure; it never performs an approval transition.

The rebuilt local public app loaded the actual approved repair and reset to baseline. The rejected garden offered no approved repair. Six real-data browser groups passed at desktop/tablet/mobile widths with no page errors. Unit tests20/20, lint, Next/Studio builds and typecheck passed. The verification script performs public reads plus a denied anonymous same-value write test(403); it is not wholly read-only.

[Safe machine-readable evidence](workflow-evidence.json). [Public decisions query](https://ipp6nys2.api.sanity.io/v2026-09-01/data/query/production?query=*%5B_type%3D%3D%22repairProposal%22%5D%7B_id%2Ctitle%2Cstatus%2Cguide%2Cfingerprint%2Cexperiment%2CreviewedAt%7D). Public-app screenshots under screenshots show approved availability and the repaired desktop/mobile state without private browser chrome. The parent owns deployment to the existing demo and updating the existing DEV entry.
