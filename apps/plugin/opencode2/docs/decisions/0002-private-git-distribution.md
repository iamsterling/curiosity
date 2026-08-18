# ADR 0002: Private Git distribution

Status: Accepted

## Decision

Distribute this bootstrap only through the private `iamsterling/opencode2-config` GitHub repository. Mark the package private and remove npm publication and public release workflows.

## Consequence

CI verifies source and provenance, but no npm publication, public release, Pages deployment, or installer cutover occurs.
