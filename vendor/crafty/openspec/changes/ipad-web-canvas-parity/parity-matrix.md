# Mounted web → iPad canvas parity matrix

Status: **Current inventory, 2026-08-29.** This is the acceptance ledger for
behavior reachable from the mounted web file route. It is not an inventory of
every exported panel or kernel foundation.

## Acceptance rule

The `iPad accepted` column is deliberately binary:

- **YES** means the shared canonical behavior and packet path pass their focused
  checks and all applicable physical-iPad interaction, pixel, lifecycle,
  persistence, and accessibility evidence is linked.
- **NO** means at least one applicable check is absent or failed. The final
  column names that exact gap; implemented code or simulator evidence alone does
  not turn a visible device behavior into a pass.

No row uses “partial” as a substitute for evidence. A row may cite working
substrate while remaining **NO**.

## Evidence keys

- **W-LAYOUT** — mounted file shell and controls:
  [`apps/web/editor/src/app/editor/[slug]/layout.tsx`](../../../apps/web/editor/src/app/editor/%5Bslug%5D/layout.tsx)
- **W-PAGE** — mounted stage, context menu, and keyboard layer:
  [`apps/web/editor/src/app/editor/[slug]/page.tsx`](../../../apps/web/editor/src/app/editor/%5Bslug%5D/page.tsx)
- **W-HARNESS** — headless mounted-editor behavior suite:
  [`packages/editor/src/ui/editor/harness.test.ts`](../../../packages/editor/src/ui/editor/harness.test.ts)
- **W-KEYS** — mounted keyboard and command-palette trigger:
  [`packages/editor/src/ui/editor/keyboard-bindings.tsx`](../../../packages/editor/src/ui/editor/keyboard-bindings.tsx)
- **W-MENU** — mounted canvas context actions:
  [`packages/editor/src/ui/editor-primitives/canvas-context-menu.tsx`](../../../packages/editor/src/ui/editor-primitives/canvas-context-menu.tsx)
- **W-PALETTE** — mounted command inventory:
  [`packages/editor/src/ui/editor-primitives/command-palette.tsx`](../../../packages/editor/src/ui/editor-primitives/command-palette.tsx)
- **M-NATIVE** — iPad canonical packet and interaction checks:
  [`apps/mobile/tests/crafty-native-frame.test.mjs`](../../../../../apps/mobile/tests/crafty-native-frame.test.mjs)
- **M-STORE** — portable package/persistence checks:
  [`apps/mobile/tests/crafty-kernel-portability.test.mjs`](../../../../../apps/mobile/tests/crafty-kernel-portability.test.mjs)
- **M-SURFACE** — current native Craft chrome and adapter wiring:
  [`apps/mobile/src/components/craft-surface.tsx`](../../../../../apps/mobile/src/components/craft-surface.tsx)
- **S1** — physical-iPad canonical packet presentation and pixels:
  [`native-ios-renderer-host/evidence/s1-native-presentation-2026-08-29.md`](../native-ios-renderer-host/evidence/s1-native-presentation-2026-08-29.md)

## Matrix

| ID | Mounted web behavior | Web evidence | iPad accepted | iPad evidence or exact remaining gap |
| --- | --- | --- | :---: | --- |
| NAV-01 | List local files and open a file | File browser route; W-LAYOUT “All files” link | **NO** | Native shell opens one bundled/app-private document; no canonical local file collection or file-open flow. |
| NAV-02 | Create a local file | Mounted file browser action | **NO** | No native file creation flow. |
| PAGE-01 | Switch pages | W-LAYOUT page switcher; W-HARNESS page camera/selection tests | **NO** | Current iPad surface displays one active page name but exposes no page switch action. |
| PAGE-02 | Create a page | W-LAYOUT page switcher; W-HARNESS page creation test | **NO** | No native page creation action. |
| PAGE-03 | Rename a page | W-LAYOUT page switcher; W-HARNESS panel-helper test | **NO** | No native page rename action. |
| PAGE-04 | Reorder pages | W-LAYOUT page switcher; W-HARNESS page reorder test | **NO** | No native page reorder action. |
| PAGE-05 | Delete a page while preserving the last page | W-LAYOUT page switcher; W-HARNESS last-page guard test | **NO** | No native page delete action. |
| CAM-01 | Pan with hand, space-drag, middle drag, or trackpad | W-LAYOUT Hand tool; W-KEYS; W-HARNESS pan tests | **NO** | Native two-finger viewport updates exist, but input-family equivalence, settled rest-camera persistence, and physical interaction evidence are absent. |
| CAM-02 | Pinch/wheel zoom without authoring content | W-PAGE; W-HARNESS pinch/wheel cancellation tests | **NO** | Native pinch updates the kernel camera, but physical anchor/cancellation evidence is absent. |
| CAM-03 | Zoom in/out and choose 25/50/100/200% | W-LAYOUT zoom controls | **NO** | iPad shows a zoom value only; controls and preset actions are absent. |
| CAM-04 | Zoom to fit, zoom to selection, and recover off-canvas content | W-KEYS/W-PALETTE; W-HARNESS camera tests | **NO** | No iPad actions or physical evidence. |
| GRID-01 | Render the current page grid | W-HARNESS grid projection tests | **NO** | Native packet composition does not yet carry accepted grid overlay context. |
| GUIDE-01 | Create and move ruler-strip guides | W-HARNESS guide transaction tests | **NO** | No native ruler/guide input or packet overlay. |
| SNAP-01 | Snap creation, move, resize, and Pen input to accepted grid/guide/object/path candidates with matching evidence | W-HARNESS snapping/evidence matrix | **NO** | Native adapters provide no accepted snap context; a reduced native snap implementation is prohibited. |
| SEL-01 | Single-select by canonical hit test; empty click clears | W-HARNESS selection/hit-test tests | **NO** | M-NATIVE proves reducer/kernel selection, but physical touch and semantic per-object accessibility evidence are absent. |
| SEL-02 | Shift-click additive toggle | W-HARNESS additive selection test | **NO** | Native UIKit modifier flags now reach the shared reducer and M-NATIVE proves additive selection/multi-selection chrome; physical hardware-keyboard/touch evidence is absent. |
| SEL-03 | Marquee select and shift-marquee toggle | W-HARNESS marquee tests | **NO** | Native begin/update/commit-marquee effects now use `kernel.marqueeSelect` and M-NATIVE proves canonical-byte preservation; physical interaction/pixel evidence is absent. |
| SEL-04 | Deep-select and enter/exit isolation | W-HARNESS hierarchy/isolation tests | **NO** | Web and native now call shared transform-aware kernel isolation operations and native tap counts are generic input metadata; physical double-tap, nested-container, menu, and Layers evidence is absent. |
| SEL-05 | Select all | W-KEYS/W-PALETTE | **NO** | No native command or menu binding. |
| SEL-06 | Preserve page-local selection across page switches | W-HARNESS page switch test | **NO** | Page switching is not exposed on iPad. |
| XFORM-01 | Move one or multiple root selections as one transaction | W-HARNESS move and multi-move tests | **NO** | M-NATIVE proves one/multi-capable transaction code and exact cancel for the fixture; physical interaction evidence is absent. |
| XFORM-02 | Resize from all eight transformed handles | W-HARNESS handle matrix | **NO** | Shared geometry and M-NATIVE southeast-handle evidence pass; complete handle matrix and physical input/pixels are absent. |
| XFORM-03 | Shift aspect constraint and Alt/from-center resize | W-HARNESS modifier matrix | **NO** | Native pointer bridge supplies no modifier state. |
| XFORM-04 | Rotate from the outer ring with fixed-start previews and 15° constraint | W-HARNESS rotation tests | **NO** | M-NATIVE proves unconstrained fixed-start rotation/undo; native modifier and physical evidence are absent. |
| XFORM-05 | Edit rectangle corner radius from direct handles | W-HARNESS corner-radius tests | **NO** | Native adapter does not consume corner-radius effects. |
| XFORM-06 | Nudge by 1 or 10 world units | W-KEYS; W-HARNESS nudge test | **NO** | Generic accessibility increment/decrement nudges one x-unit, but keyboard 1/10 grammar and physical accessibility evidence are absent. |
| XFORM-07 | Flip horizontally or vertically | W-KEYS; W-HARNESS flip test | **NO** | No native action surface. |
| DUP-01 | Duplicate from selection action/context menu | W-LAYOUT selection actions; W-MENU | **NO** | No native duplicate action. |
| DUP-02 | Alt-drag duplicate and smart repeat-offset duplicate | W-KEYS/W-PALETTE; W-HARNESS duplicate tests | **NO** | Native input has no Alt state or smart-duplicate action. |
| HIER-01 | Enter child, Tab sibling, Escape parent/clear | W-KEYS; W-HARNESS hierarchy traversal test | **NO** | iPad Layers projection is read-only and keyboard grammar is absent. |
| HIER-02 | Bring forward/send backward | W-KEYS/W-MENU/W-PALETTE | **NO** | No native action surface. |
| GROUP-01 | Group and ungroup as atomic hierarchy edits | W-KEYS/W-MENU/W-PALETTE | **NO** | No native action surface; transformed-parent preservation risk remains open. |
| ALIGN-01 | Align left/center/right/top/middle/bottom | W-MENU/W-PALETTE; W-HARNESS alignment test | **NO** | No native action surface. |
| BOOL-01 | Destructive union/subtract/intersect/exclude | W-MENU; W-HARNESS boolean test | **NO** | No native action surface; visual acceptance also depends on complete shared path paint semantics. |
| CREATE-01 | Create a rounded rectangle with preview, style snapshot, cancel, selection, and one undo unit | W-LAYOUT; W-HARNESS creation/style/snap tests | **NO** | Shared `createShape`, native reducer adapter, packet preview, canonical cancel/undo, and physical rectangle renderer substrate pass (M-NATIVE/S1); physical creation/save/relaunch pixels remain absent. |
| CREATE-02 | Create a four-cubic closed-path ellipse | W-LAYOUT; W-HARNESS ellipse test | **NO** | M-NATIVE proves canonical geometry/path packet/undo; physical interaction and pixel evidence are absent. |
| CREATE-03 | Create a two-point open-path line | W-LAYOUT; W-HARNESS line test | **NO** | Canonical authoring and path packet pass M-NATIVE, but shared production stroke realization is incomplete, so visible parity is blocked. |
| CREATE-04 | Create a frame and atomically absorb/rebase contained roots | W-LAYOUT; W-HARNESS frame absorption test | **NO** | M-NATIVE proves canonical absorption/cancel/undo; physical interaction and pixels are absent. |
| PEN-01 | Create open/closed paths and finish/cancel one Pen session | W-LAYOUT; W-HARNESS Pen session tests | **NO** | Native Pen/Pencil adapter is absent; open-path stroke realization is blocked. |
| PEN-02 | Select/move/delete points, drag handles, and cycle point type | W-HARNESS path-edit tests | **NO** | Native point/handle input and overlays are absent. |
| PEN-03 | Join an existing path endpoint | W-HARNESS existing join coverage | **NO** | Shared join currently loses handle intent; canonical repair is required before native work. |
| STYLE-01 | Set selection fill/stroke | W-LAYOUT color controls | **NO** | Native Inspector has read-only geometry only; production packet stroke semantics are incomplete. |
| STYLE-02 | Set creation fill/stroke with gesture-start capture | W-LAYOUT color controls; W-HARNESS style-capture tests | **NO** | Native interaction captures shared creation style, but no native color controls or physical evidence exist. |
| STYLE-03 | Set selection opacity with number keys | W-KEYS; W-HARNESS opacity test | **NO** | No native action or inspector field. |
| CLIP-01 | Copy selection to the internal/OS textual payload | W-KEYS/W-MENU | **NO** | No `UIPasteboard` adapter or declared native type. |
| CLIP-02 | Preview-first paste at pointer | W-KEYS/W-MENU; W-HARNESS paste-preview tests | **NO** | No native clipboard/preview flow. |
| CLIP-03 | Paste in place and preserve/remint canonical references | W-KEYS; W-HARNESS cross-page/paste tests | **NO** | No native clipboard action. |
| EDIT-01 | Delete the current selection atomically | W-LAYOUT/W-KEYS/W-MENU | **NO** | No native delete action. |
| HIST-01 | Undo and redo document edits without moving the live camera | W-LAYOUT/W-KEYS/W-PALETTE; W-HARNESS history tests | **NO** | Native controls and M-NATIVE semantics exist; physical control/camera evidence is absent. |
| DISC-01 | Open the command palette and invoke its tool/canvas/edit/arrange actions | W-KEYS/W-PALETTE | **NO** | No iPad command-palette/system-command projection. |
| MENU-01 | Right-click selection-aware context actions | W-PAGE/W-MENU; W-HARNESS context-hit tests | **NO** | No iPad context-menu adapter. |
| TOOL-01 | Activate Select/Hand/Frame/Rectangle/Ellipse/Line/Pen by toolbar or shortcut | W-LAYOUT/W-KEYS | **NO** | iPad exposes Select/Frame/Rectangle/Ellipse/Line buttons, but Hand/Pen/shortcuts and physical activation evidence are absent. |
| PANEL-01 | Open Layers from the visible toggle | W-LAYOUT | **NO** | The mounted web toggle is defective because no floating panel is composed. iPad must not copy it; the current wide-screen native tree is read-only and nonadaptive. |
| PANEL-02 | Open Inspector from the visible toggle | W-LAYOUT | **NO** | The mounted web toggle is defective because no floating panel is composed. The current wide-screen native readout has no exact editing controls. |
| AX-01 | Operate each semantic object through a nonspatial accessibility route | Web DOM controls plus canonical IDs | **NO** | Native canvas is one generic adjustable element; per-node elements, screen-correct frames/paths, named transform actions, Layers traversal, and physical assistive-technology audits are absent. |
| SAVE-01 | Persist canonical `.ui` revisions and reload them | Web autosave/store path | **NO** | M-STORE and simulator save/relaunch pass app-private manifest-last publication; coordinated `UIDocument`/Files-provider and physical crash/provider evidence are absent. |
| RENDER-01 | Present the active canonical document through the shared whole-frame renderer path | Web packet/Rust path; W-HARNESS packet projections | **YES** | M-NATIVE proves canonical packet projection and S1 records physical-iPad Rust/Vello/wgpu pixels (SHA-256 `7382a3bf4eabb4d5143de9a771a5d5b044942d0873b8196c4635eb975044c5a5`). This does not accept other behavior rows. |
| RENDER-02 | Render selection/preview chrome after authored content | W-HARNESS selection/preview projections | **NO** | M-NATIVE proves packet composition; physical interaction/pixel parity for transformed selection and creation previews is absent. |
| RECOVER-01 | Preserve document and last-valid presentation across renderer/surface failure | Web renderer recovery path | **NO** | Native S3/S4 lifecycle and device-loss evidence remain open; CoreSimulator cannot present Vello because its adapter lacks `INDIRECT_EXECUTION`. |

## Explicit exclusions from this mounted baseline

The exported `LayersPanel`, `InspectorPanel`, snap settings, distribution
commands, measurement utilities, live-compound authoring, auto-layout controls,
manual save/status surfaces, component authoring, image assets, full text editing,
collaboration, presence/comments, agent product UI, and 3D are not reachable
mounted-web behavior. They remain tracked in
[`apps/mobile/design/CRAFT-IPAD-FEATURE-TRANSLATION.md`](../../../../../apps/mobile/design/CRAFT-IPAD-FEATURE-TRANSLATION.md)
and the tasks for this change, but they do not silently inflate this baseline.

## Update rule

When a row changes, update the binary value and replace the stated gap with
links to raw evidence. Do not delete failed or blocked behavior from the matrix;
record a deliberate product exclusion in the OpenSpec change instead.
