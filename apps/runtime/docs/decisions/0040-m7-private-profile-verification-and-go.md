# ADR 0040: M7 private-profile verification and GO

**Status:** Accepted 2026-08-18 for the exact private Darwin arm64 profile; all broader release gates NO-GO

## Verdict and immutable identity

The project owner records **GO** for only the ADR 0039 private, unpublished,
single-user/single-machine/single-workspace profile: Darwin arm64, macOS 27.0,
Bun 1.3.14, rustc/cargo 1.97.1, OpenCode `0.0.0-beta-17519`, and Effect
`4.0.0-beta.101`. The immutable release is:

- source commit: `0dfc71de02393da9aad37bc753724886c00e323c`
- release ID: `m7-0dfc71de02393da9aad37bc753724886c00e323c`
- archive: `m7-0dfc71de02393da9aad37bc753724886c00e323c.tar.gz`
- archive SHA-256: `3aa8e5ba6660cafefb3d3121ba1e652346f4019a78922a0ec689b04b32e06642`

ADR 0040 is necessarily a later, documentation-only commit. That later commit
is not, and must never be represented as, the artifact source. The artifact
remains bound to the clean release source commit above.

## Verification evidence

The acceptance run used clean detached checkouts of the release commit. Runtime
`verify` passed 103 tests/716 expectations across 10 files plus 3
characterization tests/15 expectations across two files; focused `m7:test`
passed 39 tests/222 expectations across four files. The complementary plugin
verification passed 121 unit, 22 integration, 14 characterization, 21 security,
and 9 staged-release tests, its exact-host suite, ABI/build/type/lint/format,
artifact/provenance/relocation/resource, and secret scan (425 workspace files;
lockfiles excluded from pattern scanning). Canonical root build, lint, and type
checks passed 4/4, 5/5, and 5/5 tasks respectively. Earlier root attempts with
missing dependencies and out-of-root `node_modules` symlinks were invalid test
setups, not accepted evidence; the clean committed dependency-complete run is
the root evidence.

Three independent clean builds were byte-reproducible: two detached source
copies and the independent audit build each produced the exact archive SHA-256
above. Both primary source copies remained at the exact release HEAD with clean
status. The independent audit reproduced the third archive and returned **GO**
with no blocking finding for this exact private profile.

Extracted `scripts/verify` and `scripts/preflight` passed. The 118-member archive
contained 97 regular payload files and 21 directories, with no symlinks or
special files. `manifest.json` covered the 96 non-integrity payload files;
`SHA256SUMS` contained 96 entries (the manifest plus the other 95 payload files)
and excluded itself. The two integrity views were complete and consistent.
CycloneDX covered 12 exact components, every bundled-metafile dependency and
payload assignment, and all nine shipped license/notice files. Artifact secret
canaries and token-pattern checks found no retained secret.

The bundled OpenCode and ripgrep executables and runtime library were Darwin
arm64 Mach-O files. The dylib had the exact
`@rpath/libcuriosity_runtime_native.dylib` ID, a nonzero deterministic UUID,
only `/usr/lib/libSystem.B.dylib`, and the expected v0 and v1 query symbols.
The pinned ripgrep 15.1.0 bytes and notices passed version, architecture, hash,
link, SBOM, and license checks.

Install, duplicate-install rejection, lock contention, upgrade, incompatible
state rejection, rollback, and uninstall passed. Atomic `current` changes and
receipts were verified; rollback preserved the query-state schema, and uninstall
preserved unrelated state and the mode-0600 credential. A direct release query
against bootstrapped M2 state returned the expected bounded result, while a
wrong capability returned the stable `authority_rejected` diagnostic. M5 live
provider and M6 crawl remained disabled in the release profile.

The exact bundled host was smoked twice as `opencode2 serve --hostname
127.0.0.1 --port 0`. Each authenticated `/api/plugin` observation reported
exactly `iamsterling.opencode2-config`, one setup and one cleanup; each run
recorded zero external attempts and zero surviving process-group members.
Generated launch/smoke tests additionally covered explicit process-local
activation, clean environment, model-catalog/GitHub/provider rejection,
profile/path/mode and competing-config rejection, stable redaction, repeated
smoke cleanup, and bounded SIGINT/SIGTERM/SIGHUP descendant reaping.

The detailed logs and extracted trees were retained only at the ephemeral
validation root
`/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/m7-postcommit-0dfc71d-20260818T145651-62490`;
the independent build was under the sibling `m7-independent-review-0dfc71d`
path. These machine-local paths are evidence locations, not release contents,
durable repository records, or prerequisites for validating the immutable
commit and archive digest.

## Limits, rollback, and reopening

This GO does not approve a service, daemon, multi-user or background profile;
another host/OS/architecture; ambient interactive egress; production or public
deployment; public supply chain; publication; publisher identity; signing; or
notarization. **Production/public, M5-live, M6-crawl, publication, signing,
notarization, and every other platform remain NO-GO.** No generic fetch, public
crawl, corpus expansion, or production durability claim follows from M7.

Rollback selects the prior verified compatible release without rolling state
back. If safe rollback cannot be proven, stop the host; uninstall the release
while preserving state and credentials; and return to the previously accepted
repository-only M1-M6 capabilities. Never delete or migrate state, credentials,
receipts, or shared/global OpenCode configuration as rollback shorthand.

Reopen this decision before any source or artifact-byte change; toolchain,
dependency, host, plugin ABI, ripgrep, OS, architecture, profile, workspace,
state-schema, capability, lifecycle, network, sandbox, inventory, license, or
operations-owner change; any hash/reproducibility/integrity/SBOM/license/secret,
query, host-smoke, zero-attempt, cleanup, survivor, upgrade, rollback, or
uninstall failure; or any request for M5-live, M6-crawl, production/public use,
publication, signing, notarization, service operation, or another platform.
