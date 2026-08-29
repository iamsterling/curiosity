# iPadOS native N1–N3 physical acceptance — 2026-08-29

**Status:** Current point evidence; not release authority.  
**Device:** Sterling’s iPad, `C137FAC2-3B00-528E-BBD0-1C3C5C714667`, iPadOS 27.  
**Build:** signed Release iPhoneOS app, `com.iamsterling.curiosity`.  
**Boundary exercised:** React Native/Hermes → portable TypeScript authority →
Expo Swift module → mobile-owned Rust/SQLite journal or Foundation Models.

## N1/N2 command, event, projection, and relaunch fixture

The fixture used deterministic IDs and time, created a thread, admitted a
scripted turn, completed it, and compared the five physical-Hermes event hashes
with the Bun fixture. It then terminated process `11945` and launched a new
process (`11951`) without reinstalling or copying the database.

Create evidence copied from the app data container:

```json
{"eventCount":5,"eventDigest":"0914095d4b364230f8ada9837a8228ed149f4dbe96fe77ebdab3899e7e9cdb30","phase":"create","status":"passed"}
```

Relaunch evidence copied after process termination:

```json
{"eventCount":5,"eventDigest":"0914095d4b364230f8ada9837a8228ed149f4dbe96fe77ebdab3899e7e9cdb30","phase":"recover","status":"passed"}
```

`devicectl device info files` reported
`Library/Application Support/CuriosityAuthority/authority-v15.sqlite3` at
284 KB on both launches. This proves this fixture’s projection recovery and
hash identity across one real process relaunch. It does not prove crash-point,
device-lock, storage-pressure, migration, or corrupt-store recovery.

## N3 Foundation Models point measurement

The in-app Hermes fixture queried `SystemLanguageModel.default.availability`,
completed one tool-free request through the turn-keyed Expo event stream, and
aborted a separate turn through the production `GenerationPort`.

```json
{"eventCount":5,"eventDigest":"dce6505b2259ac232425f1d4737d95bfec39a24bf1f838eed17961f72c367ee1","phase":"model","status":"passed:NONE:ACTION_CANCELLED:1396ms"}
```

- Availability reason: `NONE` (`available`).
- Model ID asserted by the fixture: `apple:system-language-model`.
- Stream event count: 5.
- Completion latency: 1,396 ms for this single prompt.
- Cancellation result: `ACTION_CANCELLED`.
- The digest is SHA-256 of the generated response; response text is deliberately
  not retained as architectural evidence.

This is one point sample, not a quality or performance qualification. Memory,
thermals, first-response latency, unsupported-device reasons, context overflow,
guardrail behavior, backgrounding, and long-duration stream transport remain
open.

## Acceptance harness disposal

The signed Release builds used a launch-environment-gated acceptance harness to
write bounded JSON evidence into the app container. After copying the evidence,
the harness, scripted generation port, launch-environment reader, and evidence
writer were removed. The final production bundle is verified separately; no
scripted provider or acceptance trigger remains in its import graph.

## Harness-free no-server cold launch

After removing the harness, the app was uninstalled to delete the fixture store.
A signed Release build then cold-launched with no acceptance environment and no
Curiosity server. Process `12034` created exactly one file under the authority
directory: `authority-v15.sqlite3` (284 KB). A subsequent signed build removed
`NSLocalNetworkUsageDescription` and
`NSAppTransportSecurity.NSAllowsLocalNetworking`; final process `12077` launched, the
built `Info.plist` contained neither key, and the authority directory still
contained only the production journal.

The production Expo export passed the local-bundle denylist after harness
removal. This proves the observed cold-launch path did not require the removed
HTTP/server route. It does not claim the entire N5 matrix: the Mac was connected
for installation and diagnostics, and a local-network-denied lifecycle run was
not performed.
