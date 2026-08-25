# Curiosity custom-harness synthesis

**Decision date:** 2026-08-25  
**Evidence cutoff:** 2026-08-24 UTC  
**Inputs:** the 21 dossiers governed by [RESEARCH-CONTRACT.md](RESEARCH-CONTRACT.md),
[DECISION-FRAME.md](DECISION-FRAME.md), and the accepted ADR package under
`docs/architecture/custom-harness/`.  
**Result:** `BUILD_DIRECTLY`; clean-room adapt bounded patterns; keep other
harnesses behind non-authoritative protocol or reviewed-tool boundaries when
there is a concrete interoperability need.

## Executive decision

- **FACT:** every reviewed complete harness owns at least one of the loop, tool
  dispatch, retry, persistence, approval, provider transport, or completion
  paths that Curiosity assigns to its sealed Effect authority. Proprietary
  products additionally leave consequential enforcement and recovery behavior
  `UNKNOWN`.
- **INFERENCE (HIGH):** using or forking a complete harness would cost more and
  create more authority ambiguity than implementing Curiosity's accepted kernel
  directly. Removing a second authority is the dominant work, not integration.
- **INFERENCE (HIGH):** the valuable leverage is pattern-level: typed lifecycle
  envelopes, final-sink checks, immutable correlated events, resumable
  unknown-effect frontiers, capability intersection, and versioned process
  protocols.
- **UNKNOWN:** exact live-provider, hard-reset, sandbox, device, and
  cross-platform behavior remains qualification work. These unknowns block
  claims about those capabilities, but do not block the direct-build decision
  because the first kernel slice enables none of them.

No weighted total is reported. All substrate/fork candidates fail a hard gate or
retain a consequential unknown, so a numeric ranking would imply precision that
the decision frame forbids.

## Per-harness disposition

`FAIL G-01` means the candidate retains a competing application authority.
Additional gates name the principal observed conflict, not an exhaustive list.

| Target and snapshot | Substrate / fork | Bounded disposition | Evidence |
| --- | --- | --- | --- |
| Aider `5dc9490…`; stable `0.86.2` | `REJECT` — `FAIL G-01/G-05` | Adapt repository-map/context and explicit edit-format patterns only. | `aider.md` C-030,C-031,C-038,C-039 |
| Amp CLI `0.0.1787616161-g9dff10`; proprietary core | `REJECT` — `UNKNOWN G-01/G-03/G-07/G-11` | Defer runtime claims; adapt durable typed thread/executor IDs, not hosted authority. | `amp.md` C-005,C-018,C-022,C-027,C-034,C-035 |
| Claude Code `2.1.243`; public tree `8b6ef81…` | `REJECT` — `UNKNOWN G-01/G-03/G-11` | Interoperate only through a versioned reviewed process adapter; adapt capability discovery and correlated events. | `claude-code.md` C-028,C-029,C-030,C-040,C-047 |
| Cline CLI `3.0.58`; SDK `0.0.79`; VS Code `4.1.15` | `REJECT` — `FAIL G-01/G-07` | Adapt typed host/agent messages and explicit lifecycle interception. | `cline.md` C-006,C-027,C-028 |
| Continue `5522c6f…`; CLI `1.5.47` | `REJECT` — `FAIL G-01/G-05` | Reuse no loop; adapt provider-neutral message/tool contracts after independent qualification. | `continue.md` C-036,C-037 |
| Crush `v0.91.0` / `41cdd18…` | `REJECT` — `FAIL G-01/G-05/G-10` | Adapt lifecycle and persistence lessons; reject unauthenticated full-authority TCP and safe-prefix shell policy. | `crush.md` C-037,C-038,C-039,C-044,C-045 |
| Cursor Agent `2026.08.11-e8db854` | `REJECT` — `UNKNOWN G-01/G-07/G-11` | Adapt durable run/workspace handoff as a pattern; do not adopt proprietary enforcement claims. | `cursor-agent.md` C-016,C-023,C-025,C-026,C-040 |
| DeepSeek Harness `dsh-v0.1.1-rc.2` / `b150a55…` | `REJECT` — `FAIL G-01/G-07` | Adapt ordered immutable overlays and explicit interrupted-operation evidence. | `deepseek-harness.md` C-030,C-031,C-032,C-034 |
| Gemini CLI source `812f7a2…`; stable `0.56.0` | `REJECT` — `FAIL G-01/G-05` | Adapt typed validate/build/authorize/execute/result stages; reject implicit permissive modes. | `gemini-cli.md` C-029,C-030,C-031 |
| GitHub Copilot CLI `1.0.80` / `ef627e1…` | `REJECT` — `UNKNOWN G-01/G-03/G-05/G-11` | Adapt public event/protocol shapes only; closed defaults are not substrate evidence. | `github-copilot-cli.md` C-030,C-031,C-032,C-039 |
| Goose `f9ac24c…`; release `1.47.0` separate | `REJECT` — `FAIL G-01/G-05/G-09` | Adapt generation-fenced child transport and final-sink qualified policy, with Curiosity defaults. | `goose.md` C-026,C-027,C-028,C-029,C-031 |
| Kimi CLI `1.49.0` / `cbc15c0…` | `REJECT` — `FAIL G-01/G-07` | Adapt typed bidirectional wire and source-scoped approval lifecycle; keep UI non-authoritative. | `kimi-cli.md` C-016,C-019,C-032,C-034,C-035 |
| OpenAI Codex `4ef1d4b…`; stable tag `rust-v0.149.1` separate | `REJECT` — `FAIL G-01/G-05` | Adapt generated lifecycle RPC, reader/writer tool admission, and monotone capability intersection. | `openai-codex.md` C-033,C-034,C-035,C-036,C-037 |
| OpenCode `v1.18.22` / `47b6b6f…` | `REJECT` — `FAIL G-01/G-05/G-07` | Keep as replaceable host adapter; adapt final-sink validation and event/projection mechanics. | `opencode.md` C-009,C-038,C-039,C-040,C-041 |
| OpenHands four-repository snapshot; SDK `1.43.1` | `REJECT` — `FAIL G-01/G-03/G-07` | Adapt typed append ledger and explicit approval-response event; reject exactly-once automation claims. | `openhands.md` C-022,C-029,C-030,C-031,C-032,C-036 |
| Pi `v0.84.3` / `4e58f32…` | `REJECT` — `FAIL G-01/G-05/G-07` | Adapt fail-closed tool validation and parent-linked transcript nodes; no in-process untrusted extensions. | `pi.md` C-033,C-034,C-035,C-036,C-037 |
| Pydantic AI Harness `v0.24.0`; core `v2.33.0` | `REJECT` — `FAIL G-01`; strongest builder candidate | Adapt inspectable static composition and unknown-effect frontiers; do not place `Agent.run()` below Effect. | `pydantic-ai-harness.md` C-006,C-007,C-019,C-027,C-029,C-030 |
| Qwen Code source `22bb5e8…`; stable `0.22.0` | `REJECT` — `FAIL G-01/G-05` | Adapt typed request-authority-execution-evidence stages and integrity-checked single-writer ideas. | `qwen-code.md` C-030,C-031,C-032 |
| SWE-agent `3ea751c…`; release lineage separate | `REJECT` — `FAIL G-01/G-07` | Adapt action/observation evidence envelope; reject shell blocklists and trajectory re-execution as recovery. | `swe-agent.md` C-025,C-026,C-027,C-029,C-030 |
| Trae Agent `e839e55…` | `REJECT` — `FAIL G-01/G-05/G-07` | Adapt normalized provider records and step/interaction evidence only. | `trae-agent.md` C-014,C-015,C-022,C-023 |
| Zed `5631830…`; ACP `9bc7ac7…`; registry `c62ab72…` | `REJECT` as substrate; `ADAPT` protocol boundary | Use capability-negotiated ACP-style process ownership when needed; do not imply one UI means one enforcement policy. | `zed-agent.md` C-028,C-029,C-030,C-032 |

## Answers to the architecture questions

1. **No reviewed public runtime is narrow enough to sit below Effect unchanged.**
   Pydantic AI Harness was the strongest candidate because it is a decomposable
   library, but `Agent.run()` still drives model requests, tool dispatch, retry,
   loop continuation, and result completion (`C-006`, `C-007`, `C-019`).
2. **Use canonical kernel events plus disposable projections.** Parent-linked
   transcript nodes are useful model evidence, but they remain a projection of
   command, provider, tool, and context facts rather than domain authority.
3. **Authorize typed resources at the final sink.** Tool names, prompt text,
   annotations, classifiers, and UI approval widgets are advisory inputs.
4. **Cancellation needs durable intent, attempt fencing, and verified process-tree
   termination.** Abort signals and promise cancellation alone are insufficient.
5. **Provider adapters must expose exactly one armed physical send.** Any SDK or
   harness with hidden retries, fallback, or zero-filled missing usage is rejected
   for the authoritative gateway.
6. **Context is ordered, provenance-carrying data.** Retrieved, repository, tool,
   memory, and summary content stays untrusted; compaction records its inputs and
   produces a new evidence node rather than rewriting history.
7. **Static first-party registration is the in-process boundary.** ACP/MCP-like
   versioned process protocols provide interoperability; dynamic third-party code
   does not enter the authority process.
8. **A clean-room build is smaller and safer.** It implements the accepted
   boundary directly instead of deleting loop, policy, persistence, provider,
   and completion ownership from another harness.

## Adapted architecture vocabulary

| Curiosity mechanism | Research-backed pattern | Required correction |
| --- | --- | --- |
| One Effect `ManagedRuntime` and Command Port | Evented orchestrator/protocol splits across Copilot, Kimi, Codex, and Zed | Transport and UI never own authority. |
| Static stock-plugin registry | Pydantic combined capabilities; DeepSeek ordered overlays | No dynamic loader; duplicate command ownership fails startup. |
| Authenticate → decode → resolve → decide → commit → project | Qwen/Gemini typed lifecycle seams; OpenCode/Pi final validation | Authentication and final-sink authorization are kernel-owned and fail closed. |
| Append-only hash-linked events with rebuildable projection | OpenHands typed ledger; OpenCode/Goose/Codex event-plus-index patterns | SQLite writer is singular; projections are read-only and disposable. |
| Attempt IDs, generation fences, and unknown-effect recovery | OpenHands leases; Pydantic effect frontier; Goose generation fencing | A restart never manufactures success or retries an ambiguous non-idempotent effect. |
| Recursive capability intersection | Codex monotone profiles | Child/request authority can only narrow; impossible intersection denies. |
| Versioned external process protocol | Zed ACP, Kimi Wire, Codex app-server envelopes | External peers are evidence/tool processes, not application writers. |

## Curiosity pass and stop decision

The highest-value unresolved thread was whether Pydantic AI Harness could be a
subordinate builder substrate. The focused pass confirmed that its composition
is unusually inspectable (**FACT**), but its core graph still owns the loop,
tool execution, retries, and terminal result (**FACT**). Replacing those owners
would leave only patterns and schemas (**INFERENCE**), which is the same leverage
available through clean-room adaptation without adding a Python authority.

All other follow-ups are `CURIOSITY_NO_GO` for this decision: proprietary
internals, paid provider probes, destructive sandbox tests, broad popularity or
UI surveys, post-cutoff snapshots, and exhaustive adapter catalogs cannot change
the top recommendation within the evidence/authority budget. Stop condition:
`STOP_COVERAGE_AND_SATURATION`.

## Bibliography rationale

The 21 local dossiers are retained because each pins its own primary-source and
artifact ledger, claim classifications, adversarial limits, and snapshot. The
accepted ADRs are preferable for Curiosity requirements because they are the
project's explicit authority decisions. No new mutable web source was needed in
this synthesis; reopening a dossier's `UNKNOWN` requires its named discriminating
probe rather than another general search.
