# Contracts: Generated Crafty Repo Config

## Public API

```ts
await crafty.generateConfig({ workspaceRoot });
```

Returns:

```ts
interface CraftyGeneratedConfigResult {
  workspaceRoot: string;
  configPath: string;
  manifestPath: string;
  typesPath: string;
  config: CraftyConfig;
  manifest: CraftyGeneratedConfigManifest;
}
```

## CLI

```bash
crafty config <workspace-root>
```

Prints JSON:

```json
{
  "ok": true,
  "workspaceRoot": "/repo",
  "configPath": "/repo/.crafty/config.ts",
  "manifestPath": "/repo/.crafty/manifest.json",
  "typesPath": "/repo/.crafty/generated.d.ts"
}
```

## Generated Files

- `.crafty/config.ts`: typed, editable Payload-style config objects.
- `.crafty/manifest.json`: generated discovery summary and reasons.
- `.crafty/generated.d.ts`: type re-export convenience for editors.
