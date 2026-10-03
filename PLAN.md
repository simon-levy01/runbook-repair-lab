# Runbook Repair Lab

Build an original Next.js tool backed by a public Sanity dataset of fictional guides. No runtime AI, command execution, login, browser writes to Sanity, or paid services.

## Design

An ink/navy header, pale gray workspace, white guide and step surfaces, violet controls, orange findings and green resolved states. Use system sans typography with monospace only for inert command examples. Desktop: guide rail, step list, repair inspector. Mobile: stack those regions with controls reachable and readable. Clearly explain fictional content, browser-local edits, data provenance, deterministic checks, and reset.

## Content and behavior

Three document types: tool (named releases), prerequisite (capability), guide (references to prerequisites and tools, ordered inline steps). Each step consumes and produces capabilities and declares minimum/maximum supported tool major versions. Checks inspect each enabled step in order, explaining missing prerequisites, dependencies on skipped/later steps and version mismatches. Disabled steps provide no capabilities. Experiments change only local prerequisite selection, versions and enabled steps; reset restores published defaults. Validate remote data and stored experiments; reject malformed data and recover corrupt storage. No fake backend fallback.

## Verification

Node unit tests: missing/present prerequisites, inclusive version boundaries, unsupported releases, skipped steps, ordered capability production, malformed input and interrupted/corrupt local state. Sanity: seed harmless documents, public query and schema validation. Browser: desktop/mobile, repair to zero findings, guide switching, reload restoration, reset, corrupt storage and network/error state. Production build and server smoke test. Scan tracked source and built browser assets for exact credential values without printing them. Independent review before publication. Publish sanitized MIT source only to the authorized GitHub account/repository. Parent owns deployment and DEV submission.
