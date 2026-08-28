# Artboards and Semantic Surfaces

Status: **Research**, 2026-08-10. This report records product behavior and
architectural lessons; it does not copy implementation code.

## Question

What should an artboard-like container mean in Crafty if the same authored model
must project to web, native, and agent-facing application surfaces?

## Findings

| Product | Container model | Application semantics | Crafty lesson |
|---|---|---|---|
| Figma | Frames are nestable visual/layout containers; pages organize files. | Components, variants, and prototype destinations are separate from frame geometry. | Do not overload the frame node with route or framework meaning. |
| Sketch | Current Frames replace legacy Artboards for interface/layout work; Graphics serve illustration; Stacks and pinning control layout. | Frames can be screens, flows, or reusable containers by usage, but the container remains a visual frame. | “Artboard” is a workflow label, not a sufficient durable ontology. |
| Penpot | Boards are high-level layers, can contain boards, and first-level boards act as screens in View mode. | Prototype flows, starting points, links, and overlays are explicit graph concepts. | Screen/presentation intent belongs in relationships and records, not inferred from top-level placement. |
| Framer | Web pages define the published site; CMS pages are collection-driven; Design Pages are private canvases. | Breakpoints, preview, navigation, and CMS generation are page-aware but distinct. | Separate design workspace, navigable screen, generated content, and runtime behavior. |
| Adobe XD | Artboards are responsive-resize and prototype targets; groups/components can have padding, stacks, constraints, and states. | Component states and interactions are explicit and reusable. | Layout, component, state, and interaction semantics need independently versioned contracts. |
| Next.js App Router | Filesystem route segments project to pages and nested layouts; layouts persist and receive descendant content as `children`. | The filesystem and `layout.tsx` are adapter vocabulary, not product semantics. | Model persistent composition and an outlet; let a target adapter choose its representation. |

## Synthesis

The durable commonality is not “artboard = screen.” It is:

```text
visual container + authored intent + explicit relationships + target binding
```

Crafty therefore keeps `frame` as geometry and hierarchy, and adds a separate
semantic surface registry. Initial roles are `freeform`, `screen`, `layout`,
`component`, and `overlay`. Route intent is target-neutral; a binding can point
at a Next.js file or another target without changing the role.

## Sources

- Sketch: https://www.sketch.com/docs/designing/frames/ and https://www.sketch.com/blog/frames/
- Penpot: https://help.penpot.app/user-guide/designing/layers/ and https://help.penpot.app/user-guide/prototyping-testing/prototyping/
- Framer: https://www.framer.com/help/articles/how-to-use-pages/
- Adobe XD: https://blog.adobe.com/en/publish/2018/09/28/how-to-design-with-responsive-resize-xd
- Next.js: https://nextjs.org/docs/app/building-your-application/routing/layouts-and-pages
