# Crafty

Crafty is a local visual design surface. The standalone browser slice models visual layers and states directly; it does not execute React/TSX components or mutate source files.

## Run Crafty

Build once, run anywhere — a self-contained directory with a bundled Bun runtime, no toolchain needed on the target machine:

```sh
bun install
bun run bundle
./dist/crafty
```

- `./dist/crafty` — desktop face: opens the design surface in your browser (loopback, secure origin; WebGPU works without certificates). The root URL is a file browser; every file lives at its own slug — `/files/<slug>` — with per-file scene storage under the data directory
- `./dist/crafty serve` — serve face: hosts the surface over HTTPS on `0.0.0.0` with a Tailscale-aware local CA, so an iPad on the tailnet can continue the same session
- `./dist/crafty import <file.pen> [file-slug]` — imports a pen.dev `.pen` document into `/files/<slug>` (default `untitled`)
- `./dist/crafty save <slug> [dir.ui]` / `./dist/crafty load <slug> [dir.ui]` — copy the slug's `.ui` package out of / into the store
- `./dist/crafty --help` — the available faces

Crafty ships Next.js zone servers (a blank base app routing the domain, the
editor zone hosting the surface and scene API, and — in deployed mode — an
admin zone), so `dist/` contains the standalone zone builds, the CLI, and a
bundled `bun` behind the `crafty` launcher.

The scene is stored under `~/.crafty` (override with `CRAFTY_DATA_DIR`) and survives restarts. Work on the Mac, hop on the iPad — the Mac desktop face and the serve face share one persisted scene.

## Run The Browser Surface (development)

```sh
bun install
bun run dev
```

Open `https://127.0.0.1:4173` on the host machine, or use the host's Tailscale IPv4 address from an iPad or another device on the tailnet. Find it with `tailscale ip -4`, then open `https://<tailscale-ip>:4173`. `bun run dev` runs the multi-zone supervisor: the base app owns `0.0.0.0:4173` (HTTPS) and rewrites to the zone dev servers over loopback (the editor on `127.0.0.1:4175`) — one origin, several servers. WebGPU requires this secure origin.

The first `bun run dev` generates a local CA and a Tailscale-IP-aware development certificate under `apps/crafty-web/certificates/`. Install `crafty-dev-ca.cer` on the iPad, then enable it under Settings > General > About > Certificate Trust Settings. Open the HTTPS Tailscale URL afterward. iPadOS 26 or newer is required for WebGPU.

The development server is intended for trusted local networks. Do not expose it to the public internet without authentication and production transport security.

The editor displays a `Runtime proof` panel in the canvas. `VERIFIED` requires all three checks to pass: the generated Rust/WASM module must instantiate and expose `RendererCore` exports, WebGPU must render a 1x1 offscreen target and read back the expected pixel bytes, and the current scene frame must report Rust draw commands submitted through the versioned protocol to WebGPU. A WebGL context is never requested.

Useful checks:

```sh
bun run build
bun run typecheck
bun run test
bun run lint
bun run format:check
```
