# ADR 0019: exact beta-17519 plugin ABI

**Status:** Proposed 2026-08-17; supersedes ADR 0015's host pin

## Evidence

The active packaged host reports `opencode2 v0.0.0-beta-17519`. Its published
plugin SDK has registry integrity
`sha512-4gok66CLBFo4C9T+Tdr7wUBtj20QAL/zIuICG337umtlQZOslHYzTra7ZIJN3VAWq7RDJduqt99z5ac3wxQpIw==`.
The Promise plugin definition declaration is byte-identical to next-17430
(SHA-256 `d1b65b2471e4e946057cc37fa93b6a66a5eaf4b6c585e582b5a99d21ce0eb6a7`).
The installed Darwin arm64 executable has SHA-256
`5e25c1eb8c1afd5b0665340f9ba9c07eeb60d5e5e33434885a190cf034eb43ec`;
the registry CLI integrity is
`sha512-Myu7ju6FtZ0EiScGLbs/utgWNZ2EgUmoihdpdFJz63WZXeaiHcxRRxOA7VKmHLgLKsOL4ZQ3sOtmngA3L64N0Q==`.
Other SDK declarations differ, so this is a real package revision rather than a
release-channel alias; the product does not use the changed surfaces.

An isolated beta-17519 `serve` probe with no operator configuration established
that the prior exact next-17430 runtime guard prevented this plugin from being
listed. The repository real-host suite remains the authority for setup,
registration, cleanup, confinement, and artifact identity on the new exact pin.

## Decision

Pin the host CLI, plugin SDK, lockfile, runtime guard, and generated installation
manifest to `0.0.0-beta-17519`. Keep the guard exact: no version range or
cross-version alias is accepted. Preserve one global auto-discovery route; an
additional explicit configuration entry is unsupported because duplicate IDs
fail host activation.
