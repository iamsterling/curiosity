# Research records

Store decision-serving reports here. Each report must include a question, scope, source bibliography with selection rationale, evidence-labeled claims, contradictions, unknowns, a curiosity log including `CURIOSITY_NO_GO` entries, and a stop decision.

## Adaptive prompt design record

Primary sources used for the generic role and research-loop design:

- OpenAI, *A Practical Guide to Building Agents* (2025), https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf — selected as first-party guidance on bounded tools, handoffs, and evaluator loops.
- Anthropic, *Building Effective Agents* (2024), https://www.anthropic.com/research/building-effective-agents — selected as first-party guidance distinguishing workflows from autonomous agents and emphasizing simple composable patterns.
- Google Research, *ReAct: Synergizing Reasoning and Acting in Language Models* (2022), https://arxiv.org/abs/2210.03629 — selected as the primary paper for interleaved evidence acquisition and synthesis.
- Yao et al., *Tree of Thoughts* (2023), https://arxiv.org/abs/2305.10601 — selected for deliberate branch exploration; adapted only as bounded candidate-thread generation, not exposed hidden reasoning.
- OpenAI, *Evaluating model performance* documentation, https://platform.openai.com/docs/guides/evals — selected for evidence-driven acceptance and regression checks.

Design rationale: prompts encode role boundaries, explicit routing signals, binary acceptance, source discipline, stop conditions, and evidence authority. Provider/model choice is deployment policy and remains outside authored prompt cores. Adaptive curiosity is allowed only inside a declared frame with value/cost and saturation checks.

## Curiosity experiment verdict

`CURIOSITY_NO_GO`: the disposable curiosity-engine validator/harness did not establish safe authority, bounded execution, or production-grade validation. Its implementation is not shipped. The architectural lesson—generate follow-up threads after synthesis, score relevance/value/novelty against cost, recursively narrow breadth, and stop on saturation—is retained as prompt policy and research protocol only. Live curiosity remains deferred pending a trusted host boundary and independent validation.

## Graph engineering

[`graph-engineering.md`](graph-engineering.md) evaluates a clean-room native synthesis of specification deltas, durable work/readiness, bounded execution graphs, evidence, and Loop continuation. It recommends one Ledger authority with typed `SpecGraph`, `WorkGraph`, `RunGraph`, and `EvidenceGraph` projections, a pure deterministic graph kernel, immutable plan revisions, and a staged rollout that keeps parallel dispatch and model-result caching disabled until host lineage and publication fencing are proven.
