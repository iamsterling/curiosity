# The React Boundary

Status: **Current.** The kernel is an external store, React is chrome, and the
render loop is independent of React rendering. Ratified by
[ADR 0002](adrs/0002-editor.md) and [ADR 0008](adrs/0008-next-server-runtime.md).

## The shape

```
SERVER (Server Components — no editor knowledge)
  app/layout.tsx                  root document
  app/page.tsx                    file browser; reads @crafty/scene-store directly
  app/editor/[slug]/layout.tsx     THE SHELL: reads the document on the server and
                                  composes the editor primitives (sidebar panels,
                                  canvas slot, toolbar controls, details panel)
  app/editor/[slug]/page.tsx       composes CanvasStage + KeyboardBindings
  app/api/files/[slug]/…/route.ts route handlers over the same store
        │
        │  serializable props: { slug, initialDocument, initialRevision }
        ▼
CLIENT (degraded only where state demands it)
  src/editor/editor-context.tsx   CanvasEditor in context (a stable handle)
  src/editor/editor-chrome.tsx    save status, preferences, refs (context)
  src/components/editor/          chrome primitives — forwardRef families, one
                                  concept per file: editor-panels.tsx (sidebar
                                  content + status bar), editor-toolbar.tsx
                                  (tool/action/zoom controls), details-panel.tsx
                                  (the DetailsPanel family + selection content)
  src/editor/canvas-stage.tsx     canvas, listeners, WebGPU, rAF RENDER LOOP
  src/editor/keyboard-bindings    key map, renders nothing
```

The shell is defined in the layout — a Server Component that composes the
primitives. **`EditorProvider`, `EditorChromeProvider`, the primitives and the
leaf panels are client; the shell structure is server.** The page composes its
content directly from leaves (`CanvasStage` + `KeyboardBindings`), each of which
wires itself from the chrome context — no wrapper component exists to hand
refs through.

The current top chrome is likewise layout-owned: history and panel toggles are
separate centered pills. Creation-style controls remain beside the bottom tool
controls, while selection actions remain one stage-relative leaf that portals
after mount; visual grouping does not reclaim either behavior into fixed chrome.

### Chrome glass

The editor chrome remains DOM content and interaction, not authored document
state. Floating shell surfaces are marked declaratively with
`data-chrome-glass`; the canvas host may project their measured geometry into
the renderer, while the DOM remains the no-WebGPU fallback. This keeps the
React boundary intact: chrome glass does not move product semantics or GPU
ownership into React, and authored glass remains a separate document/renderer
feature.

## Why the editor is a client island

Nothing below the client editor tree can be server-rendered in any meaningful
sense: a WebGPU device, pointer capture, a 60 fps loop, and an in-memory kernel
holding the canonical document. Server Components help with everything *around*
the editor — browsing, cataloguing, history — and that is exactly what they are
used for here.

Server Components must never become a route for putting document state on the
server. The server reads a scene from disk and hands it over; the kernel owns it
from that moment.

## The render loop

`canvas-stage.tsx` owns a `requestAnimationFrame` loop that reads
`editor.getSnapshot()` **directly**:

```
pointer move → kernel mutation → emit() bumps renderRevision
                                          │
                    (no React render on this path)
                                          ▼
             next animation frame: renderRevision changed? → draw
```

`EditorProjection.renderRevision` (`harness.ts`) is a monotonic counter bumped on
every emit — document, viewport, selection, draft geometry, anything the canvas
draws. The loop compares it against the last drawn value and skips the frame
otherwise. A `resizeDirty` flag from a `ResizeObserver` forces a redraw when only
the canvas size changed.

The stage also owns one narrow DOM positioning host for selection actions. Its
rAF reads the same direct projection, projects the authoritative `selectionBox`
through the kernel coordinate helper, measures the registered toolbar, and
writes visibility/transform imperatively. The toolbar portals only after mount;
no pointer-move placement enters React state or reads browser globals during
server render.

**A drag renders zero React components.** The only React state in the stage is
renderer status, and `publishStatus` writes it solely when the message, backend,
proof or evidence actually changes — so a normal frame calls no setter.

This replaced a `useLayoutEffect` keyed on the projection, which re-rendered the
entire editor tree before every frame.

## Sliced subscriptions

`useEditorSelector(select, isEqual?)` in `editor-context.tsx` subscribes to one
slice of the projection:

- The selected value is cached against projection identity, so an unchanged
  projection costs nothing.
- `isEqual` (default `Object.is`, with `shallowArrayEqual` provided) suppresses
  the re-render when a slice is structurally unchanged.
- Selectors must be referentially stable — module scope or `useCallback`.

Zooming re-renders the zoom readout, not the layers tree. Selecting re-renders
the inspector and the layers rows, not the toolbar's undo buttons.

## Rules

- **The kernel is never in React state.** Context carries the `CanvasEditor`
  instance — a stable handle — never a state object. A context carrying state
  re-renders every consumer on every change.
- **`getSnapshot` must be referentially stable between changes.** Returning a
  fresh object each call breaks `useSyncExternalStore`. Both `CanvasEditor` and
  `EditorKernel` memoise their projections; do not remove that.
- **The canvas does not re-render from React.** A pointer move must not render a
  panel. If you find yourself putting canvas data in `useState`, stop.
- **Panels subscribe to slices.** A panel reading the whole projection is
  re-rendered by every unrelated change.
- **Server Components are the default, and now mean something.** `"use client"`
  is opt-in for hooks, event handlers or browser APIs — never on a page or
  layout. New non-canvas surfaces (libraries, history, assets) should be Server
  Components reading the store directly.
- **Keep the client tree SSR-safe.** The island is server-rendered, so `window`,
  `document`, `matchMedia`, `localStorage` and `devicePixelRatio` are read inside
  effects, not during render. `EditorChromeProvider` reads preferences and the
  editor primitives read the mobile breakpoint in mount effects for exactly
  this reason.
- **Cross-boundary props are serializable.** `initialScene` is plain JSON. Never
  pass a kernel, a class instance or a function across the boundary.
- **Data is fetched where it is used.** Server Components read
  `@crafty/scene-store` directly rather than fetching their own API.
- **Mutations go through the kernel, not the server.** The client owns batching,
  undo and validation; the API is a save boundary. This is why route handlers
  are used rather than Server Actions — see
  [ADR 0008](adrs/0008-next-server-runtime.md).
- **Generic UI primitives follow the shadcn/ui composition model** — one
  primitive per file under `src/components/ui/`, `data-slot` attributes, `cva`
  variants, `Slot`/`asChild` composition. **Editor chrome primitives live in
  `src/components/editor/` as forwardRef families**: one file per concept
  (panels, toolbar, details panel), each file holding the component and its
  related primitives (`DetailsPanel` + `DetailsPanelHeader` + `DetailsPanelContent`
  + ...), every one a `forwardRef` with a `displayName`, exported in a block at
  the file end. The layout composes the families; the families never wrap each
  other in container components.

## Testing across the boundary

`packages/editor/src/ui/editor/harness.test.ts` drives `CanvasEditor`
directly — pointer sequences, tool switching, transactions, clipboard, pages —
with **no React and no DOM**. `packages/scene-store` (17 tests) covers the
server side with no HTTP.

If a behaviour needs a mounted component to test, it is in the wrong place.

## Remaining work

- The panels are sliced subscribers, but `LayersPanel` re-renders on any layer
  change because its slice is the whole layer tree. Row-level subscription is the
  next refinement if it shows up in a measurement.
- Input latency is still unmeasured — see [`performance.md`](performance.md).
  The structural blocker is gone; the number is not yet known.
