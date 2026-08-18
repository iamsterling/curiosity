# ADR 0034: M4 D5A owned-crawl job semantics

**Status:** Accepted 2026-08-18 for one repository operation

The project owner accepts D5A only for `build_owned_crawl_snapshot`. Canonical
files hold `queued`, `running`, `cancel_requested`, `succeeded`, `failed`, and
`cancelled`; terminal states are immutable. A canonical request digest plus an
idempotency key returns the original job or a stable conflict. `runNext` is a
cooperative foreground call: no daemon, timer, thread, or background worker is
authorized.

Per-job domain events are append-only and ordered. Reads are bounded to 100 and
use an inclusive cursor, intentionally permitting at-least-once replay. Redacted
audit correlation is separate and is not domain authority. `attempt_started`
without settlement is marked `attempt_abandoned`, requeued, and refetched;
content digests deduplicate immutable capture identity. Cancellation settles at
safe boundaries. The canonical writer lock is never held over network I/O.
Rust owns the bounded transition state machine and allowlisted canonical-file
mutations through caller-owned FFI; Bun owns HTTPS and the fixed workflow. No
observability dependency is introduced.

This accepts no other operation, generic scheduler, public crawl, production
durability claim, migration system, telemetry payload, or M7 work.
