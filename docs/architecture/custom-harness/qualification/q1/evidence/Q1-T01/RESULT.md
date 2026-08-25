# Q1-T01 result

**Corrected result:** **INSUFFICIENT / NOT REPRODUCIBLE.** This correction
supersedes the original PASS summary. Inventory-only, unknown, and rejected
candidates remain unavailable; no candidate is qualified by Q1-T01.

- Exact identity, source, artifact, lock, target, and license observations:
  `identity-license-observation.log`.
- Historical focused runtime/dependency/build/record output:
  `focused-bun-test.log` (it reports 15 pass, 0 fail, 35 expectations).
- Historical selected-surface type-check receipt: `focused-typescript.log`.
- Preserved diagnostic: `diagnostic-initial-comment-scan-failure.log`; the first
  regex scanner read documentation examples as imports and was replaced by
  Bun's syntax-aware scanner.
- Preserved diagnostic: `diagnostic-upstream-declaration-check.log`; strict
  third-party declaration checking failed and led to the exact, source-backed
  compiler boundary recorded in the Effect/build records.

The raw logs are preserved byte-for-byte and hashed in `SHA256SUMS`. Their
command lines contain `...` and shortened paths rather than exact unelided
commands; exact environment/profile, timestamps, and explicit exits are absent
from some or all receipts. In particular, `focused-typescript.log` contains no
compiler output or explicit exit value. The aggregate identity observation also
does not retain the commands and per-command exits that produced its values.
Those omissions prevent exact reproduction and independent attribution.

The Effect probes additionally import and scan internal installed `dist` files.
They do not exercise the public `effect/*` package-export boundary or consumer
resolution. Historical passing output therefore cannot qualify the claimed
public subpaths. See the
[evidence sufficiency ledger](../EVIDENCE-SUFFICIENCY.md).

No raw failed or passing observation was deleted or rewritten. This corrected
summary does not represent the historical output as qualification.
