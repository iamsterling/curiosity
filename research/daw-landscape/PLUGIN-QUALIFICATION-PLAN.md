# Bounded plug-in qualification plan

> Test-plan handoff only. It does not authorize third-party binary execution,
> SDK use, VST2 implementation, security acceptance, or a compatibility claim.
> Use only owned fixtures in disposable environments until separate authority is
> granted.

## 0. Decision and scope

**Decision:** determine whether each planned adapter and host execution mode is
safe and correct enough to advance from prototype to a release claim.

**Initial formats:** VST3, AUv2, AUv3, and CLAP. VST2 uses the same behavioral
suite only after a provenance/legal gate confirms that the implementing entity
may build and distribute the required host path. LV2 is a later Linux phase.

**Sufficient coverage:** every applicable format/OS/architecture cell passes
discovery, instantiation, realtime, offline, state, migration, UI, failure, and
project-durability gates with retained logs and deterministic artifacts.

The gate separation is mandatory because public DAW evidence repeatedly shows
that format acceptance, scanning, instantiation, rendering, and full host
contract behavior differ. ([Logic C-042](dossiers/apple-logic-pro.md#21-claims-register),
[REAPER C-056](dossiers/cockos-reaper.md#21-claims-register))

## 1. Safety and authority boundary

- Run only source-controlled, locally built qualification plug-ins whose code
  and dependencies are owned or explicitly approved.
- Sign/notarize fixtures where the target platform requires it; retain hashes,
  toolchain, SDK version, license/provenance record, and build logs.
- Use disposable VMs, simulator/device test accounts, or dedicated lab hosts.
- Never run unknown marketplace/community plug-ins in CI or on developer hosts.
- Crash, hang, malformed-state, memory-pressure, and path-permission tests require
  process isolation plus restorable environment snapshots.
- Keep audio inputs muted/synthetic and block network access unless a named test
  explicitly requires a local endpoint.
- Do not accept click-through SDK/program terms or fetch gated materials without
  authorized human approval.
- A passing fixture suite proves the tested host/fixture matrix only; it does not
  certify the ecosystem or grant trademark/redistribution rights.

## 2. Qualification fixtures

Each logical fixture should be implemented in every target format from one
behavioral specification. Format limitations must be recorded, not hidden by
changing expected behavior.

### QF-01 Deterministic effect

- mono, stereo, and surround-capable main buses where the format permits;
- optional mono/stereo sidechain;
- deterministic gain, polarity, channel-tag, and impulse output;
- switchable latency: 0, 17, 257, and 2048 samples;
- switchable tail: 0, 250 ms, and 2 s;
- latency changes both stopped and during playback;
- silence, denormal, `NaN`, infinity, and clipped-input handling; and
- realtime and offline output signatures.

### QF-02 Multi-output instrument

- timestamped note input and deterministic oscillator;
- stereo main plus two auxiliary outputs;
- MIDI/event output where the format supports it;
- note ID, pressure, timbre, pitch, release velocity, sustain, and per-note
  expression probes;
- deterministic voice stealing and all-notes-off; and
- optional bus activation/deactivation while stopped and during playback.

### QF-03 Parameter and automation probe

- stable IDs independent of display order;
- boolean, integer, enum, linear, logarithmic, bipolar, read-only, hidden, and
  non-automatable parameters;
- UTF-8 names/units and long/duplicate display names;
- value-to-text/text-to-value boundaries;
- begin/change/end gestures;
- multiple points within one audio block; and
- version 2 with reordered parameters but preserved stable IDs.

### QF-04 State and external-asset probe

- opaque binary state with checksum and schema version;
- empty, large, truncated, corrupt, and unknown-future state;
- relative and external asset references;
- moved/missing/restored asset workflows;
- preset/program/bank paths where supported; and
- deterministic v1→v2 migration plus intentional migration failure.

### QF-05 UI probe

- custom and generated parameter UI;
- resizable, fixed-size, and no-custom-UI variants;
- multiple windows/instances, detach/reattach, focus and keyboard capture;
- 100/125/150/200% scaling and mixed-DPI displays;
- screen-reader/accessibility-tree inspection;
- UI close while processing and project close while UI is open; and
- headless/offline render without a display server.

### QF-06 Fault and adversarial probe

Controlled modes for crash, abort, exception, deadlock, infinite scan,
infinite process callback, excessive CPU, memory growth, invalid bus metadata,
malformed parameter/state data, UI hang, and delayed shutdown. Every mode must
identify its phase so the host can attribute failure.

### QF-07 Identity and duplicate probe

- two paths to the same component;
- same display name with different stable IDs/vendors;
- same stable ID with different architecture/version;
- VST2/VST3/AUv2/AUv3 siblings representing one product;
- native and translated architecture variants; and
- removed, reinstalled, downgraded, and upgraded versions.

### QF-08 Realtime-safety probe

Instrumented optional allocation, lock, sleep, file, network, and logging calls
from scan, initialize, UI, realtime, and offline contexts. This fixture detects
host call context and containment; it does not authorize unsafe production code.

## 3. Test matrix

Run applicable combinations; record `NOT_APPLICABLE:<reason>` rather than
silently omitting cells.

| Dimension | Required values |
| --- | --- |
| Format | VST3; AUv2; AUv3; CLAP; VST2 only after legal gate; later LV2 |
| OS | Current minimum and latest supported Windows, macOS, Linux; iOS if scoped |
| CPU architecture | x86_64; arm64; translated/emulated mode where officially supported; explicit rejected 32-bit fixture |
| Host execution mode | isolated instance; grouped worker; explicit in-process compatibility mode |
| Processing | realtime playback; monitored/live path; offline faster-than-realtime; freeze/bounce; headless |
| Sample rate | 44.1, 48, 96, 192 kHz where supported |
| Block size | 16, 32, 64, 128, 257, 512, 1024, and host-variable blocks |
| Channel layout | mono; stereo; sidechain; multi-output; 5.1/7.1.4 where product scope requires |
| Transport | stopped; preroll; play; loop boundary; seek; tempo/meter change; record; tail drain |
| Lifecycle | first scan; cached scan; rescan; update; disable; remove; reinstall; project reopen; worker restart |
| State | default; edited; automated; large; corrupt; missing asset; future version; downgrade |
| UI | custom; generic; absent; mixed DPI; accessibility; headless |

## 4. Qualification gates

### G0 — Provenance and legal readiness

**Pass only if:** source, SDK/toolchain, licenses, hashes, signing identity,
trademark usage, and distribution authority have an approved record. VST2 stops
here unless entity-specific rights are resolved. Public dossier evidence warns
that current hosts may retain VST2 while new distribution/header rights remain
restricted. ([Cubase C-026–C-027](dossiers/steinberg-cubase.md#21-claims-register),
[Ardour C-024](dossiers/ardour.md#21-claims-register),
[LMMS C-033](dossiers/lmms.md#21-claims-register))

### G1 — Discovery and scan safety

**Pass only if:** paths, package discovery, duplicate identity, architecture,
cache invalidation, rescan, timeout, cancellation, logs, and blacklist states
are deterministic. Scan crash/hang/malformed fixtures cannot crash or block the
DAW. Recovery names the exact component and reason. Existing hosts demonstrate
the need for external scanners and visible suppression/recovery. ([Ableton C-016–C-017](dossiers/ableton-live.md#21-claims-register),
[Studio One C-016–C-018](dossiers/presonus-studio-one.md#21-claims-register),
[Ardour C-012](dossiers/ardour.md#21-claims-register))

### G2 — Instantiation and lifecycle

**Pass only if:** role, buses, sample rate, block policy, activation, UI, and
shutdown succeed in every applicable mode. Unsupported architectures/layouts
fail with a stable diagnostic and do not mutate the project.

### G3 — Realtime processing

**Pass only if:** audio/event output matches the deterministic oracle; no callback
deadline, allocation/lock policy, channel, event-order, sidechain, multi-output,
bypass, suspend, or dynamic-I/O check fails. Worker crash/hang is contained and
the engine continues with defined silence/bypass behavior.

### G4 — Timing and offline fidelity

**Pass only if:** latency impulses align sample-for-sample across graph paths and
after dynamic latency changes; automation/event offsets meet the declared
tolerance; tails are neither truncated nor resurrected; offline/freeze/headless
results match the declared realtime-equivalence policy. These details remain
unknown even in many mature hosts and cannot be inferred from a format badge.
([Ableton C-025](dossiers/ableton-live.md#21-claims-register),
[Logic C-040](dossiers/apple-logic-pro.md#21-claims-register),
[Studio One C-022](dossiers/presonus-studio-one.md#21-claims-register))

### G5 — State, presets, migration, and project durability

**Pass only if:** save/open reproduces sound, parameters, automation, I/O,
sidechain, presets, assets, and worker mode. Remove the plug-in, open, edit,
resave, restore it, and recover the original behavior. State corruption or a
future version must preserve the last valid project snapshot. Ardour and Reason
document durable placeholders; products that skip unavailable nodes demonstrate
the failure risk. ([Ardour C-018–C-019](dossiers/ardour.md#21-claims-register),
[Reason C-020](dossiers/reason-studios-reason.md#21-claims-register),
[Traverso C-022](dossiers/traverso-daw.md#21-claims-register))

### G6 — UI, accessibility, and diagnostics

**Pass only if:** custom UI, generic UI, focus, scaling, multiple windows,
headless operation, and teardown pass. The generated host UI must expose all
public parameters through keyboard and platform accessibility APIs. Logs must
correlate scan, worker, state, UI, latency, and crash events without leaking
project content or credentials.

### G7 — Recovery and soak

**Pass only if:** repeated scan/open/play/save/close cycles, worker restarts,
sample-rate/device changes, sleep/wake, memory pressure, and long sessions show
no unbounded resource growth, stale cache, state loss, or nondeterministic audio.
Fault injection leaves the previous or new project snapshot valid.

## 5. Binary acceptance checks

For each release-claimed format/platform cell:

- [ ] Main application survives every scan fault and attributes the component.
- [ ] Unsupported architecture/package is rejected with a stable remediation.
- [ ] Instrument/effect roles, buses, sidechains, and multi-output match metadata.
- [ ] Audio and event timestamps pass at every required block size/sample rate.
- [ ] PDC passes through tracks, buses, sends, sidechains, bypass, and latency changes.
- [ ] Tail, stop, seek, loop, freeze, and offline behavior match policy.
- [ ] Custom, generic, inaccessible, and absent UI paths remain operable.
- [ ] Save/open reproduces sound, state, automation, routes, and assets.
- [ ] Missing/resave/restore preserves the complete dependency placeholder.
- [ ] Upgrade/downgrade and parameter reorder use stable identity and migration.
- [ ] Worker crash/hang is contained; restart/bypass is deterministic.
- [ ] Logs, crash artifacts, and support bundle identify phase and component.
- [ ] Legal/provenance/signing records are pinned to the shipped adapter.

Any unchecked item blocks a broad “supports <format>” claim. A narrower claim
may name the exact passed gates, version, OS, architecture, and limitations.

## 6. Required evidence artifacts

Each run stores:

- host, OS, CPU, format SDK, compiler, fixture, and adapter revisions;
- plug-in package hash/signature and provenance record;
- scan database transition and normalized identity record;
- process/worker topology and crash/hang attribution;
- audio files plus deterministic hashes or numeric tolerances;
- timestamped event/automation traces;
- latency/tail measurements and graph-alignment report;
- project snapshots before/after save, missing dependency, migration, and fault;
- UI screenshots/accessibility snapshots where authorized;
- resource/soak metrics; and
- machine-readable gate result with human-readable failure diagnostics.

Do not compare opaque state bytes as the sole correctness oracle; compare
declared migration result and reproduced behavior.

## 7. Phased execution and stop rule

1. **Harness:** implement the format-neutral oracle, artifact schema, project
   round-trip, process monitor, and fault controller.
2. **VST3 vertical slice:** QF-01/QF-03/QF-04/QF-06 through G0–G7 on one OS,
   then expand OS/architecture.
3. **AUv2/AUv3 slice:** reuse the same oracle but keep discovery, process, state,
   and UI results separate by AU generation and OS.
4. **CLAP slice:** qualify portable adapter and polyphonic modulation/event paths.
5. **VST2 decision:** proceed only after G0; otherwise retain an adapter seam and
   a documented unsupported result.
6. **LV2 decision:** run only if Linux/open-ecosystem requirements justify it.

**Stop a format phase** when all applicable cells pass, a blocking defect is
reproduced with retained evidence, or authority/provenance is absent. Do not
broaden into arbitrary third-party compatibility testing until owned fixtures
pass and a separate ecosystem-qualification budget is approved.

## 8. Curiosity decisions

- `CURIOSITY_NO_GO` — random commercial/free plug-in census before fixture gates;
  failures would be unsafe, anecdotal, and hard to attribute.
- `CURIOSITY_NO_GO` — reverse engineering proprietary state or project schemas;
  use behavior and public APIs only.
- `CURIOSITY_NO_GO` — infer AUv2/AUv3 or VST2/VST3 equivalence from branding;
  qualify each adapter separately.
- `CURIOSITY_NO_GO` — claim sandboxing from a process name alone; verify crash,
  hang, memory, state replay, and IPC behavior.
- `CURIOSITY_NO_GO` — pursue VST2 implementation before the legal/provenance gate.

**Stop decision:** this plan is sufficiently bounded when its fixtures, matrix,
gates, artifacts, and authority limits are accepted. The next step is the VST3
vertical-slice prototype, not additional broad documentary research.
