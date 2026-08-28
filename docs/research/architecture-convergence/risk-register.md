# Risk Register

| Risk | Evidence | Mitigation | Gate |
|---|---|---|---|
| Route/documentation drift causes broken navigation | `/files` links versus `/editor` route | Stage 0 route audit and smoke tests | Before mode work |
| Renderer migration changes draw order or glass behavior | Scene plus side channels; suspected split-path inversion | Confirm with focused packet/pixel tests first | Before renderer refactor |
| MCP commits split from persistence | Local agent seam has no durable receipts | Room receipts, idempotency, persistence status | Before public MCP |
| Selection semantics diverge by entry point | Context menu still uses scene spatial index | Unify or explicitly version hit-test ownership | Before new selection scopes |
| Workspace registry becomes premature plugin API | No second workspace exists | First-party descriptor only after concrete consumer | Before registry abstraction |
| Code becomes second canonical artifact | IDE research requires model/projection separation | Stable IDs/anchors and command compiler | Before Code mode |
| Animation leaks into authored or renderer state | Target docs already separate resolution | Deterministic evaluated frame contract | Before animation tooling |
| Full-suite verification is resource-sensitive | Parallel run timed out while isolated suite passed | Record isolated/full results separately; measure CI | Every migration checkpoint |
