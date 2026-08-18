# ADR 0018: plugin-owned agent catalog and default

**Accepted, 2026-08-14.** Loading `iamsterling.opencode2-config` must be the only
OpenCode configuration step required to activate the product's agent routing.
Users must not also duplicate bundled agent definitions or set
`default_agent` in their OpenCode configuration.

The Promise plugin registers `orchestrator` as a primary agent, registers the
bundled analyst, generalist, implementer, researcher, reviewer, strategist, and
worker roles as subagents, and selects `orchestrator` through
`ctx.agent.transform`. Agent models remain unset so they inherit the active
session model. OpenCode's built-in `build` and `plan` agents remain available as
fallbacks and are not removed by the plugin.

The compiled definitions must match the reviewed assets under
`assets/config/agents/`. A focused drift test enforces that relationship. The
exact-host probe allows bounded agent-catalog teardown time and still requires
clean plugin setup, cleanup, process termination, and retained-secret checks.

This decision does not authorize publication, installation cutover, model
selection, or changes to unrelated user configuration.
