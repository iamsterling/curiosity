# iPadOS native H2–H3 point evidence — 2026-08-29

**Status:** Implementation and point evidence; not release authority.  
**Device:** Sterling’s iPad, `C137FAC2-3B00-528E-BBD0-1C3C5C714667`, iPadOS 27.  
**Build:** signed Debug iPhoneOS app, `com.iamsterling.curiosity`.  
**Boundary exercised:** portable TypeScript contracts, Expo Swift hosts,
Foundation Models, and the mobile-owned Rust/SQLite journal library.

## H2 native journal ABI v2

ABI v2 now exposes only coarse operations for run start, atomic transition
commit, runnable/read projections, dispatch allocation/authorization, attempt
settlement, and interrupted-attempt reconciliation. The Swift host injects the
database path, catalog digest, and ABI version; Hermes receives none of those
storage authorities and cannot submit SQL or migration primitives.

Rust tests exercised the following deterministic transaction fault points:

- run insert and run-start event append;
- transition event append, action/child/gate allocation, and final run revision
  update;
- attempt/action/call allocation;
- dispatch authorization after the call is marked dispatched;
- settlement after terminal row updates and after terminal event append.

At every exercised point, dropping the failed `IMMEDIATE` transaction left no
partial run revision, action, child, gate, attempt, call state, resource lease,
receipt, or fabricated terminal event. Separate tests retained explicit
`delivery-unknown` for interrupted dispatched work, returned armed work to
`proposed`, rejected stale generations, preserved exact duplicate identities,
and opened an ABI-v1 schema-v15 database through ABI v2 without rewriting the
schema.

The focused native run on this revision was:

```text
running 9 tests
test result: ok. 9 passed; 0 failed
```

Both simulator and signed physical-device builds linked ABI v2 successfully.
This does **not** qualify acknowledged durability. Physical hard-reset, device
lock, SQLite VFS/WAL synchronization, storage pressure, backup/restore, and
forward/failing migrations remain open under ADR-017 and H11.

## H3 structured on-device agent step

The native step uses one greedy `LanguageModelSession.respond` call with
`tools: []`. Its generated output is a true `@Generable` enum with four
associated-value branches, so mixed branch fields are not representable. The
Swift host separately validates exact tools and versions, JSON input, citation
sources, branch bounds, and optional assistant-state JSON. TypeScript repeats
route, context, run revision, state digest, step identity, tool, citation, and
proposal fencing before a proposal can reach authority code.

The physical DEBUG-only launch fixture reported:

```text
CURIOSITY_AGENT_STEP_FIXTURE kind=final status=PASS durationMs=2811
CURIOSITY_AGENT_STEP_FIXTURE kind=actions status=PASS durationMs=3206
CURIOSITY_AGENT_STEP_FIXTURE kind=question status=PASS durationMs=3870
CURIOSITY_AGENT_STEP_FIXTURE kind=no-go status=PASS durationMs=2629
CURIOSITY_AGENT_STEP_FIXTURE kind=overflow status=PASS error=FOUNDATION_MODEL_CONTEXT_EXCEEDED
CURIOSITY_AGENT_STEP_FIXTURE kind=cancel status=PASS error=ACTION_CANCELLED
```

The action branch proposed exactly one synthetic `document.read` version `1`
call. It did not execute a tool. The overflow fixture was rejected by native
total-envelope preflight before model dispatch. The cancellation fixture
cancelled an in-flight native structured step through `AgentStepHost.cancelAll`,
the same host method invoked by `OnAppEntersBackground`.

Portable and mobile tests additionally prove pre-dispatch route/overflow
rejection, exact stale-result identity fencing, malformed proposal rejection,
and one native call with no hidden retry. Static scans found no model tool loop,
native journal admission, or authority mutation path in the proposal hosts.

This fixture does **not** complete the physical lifecycle matrix. A real Home/
lock/suspend/terminate/relaunch sequence and stale callback after a newer
journal revision remain H3/H11 acceptance work. The launch fixture is compiled
only in DEBUG, requires `--curiosity-agent-step-fixtures`, and is not wired to
production scheduling, memory capture, or the local client.
