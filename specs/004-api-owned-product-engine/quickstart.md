# Quickstart: API-Owned Reusable Product Engine

After migration, users and app packages should use `@crafty/api`:

```ts
import { createCrafty } from "@crafty/api";

const crafty = createCrafty({ workspaceRoot: process.cwd() });

await crafty.generateConfig();
await crafty.discover();
```

CLI remains:

```bash
crafty config .
crafty discover .
crafty doctor .
```

Contributors should place new code by this rule:

- reusable engine behavior → `packages/api/src/*`
- app lifecycle/orchestration → owning app package
- pure primitive/schema/compiler logic → lower-level primitive package
