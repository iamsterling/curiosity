# Crafty — launcher

`apps/cli` is the Crafty launcher: one entry point, several faces. It owns the
face dispatch (`src/index.ts`), the desktop/serve next-server harnesses, pen
import, and the `.ui` package save/load faces.

## Faces

| Face | Invocation | What it does |
|---|---|---|
| Desktop | `crafty` | Starts the Next server loopback-only, opens the system browser |
| Serve | `crafty serve` | Starts the Next server over HTTPS for iPad/other devices (Tailscale certs) |
| Import | `crafty import <file.pen>` | Imports a pen.dev `.pen` document into the scene store |
| Save / Load | `crafty save <slug> [dir.ui]` / `crafty load <slug> [dir.ui]` | Copy a `.ui` package out of / into the store |
| Usage | `crafty --help` | Prints the available faces |

The old block-compiler CLI commands (list, doctor, validate, compile, preview,
inspect, discover, config, facade) were removed with the retired lineage — see
ADR 0016.

## Building the binary

```bash
bun run bundle
```

`scripts/build-crafty-binary.mjs` builds the dependency chain (scene-model,
scene-renderer, editor, pen-import, scene-store,
crafty-web, crafty), then assembles a self-contained `dist/` directory: the Next
standalone build under `web/`, the compiled CLI under `cli/`, the workspace
packages under `node_modules/`, and a bundled `bun` runtime behind the `crafty`
launcher.

## Layout

- `src/index.ts` — entry; face dispatch
- `src/faces.ts` — pure face/port resolution (unit-tested)
- `src/desktop.ts`, `src/serve.ts` — desktop and serve faces over the Next server
- `src/next-server.ts` — spawns the built Next standalone server
- `src/import.ts` — pen import face
- `src/package-faces.ts` — save/load `.ui` package faces
