# Next.js And UI Composition

## Evidence

- Next owns layouts, route hierarchy, metadata, loading/error/not-found
  boundaries, and server data entry:
  [Layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages),
  [Server/client components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
  [Loading](https://nextjs.org/docs/app/api-reference/file-conventions/loading),
  [Error handling](https://nextjs.org/docs/app/getting-started/error-handling).
- Parallel/intercepted routes are appropriate for URL-addressable modal/surface
  state, not every ephemeral chrome toggle:
  [Parallel routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes),
  [Intercepting routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes).
- Multi-zone navigation needs explicit cross-zone handling:
  [Multi-zones](https://nextjs.org/docs/app/guides/multi-zones).
- Radix composition is prop/ref/slot composition rather than hidden container
  ownership:
  [Composition](https://www.radix-ui.com/primitives/docs/guides/composition).

## Crafty implications

The current server layout plus client canvas island is a sound boundary. Keep
high-frequency editor state, WebGPU lifecycle, kernel mutations, and render
ticks out of Next routing.

Keep shell placement in the app layout. Package exports should be leaf
primitives that consume their own state where necessary but do not decide the
parent's grouping, ordering, spacing, or surface arrangement.

Audit cross-zone links: current code still contains `/files` links despite the
current `/editor` route contract. Same-zone `Link` and cross-zone anchors need
to be deliberate.

Add route-level loading/error/not-found boundaries when the editor's failure
and loading behavior is understood; do not add them as framework ceremony.
