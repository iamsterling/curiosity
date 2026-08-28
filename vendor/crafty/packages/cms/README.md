# `@crafty/cms`

The package currently contains the zero-I/O CMS kernel and local service
implementations used for deterministic tests. Definitions, codecs, validation,
access projections, tenancy guards, and descriptors are safe to use without a
database.

The local services are not a Postgres implementation. Persistence, migrations,
RLS, platform identity integration, HTTP adapters, assets, and outbox delivery
remain blocked on their respective infrastructure contracts and environment
evidence; this package deliberately makes no claim that those tasks are done.
