# ADR 0002: Private Git distribution

Status: Superseded by ADR 0031

## Decision

Distribute this bootstrap only through the private `iamsterling/opencode2-config` GitHub repository. Mark the package private and remove npm publication and public release workflows.

## Consequence

CI verifies source and provenance, but no npm publication, public release, Pages deployment, or installer cutover occurs.

## Supersession

ADR 0031 retains the no-publication/no-cutover boundary while allowing a
registry-ready package artifact and an isolated local-registry proof. This
record remains the historical reason the package was previously private.
