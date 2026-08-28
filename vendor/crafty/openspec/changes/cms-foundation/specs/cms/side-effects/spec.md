# Side effects

## Purpose

Defines how mutations trigger downstream work: a transactional outbox as the
only asynchronous machinery, lease-based claiming for workers, at-least-once
delivery with recorded outcomes, and webhooks as the first consumer. No
mutation-time work may run outside this path and silently vanish on
rollback.

## ADDED Requirements

### Requirement: Side effects are recorded atomically with their mutation

Any mutation that must trigger downstream work SHALL record that intent in
the same atomic commit as the mutation. If the mutation rolls back, no
side-effect intent survives; if it commits, the intent is durable before any
downstream work begins. No downstream work SHALL be initiated from within
the mutation request path itself.

#### Scenario: Rollback leaves no orphaned work

- **WHEN** a publish fails after side-effect intent would have been recorded
- **THEN** neither the publish nor any side-effect intent is durable, and no
  downstream delivery occurs

### Requirement: Workers claim work with expiring leases

Side-effect entries SHALL be claimed by workers under an expiring,
renewable lease bound to a claim token, such that multiple workers never
process one entry concurrently and a crashed worker's entries become
claimable after lease expiry. Delivery SHALL be at-least-once; every attempt
and its outcome SHALL be recorded with timestamps.

#### Scenario: A crashed worker's work is recovered

- **GIVEN** a worker that claimed an entry and stopped renewing its lease
- **WHEN** the lease expires
- **THEN** another worker can claim the entry, and the entry is processed to
  completion exactly as if the first worker had never claimed it

### Requirement: Webhooks deliver signed events with retry and a dead state

An authorized principal SHALL be able to register tenant-scoped webhook
subscriptions for content events. Deliveries SHALL be signed so receivers
can verify origin, retried on failure with backoff up to a declared attempt
bound, and moved to an inspectable dead state after exhaustion. Delivery
history SHALL be queryable per subscription.

#### Scenario: A failing endpoint exhausts into the dead state

- **GIVEN** a subscription whose endpoint persistently fails
- **WHEN** the attempt bound is exhausted
- **THEN** the delivery is marked dead with its attempt history, no further
  retries occur, and other subscriptions are unaffected
