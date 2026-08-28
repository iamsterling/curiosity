# Contracts: API-Owned Reusable Product Engine

## Public Import Contract

```ts
import { crafty, createCrafty } from "@crafty/api";
```

Supported public methods remain object-first:

```ts
await crafty.discover({ workspaceRoot });
await crafty.generateConfig({ workspaceRoot });
await crafty.find({ collection: "blocks", workspaceRoot });
await crafty.validateWorkspace({ workspaceRoot });
await crafty.compileWorkspace({ workspaceRoot });
await crafty.previewWorkspace({ workspaceRoot });
```

## Package Boundary Contract

- CLI/MCP/userland import reusable behavior from `@crafty/api` only.
- VS Code and any app host may contain app-local services, but reusable engine behavior should come from `@crafty/api`.
- Primitive packages do not import `@crafty/api`.
- `@crafty/api` may import primitive packages.

## Drift Contract

The migration is incomplete if reusable discovery, config, workspace, preview, or validation logic is reintroduced outside `@crafty/api` without an app-host reason.

```bash
grep -R -n "@crafty/api" apps packages --include='*.ts' --include='*.tsx'
```

Removed service packages must stay absent from workspace manifests and lockfiles.
