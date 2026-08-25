# AI SDK core/provider adapter record

**Verdict:** **REJECTED — `REJECTED_NO_CANDIDATE`**  
**Disposition:** **REJECTED**  
**Confidence:** High for the fail-closed candidate rejection; network activity
is unknown from the retained receipts.

No Vercel AI SDK core/provider-adapter tuple was selected. Existing unrelated
transitive `@ai-sdk/provider` bytes under the OpenCode plugin are not inherited
as a custom-harness candidate. Retained Q1 source has no selected AI SDK import
or adapter, and no candidate, credential, dynamic adapter execution, or provider
test is recorded.

The receipts include no evidence that a provider request occurred, but they also
include no packet/endpoint observation capable of proving network-zero. The
earlier zero-request claim is retracted; network activity is **UNKNOWN** from
Q1-T03.

Q1-T03 therefore takes its authorized rejection branch. It does not claim that
one gateway send was tested. Hidden retry, automatic steps/tool execution, eager
network start, error suppression, abort behavior, and per-physical-send
observability all remain unknown. The Provider Gateway and I7 are blocked until
a later explicit candidate amendment and complete Q1-W03/Q1-T03 rerun.

Retained evidence: `../evidence/Q1-T03/REJECTION.md`.
