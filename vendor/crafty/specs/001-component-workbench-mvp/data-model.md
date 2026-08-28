# Data Model: Component Workbench MVP

## Diagnostic

- `code`: stable machine-readable code
- `message`: actionable human-readable message
- `path?`: workspace-relative or absolute path when relevant
- `severity`: `info | warning | error`

## ComponentTarget

- `id`: stable component id
- `name`: display name
- `title`: source path or grouping
- `filePath?`: source file path
- `source`: `crafty | inferred`
- `stories`: `StoryTarget[]`
- `tags`: `string[]`

## StoryTarget

- `id`: Crafty source target id
- `name`: source target display name
- `title`: source path or grouping
- `componentId`: owning component id
- `filePath?`: source import path
- `tags`: `string[]`
- `renderUrl?`: native render URL when known

## VariantTarget

- `id`: variant id
- `componentId`: component id
- `storyId?`: story id
- `name`: variant label
- `kind`: `story | prop | state`
- `props?`: JSON object of known prop values
- `state?`: JSON object of known state values

## RenderTarget

- `storyId`: story id
- `viewport?`: `{ width, height }`
- `theme?`: theme id/name
- `state?`: JSON object
- `renderUrl?`: iframe URL
- `screenshotRef?`: optional screenshot reference
- `status`: `ready | unsupported | error`
- `diagnostics`: `Diagnostic[]`

## Timeline

- `id`: generated stable id
- `storyId`: story id
- `events`: `TimelineEvent[]`
- `createdAt`: ISO timestamp

## TimelineEvent

- `id`: event id
- `at`: non-negative millisecond timestamp
- `kind`: `state | prop | interaction | note`
- `target?`: event target selector/key
- `value?`: JSON value
- `description?`: human-readable note

## TestRun

- `id`: run id
- `targetId?`: component or story id
- `status`: `passed | failed | unsupported | error`
- `command?`: explicit/detected command
- `stdoutSummary?`: bounded stdout summary
- `stderrSummary?`: bounded stderr summary
- `failures`: string array
- `traceRef?`: trace reference
- `diagnostics`: `Diagnostic[]`

## VisualDiffResult

- `status`: `passed | failed | unsupported | error`
- `beforeRef`: input ref
- `afterRef`: input ref
- `diffRef?`: diff artifact ref
- `summary`: bounded text summary
- `diagnostics`: `Diagnostic[]`

## WorkbenchTraceEvent

- `id`: event id
- `timestamp`: ISO timestamp
- `source`: `agent | human | extension | mcp | webview | test | render`
- `action`: stable action name
- `targetId?`: story/component/timeline/test target
- `status`: `started | completed | failed | unsupported`
- `message`: short text
- `metadata?`: JSON object
