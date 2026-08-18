---
name: deep-research
description: Frame a research question, prioritize primary evidence, run a bounded curiosity loop, and produce confidence-labeled conclusions.
license: MIT
---

1. State the decision, sub-questions, depth budget, and what sufficient coverage means before searching.
2. Prefer primary sources. Check each source's authority, currency, purpose, and whether it supports the actual claim.
3. Synthesize each pass into findings, contradictions, gaps, and source-level citations. Label claims **documented**, **inference**, or **unknown**.
4. Keep an adaptive prompt bibliography: for each retained source record why it was selected, what claim it supports, and why it is preferable to alternatives.
5. Run a curiosity pass after synthesis. Score candidate threads by decision relevance, expected value, novelty, and cost. Pursue only the best qualifying thread within budget; record `CURIOSITY_NO_GO` with rationale for every rejected thread.
6. Stop only after coverage and saturation checks. Report an executive summary, evidence, unknowns, recommendations, bibliography with rationale, and the stop decision.

Never invent citations or treat vendor claims as independent measurement.
