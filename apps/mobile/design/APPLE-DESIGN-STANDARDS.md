# Curiosity Apple Design Standards

Research date: 2026-08-28
Target: iPadOS 27, with graceful compatibility for iPadOS 26 and resizable iPad windows.

## Decision

Curiosity should use Apple-native structure and semantics wherever possible. Liquid Glass is the functional layer for adaptive navigation and important controls; project artifacts remain in a separate content layer built from standard system backgrounds and materials.

This document is normative for the `.pen` source. A visual effect in the static design file represents a native material contract, not a custom blur recipe.

Craft implementation is additionally governed by
[`CRAFT-IPAD-FEATURE-TRANSLATION.md`](./CRAFT-IPAD-FEATURE-TRANSLATION.md).
That matrix is the architecture gate for every Craft feature: the existing
Crafty `EditorDocument` and validated command kernel remain canonical, while
UIKit, SwiftUI, React Native, Metal, and any future RealityKit integration are
adapters, chrome, or renderer backends.

## Documented Apple guidance

1. **Reserve Liquid Glass for the functional layer.** Navigation and important controls float above content. Don’t use Liquid Glass for content cards, tables, canvases, graph nodes, or nested glass-on-glass surfaces. Use standard materials in the content layer. [1][2]
2. **Use Regular glass by default.** Clear glass is only appropriate above media-rich content when a dimming layer is acceptable and foreground content is bold and bright. Don’t mix Regular and Clear variants. Curiosity’s dense project UI uses Regular only. [1][2]
3. **Group related glass controls.** Nearby toolbar actions share a glass container/sampling region. Separate unrelated action groups. Tint only the primary action or a state with distinct functional meaning. [2]
4. **Use scroll-edge effects.** Content can extend beneath floating navigation, but the automatic edge effect must preserve control legibility. iOS/iPadOS 27 changes the automatic treatment, so don’t encode a custom soft-edge appearance as the standard. [2][7]
5. **Use content-first progressive navigation.** Curiosity adopts a Notes-like hierarchy rather than top-level peer tabs: the selected artifact fills the window by default; its leading control reveals the artifact list; a control in that list reveals the parent source/collection sidebar. Wide windows may pin either column, while constrained windows progressively present the same hierarchy without compressing the artifact. This is a Curiosity product decision informed by system split-view patterns, not a claim that Apple mandates this exact structure. [3][7][8]
6. **Design for available size, not orientation or device idiom.** iPad windows are freely resizable. Use size classes and available view geometry; provide continuous adaptations rather than landscape/portrait-only branches. [3][7]
7. **Use system controls and minimum targets.** Interactive hit regions are at least 44×44 pt. Prefer symbols in square icon buttons and preserve system feedback, disabled, focus, hover, pressed, and busy states. [4]
8. **Use system typography and symbols.** Specify SF Pro through Dynamic Type text styles and SF Symbols by semantic name. Symbol weight should match adjacent text; toolbar symbols generally use outline variants and selected navigation can use fill variants. [5]
9. **Honor accessibility adaptations.** Native glass responds to Reduce Transparency, Increase Contrast, and Reduce Motion. Designs must show equivalent fallback specimens and must not rely on transparency, color, or motion alone to communicate state. [2]

## Curiosity navigation model

- There is no top-level surface tab bar. Issues, conversations, Craft documents, and Audio sessions are artifact collections inside a project, not separate apps inside the app.
- The selected artifact is full-screen by default.
- The first leading reveal opens the current artifact list: issues, conversations, Craft documents, or Audio sessions.
- A control in the artifact-list header reveals its parent source/collection sidebar: Quick Capture, Recent, Calls/Recordings, Shared, Projects, Folders, and other ratified smart collections.
- Memory is ambient project intelligence, not a navigation mode. Explicit access lives in a contextual inspector and in smart knowledge collections such as evidence, decisions, sources, and people.
- Global artifact navigation and editor-local structure are separate. Craft Layers/pages and Audio tracks remain artifact-local tools and never masquerade as the project/source sidebar.
- Selection details belong in a trailing inspector. As width narrows, the inspector collapses to a sheet, pushed detail, or inline summary before the primary content is compressed.
- On wide windows, users may pin the source and/or artifact-list columns. In constrained windows they overlay, push, or replace progressively while preserving the same source → collection → artifact hierarchy.
- The selected project, collection, artifact, and artifact-local editing context persist independently of navigation-column visibility.
- The default launch restores the last selected artifact when possible; first-run and unavailable-item fallback behavior requires a separate product decision.

## Bench promise

Curiosity is a creative project bench. Issues, conversations, Craft documents, Audio sessions, calls, and shared work are artifact collections inside one project. Research and evidence are ambient project intelligence available alongside those artifacts.

- **Curiosity drives every canvas.** Every artifact starts from the same project identity and durable context.
- **Humans collaborate across everything.** Presence, shared cursors, comments, and activity follow the project and artifact — not a top-level mode.

## Collaboration model

- Sharing happens at project level, not collection level. A project invite opens the whole project context and its permitted artifacts.
- Live presence (avatars), shared cursor/selection, and comment threads are content-adjacent and never navigation.
- Presence never blocks editing and never changes another participant's selected collection or artifact.
- The Share control lives in the functional bar next to the primary actions and uses the system share sheet. In compact layouts it moves into the overflow menu.
- Every shared control keeps its accessibility label; announcements are local to the change made.
- Undo, clipboard, and drafts stay local until the system reconciles them; conflicts surface as a clear choice, never silent loss.
- **Documented:** every control needs an explicit label so assistive technologies and Voice Control can reach shared UI. [12][13]
- **Inference:** the presence/shared-cursor placement above follows Apple's own collaborative surfaces (Freeform, Notes, Keynote). Apple publishes no HIG page that specifies this exact layout, so this rule is our contract, not a documented requirement.

## Super accessibility contract

Normative for every artifact type and navigation level. Static specimens define the contract; the native implementation owns the behavior.

1. **VoiceOver.** Reading order equals visual order. With all columns visible: source sidebar → artifact list → artifact toolbar → artifact content → contextual inspector. In content-only mode, hidden navigation is not traversed and the leading reveal control comes first. Rows are combined elements with one label; state announces as "Selected/Button"; live changes announce without interrupting. [12][13]
2. **Dynamic Type.** All text uses system text styles and scales to the system maximum (AX5, ≈310%); rows grow instead of truncating; critical metadata wraps to its own line; controls reflow to preserve 44×44 pt targets. [5][12]
3. **Full Keyboard Access.** Tab moves through focus groups, arrows move within; the focus ring is always visible; every artifact and primary action has a keyboard equivalent; commands expose source-sidebar, artifact-list, and inspector visibility. No shortcut treats Memory or an artifact collection as a top-level peer tab. [12][14]
4. **Switch Control and Voice Control.** Scanning order follows reading order; all targets are ≥44×44 pt; every control is reachable by its spoken label, never by position alone. [12]
5. **Assistive Access.** A simplified mode offers one primary action per artifact type, larger type, fewer rows, and explicit labels; the same content stays reachable in standard mode. Implemented with the system Assistive Access layout on device. [12]
6. **Reduce Transparency.** Glass controls fall back to standard materials; no state depends on translucency or content sampling. [2][12]
7. **Increase Contrast, Bold Text, Button Shapes.** Text contrast ≥4.5:1; large text and UI ≥3:1; fields keep borders; button shapes stay visible; Bold Text never clips a label. [12][15]
8. **Reduce Motion.** No automatic morphing, parallax, or continuous animation; transitions are direct fades; no affordance depends on motion alone. [2][12]
9. **Differentiate Without Color.** State always pairs shape + text + icon with any color. [15]
10. **Charts and graphs.** The Memory graph and audio visualizations carry labels and a high-level summary, not per-element geometry alone. [16]
11. **Generative AI disclosure.** Curiosity is AI-driven; disclosures explain what the model does with stored content and memory, concisely and before it matters. [17]
12. **Audit.** Accessibility Inspector on device for every artifact type and navigation level; the accessibility nutrition label reflects verified support, not intent. [12]

## Semantic material tokens

| Token | Native intent | Use |
| --- | --- | --- |
| `material.glass.regular` | Native Regular Liquid Glass | Adaptive navigation columns, toolbar groups, floating primary controls |
| `material.glass.prominent` | Tinted native glass | One primary action at a time |
| `material.standard.regular` | Standard system material | Inspector and content-layer differentiation |
| `background.primary` | `systemBackground` | Main artifact plane |
| `background.secondary` | `secondarySystemBackground` | Secondary content regions |
| `label.primary` | `label` | Primary text |
| `label.secondary` | `secondaryLabel` | Supporting text |
| `label.tertiary` | `tertiaryLabel` | Metadata |
| `separator` | `separator` | Hairline structure; never decorative glass borders |
| `tint` | App/system tint | Selection and primary action only |

Do not encode a fixed glass opacity, blur radius, refraction, shadow, or light/dark foreground as a production token. The system owns those adaptive properties.

## Primitive contract

- **System text styles:** Large Title, Title 1–3, Headline, Body, Callout, Subheadline, Footnote, Caption 1–2. Every specimen includes default and accessibility-size behavior.
- **SF Symbol:** semantic symbol name, point size, weight, scale, rendering mode, and selected variant.
- **Icon button:** 44×44 pt minimum hit region; square/circular or concentric system shape; default, hover/pointer, focused, pressed, disabled, and busy states.
- **Text button:** system plain, glass, and glass-prominent roles; labels use sentence-style capitalization.
- **Field/search:** system field geometry, clear affordance, focus ring, keyboard behavior, and Dynamic Type growth.
- **Selection/state:** system tint plus shape/symbol/text; never color alone.
- **Divider:** semantic separator color at device-pixel hairline.
- **Keyboard shortcut:** native menu/key-equivalent notation; visible only where context requires it.

## Reusable component mapping

| Curiosity component | Apple component/pattern to mirror | Material |
| --- | --- | --- |
| Source/Collection Sidebar | Outermost split-view navigation column | Regular glass pane; hidden by default, pinnable when width permits |
| Artifact List | Middle split-view content list | Standard list/vibrancy; hidden by default, pinnable when width permits |
| Leading Navigation Reveal | Split-view sidebar/list toggle in the current header | Regular glass control |
| Project/Artifact Title | Toolbar title menu and anchored presentation | Regular glass control |
| Artifact-local Navigator | Optional structure column such as Craft Layers or Audio tracks | Content-layer pane; never substitutes for global navigation |
| Artifact Toolbar | `UINavigationBar` / `UIToolbar` grouped items | Regular glass groups + automatic edge effect |
| Search | System searchable placement, trailing on iPad where appropriate | System glass search control |
| Sidebar/Issue Row | System list row and selection treatment | Content/vibrancy; no per-row glass |
| Inspector | Secondary split-view content | Standard material; no Liquid Glass card stack |
| Composer | System text input with grouped action controls | Standard input + limited glass actions |
| Craft Canvas | Expo native view hosting `MTKView`; scene data remains renderer-independent | Opaque content plane; no Liquid Glass |
| Segmented filter | `UISegmentedControl` / segmented picker | System control; interactive thumb adopts glass |
| Toggle | `UISwitch` / `Toggle` | System control |
| Slider/transport | `UISlider` / `Slider` | System control; glass interaction state |
| Menu/popover/sheet | Native presentation from its source control | System-managed Liquid Glass transition |

## Native implementation notes (current build)

- The current build removes the superseded top-level segmented picker. A parent organization sidebar and child session sidebar are both pinned in wide windows, the session sidebar is pinned in regular windows, and compact windows progressively replace content with sessions and then organizations.
- Only the local Curiosity organization is currently backed by runtime data. The organization projection is an explicit shell boundary, not a claim that server-owned organization identity or cross-organization session loading exists.
- The functional bar remains the Expo Router custom header and uses **native SwiftUI `Button`s** (`buttonStyle("glass")` / `"glassProminent"`) with SF Symbols for session reveal, search, contextual filtering, and new session. It preserves the system window-control inset while removing project/session selection from a menu.
- The sidebars use accessible React Native list projections with 44 pt controls, selected state beyond color, and the source → session → content reading order. Native split-view behavior and physical VoiceOver validation remain subsequent implementation gates.
- Craft's current center viewport is an **Expo native view hosting `MTKView`**,
  but its Swift rectangles, colors, selection and camera are a disposable
  renderer proof. Production Craft must consume the existing Crafty kernel's
  resolved, versioned render packet; neither Swift nor React Native may create a
  parallel authored scene. The preferred first renderer spike reuses Crafty's
  Rust/Vello encoder through wgpu's iOS Metal backend; direct Swift/Metal is a
  packet-compatible fallback. UIKit owns raw input, Pencil, text-input and
  accessibility adapters. React Native/SwiftUI own chrome and narrow state
  projections. The current SIMD3 vertices, depth buffer and 4×4 matrix do not by
  themselves establish 3D document support; authored 3D requires a separate ADR
  covering model, commands, persistence, accessibility and renderer protocol.
- Content rows, inspectors, navigation lists, and artifact chrome remain in the content/functional layers defined above; the artifact itself stays visually primary.

## Static `.pen` representation

- Label every glass specimen with its native semantic role and variant.
- Do not show a persistent universal project sidebar in any default screen specimen.
- Approximate Regular glass using a translucent system fill, adaptive-looking border highlight, and restrained shadow, but mark it `STATIC APPROXIMATION — NATIVE MATERIAL OWNS RENDERING`.
- Use exact SF Symbol names in layer labels even if the renderer uses a Lucide stand-in.
- Use SF Pro/SF Mono semantic tokens. If the renderer lacks those fonts, use a labeled fallback without changing the implementation contract.
- Include Reduce Transparency, Increase Contrast, Reduced Motion, Dark Appearance, pointer hover, keyboard focus, and Dynamic Type specimens.
- Section 11 (Collaboration and Accessibility Bench) is normative: it defines contracts and fallback states, not decorative variants. It must show the no-isolation default state next to at least one explicit fallback for every accessibility feature listed in the Super accessibility contract.
- Collaboration controls (presence, shared cursors, Share) appear in the functional bar only — never in content rows, and never as navigation.
- Keep all issue rows, document objects, memory nodes, audio clips, and inspectors out of Liquid Glass.

## Confidence and unknowns

- **High confidence:** material hierarchy, Regular-versus-Clear guidance, glass grouping, tint restraint, accessibility adaptations, tab-first navigation, optional surface-local navigators, trailing inspectors, 44 pt minimum targets, and size-class-based layout.
- **High confidence:** the bench promise (curiosity drives every canvas), the collaboration model, and the super accessibility contract enumerated above are the normative design contract for this framework.
- **Unknown in a static `.pen`:** real-time lensing, content sampling, elastic interaction, automatic foreground switching, and system accessibility transformations. Validate these using native system components on device, not by approving the PNG export.
- **Unknown until device validation:** actual VoiceOver reading order, Switch Control scanning, AX5 layout reflow, and Assistive Access presentation. These must be verified on Sterling's iPad with Accessibility Inspector; the PNG proves the contract, not the behavior.

## Bibliography and rationale

1. [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials) — Primary normative source for Liquid Glass versus standard materials and content/functional layer separation.
2. [WWDC25 — Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/) — Primary design-team explanation of lensing, hierarchy, variants, tint, grouping, scroll-edge behavior, and accessibility adaptations.
3. [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout) — Primary layout guidance for edge-to-edge content, resizable iPad windows, Dynamic Type, and adaptive tab/sidebar navigation.
4. [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) — Primary source for the 44×44 pt minimum target and system symbol-button guidance.
5. [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography) and [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols) — Primary sources for system text styles, Dynamic Type, and symbol weight/scale behavior.
6. [Apple HIG — Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) — Current 2026 iPad guidance for top tab bars, `sidebarAdaptable`, and secondary sidebars that don’t switch tabs.
7. [WWDC26 — Modernize your UIKit app](https://developer.apple.com/videos/play/wwdc2026/278/) — Current iOS/iPadOS 27 source for size-class/available-geometry adaptation, sidebar availability, bar minimization, and automatic scroll-edge refinements.
8. [Apple HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) — Primary guidance that sidebars consume substantial space and a tab bar is preferable when content needs priority.
9. [WWDC25 — Elevate the design of your iPad app](https://developer.apple.com/videos/play/wwdc2025/208/) — Primary recommendation to start with a tab bar unless numerous subviews or deep hierarchy justify a sidebar.
10. [Final Cut Pro for iPad — Customize the Edit screen](https://support.apple.com/guide/final-cut-pro-ipad/customize-the-edit-screen-dev8b472bcb8/ipados) — Apple pro-app precedent for explicitly shown, hidden, and resized task-specific browsers and inspectors.
11. [Logic Pro for iPad — Intro to editing regions and cells](https://support.apple.com/guide/logicpro-ipad/intro-to-editing-regions-and-cells-lpipd9859eae/ipados) — Apple pro-app precedent for selection-driven editors and inspectors around a canvas-first workspace.
12. [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) — Normative for VoiceOver, Dynamic Type, Full Keyboard Access, Switch Control, Voice Control, Assistive Access, Accessibility Inspector, and accessibility nutrition labels.
13. [Apple HIG — VoiceOver](https://developer.apple.com/design/human-interface-guidelines/voiceover) — Reading order, labels, traits, and dynamic-announcement behavior.
14. [Apple HIG — Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection) — iPadOS focus groups, Tab/arrow key behavior, and always-visible focus indication.
15. [Apple HIG — Color](https://developer.apple.com/design/human-interface-guidelines/color) — Contrast ratios and differentiate-without-color guidance.
16. [Apple HIG — Charts](https://developer.apple.com/design/human-interface-guidelines/charts) — Accessibility labels and high-level summaries for Memory graph and audio visualizations.
17. [Apple HIG — Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai) — Disclosure of how an AI-driven product uses stored content and memory.
18. [Apple HIG — Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio) — External audio controls and focus behavior for the Audio surface.

## Stop decision

Coverage is sufficient and findings are saturated for the design decision. Additional investigation into custom optical effects was rejected because Apple explicitly recommends native materials and controls, and a static approximation cannot validate dynamic Liquid Glass behavior. Collaboration placement and accessibility fallbacks follow the contract above; real VoiceOver, scanning, AX5, and Assistive Access behavior require on-device validation with Accessibility Inspector.
