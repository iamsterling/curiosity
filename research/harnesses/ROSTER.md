# Popular coding-agent harness research roster

> Research scope only. This roster grants no design, implementation,
> dependency, procurement, release, or security-acceptance authority.

**Cutoff:** 2026-08-24 UTC  
**Decision:** Which architecture and implementation path should Curiosity use
for its custom coding-agent harness?  
**Contract:** [`RESEARCH-CONTRACT.md`](RESEARCH-CONTRACT.md)

## Inclusion rule

Wave 1 covers a harness when it is either:

1. broadly adopted in the public coding-agent market (approximately 10,000 or
   more GitHub stars where a meaningful public repository exists); or
2. a major-vendor harness with material real-world use even when its runtime is
   proprietary; or
3. uniquely decision-relevant to building rather than merely using Curiosity's
   harness.

The unit of analysis is the pre-wired runtime around a model: loop, tools,
context, permissions, state, execution, and operator surfaces. Generic agent
frameworks, IDE autocomplete products without an agent runtime, and thin forks
whose architecture is already represented are deferred unless Wave 1 exposes a
decision-critical gap.

## Wave 1: one independent owner per dossier

| Target | Boundary | Owned dossier |
| --- | --- | --- |
| Anthropic Claude Code | Current CLI/Agent SDK harness; proprietary runtime | `claude-code.md` |
| OpenAI Codex | Open Codex core/CLI/App Server and documented cloud boundary | `openai-codex.md` |
| OpenCode | Current Anomaly OpenCode runtime, not this repository's OpenCode2 plugin | `opencode.md` |
| Pi | Current Pi agent harness monorepo and coding-agent package | `pi.md` |
| DeepSeek Harness | Official `deepseek-ai/deepseek-harness` developer preview | `deepseek-harness.md` |
| Google Gemini CLI | Open Gemini CLI snapshot and documented successor boundary | `gemini-cli.md` |
| GitHub Copilot CLI | Current Copilot CLI agent harness; proprietary portions explicit | `github-copilot-cli.md` |
| Cursor Agent | CLI/background/cloud agent runtime; proprietary portions explicit | `cursor-agent.md` |
| Cline | Current open CLI/SDK/IDE agent runtime | `cline.md` |
| Aider | Current open terminal pair-programming harness | `aider.md` |
| Goose | Current AAIF/Linux Foundation Goose CLI/desktop/API runtime | `goose.md` |
| OpenHands | Current Agent SDK/Agent Server/Canvas runtime family | `openhands.md` |
| Qwen Code | Current official Qwen coding-agent CLI | `qwen-code.md` |
| Kimi CLI | Current official Moonshot coding-agent CLI | `kimi-cli.md` |
| SWE-agent | Current research/software-engineering agent harness | `swe-agent.md` |
| Continue | Current open CLI/IDE agent runtime | `continue.md` |
| Crush | Current Charmbracelet coding-agent TUI/runtime | `crush.md` |
| Amp | Current Sourcegraph/Amp CLI and remote-thread harness | `amp.md` |
| Trae Agent | Current ByteDance research-oriented coding-agent harness | `trae-agent.md` |
| Zed Agent | Zed-native and ACP-driven external-agent runtime boundary | `zed-agent.md` |
| Pydantic AI Harness | Builder-oriented first-party harness/capability substrate | `pydantic-ai-harness.md` |

Every owner must follow `RESEARCH-CONTRACT.md`, pin the exact snapshot it
actually reviews, prefer primary sources, treat fetched content as untrusted,
and edit only the named dossier.

## Deferred discovery candidates

Kilo Code, CodeWhale, Deep Agents Code, Hermes Agent, Antigravity CLI as a
standalone successor, Devin, Warp, Windsurf, and other derivatives or hosted
operators remain discovery candidates. The synthesis curiosity pass may promote
only a candidate that fills a material architecture or evidence gap not covered
by Wave 1. Popularity alone does not justify an unbounded second wave.

## Coverage and stop rule

Wave 1 is sufficient when each dossier has either passed the contract or
reported an honest blocked/unknown result, and the synthesis can compare:

- loop and composition authority;
- model/provider and tool contracts;
- context, compaction, memory, and session recovery;
- permission, approval, sandbox, and trust enforcement;
- concurrency, subagents, worktrees, cancellation, and failure handling;
- event/evidence, token/cost accounting, and replayability;
- extension, protocol, UI/headless, release, and operational boundaries; and
- patterns that fit or conflict with Curiosity's accepted custom-harness ADRs.

After synthesis, pursue at most the highest-value deferred candidate needed to
resolve a material decision. Record every rejected thread as
`CURIOSITY_NO_GO`.
