# ADR 0004: Explicit Tool and Gesture State Machines

Status: Accepted — implemented
Date: 2026-08-05
Implementation status: Implemented in `packages/editor-kernel/src/interaction.ts`; resize is not yet modelled as an explicit effect

## Context

Pointer callbacks currently infer creation, selection, movement, and pan from event properties. A miss immediately becomes rectangle creation.

## Options Considered

- More event guards in the canvas component.
- A single generic drag boolean.
- Explicit tool state and gesture ownership with thresholded commit.

## Decision

Use explicit `idle`, `armed`, `captured`, `preview`, `committed`, and `cancelled` states. Route navigation before selection and creation. Only the rectangle tool can emit rectangle commit.

## Consequences

The interaction model is slightly more verbose but makes invalid cross-tool transitions unrepresentable and enables deterministic tests.

## Validation

Tests cover wheel zoom, hand navigation, selection misses, rectangle threshold, Escape, pointer cancel, and lost capture.
