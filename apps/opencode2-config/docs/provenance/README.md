# Provenance relocation

**Current.** Historical import manifests and evidence remain immutable. `relocations.json` maps historical authored paths to current paths and current digests. Full-history verification proves historical blobs against the old manifests and current relocated files against this mapping. Shallow clones cannot reproduce the historical half and fail truthfully.
