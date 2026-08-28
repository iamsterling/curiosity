# Quickstart: Generated Crafty Repo Config

```bash
npm run build --workspace @crafty/cli
node packages/cli/dist/index.js config test-workspaces/source-discovery
```

Then inspect:

```bash
ls test-workspaces/source-discovery/.crafty
```

Expected files:

- `config.ts`
- `manifest.json`
- `generated.d.ts`

The generated `config.ts` can be edited by teams to refine collection paths and workbench defaults.
