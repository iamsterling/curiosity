## 1. Parity inventory and basic creation

- [x] 1.1 Generate and maintain the mounted-web behavior matrix with one binary iPad acceptance row and linked evidence per behavior (`parity-matrix.md`)
- [x] 1.2 Move rectangle/ellipse/line/frame node construction, unique path identities, frame absorption/rebasing, selection, and one-entry history into `EditorKernel.createShape`
- [x] 1.3 Refactor the web harness to consume the shared shape operation without changing its creation behavior suite
- [x] 1.4 Extract resolved path/text/compound/glass packet projection into framework-free `@crafty/editor/rendering` and consume it from web and iPad
- [x] 1.5 Wire iPad rectangle/ellipse/line/frame gestures through `transitionInteraction`, including preview, gesture-start style capture, cancellation, undo, canonical hierarchy, and generic Layers/Inspector projection
- [ ] 1.6 Capture physical-iPad creation, cancellation, undo, save/relaunch, and rect/ellipse/frame pixels; Line remains visually blocked by task 6.1

## 2. Selection and transform grammar

- [x] 2.1 Port additive/marquee/deep selection and isolation with shared hit testing
- [ ] 2.2 Port multi-selection move, all modifiers, duplicate drag, corner-radius handles, and keyboard commands
- [ ] 2.3 Wire shared grid/guide/object/rhythm/path snapping and accepted snap evidence; add no native-only snap implementation
- [ ] 2.4 Add complete named accessibility alternatives and transformed object frames/paths

## 3. Pages, camera, guides, and hierarchy

- [ ] 3.1 Port page create/switch/rename/reorder/delete and page-local camera/selection memory
- [ ] 3.2 Port pan/zoom presets, back-to-content, grid, guide create/move/delete, and snap settings
- [ ] 3.3 Rebuild reachable Layers/Inspector surfaces for reorder/reparent, visibility, lock, groups, and exact properties
- [ ] 3.4 Port alignment/distribution, stacking, clipboard, duplicate, command palette, menus, and external drag/drop adapters

## 4. Vector editing

- [ ] 4.1 Repair the shared pen join handle-preservation defect
- [ ] 4.2 Port Pen/Pencil anchor, handle, point type, close/join/delete/move, hover, predicted-sample, and cancellation behavior
- [ ] 4.3 Port destructive booleans and repair/expose live compound authoring

## 5. Layout, reusable content, and rich content

- [ ] 5.1 Port frame/layout authoring after transformed hierarchy evidence passes
- [ ] 5.2 Complete text shaping schema/resolver parity, then add TextKit editing/IME/Scribble adapters
- [ ] 5.3 Add package assets/images and pressure/corruption evidence
- [ ] 5.4 Port local component/override authoring; gate tokens/variants/libraries on their resolvers

## 6. Shared blockers and completion evidence

- [ ] 6.1 Ratify and implement fill/stroke packet semantics for rects, closed paths, and open paths before claiming Line/Pen visual parity
- [ ] 6.2 Complete coordinated `UIDocument`/Files-provider persistence, autosave/conflicts, and crash/torn-write evidence
- [ ] 6.3 Complete native renderer S2–S6 lifecycle, recovery, pixel, latency, and memory evidence
- [ ] 6.4 Run physical assistive-technology and 10k-node accessibility/performance audits
- [ ] 6.5 Mark parity complete only when every mounted-web matrix row has linked raw evidence or an explicitly approved exclusion
