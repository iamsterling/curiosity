# Curiosity Session-System Synthesis

Date: 2026-08-30

## Decision

- Decision ID: `ADOPT_EVENT_AUTHORITY_TRANSACTIONAL_CHAT_PROJECTIONS_V1`
- Research stop: `STOP_SESSION_SYSTEM_SATURATION_DESIGN_V16_AND_QUALIFY`
- Interoperability question: how should Curiosity list, resume, update, and
  restore chats without weakening the canonical durable-agent lifecycle?
- Boundary: Curiosity's repository, its signed app and app container on the
  owner's connected iPad, and public first-party OpenCode source. No provider
  credentials, access-control bypass, or protected implementation copying was
  used.

Curiosity SHOULD add dedicated SQLite chat tables, but they MUST be
transactional, rebuildable projections of canonical events. They MUST NOT be
model-authored or become an independent source of truth. The model returns
untrusted structured output; Curiosity admission and terminal-commit code owns
all durable writes.

The target read model is:

1. `chat_sessions` for bounded, recency-ordered project/session listing;
2. `chat_turns` for turn/run status and exact recovery identity;
3. `chat_transcript_entries` for ordered user, assistant, question, and answer
   presentation; and
4. a projection checkpoint/version that permits deterministic rebuild from the
   event journal.

Workspace organizations/projects must also become durable. Otherwise a valid
project-bound session can remain in SQLite while its in-memory project route
disappears after relaunch.

## Executive finding

The physical Moon session was not lost. The iPad database is healthy and the
entire Moon lifecycle is durable. The immediate failure is in the read and UI
system:

- every session read loads and projects the complete event journal in
  JavaScript;
- session rows are ordered by oldest thread-open sequence, not latest activity;
- the oldest rows are labeled `Today`, while the newest Moon row lands last;
- current project catalog, local ownership overrides, active session, and route
  state are memory-only;
- one projection exception is caught as a generic runtime failure and can leave
  an empty or stale list with no session-specific recovery state; and
- there is no cursor-bound native session-list or transcript API.

Therefore, “load from the DB” is directionally correct, but Curiosity already
loads the DB. The missing piece is a bounded native SQLite read model and a
single transaction boundary between canonical event append and projection
update.

## Physical evidence

Read-only inspection of Sterling's connected iPad app container found:

- database:
  `Library/Application Support/CuriosityAuthority/authority-v15.sqlite3`;
- size at inspection: 1,228,800 bytes;
- `PRAGMA integrity_check`: `ok`;
- schema version: `15`;
- canonical event range: 324 events, global sequence 1 through 324;
- 21 `thread.opened` events;
- 44 `message.appended` events; and
- two historical catalog digests, demonstrating that the journal retained old
  events across app/catalog revisions.

The latest Moon thread
`e0522905-e9ab-4cec-81bf-7557d5f65a49` contains:

| Sequence | Event                                 |
| -------: | ------------------------------------- |
|      306 | `thread.opened` with title `Moon`     |
|      307 | canonical user `message.appended`     |
|      308 | `turn.requested`, project `curiosity` |
|      315 | `question.asked`                      |
|      316 | `question.answered`                   |
|      323 | terminal assistant `message.appended` |
|      324 | `turn.completed`                      |

Running the current TypeScript authority projectors over the exported physical
database produced 21 threads and 44 messages without a validation error.

Evidence classification:

- **Documented:** canonical data, integrity, counts, event order, and project
  identity above.
- **Documented:** the current projector can decode the physical database.
- **Inference (high):** the reported missing Moon row was hidden by
  projection/presentation behavior rather than lost storage.
- **Unknown:** the exact post-relaunch accessibility tree on the physical iPad;
  available UI automation is simulator-scoped.

The temporary database export was used only for local read-only queries and is
not retained in the repository.

## Current end-to-end trace

### Native storage

`NativeJournalHost.swift` opens the app-support database and delegates event
reads to Rust. `native-journal.ts` then pages every event in groups of 32 into a
new in-memory `NativeAuthorityJournal`.

Relevant paths:

- `apps/mobile/modules/curiosity-runtime/ios/NativeJournalHost.swift:28-84`
- `apps/mobile/modules/curiosity-runtime/native/src/lib.rs:878-925`
- `apps/mobile/src/native-journal.ts:196-223`

This is a database-backed journal, but not a bounded session query.

### JavaScript projection

`durable-curiosity-client.ts` reconstructs project ownership from all
`turn.requested` events, calls the authority's full-journal thread/message
projectors, joins question events in JavaScript, and returns a session object.

Relevant paths:

- `packages/curiosity-authority/src/projections.ts:40-112`
- `apps/mobile/src/durable-curiosity-client.ts:75-186`

Before the immediate recency fix associated with this synthesis, thread
projections exposed only their open sequence. Project and organization lists
preserved that ascending order.

### React state and routing

Startup calls `client.session()` and stores returned threads in React state.
Project-scoped active thread/messages are also React state. Session refresh
catches every error, marks the local runtime unavailable, and does not expose a
typed session-index failure.

The workspace catalog and thread-ownership override are initialized from
constants/empty objects on every provider mount. A custom project therefore
disappears on relaunch. A thread with a durable custom `projectId` is then
excluded from the default project and has no surviving project route.

Relevant paths:

- `apps/mobile/src/use-curiosity-workspace.ts:26-100`
- `apps/mobile/src/workspace-catalog-context.tsx:20-101`
- `apps/mobile/src/project-session-index-context.tsx:38-74`
- `apps/mobile/app/(app)/(project)/projects/[projectId]/_layout.tsx:11-14`

### Live updates

Provider deltas are correctly non-authoritative and flow through the in-memory
delta broker. Terminal assistant text is committed only when the durable run
settles. This boundary should remain.

Persisting every streamed token would add write amplification and could turn a
partial stream into a false durable assistant result. The database projection
should update on admitted and terminal events, not from the model transport.

## Falsified and retained hypotheses

| Hypothesis                                         | Result                         | Evidence                                                                              |
| -------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| The Moon thread was deleted or never committed     | **Falsified**                  | Physical sequences 306-324 are present and the DB passes integrity check.             |
| Current code cannot decode historical chat rows    | **Falsified for this fixture** | Current projectors return 21 threads/44 messages from the physical DB.                |
| A dedicated table should replace the event journal | **Rejected**                   | It would split authority and weaken replay/idempotency.                               |
| The model should write session rows as it streams  | **Rejected**                   | Model output is untrusted and streaming is non-terminal.                              |
| A dedicated table should serve reads               | **Retained**                   | It bounds list/transcript queries and isolates UI reads from full-journal replay.     |
| Workspace durability is unrelated                  | **Falsified**                  | Custom projects and ownership overrides are memory-only and can orphan valid threads. |

## Option assessment

### A. Keep full-journal JavaScript replay

Advantages: minimal schema and one canonical store.

Rejected as the production read path because cost grows with unrelated events,
every refresh crosses Swift/Rust/JSON/TypeScript for the full journal, one bad
projection can fail the whole list, and native pagination is by global events
rather than user sessions.

### B. Make session/message tables authoritative

Advantages: simple reads and familiar CRUD.

Rejected because event and table writes can diverge, direct model writes bypass
Curiosity policy, and crash/replay semantics become ambiguous. This conflicts
with D01/D18 and the accepted durable lifecycle.

### C. Canonical events plus transactional read projections

Selected. Event append remains authority. The same SQLite `IMMEDIATE`
transaction applies deterministic projectors to chat tables and advances a
checkpoint. Native list/read APIs query those tables directly. Tables can be
dropped and rebuilt from events.

This also matches the useful, non-authoritative part of OpenCode's design:
normalized project/session/message tables with session/time/sequence indexes,
plus durable event code that runs projector/commit work in the event
transaction before notification. Curiosity should adopt the pattern, not copy
OpenCode's authority or broad schema.

## Proposed schema v16

Illustrative SQL; exact migration SQL must be implemented and tested in Rust.

```sql
CREATE TABLE chat_sessions (
  session_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  opened_sequence INTEGER NOT NULL UNIQUE,
  updated_sequence INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  latest_turn_id TEXT,
  latest_turn_status TEXT NOT NULL
    CHECK (latest_turn_status IN
      ('idle','pending','waiting-for-input','completed','failed','cancelled')),
  transcript_entry_count INTEGER NOT NULL DEFAULT 0,
  projection_version INTEGER NOT NULL
) STRICT;

CREATE INDEX chat_sessions_project_recency_idx
  ON chat_sessions(project_id, updated_sequence DESC, session_id);

CREATE TABLE chat_turns (
  turn_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(session_id),
  run_id TEXT,
  assistant_message_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  requested_sequence INTEGER NOT NULL UNIQUE,
  terminal_sequence INTEGER UNIQUE,
  status TEXT NOT NULL
    CHECK (status IN
      ('pending','waiting-for-input','completed','failed','cancelled')),
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX chat_turns_session_sequence_idx
  ON chat_turns(session_id, requested_sequence);

CREATE TABLE chat_transcript_entries (
  session_id TEXT NOT NULL REFERENCES chat_sessions(session_id),
  sequence INTEGER NOT NULL,
  entry_id TEXT NOT NULL UNIQUE,
  source_event_id TEXT NOT NULL UNIQUE,
  turn_id TEXT,
  kind TEXT NOT NULL
    CHECK (kind IN
      ('user-message','assistant-message','question','question-answer')),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  text TEXT NOT NULL,
  transport_receipt_json TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(session_id, sequence)
) STRICT;

CREATE TABLE projection_checkpoints (
  projection_id TEXT PRIMARY KEY,
  projection_version INTEGER NOT NULL,
  last_sequence INTEGER NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
```

Workspace tables/events are also required:

- `workspace.organization.created`
- `workspace.project.created`
- `workspace.project.renamed`
- rebuildable `workspace_organizations` and `workspace_projects` tables
- a default `curiosity` organization/project seeded before chat replay

Presentation-only state such as `last_opened_session_id` MAY live in a separate
local preferences table. It is not model authority and need not enter the
canonical agent event chain.

## Deterministic event projection

| Event                        | Projection effect                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `thread.opened`              | Insert `chat_sessions`; title and creation identity become immutable unless a later trusted rename event exists. |
| `turn.requested`             | Bind/fence project identity, insert `chat_turns`, set latest turn pending, advance recency.                      |
| user `message.appended`      | Insert one `user-message` transcript entry.                                                                      |
| `question.asked`             | Resolve root execution to turn/session, insert assistant question entry, set waiting status.                     |
| `question.answered`          | Insert user answer entry; preserve `untrusted-user-answer` in the source event.                                  |
| assistant `message.appended` | Insert one terminal assistant entry, including validated transport receipt if present.                           |
| `turn.completed`             | Mark exact turn complete and session idle/completed; advance recency.                                            |
| `turn.failed` / cancellation | Mark exact typed terminal state and error without inventing assistant text.                                      |

Projection application and checkpoint advancement must occur in the same
transaction as the event append. Projector code must be pure with respect to
the event plus existing projection state and must be idempotent under exact
replay.

## Native API

Add a bounded native projection port instead of constructing a
`PortableAuthority` for session reads:

```ts
interface NativeChatProjectionPort {
  listSessions(input: {
    projectIds?: readonly string[];
    beforeUpdatedSequence?: number;
    beforeSessionId?: string;
    limit: number; // 1...100
  }): Promise<readonly ChatSessionProjection[]>;

  readTranscript(input: {
    sessionId: string;
    afterSequence?: number;
    limit: number; // 1...200
  }): Promise<readonly ChatTranscriptEntry[]>;
}
```

Ordering is deterministic:

```sql
ORDER BY updated_sequence DESC, session_id ASC
```

The React client should:

1. load the workspace catalog;
2. list sessions directly from the native projection;
3. restore the route's session or the persisted last-opened session;
4. page transcript entries for only that session;
5. overlay in-memory provider deltas while a turn is running; and
6. re-read the affected session after a canonical transaction commits.

No polling or model-authored database update is required.

## Migration and rebuild

The mobile native runtime currently accepts only exact schema v15 and has no
v15-to-v16 migration path. V16 must therefore add an explicit atomic migration,
not merely change `CREATE TABLE IF NOT EXISTS` declarations.

Required migration sequence:

1. open v15 with foreign-key enforcement disabled only inside the migration
   boundary;
2. begin an `IMMEDIATE` transaction;
3. create workspace/chat projection tables and indexes;
4. seed the default workspace;
5. replay all canonical events in global sequence order;
6. create placeholder `Recovered Project <short-id>` records for historical
   non-default project IDs whose in-memory names were already lost—never
   silently reassign those sessions;
7. write projection version/checkpoint at the journal tail;
8. set schema version 16;
9. run foreign-key check, projection invariants, and event-chain verification;
10. commit and re-enable foreign keys.

If rebuild fails, preserve the journal and surface a typed
`CHAT_PROJECTION_REBUILD_FAILED`. Do not convert failure into an empty session
list. A repair command may drop only projection tables and replay canonical
events.

## Binary qualification matrix

| Check              | Pass condition                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| V15 migration      | A copy of the physical 324-event fixture migrates atomically and retains event-chain integrity.           |
| Moon list          | Project `curiosity` returns Moon first with `updated_sequence = 324`.                                     |
| Moon transcript    | Read returns user, question, answer, final assistant in source sequence order.                            |
| Cold relaunch      | Kill after terminal commit; relaunch lists and opens the same session without JS full-journal replay.     |
| Waiting relaunch   | Kill after `question.asked`; relaunch shows the question and answer composer without duplicate entries.   |
| Custom project     | Create project, create chat, kill, relaunch; both project and chat route restore.                         |
| Idempotent rebuild | Two clean rebuilds produce row-for-row identical projections/checkpoint.                                  |
| Projection failure | Invalid projection input produces a typed recovery state, never `No recent sessions`.                     |
| Streaming crash    | Kill mid-delta; no partial assistant message is canonical, and pending work reconciles.                   |
| Pagination         | Adjacent pages have no duplicates/gaps under deterministic recency ordering.                              |
| Continued thread   | A new turn in an old session moves it to the first row after commit.                                      |
| Concurrency        | Simultaneous list/read and event commit return an old or new complete transaction, never a mixed row set. |

## Immediate root-cause fix

The implementation associated with this synthesis adds an explicit
`updatedSequence` to projected mobile threads and orders project/organization
session lists by latest activity descending. It is intentionally a bridge, not
the v16 native projection.

## Unknowns and follow-up

- **Unknown:** crash behavior during the future v15-to-v16 table build; it must
  be fault-injected on a disposable copy.
- **Unknown:** migration time and memory at large journal sizes; qualify at
  10K, 100K, and 1M events.
- **Unknown:** final retention/archive/delete semantics. Deletion must not be
  improvised as projection-only removal.
- **Unknown:** whether session title rename is manual-only or may be proposed by
  a model and admitted by trusted policy.
- **Deferred:** FTS, cloud sync, attachments, and transcript compaction. None is
  required to fix durable list/resume.

## Curiosity pass

Pursued high-value thread:

- **Physical DB inspection:** highest decision relevance and novelty; it
  falsified data loss and located the fault above canonical storage.

`CURIOSITY_NO_GO`:

- Persist every stream delta: rejects terminal-authority semantics and adds no
  restoration correctness.
- Add only a JSON expression index on `events.body_json`: does not solve
  cross-event joins, durable project catalog, transcript typing, or failure
  isolation.
- Copy OpenCode's complete session schema: unnecessary accounting and legacy
  fields; Curiosity needs its own closed lifecycle types.
- Investigate provider credentials/model session internals: irrelevant to local
  session enumeration and outside the permitted evidence boundary.
- Add cloud sync now: high cost and no value for the demonstrated local bug.

Coverage is sufficient: creation, project ownership, live deltas, question
waits, terminal commit, list, transcript load, relaunch, migration, rebuild,
ordering, and failure semantics are traced. Further source retrieval is
saturated until v16 implementation or fault-injection begins.

## Bibliography and rationale

1. **Physical Curiosity v15 SQLite database, read-only export, 2026-08-30.**
   Selected because it is the direct failing-device evidence. Supports
   integrity, event counts, Moon lifecycle, project identity, and the
   storage-vs-presentation conclusion. Preferable to screenshots or inferred
   state. The export is not committed.
2. **Curiosity mobile journal and projection source**, paths cited above at
   commit `5ff8475`. Selected because it owns the actual read, projection,
   React state, and route boundaries.
3. **OpenCode typed durable session tables**, exact first-party source at
   commit `47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7`:
   <https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/session/sql.ts>.
   Selected for normalized session/message foreign keys and recency/sequence
   indexes. It supports a read-model pattern, not Curiosity authority.
4. **OpenCode sequence-checked durable event transaction**, exact first-party
   source at the same commit:
   <https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/event.ts> and
   <https://github.com/anomalyco/opencode/blob/47b6b6f5f4f9b42d2bce7af1c4e5bf6efaf22ba7/packages/core/src/event/sql.ts>.
   Selected because projector/commit work runs transactionally before event
   notification and replay is sequence checked. Preferable to generic event
   sourcing guidance because it is the parity system's executable source.
