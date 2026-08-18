# Installation architecture

No installation cutover is part of this bootstrap. The current installer implementation is imported behavior and is tested, but this repository does not run it against operator configuration.

A future reviewed installer must define artifact integrity, atomic placement, duplicate-load prevention, rollback, and explicit one-time import from old `.opencode/opencode-loop/` state. Until then:

- native state is only `.opencode/opencode2-config/`;
- old state is read by neither runtime nor bootstrap tooling;
- global OpenCode configuration and installed plugins remain untouched.
