# Curiosity web

This is Curiosity's single Next.js dashboard. Ask, Research, and Build submit
through narrow same-origin routes into the governed harness; Craft composes the
pinned Crafty editor, renderer, and document store into the same app shell.

The server must run on Bun because the sealed harness journal uses Bun's SQLite
driver. The package's `dev` and `start` scripts enforce that runtime with
`bun --bun`.

## Run

Build the harness package, optionally point the web process at an absolute
SQLite database path, then start the development server:

```sh
bun run --cwd apps/custom-harness build
CURIOSITY_DATABASE_PATH=/absolute/path/to/curiosity.sqlite \
  bun run --cwd apps/web dev
```

Without `CURIOSITY_DATABASE_PATH`, the governed dashboard uses
`~/.curiosity/events.sqlite`. Craft documents default to `~/.crafty` and can be
redirected with `CRAFTY_DATA_DIR`.

## Verify

```sh
bunx turbo run verify --filter=web
```

The web tests verify read-only projection behavior, the narrow same-origin chat
envelope, and the single-app Craft composition boundary.
