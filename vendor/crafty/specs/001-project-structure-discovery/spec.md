# Feature Specification: Project Structure Discovery

## User Story

As a NewPencil operator, I need the workspace tooling to understand source project structure beyond portable block manifests so I can see reusable UI components, distinguish leaf primitives from composed components, and inspect page directory topology before generating or previewing assets.

## Functional Requirements

- Discover component source files from every `components` directory under a workspace root.
- Classify each discovered component source file as:
  - `primitive` when it does not import another discovered component source file.
  - `component` when it imports another discovered component source file.
  - `shared` when it lives in a shared/common component path or is reused by multiple discovered components.
- Discover Next-style app-router page roots from `src/app` and `app`, including nested workspace package roots such as `apps/web/src/app`.
- Discover pages-router page roots from `pages` and `src/pages`, including nested workspace package roots.
- Identify app-router screen entries from `page` convention files with TypeScript/JavaScript extensions; do not classify `route` API endpoints as screens.
- Identify pages-router screen entries from route files while excluding `api` routes and private `_` files.
- Identify generic React screen entries from `screens`/`views` directories and `src/App` entrypoints when framework-specific routing is not present.
- Return directory-only trees for components and page roots with per-directory target source file counts.
- Expose the same discovery payload through app services, CLI, MCP, and Studio workspace load flows.
- Keep block validation, inspection, compile, and preview behavior backward compatible.

## Acceptance Criteria

- Given a workspace with `components/ui/button.tsx` that imports no discovered components, discovery returns it with classification `primitive`.
- Given a workspace with `components/marketing/hero.tsx` that imports `components/ui/button.tsx`, discovery returns it with classification `component`.
- Given a workspace with `components/shared/page-shell.tsx`, discovery returns it with classification `shared`.
- Given `src/app/(marketing)/pricing/page.tsx`, discovery returns a page entry with route `/pricing`.
- Given `src/app/api/health/route.ts`, discovery does not return a screen entry for `/api/health`.
- Given `pages/about/index.tsx` and `src/pages/dashboard/settings/index.tsx`, discovery returns page entries with routes `/about` and `/dashboard/settings`.
- Given `src/screens/HomeScreen.tsx` and `src/App.tsx`, discovery returns React screen entries instead of leaving the screens section empty.
- CLI command `discover <workspace-root>` prints the discovery payload as JSON.
- MCP tool `discover_project` returns structured discovery content.
- Studio workspace load payload includes `projectDiscovery`, and the Studio shell renders a Project structure rail section.

## Non-Goals

- Full router-config parsing outside common file/folder conventions.
- Semantic TypeScript compilation for source classification.
- File-level visual rendering in directory trees; trees are directory-only by design.
