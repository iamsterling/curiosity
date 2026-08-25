---
name: deep-research
description: Frame a research question, prioritize primary evidence, run a bounded curiosity loop, and produce confidence-labeled conclusions.
license: MIT
---

1. State the decision, sub-questions, depth budget, and what sufficient coverage means before searching.
2. Prefer primary sources. Search broadly, but retrieve no more than two decision-critical sources in an evidence pass; extract only the passages needed for the current claim. If a PDF or source format cannot be read, record that limitation and choose one accessible equivalent rather than repeatedly retrying it.
3. Synthesize before further retrieval: record findings, contradictions, gaps, and source-level citations. Label claims **documented**, **inference**, or **unknown**. Do not start a second discovery batch until this synthesis identifies a material gap.
4. Keep an adaptive prompt bibliography: for each retained source record why it was selected, what claim it supports, and why it is preferable to alternatives.
5. Run a curiosity pass after synthesis. Score candidate threads by decision relevance, expected value, novelty, and cost. Pursue only the best qualifying thread within budget; record `CURIOSITY_NO_GO` with rationale for every rejected thread.
6. Stop only after coverage and saturation checks. Report an executive summary, evidence, unknowns, recommendations, bibliography with rationale, and the stop decision. If source access, rate limiting, or the depth budget prevents coverage, stop explicitly with that limitation instead of silently ending.

Never invent citations or treat vendor claims as independent measurement.
