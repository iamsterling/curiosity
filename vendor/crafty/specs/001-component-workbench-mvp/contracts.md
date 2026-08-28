# Contracts: Component Workbench MVP

## Error shape

All tools return `diagnostics: Diagnostic[]`. Fatal failures still return structured JSON where possible:

```json
{
  "ok": false,
  "diagnostics": [{ "code": "WORKSPACE_NOT_FOUND", "message": "...", "severity": "error" }]
}
```

## MCP tools

### component.list
- **Input**: `{ "workspaceRoot"?: string, "sourceId"?: string }`
- **Output**: `{ "ok": boolean, "components": ComponentTarget[], "sources": SourceTarget[], "diagnostics": Diagnostic[] }`

### component.inspect
- **Input**: `{ "workspaceRoot"?: string, "componentId"?: string, "sourceId"?: string }`
- **Output**: `{ "ok": boolean, "component"?: ComponentTarget, "sources": SourceTarget[], "variants": VariantTarget[], "limitations": string[], "diagnostics": Diagnostic[] }`

### component.render
- **Input**: `{ "componentId": string, "sourceId"?: string, "viewport"?: { "width": number, "height": number }, "theme"?: string, "state"?: object }`
- **Output**: `RenderTarget`

### variant.list
- **Input**: `{ "workspaceRoot"?: string, "componentId": string, "sourceId"?: string }`
- **Output**: `{ "ok": boolean, "variants": VariantTarget[], "diagnostics": Diagnostic[] }`

### state.set
- **Input**: `{ "componentId": string, "sourceId"?: string, "state": object }`
- **Output**: `{ "ok": boolean, "renderTarget": RenderTarget, "warnings": string[], "diagnostics": Diagnostic[] }`

### timeline.create
- **Input**: `{ "componentId": string, "sourceId"?: string, "events": TimelineEvent[] }`
- **Output**: `{ "ok": boolean, "timeline"?: Timeline, "diagnostics": Diagnostic[] }`

### timeline.play
- **Input**: `{ "timelineId": string }`
- **Output**: `{ "ok": boolean, "timelineId": string, "status": "played" | "unsupported" | "error", "renderRefs": string[], "diagnostics": Diagnostic[] }`

### test.run
- **Input**: `{ "workspaceRoot"?: string, "componentId"?: string, "sourceId"?: string, "testKinds"?: string[], "command"?: string }`
- **Output**: `TestRun`

### visual.diff
- **Input**: `{ "beforeRef": string, "afterRef": string }`
- **Output**: `VisualDiffResult`

## Webview messages

- `workbench.ready`: webview requests initial state.
- `component.select`: webview selects a component source.
- `component.render`: webview requests render metadata.
- `test.run`: webview asks extension to run component checks.
- `trace.append`: extension sends trace events.

## Extension commands

- `craftyWorkbench.open`: open component workbench panel.
- `craftyWorkbench.startMcpServer`: start MCP server process.
- `craftyWorkbench.runComponentChecks`: run safe detected checks for current workspace.
