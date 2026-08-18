# Single plugin composition root

Status: Accepted for foundation, 2026-08-12.

Current: only src/plugin/plugin.ts calls Plugin.define. compose.ts owns registration ordering and idempotent reverse cleanup, not lifecycle policy. Target: features register through contracts and host adapters.
