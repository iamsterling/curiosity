# ADR 0022: Component definition identity and semantic-surface ownership

- Status: Accepted
- Date: 2026-08-11

## Decision

Local component definitions own reusable identity and reference one authored
template subtree through `rootNodeId`. A component-role semantic surface is an
independent semantic record. A definition may reference that record with
`surfaceId`, but the two ids are never interchangeable and deleting a surface
does not retarget a definition or its instances.

Template roots are authored nodes outside page roots. Instances remain linked
records containing only `definitionId`, declared properties, and sparse
overrides. Resolution creates disposable provenance-bearing projections; it
does not serialize derived ids or resolved values.

## Consequences

- Canonical `.ui` persistence must retain both registries and surface records.
- Clipboard paste remints internal node, definition, instance, and surface ids;
  external definitions remain references or produce an explicit diagnostic.
- Structural variants, runtime states, libraries, and motion remain deferred.
- Validation rejects missing roots and component-role surface mismatches rather
  than guessing ownership.

## Alternatives rejected

- Making the surface id the component id would conflate semantic intent with
  reusable authored identity.
- Treating the definition root as a page child would make templates visible
  authoring content and introduce accidental duplication on placement.
