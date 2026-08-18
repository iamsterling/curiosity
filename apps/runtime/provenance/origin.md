# Origin and transfer record

- **Origin repository:** `iamsterling/opencode2-config`
- **Origin local path:** `/Volumes/dev/opencode2-config`
- **Origin commit:** `8ff93f27bd8a19cf548a562a6c684c87a9e37004`
- **Transfer date:** 2026-08-17
- **Transfer mode:** MOVE

## Moved documents

| Origin path                                          | Current path                                         | Source state                    |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| `docs/decisions/0020-provider-neutral-web-search.md` | `docs/decisions/0020-provider-neutral-web-search.md` | Untracked working-tree document |

The source repository had unrelated uncommitted work at transfer time. The moved
ADR itself was uncommitted, so the origin commit identifies the repository base,
not a commit containing that document. Its content and historical statements
were preserved verbatim.

No separate completed product-agent reports or coordinator synthesis were found
in accessible source files or Orca terminal artifacts. None were fabricated.
The source repository's MIT license was copied conservatively for project-authored
documentation. This does not relicense SearXNG or any other third-party AGPL code;
no third-party source code was transferred.

## ADR 0024 ownership correction

On 2026-08-18, ADR 0024's durability design was moved while Proposed to
[`apps/opencode2-config`](../../opencode2-config/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md),
beside the Ledger architecture it governs. The runtime path retains a
[Moved provenance stub](../docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
The canonical design was accepted on 2026-08-18. Acceptance is design approval
only; implementation and production authority/persistence remain blocked on its
gates.
