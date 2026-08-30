# ARM64 Apple plug-in qualification plan

> Bounded test-plan handoff for Apple-silicon macOS, iPadOS, and iPhone. It does
> not authorize arbitrary third-party binary execution, SDK/program terms,
> security acceptance, App Store submission, or a compatibility claim. Use only
> owned fixtures in disposable environments until separate authority is granted.

## 0. Corrected scope

**Decision:** determine whether native ARM64 plug-in adapters and execution modes
are correct and resilient enough to advance from prototype to a release claim.

Initial and conditional format scope:

| Format | macOS ARM64 | iPadOS | iPhone | Plan status |
| --- | --- | --- | --- | --- |
| AUv3 | Required | Required | Required | First vertical slice and cross-device baseline. |
| AUv2 | Required compatibility path | Not applicable | Not applicable | Second adapter, native ARM64 only. |
| VST3 | Planned compatibility path | Not applicable | Not applicable | Third adapter, native ARM64 only. |
| VST2 | Conditional compatibility path | Not applicable | Not applicable | Native ARM64 only; fixture and adapter work begin only after G0 approval. |
| CLAP and other surveyed formats | Deferred/unsupported | Not applicable | Not applicable | Outside initial Apple product. |

No x86_64, 32-bit, Rosetta host mode, or architecture bridge is in scope.
Intel/32-bit fixture packages are rejection tests only and must never execute
inside the shipping host.

**Sufficient coverage:** every applicable format/OS/device cell passes
discovery, instantiation, realtime, offline, state, migration, UI, lifecycle,
failure, and project-durability gates with retained evidence.

Gate separation is mandatory because format acceptance, scanning,
instantiation, rendering, and full contract behavior are distinct. ([Logic
C-042](dossiers/apple-logic-pro.md#21-claims-register),
[REAPER C-056](dossiers/cockos-reaper.md#21-claims-register))

## 1. Safety, provenance, and Apple authority boundary

- Run only source-controlled qualification plug-ins owned by or explicitly
  approved for the project.
- Pin Xcode, Apple SDKs, deployment targets, AU/VST SDK revisions, compiler,
  entitlements, signing identities, package hashes, and dependency licenses.
- Use dedicated test signing identities, test App IDs, and disposable Mac/iPad/
  iPhone devices or simulator environments as appropriate.
- Do not accept gated/click-through terms or enroll in a vendor program without
  authorized human approval.
- Do not run marketplace/community plug-ins in CI or on developer workstations.
- Block network access unless a named test uses a controlled local endpoint.
- Crash, hang, malformed-state, resource-pressure, interruption, and worker
  tests require restorable environments and synthetic audio.
- Do not infer App Store acceptance, notarization, sandbox safety, or ecosystem
  compatibility from fixture success.
- A pass applies only to the recorded app/OS/device/format matrix.

## 2. Fixture package family

Implement one behavior specification with platform-format wrappers:

- `ProbeAUv3`: macOS AUv3 plus iPadOS/iOS AUv3 App Extensions;
- `ProbeAUv2`: macOS ARM64 Audio Unit v2 component;
- `ProbeVST3`: macOS ARM64 VST3 bundle;
- `ProbeVST2`: macOS ARM64 VST2 bundle, created only after G0 approval;
- `ProbeIntelRejected`: Intel-only macOS metadata/package used only to verify
  deterministic rejection; and
- versioned v1/v2/v3 packages for identity and migration tests.

Where technically possible, AUv3 builds share state semantics and DSP vectors
across Mac/iPad/iPhone so the host—not fixture drift—is under test. Platform
differences must be explicit in fixture metadata and expectations.

### QF-01 Deterministic effect

- mono and stereo main buses;
- optional mono/stereo sidechain;
- deterministic gain, polarity, channel tag, impulse, and silence output;
- switchable latency of 0, 17, 257, and 2048 samples;
- switchable tail of 0, 250 ms, and 2 seconds;
- latency changes while stopped and during playback;
- bypass, reset, suspend, render-resource allocation, and deallocation probes;
- silence, denormal, `NaN`, infinity, and clipped-input handling; and
- realtime/offline output signatures.

### QF-02 Multi-output instrument and MIDI processor

- timestamped note input and deterministic oscillator;
- stereo main plus two auxiliary outputs;
- event/MIDI output where the exact format role supports it;
- note ID, pressure, timbre, pitch, release velocity, sustain, and per-note
  expression probes;
- deterministic voice stealing/all-notes-off; and
- bus activation/deactivation before and during playback.

AUv3 instrument, effect, music-effect, and MIDI-processor roles must remain
separate fixture components. Loopy Pro documents distinct AUv3 roles and MIDI
paths, demonstrating that a generic “AUv3 supported” result is insufficient.
([Loopy Pro C-019, C-026](dossiers/loopy-pro.md#21-claims-register))

### QF-03 Parameter and automation probe

- stable IDs independent of display order;
- boolean, integer, enum, linear, logarithmic, bipolar, read-only, hidden, and
  non-automatable parameters;
- UTF-8 names/units, long names, and duplicate display names;
- value-to-text/text-to-value boundaries;
- begin/change/end gestures;
- multiple timestamped points within one render quantum; and
- v2/v3 with reordered/added/removed parameters but stable surviving IDs.

### QF-04 State, preset, and external-asset probe

- opaque state with checksum and fixture schema version;
- empty, large, truncated, corrupt, and unknown-future state;
- factory/user preset paths where supported;
- package-relative and authorized external assets;
- moved, missing, revoked, and restored file access;
- deterministic v1→v2 migration and intentional migration failure; and
- identical AUv3 logical state tests across Mac, iPad, and iPhone.

### QF-05 UI and accessibility probe

- custom and generated parameter UI;
- resizable, fixed-size, and no-custom-UI variants;
- compact iPhone, regular iPad, Mac window, split view, rotation, and size change;
- multiple instances, focus, keyboard capture, touch, pointer, and hardware
  keyboard input;
- Mac display scaling and mobile display scale;
- VoiceOver/accessibility-tree inspection;
- UI destruction while DSP continues; and
- no-UI/offline rendering.

### QF-06 Fault and lifecycle probe

Controlled modes for:

- crash/abort during discovery, instantiate, render-resource allocation,
  process, UI, state save/load, and shutdown;
- deadlock, callback overrun, memory growth, invalid bus/parameter metadata, and
  malformed state;
- AUv3 extension termination and relaunch;
- app background/foreground, interruption begin/end, route removal/addition,
  sample-rate change, device loss, and media-services reset;
- memory warning/resource pressure and simulated low-storage save; and
- delayed or failed teardown.

Every fault mode identifies its phase so the host can attribute failure without
parsing a generic crash message.

### QF-07 Identity and format-sibling probe

- two package paths to the same macOS component;
- same display name with different manufacturer/component IDs;
- same ID with different version or architecture;
- AUv2, AUv3, VST3, and conditionally VST2 siblings representing one marketed
  product;
- matching AUv3 component identity across Mac/iPad/iPhone;
- removed, reinstalled, upgraded, and downgraded versions; and
- Intel-only/invalidly signed packages that must be rejected.

### QF-08 Realtime-context probe

Instrumented optional allocation, lock, sleep, file, network, and logging calls
from discovery, initialize, UI, realtime, and offline contexts. This fixture
detects host call context and containment; it does not authorize unsafe
production behavior.

## 3. Apple test matrix

Record `NOT_APPLICABLE:<reason>` instead of omitting cells.

| Dimension | Required values |
| --- | --- |
| Product surface | Apple-silicon Mac; iPad; iPhone |
| OS | Product minimum, latest stable, and next-version beta only in a non-release lane |
| CPU architecture | Native ARM64; Intel/x86_64 and 32-bit rejection fixtures on Mac |
| Format | AUv3 all surfaces; AUv2/VST3 Mac; VST2 Mac only after G0 approval |
| Device class | At least low/median/high supported resource tiers; physical mobile hardware required before release |
| Host execution | AUv3 platform extension mode; isolated Mac worker; grouped Mac worker only if offered; no in-process compatibility mode unless separately approved |
| Processing | Realtime playback; monitored path; offline; freeze/bounce; no-custom-UI |
| Sample rate | 44.1, 48, 96 kHz; 192 kHz only where product/device profile supports it |
| Render quantum | 16, 32, 64, 128, 257, 512, 1024, plus platform-variable values |
| Layout | Mono; stereo; sidechain; multi-output; wider layouts only if product requirements include them |
| Transport | Stop; preroll; play; loop boundary; seek; tempo/meter change; record; tail drain |
| Lifecycle | First discovery; cached discovery; rescan/reinstall; app relaunch; extension/worker restart; project reopen |
| Mobile lifecycle | Background/foreground; interruption; route change; sample-rate change; memory pressure; extension termination |
| State | Default; edited; automated; large; corrupt; missing asset; future version; downgrade |
| UI | Custom; generic; absent; iPhone compact; iPad split/regular; Mac scaling; VoiceOver |
| Project transfer | Mac→iPad→iPhone→Mac with AUv3; Mac-only AUv2/VST3 and approved VST2 placeholder/fallback roundtrip |

## 4. Qualification gates

### G0 — Provenance, SDK, signing, and distribution readiness

**Pass only if:** source, dependencies, Apple/VST SDKs, licenses, deployment
targets, bundle/component identifiers, entitlements, signing, notarization, App
Extension packaging, and intended distribution path have an approved record.

VST2 stops at this gate unless authorized reviewers record that this entity may
build and distribute the native ARM64 host path. Current hosts may retain VST2,
but the corpus records restricted onboarding/header/distribution conditions and
weak fit with Apple mobile. ([Cubase C-026–C-027](dossiers/steinberg-cubase.md#21-claims-register),
[Ardour C-024](dossiers/ardour.md#21-claims-register),
[LMMS C-033](dossiers/lmms.md#21-claims-register))

### G1 — Discovery and architecture rejection

**macOS pass:** AUv2/AUv3/VST3 and any approved VST2 discovery, duplicate
identity, cache invalidation, rescan, timeout, cancellation, logs, signing
result, and native ARM64 architecture are deterministic. Scan crash/hang cannot
crash or block the DAW. Intel/32-bit fixtures are rejected without Rosetta.

**iPad/iPhone pass:** installed AUv3 extensions are discovered through platform
APIs with stable identity and enable/disable status. No arbitrary filesystem scan
or desktop format appears.

Mature hosts document external scan helpers and visible recovery, but those
behaviors do not prove this implementation. ([Studio One C-016–C-018](dossiers/presonus-studio-one.md#21-claims-register),
[Ardour C-012](dossiers/ardour.md#21-claims-register),
[Logic C-015](dossiers/apple-logic-pro.md#21-claims-register))

### G2 — Instantiate and lifecycle

**Pass only if:** role, buses, sample rate, render quantum, resource allocation,
UI, state initialization, and teardown work in every applicable cell.
Unsupported roles/layouts fail with a stable diagnostic and do not mutate the
project.

### G3 — Realtime audio, events, and containment

**Pass only if:** deterministic audio/event output, channel maps, sidechains,
multi-output, bypass, suspend, parameter timestamps, and dynamic changes meet
the declared contract. Worker/extension crash or hang must not terminate the
DAW or delete the graph node. Recovery is defined silence, bypass, restart, or
render fallback—not undefined stale audio.

Logic documents containment of AU failures on Apple silicon while leaving exact
topology unknown; that is the target outcome, not proof for this host.
([Logic C-017–C-018, C-040](dossiers/apple-logic-pro.md#21-claims-register))

### G4 — Timing, tails, and offline fidelity

**Pass only if:** latency impulses align across tracks, buses, sends, sidechains,
bypass, and dynamic latency changes; automation/event offsets meet declared
tolerance; tails are neither truncated nor resurrected; and offline/freeze
results meet the declared equivalence policy. Test every supported render
quantum and sample rate. ([Ableton C-025](dossiers/ableton-live.md#21-claims-register),
[Logic C-023–C-024, C-040](dossiers/apple-logic-pro.md#21-claims-register))

### G5 — State, migration, and format siblings

**Pass only if:** save/open reproduces sound, parameters, automation, I/O,
sidechain, presets, assets, and execution mode.

- AUv3 state must round-trip independently on each surface.
- Cross-device AUv3 state transfer must pass only for an explicitly qualified
  component/version family.
- Cross-format AUv2/AUv3/VST3/VST2 sibling pairs are not migrations by default.
- A validated migration requires stable mapping, version policy, audible/state
  fixtures, rollback, and explicit user action.

### G6 — Missing dependency and project portability

Test these mandatory scenarios:

1. Create an AUv3 project on Mac; open/edit/save on iPad and iPhone; return to
   Mac and reproduce state/automation/routes.
2. Create a Mac AUv2 project; transfer to iPad/iPhone; play fallback, edit
   unrelated material, resave; return to Mac and restore the live AUv2 instance.
3. Repeat scenario 2 for VST3.
4. If G0 approved VST2, repeat scenario 2 for VST2.
5. Remove an AUv3 from one device; open/resave/reinstall; restore state.
6. Revoke/move external assets; relink without changing component identity.
7. Upgrade and downgrade fixture versions across devices.

**Pass only if:** unavailable plug-ins preserve complete placeholders and a
staleness-marked render fallback. Ardour and Reason document placeholder
preservation; Logic documents the cross-device incompatibility problem but not
universal state survival. ([Ardour C-018–C-019](dossiers/ardour.md#21-claims-register),
[Reason C-020](dossiers/reason-studios-reason.md#21-claims-register),
[Logic C-028–C-029](dossiers/apple-logic-pro.md#21-claims-register))

### G7 — UI and accessibility

**Pass only if:** custom and generic UI, focus, touch/pointer/keyboard input,
size changes, multiple instances, VoiceOver, teardown, and no-UI rendering pass
for every applicable surface. The generated host UI must expose every public
parameter through Apple accessibility APIs even when the custom UI does not.

### G8 — Mobile interruption and resource recovery

**Pass only if:** interruption, route/sample-rate changes, app transitions,
AUv3 extension termination, memory pressure, device loss, and low-storage save
produce a valid checkpoint and deterministic resume/fallback. Project state must
remain recoverable after forced app termination at each lifecycle boundary.

### G9 — Soak and atomic project recovery

**Pass only if:** repeated discover/open/play/record/save/close cycles, worker or
extension restarts, device changes, screen transitions, and long sessions show
no unbounded resource growth, stale cache, state loss, or nondeterministic audio.
Fault injection during save leaves a valid old or new package snapshot.

## 5. Binary acceptance checks

For every release-claimed surface/format cell:

- [ ] All executing code is native ARM64; Intel/32-bit packages are rejected.
- [ ] Main app survives discovery/scan faults and names the component/phase.
- [ ] AU role, buses, sidechains, and multi-output match declared metadata.
- [ ] Audio, MIDI/events, and automation timestamps pass required quantums/rates.
- [ ] PDC passes through tracks, buses, sends, sidechains, bypass, and changes.
- [ ] Tail, stop, seek, loop, freeze, and offline behavior match policy.
- [ ] Custom, generic, inaccessible, and absent UI paths remain operable.
- [ ] VoiceOver and input-modality checks pass for host-generated UI.
- [ ] Save/open reproduces state, sound, automation, routes, presets, and assets.
- [ ] Missing/resave/restore preserves the dependency placeholder.
- [ ] Mac-only plug-ins survive mobile roundtrip through fallback/placeholder.
- [ ] AUv3 cross-device state passes only for explicitly qualified identities.
- [ ] No automatic AUv2/AUv3/VST3/VST2 substitution occurs without a migration.
- [ ] Extension/worker crash or hang is contained and recovery is deterministic.
- [ ] Mobile interruption/resource lifecycle tests leave a recoverable project.
- [ ] Logs/support bundles identify OS, device, format, identity, and fault phase.
- [ ] SDK/license/signing/entitlement/distribution records match shipped artifacts.

Any unchecked item blocks a broad “supports <format>” claim. A narrower release
claim must name the exact surface, OS, architecture, format, gates, and limits.

## 6. Evidence artifacts

Each run retains:

- app, engine, adapter, fixture, Xcode/SDK, OS, device, and CPU revisions;
- plug-in bundle hash, signature, entitlements, identifiers, architecture, and
  provenance record;
- discovery/cache transition and normalized identity decision;
- process/extension topology and fault attribution;
- audio files plus deterministic hash or numeric comparison;
- timestamped MIDI/event/automation traces;
- latency/tail/critical-path report;
- lifecycle sequence and checkpoint/restart result;
- project packages before/after save, transfer, missing dependency, migration,
  and injected fault;
- authorized UI/accessibility snapshots;
- CPU, memory, thermal, disk, and soak metrics; and
- machine-readable gate results plus human-readable diagnostics.

Do not use opaque state-byte equality as the sole oracle; compare declared
migration status and reproduced behavior.

## 7. Phased execution

1. **Harness foundation:** format-neutral oracle, artifact schema, atomic project
   roundtrip, lifecycle controller, audio/event comparator, and fault controller.
2. **AUv3 on Mac:** QF-01/QF-03/QF-04/QF-06 through G0–G9.
3. **AUv3 on iPad:** repeat contract plus touch, interruption, route, memory, and
   extension lifecycle.
4. **AUv3 on iPhone:** compact UI and constrained-device matrix.
5. **Cross-device AUv3:** Mac→iPad→iPhone→Mac project/state roundtrip.
6. **AUv2 on Mac:** native ARM64 scanner/worker, state/UI, placeholder, and
   mobile fallback roundtrip.
7. **VST3 on Mac:** native ARM64 scanner/worker and the same Mac/mobile project
   fallback gates.
8. **VST2 gate and optional slice:** run G0 first; if approved, build only a
   native ARM64 macOS fixture/adapter and apply the Mac plus mobile-placeholder
   gates. If denied, retain the placeholder identity and unsupported diagnostic.
9. **Ecosystem decision:** only after owned fixtures pass may a separately
   authorized, bounded third-party compatibility corpus be proposed.

Rosetta is not a dormant phase in this plan. VST2 is conditional on the explicit
G0 decision above and cannot silently enter implementation.

## 8. Curiosity decisions and stop rule

- `CURIOSITY_NO_GO` — Intel/Rosetta bridge; outside native ARM64 product scope.
- `CURIOSITY_NO_GO` — VST2 fixture/adapter work before G0; no approved
  legal/provenance decision.
- `CURIOSITY_NO_GO` — random commercial/free plug-in census before owned fixture
  gates; unsafe, anecdotal, and hard to attribute.
- `CURIOSITY_NO_GO` — infer AUv2/AUv3 or AU/VST3 equivalence from branding.
- `CURIOSITY_NO_GO` — claim containment from process names; verify crash, hang,
  state replay, memory, and audio continuity.
- `CURIOSITY_NO_GO` — reverse engineer proprietary state/project schemas.
- `CURIOSITY_NO_GO` — Windows/Linux/Android/browser matrix expansion.

**Stop each format phase** when all applicable cells pass, a blocking defect is
reproduced with retained evidence, or authority/provenance is absent. The next
action is the AUv3-on-Mac vertical slice, followed by iPad and iPhone—not more
broad documentary research.
