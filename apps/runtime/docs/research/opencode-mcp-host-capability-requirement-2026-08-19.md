# OpenCode MCP call-scoped host-capability requirement

**Scope:** primary-source requirement and inspected-host gap; no MCP execution.

## Facts

- MCP tools are model-controlled protocol capabilities; tool results can contain
  content and structured content, and clients should validate results
  ([MCP Tools, 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)).
- MCP authorization does not replace application authorization
  ([MCP Authorization, 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)).
- OpenCode documents plugin `tool.execute.before` and `tool.execute.after` hooks,
  but its public plugin documentation does not specify a call-scoped API by which
  one plugin tool can invoke an authorized child MCP tool and receive a bounded,
  authenticated receipt
  ([OpenCode Plugins](https://opencode.ai/docs/plugins/)).
- The pinned repository hooks capture call/session/message/agent envelope fields
  but intentionally retain `arguments: "not-retained"` and
  `result: "not-retained"` (`apps/plugin/opencode2/src/features/hooks/open-code-hooks.ts:81-111`).

## Inference and host requirement

Current hooks are sufficient to observe lineage but not to prove safe bounded
result handoff without scraping unrestricted result/configuration/token material.
Upstream OpenCode should expose one call-scoped child-tool API that:

1. accepts a host-authorized exact tool capability and canonical bounded input;
2. binds parent call, session, agent, message, and input digest;
3. returns a host-authenticated size-bounded receipt and validated result subset;
4. never exposes connector credentials to the plugin;
5. supports cancellation, expiry, single settlement, and collision diagnostics;
6. prevents arbitrary/recursive invocation and cannot confer action authority.

Until that exists and is qualified, v3 has only a feature-flagged pure
model-mediated compatibility receipt state machine. No hook wiring or execution is
claimed; missing safe capability is `UNSUPPORTED`.

The hardened fixture boundary exposes an opaque single-use consumer capability,
not receipt construction. Its full-strength receipt identity binds canonical
intent, host context, nonce, input digest, capture time, mode, and bounded result
settlement. This demonstrates the required host semantics but remains no evidence
that current OpenCode hooks provide them.
