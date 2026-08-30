# DAW Landscape Research

This directory contains a clean-room, evidence-cited survey of digital audio
workstations (DAWs) and closely related production environments. The research
supports an architecture decision for a native ARM64 DAW spanning Apple-silicon
macOS, iPadOS, and iPhone, with special emphasis on AUv3 plus macOS AUv2/VST3
and legally gated VST2 interoperability.

This is research, not permission to copy proprietary implementation, bypass
access controls, redistribute SDK material, or claim compatibility that has not
been qualified.

## Governing files

- [`DECISION-FRAME.md`](DECISION-FRAME.md) — decision, questions, coverage, and
  stop rule.
- [`RESEARCH-CONTRACT.md`](RESEARCH-CONTRACT.md) — evidence, safety, ownership,
  and dossier completion requirements.
- [`ROSTER.md`](ROSTER.md) — bounded census and unique dossier ownership paths.
- [`DOSSIER-TEMPLATE.md`](DOSSIER-TEMPLATE.md) — required report structure.
- [`SYNTHESIS.md`](SYNTHESIS.md) — cross-product architecture findings,
  requirements, format roadmap, and documentary stop decision.
- [`PLUGIN-QUALIFICATION-PLAN.md`](PLUGIN-QUALIFICATION-PLAN.md) — bounded owned-
  fixture matrix and release gates for plug-in interoperability.

Individual product reports live in [`dossiers/`](dossiers/). The first research
wave is complete and its synthesis is linked above; vendor claims must not be
mistaken for independent measurements.
