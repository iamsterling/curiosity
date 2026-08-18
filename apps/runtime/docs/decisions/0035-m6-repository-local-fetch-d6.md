# ADR 0035: M6 repository-local fetch D6

**Status:** Accepted 2026-08-18 for the exact local fixture; public/production NO-GO

D6 accepts one logical origin and seed, `https://docs.m6-owned.test/`, mapped
only by the test transport to loopback and authenticated by the repository
project CA. Public DNS and egress are forbidden. Bun performs HTTPS with SNI and
hostname verification. M5 global-address policy is unchanged; this `.test`
loopback path is isolated in the M6 admin module and characterization suite.

Only GET and identity encoding are allowed. Userinfo, query, fragments,
cross-origin hops, unsafe media, and non-UTF-8 text fail closed. Bounds are one
origin/seed, 12 documents, 16 URLs, depth 2, 32 exchanges, concurrency 1, zero
retries, 3 same-origin page redirects, 5 robots redirects, 128 KiB/page,
512 KiB/robots, and 2 MiB aggregate. RFC 9309 matching uses the selected group,
longest match, Allow on ties; unreachable/server-error robots is complete
disallow while a 4xx unavailable file permits access.

No generic fetch, public DNS, credential, proxy, production endpoint, or M7
packaging is accepted.
