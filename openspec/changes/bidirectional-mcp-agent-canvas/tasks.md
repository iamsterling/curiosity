## 1. Core Contracts

- [ ] 1.1 Define transport-neutral agent operation, query, capability, receipt, diagnostic, and bounded event types.
- [ ] 1.2 Define stable limits and error codes for request size, command count, query scope, idempotency, transaction lifetime, and event queues.
- [ ] 1.3 Add scoped query functions for summaries, tree/children, node details, selection, resolved layout, and diagnostics without mutation.

## 2. File Command Room

- [ ] 2.1 Implement one authoritative kernel-backed room per canonical document file with serialized operation handling.
- [ ] 2.2 Implement preview transactions with base-revision checks, command bounds, diagnostics, affected IDs, and no history/persistence mutation.
- [ ] 2.3 Implement atomic labelled commit and rollback using the existing kernel transaction APIs.
- [ ] 2.4 Implement stale-revision rejection, idempotency-key replay, receipt retention, and persistence-status reporting through the canonical document store.
- [ ] 2.5 Implement ordered file-scoped operation events with bounded subscriptions and session-expiry rollback.
- [ ] 2.6 Add room tests for valid/invalid commands, atomicity, conflicts, idempotency, rollback, persistence failure, scope isolation, and event ordering.

## 3. MCP Package

- [ ] 3.1 Add the official TypeScript MCP SDK and create the transport-neutral MCP server factory with Zod input schemas and structured outputs.
- [ ] 3.2 Register bounded read tools/resources for summary, selection, tree/children, node, resolved layout, diagnostics, receipts, and change events.
- [ ] 3.3 Register preview, commit, rollback, receipt, and subscription tools with read/write/destructive/idempotent annotations and capability checks.
- [ ] 3.4 Add stdio transport startup with explicit local file/configuration resolution and no arbitrary filesystem paths.
- [ ] 3.5 Add MCP protocol integration tests covering tool discovery, structured responses, malformed input, capability denial, and query/write parity.

## 4. Web and CLI Integration

- [ ] 4.1 Add the local Streamable HTTP MCP route to `apps/web/editor` using the shared server factory and explicit local capability policy.
- [ ] 4.2 Add the CLI MCP face, help text, configuration validation, and lifecycle cleanup for stdio operation.
- [ ] 4.3 Add route/CLI integration tests proving both transports reach the same room and preserve revisions, receipts, and diagnostics.

## 5. Documentation and Verification

- [ ] 5.1 Record the agent command-room and MCP transport decisions in a new architecture ADR and update current-state/agent-editing documentation from Target to Current where implemented.
- [ ] 5.2 Add operator documentation for local MCP setup, capabilities, file scope, limits, recovery diagnostics, and supported client configuration.
- [ ] 5.3 Run package tests, typecheck, lint, format check, and the affected web/CLI builds; validate the OpenSpec change and retain any unsupported render-verification status explicitly.
