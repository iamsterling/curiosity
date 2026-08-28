# Operator workflows

## Single binary

Build once from the repo root, then run the binary anywhere on the machine:

```bash
bun run bundle
```

This builds the scene model, renderer, the zone servers (base, editor, and
admin when it exists), and CLI, then assembles a self-contained `dist/`
directory with a bundled Bun runtime behind the `dist/crafty` launcher (no
Bun, npm, or toolchain needed on the customer machine). The launcher spawns
every zone on a loopback port behind the base app — one artifact, many
processes.

```
dist/
  crafty          launcher script
  bun             bundled Bun runtime
  cli/            compiled CLI
  base/           base app standalone (the domain path table + /api/health)
  web/            editor zone standalone (file browser, editor, scene API)
  admin/          admin zone standalone (when it exists)
  node_modules/   workspace packages the CLI imports
```

### Desktop face

```bash
./dist/crafty
```

Starts the base app loopback-only, spawns the zone servers behind it, opens
the design surface in the system browser, and serves the file browser, the
editor and the scene API on `127.0.0.1:4173`. The scene persists under the
data directory (`~/.crafty`, override with `CRAFTY_DATA_DIR`).

### Serve face (iPad and other devices)

```bash
./dist/crafty serve [--port N]
./dist/crafty serve --http [--port N]   # plain HTTP for a reverse proxy (Dokploy/Traefik)
```

Starts the base app on loopback and terminates TLS in front of it on
`0.0.0.0` (or skips TLS entirely with `--http`), issuing a Tailscale-IP-aware
local CA and certificate under the data directory, then prints the device
URL. Install `crafty-ca.cer` on each device once (Settings > General > About >
Certificate Trust Settings), then open `https://<tailscale-ip>:4173/files/<slug>`.
The Mac desktop face and the iPad share the same persisted files — start
`crafty` on the Mac and continue on the iPad at the same slug.

### Files

Every file lives at a URL slug: `/files/<slug>`; the root is a Server Component file browser listing everything in the data directory. Scenes are stored per slug under the data directory (`~/.crafty/scene.json` for `untitled`, `~/.crafty/files/<slug>/scene.json` for the rest) and served per slug by the scene API (`/api/files/<slug>/scene`).

```bash
./dist/crafty import designs/card.pen card-demo   # imports into /files/card-demo
```

## Development workflows

Run the browser surface against the source tree:

```bash
bun run dev
```

This builds the workspace packages and starts one Next.js dev server on
`0.0.0.0:4173` with a Tailscale-aware development certificate. Next owns the surface
*and* the scene API (`app/api/files/[slug]/…`), so there is no second process and
nothing to proxy.

Run the app from source:

```bash
bun run build --filter @crafty/crafty-web   # produces the standalone server
bun run build --filter @crafty/crafty       # compiles the CLI launcher
bun apps/cli/dist/index.js            # desktop face
bun apps/cli/dist/index.js --help
```
