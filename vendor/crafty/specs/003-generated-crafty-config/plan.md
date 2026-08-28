# Implementation Plan: Generated Crafty Repo Config

## Architecture

Keep generation in `@crafty/api` because discovery now lives in the API-owned product engine. Users depend on the public `crafty.generateConfig()` facade instead of an internal service package.

## Package Responsibilities

- `packages/api`: config types, generated artifact model, discovery-to-config conversion, file writing, and public `crafty.generateConfig()` method.
- `packages/cli`: `config <workspace-root>` command.
- `specs/003-generated-crafty-config`: Spec Kit source of truth.

## Data Flow

1. Caller requests config generation for a workspace root.
2. API-owned discovery runs against the workspace.
3. Discovery results are converted into typed collection config objects.
4. API-owned config generation writes `.crafty/config.ts`, `.crafty/manifest.json`, and `.crafty/generated.d.ts`.
5. API/CLI return artifact paths and the generated manifest.

## Config Design

Use Payload-style exported object constants:

```ts
export const Screens: CraftyCollection = { ... };
export const Shared: CraftyCollection = { ... };
export const Components: CraftyCollection = { ... };
export const Primitives: CraftyCollection = { ... };

const config: CraftyConfig = {
  collections: [Screens, Shared, Components, Primitives],
};

export default config;
```

## Testing Strategy

- API unit test writes generated files into the project-structure test workspace.
- API test verifies the public facade returns generated artifact paths.
- CLI test verifies `crafty config` writes files and prints success JSON.

## Verification Commands

- `npm run typecheck --workspace @crafty/api`
- `npm run test --workspace @crafty/api`
- `npm run build --workspace @crafty/api`
- `npm run typecheck --workspace @crafty/cli`
- `npm run test --workspace @crafty/cli`
- `npm run build --workspace @crafty/cli`
