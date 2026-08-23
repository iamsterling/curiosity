# Removed legacy daemon

**Retired tombstone.** `tools/loopd.mjs` has been removed from the product tree
under ADR 0013. The imported scheduler, timer/heartbeat, shell/process behavior,
and mutable compatibility state are absent from composition, assets, exports,
package files, and binaries. Characterization and security tests enforce this
negative assertion.

Git history and provenance manifests retain attribution and historical paths;
their presence is not a runtime surface. No redesign, installation, recovery
flow, or native interface may depend on the retired daemon without a separately
reviewed decision that explicitly supersedes this tombstone.
