#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

if command -v node >/dev/null 2>&1; then
  exec node "$ROOT_DIR/tools/install-node.mjs" "$@"
fi
if command -v bun >/dev/null 2>&1; then
  exec bun "$ROOT_DIR/tools/install-node.mjs" "$@"
fi

echo "OpenCode2 Config source installation requires Node.js or Bun." >&2
exit 1
