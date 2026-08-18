# Escalated branding correction evidence

The previous corrective allowlist was incomplete: it searched compact identifiers such as `OpenCodeLoop` but omitted the spaced, case-insensitive product brand `OpenCode Loop`. That omission allowed active installer, command, agent, report, status, help, doctor, and goal-tool descriptions to retain the old display identity.

This escalation adds a tracked-text identity test with path-and-line-aware classifications. Historical provenance is allowed under `provenance/`; source attribution, migration text, command markers, and acknowledgement-agent identifiers are allowed only in their documented contexts. Active descriptive branding is not allowed.

Raw first-red, final-green, and sensitivity-check outputs are stored beside this note:

- `escalation-branding-red.txt`
- `escalation-branding-green.txt`
- `escalation-branding-sensitivity.txt`

The sensitivity check temporarily restored `OpenCode Loop source installation` in `scripts/install.sh`, observed the focused test fail on that exact line, and restored the green implementation.
