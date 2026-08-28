# `@crafty/scene-api`

Framework-neutral, disposable visual scene descriptions resolved into Crafty's
`RenderFrame` packet. This package is not an editor document and contains no
component, token, variant, history, or editing semantics.

Use `resolveScene(description, viewport)` for headless and agent surfaces. The
optional `@crafty/scene-api/react` entry point provides small React host
elements; it submits packets through a caller-provided `submit` function.
