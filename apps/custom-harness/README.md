# Curiosity custom harness

This workspace is Curiosity's independent authority kernel. It does not run on
OpenCode and does not import an external harness runtime.

The current vertical slice provides:

- one Effect `ManagedRuntime` and one authenticated command port;
- HMAC-authenticated, actor-bound, expiring command envelopes;
- actor-scoped command idempotency with digest-conflict rejection;
- a sealed plugin ABI v2 catalog with exact first-party manifests, deterministic
  dependency ordering and digest, fail-closed startup validation, and
  `thread.open`/`chat.turn` command-decider contributions;
- one SQLite writer transaction for command admission and immutable,
  hash-linked events; and
- durable user/assistant message projections and provider completion/failure
  lifecycle events;
- Bun and Node read-only thread projection adapters rebuilt from canonical
  events; and
- a mandatory nonce-bound Rust supervisor handshake with confined filesystem
  reads and opt-in, profile-bound filesystem mutation, process execution, Git
  reads, and locked detached worktree creation; generic shell, sandbox, and
  broader Git mutation remain disabled. Configured Git mutation is limited to
  gated locked detached worktree creation, clean non-force removal, and exact
  compare-and-swap updates under `refs/heads/curiosity/`.
- an optional provider-neutral bridge to Curiosity's owned query runtime with
  researcher-only final-sink enforcement, durable source custody, verified
  citations, and replay-stable research receipts.

Live model-provider behavior is not yet qualified. Network search remains
unavailable unless the owned runtime query adapter is explicitly configured;
generic public fetch has no shipped adapter. Commit, merge, push, force,
arbitrary-ref, and remote Git mutation; sandbox claims; multi-user operation;
and production readiness remain unavailable.

## Verify

```sh
bun run --cwd apps/custom-harness verify
```

## TUI

The terminal UI is a prompt-first command client and projection—it does not own
command or completion authority. The first prompt implicitly creates or resumes
a durable conversation, and the kernel streams and records the provider result.
Local OpenAI OAuth use requires no Curiosity environment setup:

```sh
bun run --cwd apps/custom-harness tui
```

Type directly in the centered composer. Use Shift/Ctrl/Alt+Enter or Ctrl+J for
a newline, `/new` for another conversation, and `/quit` to exit. Up/down recalls
composer history; use the mouse wheel or Page Up/Page Down to move through a
long transcript. Ctrl+K opens the
catalog-backed command palette, Ctrl+I toggles the read-only capability/plugin
inspector, and Escape dismisses either surface before exiting the session.
Palette selection only inserts command text; nothing executes until the
authenticated turn is submitted.

The full-screen, differentially rendered terminal client takes its Deep Space
tokens, lifecycle glyph grammar, shell, overlays, and companion-rail foundation
from [`tui.pen`](tui.pen). The implemented slice includes the idle/session
shell, responsive composer, command palette, and real kernel inspector without
depending on OpenTUI. Approval, recovery, and plugin-owned panes remain absent
until they can project authoritative kernel records. Provider deltas update
width-aware Markdown in place, while completion metadata remains subordinate.
Provider work uses one restrained, single-cell braille orbit; set
`CURIOSITY_MOTION=reduce` for a static `⠿` indicator.
Untrusted projected and streamed text is control-character sanitized before
rendering. The default is `openai-oauth:gpt-5.4-mini` at `medium` effort, using
the community OpenAI OAuth adapter and local Codex credentials. For cross-device
login, enable Codex device-code authorization for the ChatGPT account and run:

```sh
bunx @openai/codex login --device-auth -c 'cli_auth_credentials_store="file"'
```

The command prints a verification URL and one-time code. File storage is
required because the local adapter reads `$CODEX_HOME/auth.json` or the default
`~/.codex/auth.json`. Set `NO_COLOR=1` for plain terminal output.

The TypeScript renderer is the default terminal owner. The Bubble Tea migration
client remains available only for explicit comparison with
`CURIOSITY_TUI_CLIENT=bubbletea`; it is experimental and is not the default UX.

Set `CURIOSITY_MODEL` to a registry ID such as `openai:<model>`,
`anthropic:<model>`, `google:<model>`, `compatible:<model>`, or
`openai-oauth:<model>`. First-party providers use their standard API-key
variables. `compatible:` also requires
`CURIOSITY_OPENAI_COMPATIBLE_BASE_URL`; its API key is optional via
`CURIOSITY_OPENAI_COMPATIBLE_API_KEY`.

`CURIOSITY_EFFORT` accepts `default`, `none`, `minimal`, `low`, `medium`,
`high`, `xhigh`, or `max`. Non-default effort is currently restricted to the
OpenAI and OpenAI OAuth adapters so the displayed value always matches an
option sent to the provider.

### Optional research search and fetch

The TUI stays fail-closed by default: no research adapter means neither
`web_search` nor `web_fetch` is model-visible. To use the existing Curiosity
query runtime, set `CURIOSITY_RESEARCH_ADAPTER` to `runtime-local` or
`runtime-searxng`, then provide:

- `CURIOSITY_RUNTIME_STATE_ROOT` as an absolute runtime state path;
- `CURIOSITY_QUERY_CAPABILITY_HEX` as the operator-issued query capability; and
- either an absolute `CURIOSITY_RUNTIME_LIBRARY_PATH` or
  `CURIOSITY_RUNTIME_NATIVE_PROFILE=development|release`.

`runtime-searxng` additionally requires `M5_GATEWAY_TOKEN`. These settings grant
search only to the researcher role. Search results remain untrusted evidence;
the kernel records source custody, rejects uncaptured answer citations, and
shows a research-receipt summary after a completed answer.

Public HTTPS retrieval is a separate least-authority grant. Set
`CURIOSITY_RESEARCH_FETCH_ADAPTER=bounded-http` to expose `web_fetch` to the
researcher role. The adapter accepts HTTPS on port 443 only, rejects URL
credentials and local/special-use destinations, resolves and pins public IPs on
every redirect hop, sends no ambient credentials, requests identity encoding,
and bounds redirects, headers, time, media type, UTF-8 decoding, and response
bytes. Fetch content remains provenance-labelled untrusted evidence. The
runtime search and bounded fetch adapters are combined only when both grants
are explicitly configured.

For the separately authorized isolated benchmark path, set:

```sh
export CURIOSITY_RESEARCH_ADAPTER=benchmark-owned
export CURIOSITY_BENCHMARK_ACQUISITION_ACK=development-benchmark-only
export CURIOSITY_RESEARCH_FETCH_ADAPTER=bounded-http
```

`benchmark-owned` performs bounded discovery only through English Wikipedia's
MediaWiki REST page-search endpoint, writes immutable captures and lexical
snapshot generations inside the fresh research artifact directory, and serves
the active snapshot through Curiosity Retrieval v3. It is not a general crawler
or production corpus. Search output and separately fetched pages remain
untrusted evidence, and benchmark artifacts must not be committed or published.
See [ADR-014](../../docs/architecture/custom-harness/decisions/ADR-014-benchmark-owned-retrieval.md).

`curiosity doctor --json` reports research as `ready`, `unavailable`, or
`error`, including only the adapter receipt, effective capabilities, and a
stable diagnostic—never capability bytes or gateway credentials.

### Reproducible research run

The experimental binary provides a non-interactive, fresh-state research path:

```sh
curiosity research \
  --prompt-file /absolute/path/prompt.txt \
  --output-dir /absolute/path/new-artifact-directory \
  --workspace-root /absolute/path/workspace
```

The prompt must begin with `/research`. The output directory must not already
exist. The command writes the exact prompt, final answer, metrics, canonical
ledger exports, isolated SQLite state, and a SHA-256 evidence manifest. A
terminal `CURIOSITY_NO_GO` is retained as an honest answer but the command exits
unsuccessfully so it cannot be mistaken for completed evidence coverage.

Other local defaults are `local-owner`, a process-local random authentication
secret, `~/.curiosity/events.sqlite`, and the package's built supervisor. Set
`CURIOSITY_ACTOR_ID`, `CURIOSITY_AUTH_SECRET`, `CURIOSITY_DATABASE_PATH`, or
`CURIOSITY_SUPERVISOR_PATH` to override them.

## Minimal use

```ts
import { createCuriosityHarness, signCommand } from "@curiosity/custom-harness";

const harness = createCuriosityHarness({
  actorId: "local-owner",
  authenticationSecret: process.env.CURIOSITY_AUTH_SECRET!,
  databasePath: "/absolute/path/to/curiosity.sqlite",
  supervisorPath: "/absolute/path/to/curiosity-supervisor",
});

const envelope = signCommand(
  {
    schemaVersion: 1,
    actorId: "local-owner",
    issuedAt: new Date().toISOString(),
    nonce: crypto.randomUUID(),
    command: {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      kind: "thread.open",
      payload: { threadId: crypto.randomUUID(), title: "Explore the problem" },
    },
  },
  process.env.CURIOSITY_AUTH_SECRET!,
);

await harness.submit(envelope);
console.log(await harness.projections.threads());
await harness.dispose();
```

The web-safe projection surface is exported separately and contains no command
API:

```ts
import { readThreadProjections } from "@curiosity/custom-harness/thread-projections/node";

const threads = readThreadProjections("/absolute/path/to/curiosity.sqlite");
```
