# Handoff compiler

Compile caller-supplied orchestration decisions into a bounded `handoff-contract/v1` proposal. It validates contract consistency and requests blocking information; it does not choose roles, routing, or lifecycle outcomes.

Use with decisions that already identify task class, units, ownership, dependencies, selected context, criteria, limits, and handback needs. Return only applicable fields. Keep repository and user policy as referenced context rather than reproducing policy text.

For schema, diagnostics, examples, boundaries, and the Stage-3 seam, read [documentation.md](documentation.md).
