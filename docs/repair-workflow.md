# Repair proposal workflow plan and evidence

Scope: add a custom Sanity Studio review tool to the existing app. Keep public experiments local, never execute commands, and use only fictional content. No App SDK or native Sanity Workflows feature is claimed.

1. Model structured repair proposals with a guide reference, full modeled-content fingerprint, prerequisite IDs, tool references/versions and pending/approved/rejected states.
2. Use Studio's normal signed-in client. The administrator UI gates review; Sanity's existing project permissions enforce authenticated mutations. There is no server write key, anonymous submission endpoint, OAuth change, CORS change or paid service.
3. On approval, validate all enabled steps and commit source revision guards and the pending proposal transition atomically. Metadata-only repairReviewGuard writes lock all dependencies; semantic fingerprints exclude this metadata and raw revision IDs. Any modeled reference edit invalidates approval. The guard can change source revision metadata but never instructions/defaults/releases.
4. Public builds read approved proposals without authentication, independently validate their fingerprints and conditions, and expose an optional local 'Try owner-approved repair' action. Pending/rejected/stale/malformed proposals do not qualify. Rebuild/redeploy after content decisions.
5. Test compatibility, invalid structures, stale content, concurrency guards, interrupted decisions, fingerprint parity, public denied mutation, clean builds, frontend mobile/reset/storage flows and secret exclusion; request independent source review.

Owner handoff: local Studio at http://localhost:3333, project ipp6nys2. Simon signs in with the owning account, opens Repair review, creates a pending proposal and explicitly approves/rejects. Authentication stays within his browser. Do not share browser credentials, claim links or API keys. After an interrupted operation, Refresh before retrying because a server commit may already have succeeded.

Security boundary: custom client checks do not constrain a trusted project administrator who directly uses the API. Standard project members with write permissions can also bypass Studio UI through the API; adding such members changes the trust boundary. There is no claim of server-enforced per-document owner-only RBAC or native workflow enforcement. Anonymous visitors have no write access.

Live owner-authenticated create/approve/reject verification remains pending until Simon signs in. Unit tests or read-only backend checks do not establish that it happened.
