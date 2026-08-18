# ADR 0004: Native v1, explicit v4 import, and external completion authority

Status: Accepted

## Decision

Native `.opencode/opencode2-config/` state starts at version 1 and is strictly decoded. Missing state may initialize empty v1; existing malformed, missing-version, legacy-v4, and future-version state is rejected with stable diagnostics. Writes validate first and replace atomically so a failed write preserves prior valid state.

Legacy plugin version 4 state is accepted only by the operator-invoked importer. Import copies validated jobs into a non-empty-protected native target, records source path, SHA-256 digest, import time, and tool version, and leaves the source untouched. Recovery from a bad cutover is reactivating the old plugin against that source, not reverse migration.

Goal jobs may hold a bounded attachment produced only from a successful canonical `handoff-contract/v1` proposal. The attachment carries identity/revision/digest, dependency status, context/evidence locators and digests, retry delta, progress artifact delta, and the immutable `external-loop-evidence` completion-authority marker. It never stores compiler prompts or raw context and does not reinterpret task semantics.

The loop enforces mechanical readiness and evidence. The current host cannot prove external actor identity or protect an out-of-band capability from delegated agents, so ordinary tooling cannot create semantic attestation. Contract completion currently requires an explicit user override; state and logs distinguish that override from ordinary evidence completion. Digest-valid files are only typed, criterion-bound evidence and cannot also establish semantic authority.

## Consequences

- Contract-free jobs preserve their prior lifecycle except compaction truthfulness.
- Contract-aware jobs cannot auto-complete from checks alone.
- Unmet dependencies and invalid durable references prevent dispatch/progress/completion; the plugin does not choose ordering, agents, models, or semantic readiness.
- Plugin-scheduled compaction is unsupported and records `OPENCODE2_COMPACTION_MANUAL_REQUIRED`; the user persists references, invokes `/compact`, then resumes.
- Non-transport runtime retries require a diagnosis and changed instructions; transport/provider replay may preserve the prior instruction unchanged.
- The 149 observed empty legacy states require no import. The importer remains available only for explicit non-empty legacy sources.
