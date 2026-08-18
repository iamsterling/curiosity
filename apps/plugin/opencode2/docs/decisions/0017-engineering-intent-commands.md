# ADR 0017: Engineering intent commands and effect authority

**Status: Accepted design; corrected implementation, 2026-08-13.**
Contracts `ENG-CMD-DESIGN-CORRECT-07`, `ENG-CMD-IMPLEMENT-08`, and
`ENG-CMD-DESIGN-CORRECT-10`. Thin command assets are active as prompt/skill
initiation only. The typed foreground controller, admission, observation, and
profile modules exist but have no production command caller and are
**Experimental**, not active runtime wiring. No public engineering tool, global
configuration change, consequential effect, or external record is enabled.

## Decision and invariant

**Invariant.** `/bug`, `/feature`, and `/secure` express desired outcomes. Model
text, command arguments, profiles, and controller calls are untrusted claims;
none can grant authority, attest an observation, or prove completion. An effect
may occur only when independently observed root-user authority, exact action
admission, and the effect adapter all agree. Missing host guarantees are not
emulated in prompts.

**Current facts, validated in source.** Thin command/skill assets are Current
prompt initiation. Controller, admission, observation, profile, Ledger
projection, and write-disabled GitHub modules are Experimental and uncomposed.
The corrected implementation makes these boundaries explicit:

- the pinned host capability report disables authoritative persistence, child
  lineage, interrupt, reload, compaction, and concurrent setup. The current
  root-input approval hook therefore deliberately cannot confirm approvals.
- command assets expand markdown plus skill context into a model prompt; the
  pinned plugin API exposes no trusted callback that invokes typed engineering
  modules;
- capture disposition is plugin-owned call-site metadata; generic host events
  cannot select drop from their type or privacy fields;
- admission and consumption resolve immutable stored envelope/capsule records by
  identifier; and
- replay state is process-lifetime only, while failed actions diversify by class.

The prior assumptions that event metadata could classify confidentiality, caller
copies could bind authority, or memory could prove restart replay are rejected.

## Trust model

**Proposed.** Four values that were previously conflated are separate:

1. **Claim:** untrusted model/user text about desired work or an alleged result.
2. **Authority envelope:** immutable capability minted only from a trusted
   root-user/session approval event.
3. **Action ticket:** controller choice identifying the next permissible action
   class; it grants nothing.
4. **Admission capsule:** an internal, non-model-visible, one-call authorization
   minted at `execute.before` after all checks pass.

The profile contains policy and references to verified grant IDs, never grants
supplied in the profile payload. The authority store is plugin-owned state
derived from trusted host events. A model-visible ID is a lookup key, not a
bearer capability. Under the pinned host, replay protection is only
process-lifetime one-shot protection; there is no durable replay store.

### Authority provenance

An `AuthorityEnvelopeV1` is immutable and contains exactly:

```text
schemaVersion, grantID, issuer = root-user-channel, rootSessionID
intentID, intentRevision, repositoryRootIdentity
effectClass, canonicalScope, exactActionConstraints
issuedAt, expiresAt, nonce, maxUses = 1, approvalEventID
```

The approval event must be host-authenticated as direct root-user input, bound to
the displayed canonical action constraints, and unavailable for model or tool
construction. Confirmation atomically records `(grantID, nonce)` as unused.
Admission atomically changes it to consumed before effect execution. Within one
service instance, duplicate, expired, revised, differently scoped, or already
consumed grants fail closed. Every comparison uses the immutable envelope stored
at confirmation, never a caller-supplied copy. Consumption resolves the immutable
stored capsule by identifier and likewise ignores caller-supplied bindings.

Process restart loses grant, capsule, and consumed-key knowledge. The plugin must
not reconstruct or resume those records from model/session payloads. Restart
therefore invalidates a pursuit operationally, but does not prove a consumed
nonce is durably remembered. Durable restart replay prevention remains
unsupported. Diagnostics distinguish an in-process replay
(`ENGINEERING_AUTHORITY_REPLAYED`, `ENGINEERING_ADMISSION_REPLAYED`) from absent
process state (`ENGINEERING_AUTHORITY_NOT_FOUND`,
`ENGINEERING_ADMISSION_NOT_FOUND`). Production cannot mint a grant on the pinned
host, so this limitation cannot enable a production effect.

**Current pinned-host consequence.** The pinned host does not expose a proven
non-forgeable root approval channel with authoritative persistence. Therefore no
consequential authority envelope can be minted and all edits, local command
execution, active security tests, Git operations, network effects, GitHub writes,
merge, publish, release, and deploy remain disabled. Read-only reasoning may
continue. Repository reads may occur only through the host's existing user
permission boundary; they are observations, not engineering-granted capability.
This restriction is a product truth, not a temporary prompt warning.

## Exact-host `/secure` UX and privacy

**Proposed.** Raw restricted objectives are ephemeral secret inputs, not domain
data. They must not enter the base Ledger intent, engineering profile, Ledger or
capture events, canonical hashes, diagnostics, external-record plans, controller
state, tool arguments, or context projections. If a future fenced host enables
durability, the only eligible values are constants independent of objective bytes:

- Ledger objective: `Restricted security objective`;
- invariant/non-goals/criteria: policy-owned constants selected by kind;
- correlation: cryptographically random invocation ID;
- profile objective reference: that random ID only; and
- diagnostics: stable codes with no interpolated secret values.

On the exact pinned host, `/secure` is not a confidential-input channel. Its
accepted input is closed to a non-sensitive kind selector, trusted-workspace
scope, and an approved public classification enum. It accepts no objective,
finding, exploit detail, secret, summary, evidence, arbitrary metadata, or
digest. If the objective is restricted, or trusted classification is absent or
ambiguous, the command fails closed before capture. Users must not put
confidential content in command arguments.

The command's classification enum is UX framing, not trusted capture
classification and not authority to downgrade content. Because no free text is
accepted, it can select only `public-safe` or `restricted`; `restricted` returns
the unsupported diagnostic. Trusted capture classification still comes from the
host/plugin policy source described below.

The pinned host has no safe durable creation boundary. A future fenced host would
require one dedicated Ledger-owned engineering-intent transaction from closed
policy; it would not call generic `ledger_intent_propose`, accept serialized
Ledger objects, or mutate objects behind a running Ledger. For `secure`, that
future operation could accept no objective, summary, evidence, repository
content, or arbitrary metadata field. Generic intent capture must reject an
engineering command correlation and cannot later be relabelled secure.

The restricted objective may be handed to a worker only through a host-provided
ephemeral secret channel that is excluded from transcript, hooks, capture,
compaction, persistence, and diagnostics. It is erased when the foreground
action ends. **Prompt/context exposure is not solved by redaction after the
fact.** On the pinned host, no such non-persistent channel is proven; users must
not place confidential findings or exploit details in `/secure` arguments, and
restricted-objective pursuit remains blocked with
`ENGINEERING_RESTRICTED_INPUT_UNSUPPORTED`. A safe, constant-summary security
framing may exist only as foreground ephemeral state; it cannot ingest the
restricted objective or create a durable lifecycle record.

For bug/feature text, repository-private persistence requires an explicit
separate product decision, atomic publication fence, and exact field policy.
Until then there is no durable engineering base objective; natural-language text
remains ordinary host-session data, subject to the host's stated retention.

### Classification precedes hashing

Every capture boundary obtains classification from a plugin-owned call-site
policy, applies a closed retain/redact/drop transform, and only then serializes or
hashes the transformed value. A host/model event object—including `type`, tool
name, command text, privacy label, and payload—cannot select that disposition.
The disposition is a separate internal argument unavailable in the decoded event
schema. This order applies to tool/event capture,
observations, Ledger projections, diagnostics, GitHub plans, and content-derived
filenames or markers. Model labels, command privacy flags, tool names, and later
redaction cannot hide a record. If trusted classification is unavailable,
restricted input is unsupported and the record is dropped with a constant
diagnostic. There is no hash-only exception: a digest of restricted text is a
retained derived value.

**Current pinned-host consequence.** The host exposes no trusted command-origin
or confidentiality signal. Generic host events cannot be classified restricted
and cannot be dropped because their text/type resembles `/secure` or
`command.secure`. `session.input.admitted` is conservatively redacted for every
input by fixed plugin call-site policy; ordinary event envelopes are retained by
the same closed policy. Confidential/restricted command handling remains
unsupported, and restricted bytes must be rejected before entering the host
transcript or capture API.

## Exact decoding and policy closure

Every trust boundary decodes into a newly allocated immutable value; no decoder
returns the caller object. Exactness is recursive: unknown or missing keys,
duplicate IDs, empty or malformed values, non-canonical paths, unsupported
versions/enums, unsafe optional defaults, extra array entries, and invalid time
ranges are rejected.

Kind policy is a closed table. The decoder enforces at least:

- `secure` implies `restricted-security`, `local-only`, high/critical risk,
  independent security review, constant objective fields, and no ordinary Issue;
- caller payloads contain no authority, approval, provenance, evidence, status,
  correlation, marker, privacy override, or record-channel override;
- repository identity and scope come from trusted workspace discovery, not text;
- criteria and evidence requirements come from the selected policy version;
- authorization, admission, observation, Ledger append/replay, hook input, tool
  request/result, and external-record boundaries each have their own exact codec.

Policy mismatch is a diagnostic, never normalized to a permissive default.
Unknown tools and effects deny; unknown observations remain non-evidentiary.

## Evidence and satisfaction authority

**Proposed.** `engineering_pursuit_observe` does not accept evidence objects,
locators, result digests, status, or criterion satisfaction from the caller. A
caller may submit a non-authoritative claim, stored separately and never counted.

Evidence is derived only from the observation store populated by trusted
`execute.before`/`execute.after` and host events. The observation record includes
host event ID, tool call ID, exact tool identity, action/admission ID, sanitized
result status, input/output/environment digests computed by the plugin, event
sequence, observed time, and source kind. The evidence projector links an
observation to a criterion only when the action ticket declared that criterion
and expected evidence kind before execution. Freshness requires current intent,
criterion, repository/input/environment revisions and an unexpired observation.
Capture gaps, missing before/after pairs, ambiguous termination, untrusted source
kinds, or a caller-provided digest make the criterion unevidenced.

`observe` takes only the current action-ticket ID and observed tool call IDs (or
is driven directly from those events), then resolves records from the trusted
store. It cannot observe itself as proof. Reviews are evidence only when produced
through their own observed action and satisfy the bounded independence policy.
`satisfaction-proposed` is a pure projection requiring authoritative evidence for
every current criterion; only Ledger reconciliation may complete an intent, and
that remains disabled on the pinned host.

## Admission, paths, and TOCTOU

**Proposed/Experimental.** Controller `next` emits an action ticket bound to intent/revision,
criterion, action class, expected evidence class, canonical repository identity,
scope, expiry, and policy revision. It is reusable only for planning and grants
no effect.

At `execute.before`, the admission service exact-decodes the host tool request,
obtains the host-assigned call ID, canonicalizes the request, resolves current
authority, and—only on success—mints an internal `AdmissionCapsuleV1` bound to:

```text
intent/revision, action-ticket ID, grant ID, nonce
canonical root identity and canonical scope
exact tool and effect class, host call ID, canonical arguments digest
issuedAt, expiresAt, one-shot state
```

The capsule is passed out-of-band to the effect adapter, never returned to the
model. Consumption is atomic before the effect. Any mismatch or second use is
replay. Cancellation and ambiguous results consume the grant and capsule.

Canonical path policy uses filesystem identity, not string prefixes. The trusted
root is resolved once to its canonical existing directory identity. Existing
targets and every existing ancestor are resolved through symlinks and must remain
within that root and granted canonical scope. For creates, the nearest existing
parent is resolved; missing/ambiguous parents, dangling links, alternate roots,
special files, and symlinked final targets are denied. Immediately before the
effect, the adapter re-resolves identities and compares them with admission.
Replacement or mismatch yields `ENGINEERING_PATH_CHANGED` and consumes admission.

Path checks alone cannot eliminate the check/use race. A mutating adapter may be
enabled only if the platform supplies a race-resistant, directory-handle-relative
operation with no-follow semantics and postcondition verification. Where that
primitive is absent—as in the current partial implementation—workspace mutation
remains disabled. This is the explicit TOCTOU safety boundary.

The controller owns a closed history of attempted `(criterion, selectedAction,
hypothesisRevision, strategyRevision)` tuples. A failed action must change both
the strategy revision and concrete action class before a new ticket is issued.
Incrementing a revision while selecting `specialist-analysis` again is a blind
retry. If no untried safe action remains, the controller emits `ask-escalate` or
stops with `ENGINEERING_ACTION_DIVERSITY_EXHAUSTED`.

## Command initiation and production wiring

**Current.** `/bug`, `/feature`, and `/secure` are installed markdown command
assets referencing the `engineering-pursuit` skill. Under the pinned OpenCode
host they initiate a model prompt. Plugin composition registers hooks and exactly
18 Ledger/Loop tools. It registers no command callback and no `engineering_*`
tool; no source path calls `startForegroundEngineeringPursuit`, constructs
`EngineeringPursuitController`, or opens engineering admission from a command.
Host event subscription is observational and supplies no trusted command-origin
signal. There is therefore no available internal programmatic production entry
path without changing the public tool ABI or host contract.

**Decision.** Keep the exact 18-tool ABI. Command UX remains useful as
intent-driven orchestrator guidance: the shared skill frames the gap, selects
safe available actions, changes strategy, enforces budgets, and returns
`blocked`, `stopped`, or `satisfaction-proposed`. It must describe this as
prompt-guided session behavior, not typed controller enforcement or authoritative
evidence. Typed profile/controller/admission/observation modules remain internal
**Experimental** scaffolding with direct tests and are removed from Current
production claims. They become Current only after a trusted programmatic command
callback or separately approved ABI revision and end-to-end production tests.

## Closed tool and hook vocabulary

During an engineering pursuit, the before-hook recognizes three disjoint sets:

1. **Policy-control tools:** profile status, `next`, `observe`, and stop. They may
   update ephemeral controller state but cannot touch repository/external state.
2. **Observation-capable effect tools:** exact typed tools requiring admission.
3. **Denied tools:** native shell/edit, unknown tools, and every unclassified
   effect.

`engineering_pursuit_observe` is explicitly a policy-control tool. The hook
allows it after exact decoding without an effect admission capsule; it can only
resolve already captured observations and close the current action ticket. It
cannot submit or manufacture evidence. Policy-control tools are excluded from
criterion evidence. Adding any tool requires updating the closed vocabulary and
tests; name-prefix matching is prohibited.

## Ledger integration

Ledger remains the sole durable lifecycle authority, but the pinned host cannot
atomically bind its current authority token and epoch to publication. Therefore
durable engineering intent creation, profile append, activation, reconciliation,
and completion are disabled. `createEngineeringIntent` is not reachable from
production commands under this host. `/bug`, `/feature`, and safe `/secure`
framing currently use only ordinary prompt/session context. The typed foreground
constructor is Experimental and unreachable from production commands. No
plugin-owned typed pursuit is resumable.

If an atomic publication fence is later proven, a separate decision may enable a
Ledger-owned transaction that validates no conflict and publishes approved base
intent plus profile under one fenced revision. That is Target, not current
permission.

The generic intent tool remains available for non-engineering use but cannot
attach an engineering profile. Engineering tools cannot accept an existing
arbitrary intent for `/secure`. Profile revisions invalidate action tickets,
grants, admissions, observations, reviews, and satisfaction projections. Hooks
observe events; they do not append lifecycle success or infer completion.

## Product semantics and external records

### Exact public tool ABI

ADR 0015's exact public inventory is restored to these 18 tools:

```text
ledger_approval_request       ledger_approval_status
ledger_claim_release          ledger_claim_request
ledger_evidence_submit        ledger_fact_record
ledger_intent_activate        ledger_intent_frame
ledger_intent_propose         ledger_progress_propose
ledger_resolution_propose     ledger_review_propose
ledger_work_propose           native_loop_start
native_loop_pause             native_loop_resume
native_loop_stop              native_loop_status
```

The eight added `engineering_*` definitions are internal, not public tools.
Engineering guidance remains in thin commands and the shared skill. Hooks do not
turn that guidance into a typed pursuit; internal typed modules are Experimental.
A future public tool requires a separate protocol revision updating ADR 0015 and
its artifact/security tests.

`/bug`, `/feature`, and `/secure` remain concise kind selectors over one shared
skill. Bug framing requires reproduction/root-cause/regression evidence; feature
framing requires binary behavior/non-goals/architecture impact/red-green
evidence; secure framing requires authorized target/rules of engagement, threat
model, secret-safe oracle, remediation, residual risk, and distinct bounded
review. These requirements are policy-owned criteria, not prompt procedures.

GitHub is a product record, never lifecycle or approval authority. Production
GitHub reads/writes, active security testing, disclosure, commit/push, merge,
publish, release, deploy, local command execution, and workspace mutation remain
disabled. Restricted GitHub planning is also disabled: no title, body, summary,
criteria, evidence, blocker, marker, content-derived identifier, or digest is
constructed. A future approved private-security plan may contain only policy
constants and allowlisted trusted sanitized metadata demonstrably independent of
objective bytes—never arbitrary text or a digest of restricted text. Future
adapters retain read/preflight/plan/write/confirm separation,
marker idempotency, privacy-channel checks, ambiguous-write recovery, and one
fresh action-bound grant per write. Restricted data can never target an Issue.

Foreground reasoning may return a gap, blocker, stop, or satisfaction proposal.
Native continuation, strict reviewer lineage, authoritative completion, and
token accounting remain unsupported under the pinned host.

## Options considered

1. **Trusted authority/evidence services with disabled effects until host support
   (selected).** Plausible because it preserves thin commands, Ledger authority,
   and typed boundaries while making unsupported guarantees explicit. It loses
   immediate edits, checks, secure handoff, and GitHub convenience.
2. **Treat root-looking metadata and model profiles as authority.** Plausible
   because it fits the current host and partial code. It loses because the caller
   can forge grants, provenance, approvals, and evidence; replay and confused
   deputy attacks remain structural.
3. **Use opaque bearer capsules returned to the model.** Plausible because
   capability tokens can be simple. It loses because an unbound/reusable token
   can be replayed or substituted and leaks authority into an adversarial
   context.
4. **Permit mutation after realpath/prefix checks.** Plausible as a common local
   implementation. It loses on symlink replacement and TOCTOU; correctness would
   depend on timing rather than an enforced invariant.
5. **Keep 26 tools and treat expansion as internal.** Plausible because the
   scaffolding exists. It loses because registered tool identity is the public
   host protocol fixed by ADR 0015, not an implementation detail.
6. **Retain hashes or regex-redacted restricted summaries.** Plausible because it
   preserves uniform observability. It loses because classification occurs after
   exposure, unknown secrets evade regexes, and a digest remains a correlation
   oracle over restricted bytes.
7. **Keep prompt-only initiation and Experimental typed scaffolding (selected).**
   Plausible because it preserves the exact 18-tool ABI while giving users useful
   intent-driven orchestration. It loses typed runtime enforcement until the host
   exposes a trusted command callback.
8. **Remove all typed engineering modules now.** Plausible because unreachable
   scaffolding can drift and inflate confidence. It loses focused executable
   design probes for admission, evidence, and controller policy. Retention is
   conditional: modules stay explicitly Experimental, uncomposed, and absent
   from Current production claims.

This remains ADR-worthy because it defines authority provenance, privacy,
evidence, filesystem containment, and Ledger ownership across the plugin.

## Threat model and required tests

| Attack | Required fail-closed oracle |
|---|---|
| Caller inserts grants/provenance/approval IDs | exact codec rejects; no envelope exists |
| Fake root metadata or synthetic input | no trusted issuer event; grant mint denied |
| Grant/capsule replay, expiry, revision change in one process | atomic consume or stale diagnostic; no effect |
| Restart with process-local replay state | records absent and pursuit non-resumable; no durable replay claim |
| Tool/call/argument substitution | admission binding mismatch; no effect |
| Fabricated locator/digest/status/review | claim retained as non-evidence; criterion unchanged |
| Missing/colliding before/after events | capture gap/ambiguity; criterion unchanged |
| `observe` called during pursuit | allowed as policy-control; cannot count itself or caller data |
| Unknown/missing/nested-extra profile fields | exact decode rejection at every boundary |
| Kind/privacy/record mismatch | policy mismatch diagnostic; no normalization |
| `../`, absolute path, alternate separator/root | canonical scope denial |
| Existing or dangling symlink escape | canonical/no-follow denial |
| Create below symlinked/missing ambiguous parent | parent containment denial |
| Symlink/target replacement after admission | identity mismatch; consumed admission; no retry |
| Platform lacks race-resistant mutation primitive | mutation capability disabled |
| Event claims `type: command.secure` | generic call-site disposition is unchanged; event text cannot select drop |
| Restricted canary reaches trusted-classified capture seam | plugin-owned drop occurs before canonicalization; digest sink receives no canary-derived input |
| Secure canary reaches GitHub planner | restricted planning rejects before marker/body/digest construction; port receives no call |
| Secure canary reaches engineering creation | pinned-host path returns disabled and creates no Ledger event/file/hash |
| Raw secure text passed to generic Ledger intent | engineering correlation/reclassification denied |
| Host transcript retains command argument | documented exposure; restricted handoff blocks |
| Pinned-host capability denial | no consequential grants/effects, continuation, or completion |

Tests must include process-lifetime replay, explicit restart-state loss,
concurrent consume, expiry boundaries,
repository replacement, dirty-work preservation, and canaries in Ledger files,
capture files, controller snapshots, context projections, diagnostics, planned
GitHub payloads, and all canonical digest inputs. Canary tests inject the actual
canary through public capture, GitHub, durable-creation, and hashing entry points
and instrument the canonicalizer/digest sink; scanning an object that never
received the canary is not evidence. Fake adapters may prove future contracts but
production composition must expose the disabled state. Restart tests assert
`*_NOT_FOUND` and non-resumability, not that a fresh in-memory service remembers
old consumption. A wiring test proves command assets are prompt/skill assets,
setup registers no command callback, the tool set remains exactly 18, and no
command path reaches the Experimental constructor/controller/admission modules.

## Exact repair map (specification, not procedure)

The next implementation change must:

- remove authority/provenance/approval fields from caller profile schemas and
  introduce a trusted immutable grant boundary with explicitly process-lifetime
  replay state;
- restore `src/features/tools/index.ts`, setup tests, and artifact tests to the
  exact 18 names; keep engineering entry points internal;
- keep command initiation prompt/skill-only and typed engineering modules
  Experimental/uncomposed while no trusted command callback exists;
- make capture disposition a plugin-owned call-site decision unavailable to
  event/model payload; remove the `event.type === "command.secure"` drop rule and
  classify before every capture/observation digest;
- reject restricted GitHub planning before constructing text, markers, or hashes;
- recursively exact-decode all command, policy, hook, event, admission,
  observation-before/after (including nested artifact), evidence, review, and
  external-record values into newly allocated immutable values;
- split caller claims from observed evidence and project satisfaction only from
  trusted event records;
- replace the reusable capsule with action tickets plus internal call-bound,
  argument-bound, process-lifetime one-shot admission; admission and consumption
  resolve immutable stored records by reference and trust no caller copy;
- report absent records after process restart with stable `*_NOT_FOUND`
  diagnostics and make no durable replay claim;
- prevent repeated failed action classes per criterion; choose an untried action,
  ask/escalate, or stop with `ENGINEERING_ACTION_DIVERSITY_EXHAUSTED`;
- add canonical filesystem identity policy and keep mutation disabled until a
  race-resistant adapter is proven;
- for create targets, revalidation must lstat the final target and reject if it
  now exists in any form, including a symlink;
- classify `engineering_pursuit_observe` as non-evidentiary policy control; and
- retain disabled GitHub/native autonomy and exact 18-tool production wiring.

No giant command procedures, alternate lifecycle, shell-as-authority, or
objective-derived durable correlation are introduced.

### Exact implementation and test map

| Surface | Required correction | Binary test oracle |
|---|---|---|
| `src/features/hooks/event-capture.ts` | Remove event-derived secure drop; accept only an internal call-site disposition and transform before digest. | A spoofed `command.secure` generic event is retained/redacted per call-site policy; a plugin-owned drop passes no payload to the digest sink. |
| `src/features/hooks/open-code-hooks.ts` | Select fixed dispositions from the registration/call site only; never derive confidentiality from `eventEnvelope`. | Arbitrary event type/privacy/payload mutations cannot change disposition; all admitted input remains payload-redacted. |
| `src/features/engineering-intent/admission.ts` | Resolve stored envelope/capsule records by opaque ID, compare stored values only, atomically consume in process, and use not-found diagnostics after state loss. Rename/remove any capability name implying durable replay. | Mutated caller copies cannot alter admission or consumption; one of two concurrent consumes wins; a fresh service returns `*_NOT_FOUND`, not a durable-replay verdict. |
| `src/features/engineering-intent/controller.ts` | Track attempted action classes per unresolved criterion and require action diversity after failure. | Successive failures never produce the same action class; exhaustion deterministically asks/escalates or stops. |
| `src/plugin/plugin.ts`, `src/features/tools/index.ts`, command assets | Preserve prompt-only initiation and exact ABI; do not compose Experimental modules. | Setup has no command callback/engineering caller and exports exactly the listed 18 tools. |
| `docs/architecture/current-state.md`, ADR 0017 | Label runtime facts Current, typed uncomposed modules Experimental, and trusted callback/durable replay Proposed/Deferred. | Documentation assertions match source reachability and capability report. |

Focused tests belong in `tests/security/engineering-command-security.test.mjs`
(classification, immutable authority, process lifetime),
`tests/unit/engineering-policy.test.mjs` (action diversity), and
`tests/integration/plugin-setup.test.mjs` plus
`tests/unit/engineering-command-assets.test.mjs` (prompt-only wiring and exact
18-tool ABI). Existing tests that expect `command.secure` to self-classify or a
new service to prove replay must be replaced because those expectations violate
the trust and persistence facts.

## Binary acceptance criteria

1. No caller/model payload can create or widen a grant, provenance claim,
   approval, evidence observation, or satisfaction state.
2. Every consequential effect requires a trusted immutable stored envelope and an
   exact one-call capsule bound to action, tool, host call ID, canonical root and
   scope, canonical argument digest, expiry, nonce, and atomic process-lifetime
   one-shot consume; caller copies are never authoritative.
3. On the pinned host, all consequential effects and restricted-objective
   handoff are observably disabled with stable diagnostics.
4. Recursive exact codecs reject every unknown, missing, malformed,
   overscoped, unsafe-default, and kind-policy-mismatched value at each boundary.
5. Caller claims cannot satisfy criteria; only fresh, criterion-predeclared,
   trusted hook/tool observations can contribute to `satisfaction-proposed`.
6. `engineering_pursuit_observe` executes as policy control, accepts no evidence
   payload, cannot count itself, and cannot bypass effect admission.
7. Canonical path and race tests deny traversal, symlink/parent escapes,
   replacement, ambiguous creates, replay, and TOCTOU; unsupported safe mutation
   leaves workspace effects disabled.
8. Secure canary tests prove raw objective bytes enter none of the plugin-owned
   durable or hashed surfaces; host prompt persistence is disclosed and blocks
   restricted handoff rather than being falsely claimed safe.
9. On the pinned host, engineering command initiation is prompt/skill-only; it
   creates no plugin-owned foreground pursuit, Ledger event, profile, hash, or
   recoverable lifecycle state.
10. Production composition performs no external mutation, GitHub write, commit,
     publish, deploy, native continuation, or authoritative completion.
11. The public artifact registers exactly the 18 listed ADR 0015 tools and no
    `engineering_*` tool.
12. Create-target revalidation rejects final-target substitution, and recursive
    observation codecs reject nested extras, bad enums/numbers/times, aliasing,
    and malformed optional fields.
13. Real canaries flow through capture, restricted GitHub planning, durable
    creation, and hash sinks and are observed at none of them.
14. Caller/event text cannot choose capture disposition; spoofing
    `command.secure` does not drop a generic event, while a plugin-owned drop seam
    drops before canonicalization.
15. In-process duplicate consumption is rejected; a fresh service reports state
    absent rather than durable replay protection; production cannot mint/resume.
16. Two consecutive failures cannot issue the same concrete action class for the
    same unresolved criterion; exhaustion asks/escalates or stops deterministically.
17. Production setup exposes no engineering command callback or typed pursuit
    caller and exactly the 18 ADR 0015 tools.

## Pre-mortem, sensitivity, and revisit triggers

Likely failures are accidental reintroduction of model-visible authority,
objective bytes entering observability hashes, event-source confusion, a race
between admission and write, or widening the policy-control set until it becomes
an effect bypass. The exploit tests above are release gates.

The principal sensitivity points are a trusted programmatic command callback,
host-authenticated root input, durable atomic replay storage, non-persistent
secret handoff, race-resistant filesystem operations, and trustworthy tool event
identity. Changing any one can enable a
narrow capability, but does not implicitly enable the others.

Revisit this ADR only with primary-source evidence of a host API change or a
separately reviewed adapter proving one of those capabilities. Enabling GitHub,
filesystem mutation, restricted secure handoff, native autonomy, or strict
reviewer independence requires its own reviewed decision and adversarial tests.

**Deferred capabilities:** confidential `/secure` objectives, durable engineering
intent publication, resumable pursuits, restricted GitHub records, public
engineering tools, consequential local effects, native autonomy, and
authoritative completion. Controller scaffolding enables none of them.
