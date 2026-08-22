# Architecture

**Current.** This is one registry-ready, feature-modular OpenCode 2 plugin package; it is not published by the current change. `src/plugin/plugin.ts` is its only composition root. The compiled ESM public surface is `dist/index.js`; authored installable material is governed by `assets/manifest.json`.

**Transitional.** The imported loop runtime and state codec remain quarantined in `features/loop-compat`. They preserve recovery commands, markers, agent and tools while replacement evidence is gathered. The old daemon is retained only as deprecated compatibility tooling under `tools`; it is not composed, exported, or installed by the package binary map.

**Target.** Orchestration, handoff, evidence, future Ledger Authority, and a native loop engine are peer features. Ledger will become the sole lifecycle authority in a later change. Native looping will use only the exact pinned OpenCode 2 primitives.

See `current-state.md`, decisions 0005–0011, and `operations/real-host-probes.md`.
