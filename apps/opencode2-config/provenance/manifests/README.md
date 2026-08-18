# Import manifests

Machine-readable per-file SHA-256 manifests are added with each import stage. Historical bytes referenced by those manifests are retained in the content-addressed `../objects/sha256/` store so verification does not depend on discarded repository history.

The resource baseline is part of standard verification, including its resource-only objects. Its object set is unchanged: verification now covers the previously omitted objects and validates both their digests and recorded sizes.
