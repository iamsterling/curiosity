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
- a mandatory nonce-bound Rust supervisor handshake with filesystem mutation,
  Git, process, and sandbox capabilities disabled.

Live provider behavior is not yet qualified. External tools, Git mutation,
sandbox claims, remote access, multi-user operation, and production readiness
remain unavailable.

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
a newline, `/new` for another conversation, and `/quit` to exit; use the up/down
arrows to move through a long transcript. The
full-screen, differentially rendered terminal client reproduces OpenCode's
splash, composer, fixed footer, user panels, unboxed assistant hierarchy, and
responsive compact mode without depending on OpenTUI. Provider deltas update
width-aware Markdown in place, while completion metadata remains subordinate.
Provider work uses one restrained, single-cell braille orbit; set
`CURIOSITY_MOTION=reduce` for a static `⠿` indicator.
Untrusted projected and streamed text is control-character sanitized before
rendering. The default is `openai-oauth:gpt-5.4-mini` at `medium` effort, using
the community OpenAI OAuth adapter and local Codex credentials. If needed, run
`npx openai-oauth login` once. Set `NO_COLOR=1` for plain terminal output.

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
