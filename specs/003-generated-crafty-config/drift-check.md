# Drift Check: Generated Crafty Repo Config

## Spec-to-Code Checks

- `crafty.generateConfig()` exists in the public API.
- `crafty config <workspace-root>` exists in the CLI.
- Generated `.crafty/config.ts` uses `CraftyConfig` and `CraftyCollection` types.
- Generated `.crafty/manifest.json` includes collection summaries and reasons.
- Generated `.crafty/generated.d.ts` re-exports public config types.

## Verification Evidence

- `npm run typecheck --workspace @crafty/api` - passed
- `npm run test --workspace @crafty/api` - passed
- `npm run build --workspace @crafty/api` - passed
- `npm run typecheck --workspace @crafty/cli` - passed
- `npm run build --workspace @crafty/cli` - passed
- `npm run test --workspace @crafty/cli` - passed
- Review-work: goal, QA, code quality, and security passed; context mining found the missing `crafty` bin alias, which was fixed and covered by a CLI test.
