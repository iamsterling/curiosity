# Q1-T02 result

**Corrected result:** **INSUFFICIENT / NOT REPRODUCIBLE.** This correction
supersedes the original PASS summary.

`invalidation-test.log` reports six passing cases in which unchanged fixture
JSON compares equal and five mutations compare unequal. The raw command is
elided, and exact environment/profile, timestamp, and explicit exit metadata
were not retained. The probe source implements JSON equality against one static
fixture; it does not prove product invalidation enforcement or independently
validate the fixture's candidate claims.

The preserved output hash is in `SHA256SUMS`. The probe remains a static example
of Q1 policy only; it is insufficient qualification evidence, and product
invalidation enforcement is not implemented or authorized. See the
[evidence sufficiency ledger](../EVIDENCE-SUFFICIENCY.md).
