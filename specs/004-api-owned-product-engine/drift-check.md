# Drift Check: API-Owned Reusable Product Engine

## Boundary Checks

- `@crafty/api` owns reusable discovery/config/workspace/preview/validation implementation.
- CLI imports reusable behavior from `@crafty/api` only.
- MCP imports reusable behavior from `@crafty/api` only.
- Removed app service packages have no active consumers.
- VS Code extension keeps host lifecycle code app-local and imports reusable engine behavior from `@crafty/api`.
- Primitive packages do not import `@crafty/api`.

## Search Checks

Run before closing migration:

```bash
grep -R "removed app service package marker" apps packages --include='*.ts' --include='*.tsx' --include='package.json'
```

Expected result after final migration: no active consumers of removed service packages and no package manifests for them.

## Verification Evidence

- Search across `apps` and `packages` for removed app service package imports: no matches
- Search across `package-lock.json` for removed app service package entries: no matches
- Removed app service package directory: no files found; package removed
- `npm run typecheck --workspace @crafty/api` - passed
- `npm run test --workspace @crafty/api` - passed, 24 tests
- `npm run build --workspace @crafty/api` - passed
- `npm run typecheck --workspace @crafty/cli` - passed
- `npm run test --workspace @crafty/cli` - passed, 13 tests
- `npm run build --workspace @crafty/cli` - passed
- `npm run typecheck --workspace @crafty/mcp` - passed
- `npm run test --workspace @crafty/mcp` - passed, 12 tests
- `npm run build --workspace @crafty/mcp` - passed
- Removed Studio workspace verification is no longer active after package removal
- `npm run typecheck --workspace @crafty/vscode-extension` - passed
- `npm run typecheck:webview --workspace @crafty/vscode-extension` - passed
- `npm run test --workspace @crafty/vscode-extension` - passed, 12 tests
- `npm run build --workspace @crafty/vscode-extension` - passed
