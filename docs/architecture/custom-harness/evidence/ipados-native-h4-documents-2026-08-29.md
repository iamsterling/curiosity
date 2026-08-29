# iPadOS native H4 document-tool point evidence — 2026-08-29

**Status:** App-document implementation and physical point evidence; not release
authority and not the complete H4 tranche.  
**Device:** Sterling’s iPad, `C137FAC2-3B00-528E-BBD0-1C3C5C714667`, iPadOS 27.  
**Build:** signed Debug iPhoneOS app, `com.iamsterling.curiosity`.  
**Scope:** app-root `document.list`, `document.read`, and `document.search` only.
Craft read projections remain unimplemented.

## Authority boundary

The portable authority now defines a closed v1 `ActionGrant` and bounded
document input/output contracts. The mobile adapter verifies the grant digest,
deadline, exact `documents.read` capability, resource, tool identity/version,
input digest, request digest, cancellation identity, and returned receipt before
returning evidence to authority code. Every result is labelled
`untrusted-evidence`; document content is never interpreted as instructions by
the native host.

The Swift host repeats those checks and authorizes the exact call through native
journal ABI v2 immediately before file access. The Rust allocation transaction
now independently recomputes action input digests and binds tool name plus
request digest to the stored action input. A caller cannot change tool input,
tool identity, action generation, catalog, or requested capability merely by
calling the Expo surface directly. Native tests include explicit wrong-tool and
wrong-input dispatch denials.

The file host resolves only the app's Documents directory, rejects absolute and
parent paths, rejects symbolic-link components, rechecks standardized root
containment, skips hidden/package entries, uses `NSFileCoordinator`, limits
files/results/bytes, accepts UTF-8 text only, and maps read permission loss to a
stable failure. Background and module teardown cancel active calls by exact call
identity.

## Physical fixture

The DEBUG-only launch fixture first admitted a source event, started one run,
committed one `document.read` action, armed its tool attempt, authorized the
exact request through Rust, performed the coordinated read, and committed a
terminal settlement. Its final output was:

```text
CURIOSITY_DOCUMENT_FIXTURE kind=authorized-read status=PASS
CURIOSITY_DOCUMENT_FIXTURE kind=prompt-injection status=PASS
CURIOSITY_DOCUMENT_FIXTURE kind=traversal status=PASS error=NATIVE_DOCUMENT_INPUT_INVALID
CURIOSITY_DOCUMENT_FIXTURE kind=stale-grant status=PASS error=ACTION_GRANT_STALE
CURIOSITY_DOCUMENT_FIXTURE kind=cancel status=PASS error=ACTION_CANCELLED
CURIOSITY_DOCUMENT_FIXTURE kind=list-search status=PASS
CURIOSITY_DOCUMENT_FIXTURE kind=oversized status=PASS error=NATIVE_DOCUMENT_TOO_LARGE
CURIOSITY_DOCUMENT_FIXTURE kind=symlink status=PASS error=NATIVE_DOCUMENT_PATH_UNSAFE
CURIOSITY_DOCUMENT_FIXTURE kind=permission status=PASS error=NATIVE_DOCUMENT_READ_FAILED
```

The prompt-injection file contained an instruction-shaped string. It was
returned unchanged with `provenance=untrusted-evidence`; no model API was called.
The launch command later timed out because the app intentionally remained alive,
not because a fixture failed.

## Focused verification

- `@curiosity/authority`: 35 tests passed, including grant and document-contract
  tests.
- Mobile document/boundary tests: 9 passed in the focused run.
- Rust native journal: 10 tests passed, including stored input/tool binding.
- Signed physical-device and simulator builds succeeded.
- The production `local-curiosity-runtime.ts` does not import or schedule the
  document tool, agent-step port, memory curator, or ABI-v2 agent journal.

## Open acceptance work

- Craft read projections and their permission/revocation behavior;
- stale external document-provider scope and security-scoped URL lifecycle;
- a real Home/lock/suspend/relaunch tool lifecycle and post-authorization crash;
- full AgentKernel dispatch/settlement integration and semantic golden parity;
- UI disclosure of source, truncation, and provenance; and
- Release qualification under H11.
