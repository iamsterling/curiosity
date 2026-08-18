# ADR 0025: M2 initial local test snapshot

**Status:** Accepted for the exact v1.0.0 fixture on 2026-08-18

## Context

M2 in the [complementary runtime plan](../plans/complementary-runtime-implementation-plan.md)
requires D4 approval of an exact local snapshot, its rights and custody, and any
storage/index dependencies. M1 contains no corpus and authorizes none.

## Proposed decision

The selected design candidate is a future, repository-held, purpose-built
AI-authored synthetic snapshot. It is not yet a corpus: no candidate bytes may
be generated, committed, imported, or copied while ownership, rightsholder
authority, and a license/grant for the intended uses remain unresolved. The
future exact immutable bytes and manifest would require a later accepted D4
decision. Synthetic content does not itself establish originality, ownership,
license, privacy safety, ecological validity, or production relevance.

Authorization to request or perform generation establishes only permission to
run that generation act within its stated scope. It is not evidence that the
requester, model provider, repository, or project owns the output, and it is not
a rightsholder license or grant to copy, commit, index, display, modify, or
distribute it.

Before any bytes exist or are imported, the snapshot manifest would require:

- manifest schema/version, stable snapshot ID/version, purpose, owner, creation
  and approval dates, and every logical document/path, media type, byte length,
  record count, and SHA-256 digest;
- rights holder, author contribution agreement or license/grant, declared
  `intendedUses` including `copy`, `test`, `index`, `display`, `modify`, and
  `distribute`, jurisdictions and restrictions, and legal approver;
- AI provenance for each record: model/provider identity and version where
  known, creation method/date, generation authorization record, prompt/input
  record digests, transformations, and review of possible copied, memorized,
  third-party, production, user, scraped, or confidential material;
- data classification and privacy review, including explicit absence of real
  personal data, credentials, secrets, regulated data, illegal content, and
  production identifiers;
- approved custodian, repository/storage location, access roles, movement and
  copy log, backup treatment, and environments in which custody is permitted;
- retention start, review/expiry date, deletion method and owner, withdrawal
  contact, withdrawal/takedown procedure, propagation deadline, and disposition
  of backups and rebuildable projections; and
- digest algorithm and canonicalization, per-file/record digests, a digest over
  the sorted manifest, approval signatures/records, supersession relation, and
  verification procedure before import and after transfer.

## Candidate trade-offs

| Candidate | Benefit | Cost/risk | Proposed disposition |
| --- | --- | --- | --- |
| Future repository-held AI-authored synthetic snapshot | Narrow purpose, reviewable immutable candidate, deterministic edge cases | No present ownership/license grant; output-rights, memorization, originality, privacy, and repeatability uncertainty | **Selected design candidate; no bytes until rights disposition** |
| Purpose-built human-authored synthetic snapshot | Potentially clearer contribution path | Authoring/review cost; still requires an explicit contribution/license grant | Deferred |
| Existing openly licensed corpus | Better realism and comparability | License compatibility, attribution, version drift, withdrawal, and import/custody complexity | Defer to a separate exact-corpus decision |
| Production, user, scraped, or provider content | Realism | Privacy, terms, consent, security, custody, and deletion risk | Reject for the initial snapshot |

## Gates and STOP conditions

D4 may become accepted only when legal, privacy/security, product/test, and
custody owners approve the exact manifest and bytes; ownership/rightsholder
authority and an applicable license/grant are affirmatively resolved;
withdrawal and deletion are exercised; classification and retention are
recorded; every digest verifies; and any storage/index dependency separately
passes D8. A representative quality claim needs its own approved evaluation and
cannot follow from synthetic data.

Any future candidate must enter repository custody as `quarantined` and
`activationEligible: false`. It may not feed a query-visible or rebuildable
projection. The proposed
[candidate manifest schema](../schemas/d4-candidate-snapshot-manifest.schema.json)
keeps it quarantined when rights/license are missing, unresolved, pending, or
rejected, or when any legal, privacy-security, product-test, custody, manifest,
or digest approval is
pending or failed. Activation would additionally require an accepted D4, an
accepted D5, all applicable D8 decisions, exact-byte digest verification, and
separate explicit M2 implementation authority; satisfying the schema alone is
never an activation decision.

The schema represents those prerequisites explicitly: source and classification
reviews; absence findings for personal data, secrets, regulated data, production
identifiers, and prohibited content; legal, privacy-security, product-test,
custody, manifest, and digest approvals; exact D4/D5 decision references; and
either an accepted D8 reference or a dependency-free `not-required` disposition.
No such acceptance or approval currently exists. Its portable timestamp subset
is canonical RFC 3339 UTC `YYYY-MM-DDTHH:mm:ssZ`, optionally with 1-9 fractional
second digits. Offsets, lowercase `t`/`z`, leap seconds, and February 29 are
intentionally excluded to keep the regex-only subset conservative.

`STOP` before generation while the rights disposition described here is
unresolved. After a future authorization, `STOP` on unknown or conflicting
rights, copied or untraceable content, personal or secret data, missing
custodian/retention/withdrawal owner, digest mismatch, mutable snapshot identity,
unreviewed dependency, attempted quarantine bypass, or pressure to describe the
snapshot as representative of the web or production use.

## Open owner decisions

Resolved by the requester acting as project owner for M2: the exact fixture is
two English UTF-8 fictional text records under
`fixtures/m2-synthetic/v1.0.0`; repository custody is approved; annual retention
review and owner withdrawal/deletion apply; and M2 is dependency-free. The
manifest's approvals and reproducible digest bind the exact bytes. The owner
authorized AI generation and dedicates under CC0-1.0 only rights they control.
This is not legal advice or certainty about copyrightability, originality,
model-provider terms, memorization, or third-party rights. It makes no
representativeness or production claim.

1. Who owns D4 and signs for legal rights, privacy/security classification,
   test purpose, custody, retention, and withdrawal?
2. What exact size, document formats, languages, and deliberately synthetic edge
   cases are necessary for M2 acceptance without implying coverage?
3. May the eventual bytes be committed, or must they live in a separately
   controlled store, and who may copy or back them up?
4. What retention period, review cadence, withdrawal SLA, and backup-erasure
   rules apply?
5. Is M2 dependency-free, or which exact storage/index dependency must pass D8?

## Non-authorization

The prior non-authorization is superseded only for the exact fixture and M2 uses
recorded above. Different bytes, corpus acquisition, crawling, dependencies,
production use, and M3–M7 still require their own decisions.
