# iPadOS workstation command architecture

**Decision date:** 2026-08-28
**Scope:** Curiosity iOS/iPadOS client, native main menu, keyboard commands, and
shared command palette

## Decision

Curiosity will treat commands as a stable product contract rather than define
separate action lists for the menu bar, keyboard shortcuts, toolbar, and command
palette. One TypeScript registry owns command identity, title, symbol, shortcut,
enablement, selected state, description, and React handler. A local Expo module
renders that state into UIKit and returns only stable command IDs to React.

The first command set is intentionally small:

| Menu | Command | Shortcut | State owner | Why now |
| --- | --- | --- | --- | --- |
| File | New Chat | Command-N | workspace busy state | Starts the primary durable object |
| Edit | System text commands | System | focused UIKit control | Preserves Undo/Cut/Copy/Paste semantics |
| View | Chat | Command-1 | active workspace view | Primary destination |
| View | Craft | Command-2 | active workspace view | Primary visual destination |
| View | Toggle Sidebar | Command-B | responsive layout | Recovers working space without losing navigation |
| Work | Command Palette | Shift-Command-P | app | Makes the complete command set searchable |
| Work | Start Research in Chat | — | workspace busy state | Opens the governed research loop without a separate mode silo |
| Work | Start Build in Chat | — | workspace busy state | Opens the bounded execution loop without a separate mode silo |
| Work | Refresh Session | — | workspace busy state | Recovers stale server projections |
| Window | System window commands | System | UIKit | Avoids claiming multi-window support early |
| Help | System commands only | System | UIKit | Custom help does not exist yet |

Unavailable implemented commands remain visible but disabled. Unimplemented
ideas do not appear as inert menu clutter.

## Evidence

- **Documented — Apple:** iPadOS 26 brings the macOS-style menu bar to iPad.
  Apple says it should expose the app's commands, including commands without
  shortcuts; unavailable commands stay visible but disabled. UIKit continues to
  use `UIMenuBuilder`, and `UIMainMenuSystem.Configuration` can be installed
  early at launch. This supports a stable, discoverable command layer rather
  than toolbar-only actions.
- **Documented — Apple:** standard editing actions should use familiar system
  interactions and focused-content semantics. This is why Curiosity does not
  duplicate Undo/Cut/Copy/Paste in JavaScript.
- **Documented — Expo:** a local Expo module is the supported way to add native
  Swift alongside an app, while AppDelegate subscribers receive launch
  lifecycle callbacks without hand-editing generated `ios/` files.
- **Documented — local source:** Curiosity already has durable chat threads,
  governed research, lifecycle questions and gates, bounded child work, and
  confined filesystem/Git/worktree capabilities. The mobile client currently
  exposes only chat navigation and a Craft placeholder.
- **Inference:** the largest product gap is not another chat mode. It is a
  coherent workstation control plane over capabilities Curiosity already owns.

## Expansion priorities

### P1 — complete the daily control loop

1. **Quick Open and global search**
   - Search commands, chats, projects, Craft documents, and source receipts from
     one ranked surface.
   - Add File > Open Recent and Work > Search Workspace only after those indexes
     have real backing data.
   - Acceptance: every result opens a durable identity and supports keyboard-only
     selection.

2. **Activity center and inspector**
   - Show running work, tool calls, pending questions, approvals, failures,
     citations, diffs, and verification evidence.
   - Add View > Toggle Inspector using the system inspector command on iPadOS 26.
   - Acceptance: current work can be understood and acted on without reading raw
     chat output.

3. **First-class projects and workspaces**
   - Replace the decorative single project with server-owned project identities,
     recent work, capabilities, branch/worktree context, and endpoint health.
   - Acceptance: commands always target an explicit active workspace and expose
     that target before consequential work.

4. **Research workspace**
   - Promote source custody, citations, research receipts, depth budget, and stop
     rationale into structured UI beside the conversation.
   - Acceptance: a user can inspect the evidence behind a conclusion and reopen
     the durable receipt.

5. **Build workspace**
   - Present the goal contract, plan, changed files, diff, checks, approvals, and
     child work as structured state.
   - Acceptance: no consequential action is hidden in prose; pending gates are
     visible and explicit.

6. **Real Craft document integration**
   - Connect the existing web editor's file/page model to mobile instead of
     extending the placeholder.
   - Add New Craft, Open, Rename, Duplicate, Move, Export, and page-navigation
     commands only as each operation gains durable API support.
   - Acceptance: documents round-trip without losing page or canvas state.

### P2 — make it an iPad-native workstation

- Multi-window scenes for independent chats, Craft documents, research receipts,
  and activity views.
- Drag and drop between Files, chat attachments, citations, and Craft.
- Document picker/share sheet integration, Spotlight indexing, App Intents, and
  Shortcuts actions.
- User-editable keyboard shortcuts and command aliases, validated for conflicts.
- Offline read cache and queued drafts with explicit synchronization state.
- External display layouts and independent inspector placement.
- Pointer context menus and Pencil/Scribble affordances where they operate on
  real selectable content.

### P3 — only after P1/P2 foundations

- Automation recipes and reusable workflows.
- Team collaboration, handoff, comments, and notifications.
- Embedded terminal surfaces. Curiosity's authority boundary currently permits
  only bounded process and Git operations; a generic shell would violate that
  model unless separately designed and authorized.

## Engineering rules

1. Stable command IDs are API. Renaming visible labels must not change IDs.
2. A command has one handler and one state derivation, regardless of surface.
3. Native code renders command state; it does not own business state.
4. React ignores unknown or disabled command IDs.
5. System-owned Edit and Window behavior stays in UIKit.
6. Commands that can mutate durable state must name their target and expose any
   applicable approval gate.
7. The generated `ios/` tree stays ephemeral. Native behavior lives in the local
   Expo module or an idempotent config plugin.
8. Every shipped shortcut has a frequency rationale and must be tested on an
   attached hardware keyboard.

## Implemented slice

- `src/commands/workstation-commands.ts` — shared registry and state resolution.
- `src/commands/use-workstation-commands.ts` — native event bridge and handlers.
- `src/components/command-palette.tsx` — searchable in-app command surface.
- `modules/curiosity-commands/` — Swift/UIKit menu renderer and Expo bridge.
- `tests/workstation-commands.test.mjs` — identity, shortcut, and state contracts.

## Curiosity pass and stop decision

The highest-value unresolved thread was whether Expo could install an early
UIKit menu configuration without editing generated native files. Expo local
modules plus AppDelegate subscribers resolved it and the Release simulator build
proved the integration.

`CURIOSITY_NO_GO` for this slice:

- **Multi-window:** high product value, but it changes document/session ownership
  and does not change the command-layer decision.
- **Files/document provider:** valuable after Craft has durable mobile APIs.
- **Embedded terminal:** conflicts with the current bounded authority model.
- **Automation:** depends on explicit task, approval, and result projections.
- **Collaboration:** depends on identity, synchronization, and conflict semantics
  that are not present in the mobile API.

Coverage is sufficient for the first slice: each shipped command maps to a real
handler, has explicit state and shortcut ownership, survives clean Expo prebuild,
and compiles and launches through the iPad simulator. Further broad discovery is
unlikely to change this foundation, so research stops here.

## Bibliography

1. [Apple, “What’s new in UIKit,” WWDC25](https://developer.apple.com/videos/play/wwdc2025/243/)
   — primary source for the iPadOS menu bar, discoverability, disabled command
   behavior, and `UIMainMenuSystem.Configuration`.
2. [Apple Human Interface Guidelines, “Edit menus”](https://developer.apple.com/design/human-interface-guidelines/edit-menus/)
   — primary source for system-standard editing interactions and avoiding
   redundant custom controls.
3. [Expo Modules API: Get started](https://docs.expo.dev/modules/get-started/)
   — primary source for local native modules in an Expo application.
4. [Expo, “iOS AppDelegate subscribers”](https://docs.expo.dev/modules/appdelegate-subscribers/)
   — primary source for lifecycle integration without generated AppDelegate
   edits.
5. Local source: `apps/custom-harness/README.md`,
   `apps/custom-harness/STATUS.md`, and `apps/web/app/dashboard-client.tsx`
   — preferable to product inference for Curiosity's currently implemented and
   bounded capability set.
