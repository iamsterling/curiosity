# Data Model: Generated Crafty Repo Config

## CraftyCollection

- `slug`: stable collection id.
- `label`: display label.
- `classification`: `screen`, `shared`, `component`, `primitive`, or custom string.
- `paths`: repo-relative file/path patterns or exact discovered files.
- `exclude`: optional repo-relative exclusions.
- `fields`: optional metadata fields.

## CraftyConfig

- `collections`: ordered collection list.
- `discovery`: framework/root/include/exclude/extensions/aliases configuration.
- `workbench`: navigation/canvas/preview UI defaults.
- `preview`: command/url/route defaults.
- `codegen`: output file locations.
- `hooks`: named hook placeholders.
- `plugins`: plugin name placeholders for future runtime execution.

## CraftyGeneratedConfigManifest

- `workspaceRoot`: absolute workspace root used for generation.
- `generatedAt`: ISO timestamp.
- `configPath`, `manifestPath`, `typesPath`: absolute artifact paths.
- `collections`: generated collection summaries with item counts and reasons.
- `discovery`: project discovery snapshot.

## CraftyGeneratedConfigResult

- `workspaceRoot`
- `configPath`
- `manifestPath`
- `typesPath`
- `config`
- `manifest`
