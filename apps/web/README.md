# Curiosity web

This Next.js workspace renders the independent harness thread projection. It is
a read-only surface: there are no command routes, server actions, or imports of
the harness command API.

## Run

Build the harness package, point the web process at an existing absolute SQLite
database path, then start the development server:

```sh
bun run --cwd apps/custom-harness build
CURIOSITY_DATABASE_PATH=/absolute/path/to/curiosity.sqlite \
  bun run --cwd apps/web dev
```

If `CURIOSITY_DATABASE_PATH` is missing or unreadable, the page renders a
fail-closed unavailable state and no synthetic threads.

## Verify

```sh
bunx turbo run verify --filter=web
```

The web tests verify the Node read-only SQLite adapter against a non-writable
database file and reject app API routes, server actions, or command-authority
imports.
