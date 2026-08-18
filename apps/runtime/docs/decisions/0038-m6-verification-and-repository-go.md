# ADR 0038: M6 verification and repository GO

**Status:** Accepted 2026-08-18 for exact repository cell; production/public NO-GO

The project owner accepts the ADR 0035/0036 synthetic cell at source digest
`c5370dccd5961e8e4f911cbc05625cbe72d5000c868d3ee82ae0f3aeda1ccb1d` (reproduced by ADR 0037's command). Evidence covers the pinned exact
manifest identity, governance, route/body/media and qrels digests; RFC 9309
percent-octet and exact case-insensitive product-token vectors; 4xx allow-all
and other-error fail-closed robots handling; fixed local TLS and wrong-host certificate checks;
origin/redirect/query/userinfo/media/encoding and chunk-stream size bounds; normalized redirect
targets are origin/path and selected-robots checked before page transport; zero durable bytes on
safeguard failure, immutable capture/citation lineage, projection
corruption/rebuild, tombstone deletion/non-resurrection, lexical judgments,
deterministic no-answer, exact six-query held-out judgments, and query/admin
package separation. The committed CA and private keys are fixture-only,
loopback-only test material and are not production trust or credentials.

Fake-transport tests run under the OS network-denied suite. The local TLS test is
separate and explicitly opens only a loopback listener with the committed
project test CA. No test contacts public DNS or egress. No new third-party
runtime dependency exists.

Rollback disables/removes the admin export and fixture, withdraws then deletes
the exact candidate, retains tombstones, and returns query behavior to M1–M5.
Production/public crawling and M7 packaging remain **NO-GO**.
