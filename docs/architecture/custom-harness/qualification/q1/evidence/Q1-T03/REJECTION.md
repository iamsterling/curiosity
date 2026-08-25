# Q1-T03 adapter rejection evidence

**Corrected result:** **REJECTED_NO_CANDIDATE** — static/source-token evidence
only; not a dynamic or network test pass  
**Adapter verdict:** `REJECTED_NO_CANDIDATE`

The authorized Q1 input left Vercel AI SDK core/provider adapter unselected and
forbade retrieving or probing one. Therefore the alternate Q1-T03 acceptance
branch applies: reject the adapter boundary rather than fabricate a controlled
send. This correction supersedes the earlier “PASS BY EXPLICIT REJECTION” label.

Retained Q1 source contains no selected AI SDK adapter/import, and the
Q1-T04 aggregate receipt records a source-token scan with no match. That receipt
does not retain an exact scan command or pattern set, so it is static supporting
evidence only. Existing unrelated OpenCode-plugin transitive packages are not a
custom-harness candidate.

The earlier “observed request count: zero” claim is retracted. There is no
retained packet capture, endpoint/listener receipt, or equivalent observation
that can prove network-zero. No retained evidence proves that a provider request
occurred either. The only supported outcome is rejection before candidate
selection; network activity is **UNKNOWN** from this receipt.

Consequences:

- one explicit gateway send -> one physical request is **not proven**;
- hidden retries/loops and per-physical-send observability remain unknown;
- every provider capability and I7 remain unavailable; and
- a later exact core+adapter selection requires explicit amendment and a full
  Q1-W03/Q1-T03 rerun before any provider request.

This is the plan-authorized rejection outcome, not a skip, dynamic test pass, or
network observation.
