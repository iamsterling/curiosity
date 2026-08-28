# Feature Spec: Test Workspaces Consolidation

## Problem

The repo currently uses a generic test-data bucket for sample blocks and project structures. That name hides intent and makes test data feel like product code. Crafty needs cohesive, named test workspaces that describe what behavior they prove.

## Scope

- Rename generic fixture concepts to explicit test workspaces.
- Keep block-contract and project-structure examples, but organize them by the tests that consume them.
- Remove unused samples that are not referenced by tests or docs.

## Acceptance Criteria

- Test data lives under a clearly named test workspace directory, not a vague catch-all fixture bucket.
- API, CLI, MCP, and VS Code tests reference named test workspaces.
- No unused sample component directories remain.
- Drift checks search for new uses of generic fixture language before closing future cleanup work.

## Risks

- Renaming test data touches many test paths and generated-config examples.
- Moving too much at once can obscure behavior changes; do this as path-only cleanup with tests unchanged.
