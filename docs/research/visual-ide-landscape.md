# Visual IDEs and the Design↔Code Bridge: Landscape Research

Status: research, August 2026 · Evidence captured 2026-08-09 · Feeds: roadmap
open decision #11 (code↔document mapping), roadmap 4.3 (agent surface),
product positioning. Companion reports:
[`competitor-capability-matrix.md`](competitor-capability-matrix.md) (Figma,
Penpot, Excalidraw, tldraw, Rive),
[`pen-dev-and-paper-deep-research.md`](pen-dev-and-paper-deep-research.md).

Primary-source research. Every claim cites a vendor doc, engineering blog,
source repository, issue tracker or press release captured 2026-08-09, unless
marked otherwise. Confidence: **high** = direct primary-source statement,
**medium** = derived from several primary sources or credible independent
analysis, **low** = marketing or unverifiable. Nothing here is copied from an
external implementation.

---

## 1. The question

Crafty's roadmap names the long pole: a live, bidirectional visualization of
code — "the web UI grows into an IDE where the same document is edited visually
or as code." Open decision #11 is *which side is canonical, sync granularity,
how a source file becomes a node tree*. This report surveys everything that has
tried to answer that question — code-first AI builders, design-first tools
bridging to code, and thirty years of dual-mode IDEs — and extracts what
survives and what demonstrably fails.

## 2. The field, in three camps

| Camp | Canonical artifact | Representative systems | Durable? |
|---|---|---|---|
| Code-first AI builders growing canvases | The code (universally) | v0, Replit, Lovable, bolt.new, Cursor, Tempo, Claude Design | Yes — but canvases are DOM inspectors, not design documents |
| Design-first tools bridging to code | The design file, or a third schema | Figma Dev Mode/Code Connect, Anima, Plasmic, Framer, Webflow, Webstudio, Penpot, Sketch, Visly (dead) | Design-canonical: no; third-schema: yes (Plasmic, Webstudio, WFDL) |
| Dual-mode IDEs (30-year lineage) | The source, or a single serialized artifact | WinForms, WPF/XAML, Qt, Delphi, Android Studio, Xcode/Interface Builder, SwiftUI, Onlook, Puck, GrapesJS, Retool, Gutenberg, NetBeans, WindowBuilder, Flutter | One-artifact architectures only |

## 3. Code-first camp: the canvas is an inspector, code wins

Every major code-first tool shipped a visual surface between June 2025 and July
2026 (v0 Design Mode 2025-06, Cursor Design Mode 2025-12, Replit Design Canvas
2026-03, bolt select tool 2026-04, Claude Design 2026-04). None ships a
design-grade vector canvas. All keep code canonical and treat the visual
surface as a live-DOM inspector over the running app.

| Tool | Visual surface (primary source) | Canonicality | Sync mechanism |
|---|---|---|---|
| v0 (Vercel) | Design Mode: overlay on live preview, property panel, "Go to Code" — https://v0.app/docs/design-mode | Code (Next.js+Tailwind+shadcn repo; git-branch-per-chat, PR merge — https://vercel.com/blog/introducing-the-new-v0) | Visual edits are held as **pending edits**; Apply becomes a chat turn that regenerates code (https://v0.app/docs/design-mode) |
| Replit | Design Canvas: infinite board, frames as live web artifacts, mockups explicitly **not** durable ("design mockups… don't have a server behind them" — https://replit.com/blog/whats-changed-agent3-to-agent4) | Code; "the code is the same code. The prototype is the actual product" (co-founder, https://replit.com/blog/live-from-hq-agent4-launch-pt2) | Deterministic edits write source directly; "hidden complexity" hands off to the Agent (https://docs.replit.com/design/visual-editor); parallel tasks in isolated project copies, 90% auto-merge (self-reported) |
| Lovable | Visual Edits: element select + property panel over preview | Code (React+Vite+TS+shadcn) | **Best-documented mapping**: custom Vite plugin mints stable compile-time JSX ids; whole project synced to the browser as a Babel/SWC AST; visual edits mutate the AST and write clean TSX directly — no LLM for deterministic edits (https://lovable.dev/blog/visual-edits) |
| bolt.new | Preview + DOM selection; "Pick from layers" toggle (2026-04) | Code in a browser VM (WebContainers) | No deterministic visual→code mapper; design gap answered with **Design System Agents** ingesting npm/Storybook repos so generation references real tokens (https://bolt.new/blog/bolt-design-system-agents) |
| Cursor | Design Mode: temporary client-side overrides until an explicit **Apply**; Apply = agent locates components and writes the edit (https://cursor.com/blog/browser-visual-editor; independent analysis https://www.builder.io/blog/cursor-design-mode-visual-editing) | The repo, absolutely | Two loops: visual override preview + agent code writes; divergence gated by Apply + git. Documented weaknesses: token mapping "often misses", DOM-tree layers, no canvas zoom |
| Tempo | "Every frame is a live iframe of a real route or React component. Edits write back to source" — https://docs.tempo.new/introduction | Code; agents in isolated git worktrees per session | iframe-of-DOM editing, not vector |
| Firebase Studio (Google) | Prototyper view: annotate/select on preview | Code in a cloud workspace | **Sunset announced 2026-03-19, shutdown 2027-03-22** — https://firebase.google.com/docs/studio/migrating-project. A generic cloud IDE + agent + preview overlay was not a durable product; the strongest negative data point in this camp |
| Claude Design | Canvas where Claude drafts; design systems read **from your codebase**; exports/handoff to Claude Code (https://www.anthropic.com/news/claude-design-anthropic-labs) | Codebase + generated artifacts | Design-system-as-shared-schema is this camp's one quasi-schema between visual and code |

**Lessons from this camp.**

1. **Code-canonicality is the incumbent default; nobody has a durable design
   document that is also code.** The closest thing to a shared artifact across
   the camp is the *design system* (tokens/components): v0 Figma-import, Bolt
   Design System Agents, Claude Design's codebase-read design systems, Replit
   brand snapping. The camp's answer to "what is durable about design" is a
   token/component library, never a page-level document.
2. **The converged sync pattern is: pending visual state → explicit Apply →
   mapping + review.** Deterministic mapping for simple edits (Lovable's AST),
   LLM-mediated apply for structural edits (v0, Cursor, Lovable, Replit), git
   as the divergence engine (branch-per-chat, worktrees, PRs). Nobody claims a
   merge-free loop.
3. **The hard problem everyone names is source mapping** — "translating a
   change you made on a rendered page into the right edit in the right file"
   (Builder.io analysis of Cursor). Visual editing quality is bounded by code
   traceability. Crafty's canonical document sidesteps the mapping problem by
   construction — but must still solve the code round-trip this camp solved
   with git.
4. **No code-first tool has a design-grade canvas** (documented consequences:
   no proper undo, DOM-tree layers, no zoom/pan until 2026, token misses).
   "Design-grade canvas that edits real code two-way" is unclaimed white space
   as of August 2026; Tempo and Replit Design are the closest entrants.

## 4. Design-first camp: the third schema is the only survivor

| System | Canonical | Sync | Primary sources |
|---|---|---|---|
| Figma Dev Mode + Code Connect | The Figma file; Dev Mode is a read-only projection | One-way *annotation*: `.figma.ts` mappings published via CLI; "Code Connect files are not executed… the CLI essentially treats code snippets as strings" | https://developers.figma.com/docs/code-connect/ ; the pivot is documented by its own team: "an early pivot away from a codegen-first approach… translating design to code still required a human touch" — https://www.figma.com/blog/how-we-built-dev-mode/ |
| Anima | Figma design | One-way export; "when priorities shift towards code maintainability, Anima's codegen can favor clean and functional code over pixel-perfect precision" | https://www.animaapp.com/blog/product-updates/generate-responsive-react-code-from-any-figma-design/ |
| Plasmic | **A third schema** (the Plasmic project) | One-way but continuous: per component, a Plasmic-owned presentational file (overwritten every sync, "shouldn't be edited by you") + a dev-owned wrapper (generated once, "never touched again") | https://docs.plasmic.app/learn/codegen-components/ — ownership partitioning is how overwrite without data loss works |
| Framer | The project; "everything is built on React" since Framer X | Code Components render live on canvas; Design Components don't become first-class code. The FAQ is the camp's most candid statement: "Framer is not currently setup to get great results for that use case… If your project needs a lot of logic and components we advise to create a normal React application instead" | https://www.framer.com/developers/faq |
| Webflow | The Designer state; **WFDL** — a custom "programming language that is authored visually… structurally edited… lambda calculus with a Hindley-Milner type system" with "scope-unique identifiers for each syntax node… used for generating 'source maps' that power visual editing" | One-way batch export (DevLink); "Any manual edits will be overwritten during the next export" | https://webflow.com/blog/webflow-design-language ; https://developers.webflow.com/devlink/docs/component-export/whats-exported |
| Webstudio (open source) | **A third schema**: JSON instance tree + "CSS Typed Object Model" style values; Builder and published site both project it | Decoupled: Builder sends JSON patches; CLI compiles data → framework-specific components + CSS. **MCP tooling edits "the native visual-builder model so their changes remain editable in the Builder"** — the live proof that agents can edit the same document model as the UI | https://web.archive.org/web/20241219072121/https://webstudio.is/blog/webstudios-architecture-an-overview ; https://github.com/webstudio-is/webstudio/pull/5941 |
| Penpot | The Penpot document (SVG-native JSON); codegen is an inspect-time projection | One-way inspect by design: "Forget about 'exporting'… Simply 'inspect'" — https://penpot.app/blog/transform-your-designs-into-code-with-penpot/ ; community must tag layers with semantics before any export (penpot-semantic-tagger) | https://help.penpot.app/technical-guide/developer/data-guide/ ; https://github.com/elhombretecla/penpot-semantic-tagger |
| Sketch / react-sketchapp | Sketch document (open JSON spec); Airbnb's counterexample made **code canonical** and Sketch a *rendering target* | Airbnb FAQ, first-party: "Our solution is to keep our design system's source of truth in code, and use react-sketchapp to compose & consume it" — because "getting production-ready semantics out of Sketch is more difficult than generating production-ready Sketch templates from React components" | https://react-sketchapp.airbnb.tech/docs/FAQ.html |
| Visly (dead) | Design-canonical with code import: React components built visually, tokens synced to the codebase, a Rust flexbox engine (Stretch) | Acquired by **Figma** 2021-04; product wound down; the team built Dev Mode — the *handoff viewer*, not the design-in-code authoring tool | https://www.figma.com/blog/how-we-built-dev-mode/ ; https://www.ycombinator.com/companies/visly |

**Why handoff breaks — the primary-source record converges on five causes.**
Fidelity ≠ semantics (Figma's "human touch"; Airbnb; Penpot's semantic tagger);
output quality is a function of design-file discipline (Anima: "use Auto
Layout and well-named layers"; Webflow's translation engine only translates
auto-layout layers); generated code can't be edited (Webflow DevLink overwrite
contract; Anima's "needs cleanup"); nobody owns the delta (drift CI exists
because "the published state can silently drift from develop" —
https://github.com/dequelabs/cauldron/issues/2376); and since 2025 every vendor
pivoted the design→code story toward **agents consuming structured design data
+ code mappings** (Figma MCP, Webstudio MCP, Penpot MCP, Anima MCP) — "don't
generate, contextualize."

## 5. Dual-mode IDEs: the 30-year record of two-representation systems

The deepest source of evidence is not the AI builders — it is every IDE that
tried a visual designer sharing an artifact with a hand editor.

**Documented failure modes (each with primary sources in the research):**

1. **Partial reader of the source breaks under hand edits.** WinForms: the
   designer "parses whatever it serialized, but not arbitrary code that you may
   add"; `InitializeComponent` is "meant for the designer use only"
   (https://github.com/dotnet/winforms/blob/main/docs/designer/modernization-of-code-behind-in-OOP-designer/modernization-of-code-behind-in-oop-designer.md).
2. **Silent, non-commutative writes from the designer.** Android Studio's
   layout editor deleted margins, coerced `@dimen`→dp, injected
   `tools:layout_editor_absolute*` and reordered elements — users could not
   attribute the changes ("if you work almost completely in text view, the
   issue never happens" — https://stackoverflow.com/questions/41954472 ;
   Google issue tracker 37119059, 64169967, 129457736). Google's answer was
   not to fix the sync but to replace the model: "Jetpack Compose… is replacing
   the View toolkit" (https://developer.android.com/develop/ui/compose/first).
3. **Two persisted artifacts with a stringly-typed wire.** Delphi DFM+PAS
   (event name = method name, parse failure at save if you get it wrong);
   storyboards/XIBs+Swift (un-reviewable XML diffs — Faire engineering:
   https://craft.faire.com/think-twice-before-scaling-your-app-with-interface-builder-90214ebdb12a ;
   Apple's own verdict: "you need to choose between the benefits of using a
   visual editor, or the benefits of creating your UI in code. And if you
   choose one and change your mind later, then you have to start all over
   again" — WWDC19 session 204).
4. **Stored-vs-regenerated divergence, made formal.** Gutenberg serializes
   block HTML and byte-compares it against `save()` output on every load;
   any evolution of the projection invalidates stored content; the cure is a
   deprecation ladder — divergence is **detected and migrated, never
   prevented** (https://developer.wordpress.org/news/2023/03/block-deprecation-a-tutorial/ ;
   https://github.com/WordPress/gutenberg/issues/38978).
5. **The design-time canvas is not the runtime.** WinForms instantiates the
   *base class*; XAML designer executes project code and crashes; Apple
   deprecated `@IBDesignable` (Xcode 16: "will no longer be rendered in the
   Interface Builder canvas"). The survivors make the runtime the canvas:
   SwiftUI previews "are not a representation of what Xcode thinks your view
   will look like" — they compile and run the real code
   (https://developer.apple.com/videos/play/wwdc2019/233/), and hot reload
   does the same for XAML/Compose/Flutter.
6. **Designer-imposed structure on the code.** NetBeans guarded blocks
   (fenced, read-only generated code; users still file removal requests —
   https://issues.apache.org/jira/browse/NETBEANS-1410).

**The architectures that survive:**

- **A. Single artifact, total writer** (Qt `.ui` via `uic`, GrapesJS component
  tree, Puck JSON). Visual edits land in the one durable file; the write path
  owns the file's schema.
- **B. Code canonical; visual is a projection with a validated, narrow write
  path** (SwiftUI previews, Compose, Flutter hot reload, Onlook, Retool's 2026
  app builder — React source, canvas is a preview, "the generated code is
  fully editable" — https://docs.retool.com/education/labs/fundamentals/retool-app-ide).
  Divergence is impossible by construction: one durable representation. Cost:
  the visual surface's expressiveness is bounded by the write vocabulary
  (Onlook started with inline-Tailwind-only writes via AST —
  https://docs.onlook.com/developers/architecture).
- **C. Data canonical; code renders data** (Puck, GrapesJS, Quant-UX).
  Divergence becomes schema versioning, handled by explicit migration
  machinery.
- **D. Bidirectional transform over source with refusal** (Eclipse
  WindowBuilder, 20 years old and maintained): AST-in, minimal-diff out —
  "The tool never regenerates the entire source for a file… **No intermediate
  metadata file to get lost or out of sync**" — and documented constructs it
  refuses rather than corrupts (https://help.eclipse.org/latest/topic/org.eclipse.wb.doc.user/html/features/bidirectional.html).
  The only long-lived true two-way sync editor found; its properties: no
  second artifact, minimal writes, honest refusal.

**Meta-lesson.** Every system with two durable editable representations
diverges. Every surviving system has exactly one durable artifact and treats
the other surface as a projection with a validated write path. The disasters
(Android layout editor, WinForms, storyboards) all share one defect: the
design surface *silently re-serialized* the shared artifact with a transform
that was neither total nor validated.

## 6. Market: convergence is monetized; the bridge is unbuilt

Timeline highlights (primary sources, full list in section 7): Figma acquired
Visly in 2021 and shipped Dev Mode — a handoff viewer, explicitly pivoted away
from codegen (2023); Figma IPO'd July 2025 at ~$19.3B, ~$50B debut market cap,
FY2025 revenue $1.056B (+41%), with Dev Mode seats ($12–35/seat) and Figma
Make as the growth narrative — developers paying to *look at* designs is the
market's clearest willingness-to-pay signal (SEC 424B4 via
https://www.reuters.com/technology/figma-raises-12-billion-us-ipo-signaling-thaw-tech-listings-2025-07-30/ ;
https://investor.figma.com/news-events/news/news-details/2026/Figma-Announces-Fourth-Quarter-and-Fiscal-Year-2025-Financial-Results/default.aspx).
Replit: $400M Series D at $9B (2026-03). Lovable: $330M Series B at $6.6B
(2025-12). Every major lab entered design surfaces: Anthropic Claude Design
(2026-04), Google Stitch (2025-05 → "AI-native software design canvas" with
DESIGN.md as an agent-readable contract, 2026-03), Google's Firebase Studio
sunset (2026-03). Counter-signals: Creatie raised $16M and discontinued the
product in ~3 months (2025-08); Penpot raised ~$20M total; Onlook ~$500K +
undisclosed; Visly's codegen ambitions became Figma's *inspection* product.

**Agent-native surfaces (the field's fastest-moving layer):**

| MCP surface | Read | Mutation | Validated/transactional? |
|---|---|---|---|
| Figma Dev Mode MCP (2025-06) | code, image, variables; Code Connect mappings | Write tools announced as a future *paid* feature | Not public |
| Sketch MCP (2025-10) | document info, layer tree, overrides, libraries | `run_code` executes arbitrary SketchAPI JS | **None documented** |
| Penpot MCP (2025-10, beta 2026-02) | high-level overview, plugins API | Generated Plugins-API JS; Variants & Design Tokens unsupported (2025-10) | Not documented |
| pen.dev MCP | nodes, computed bounds, screenshots | Full bidirectional insert/update/move/delete | Git-native versioning, not command-level |
| Webstudio MCP | — | Edits the **native builder model** so changes stay editable in the Builder | Data-model edits; no command/inverse contract documented |

Observation: today's standard is *agents read structured design data, not
screenshots* (Figma MCP exists to replace image-guessing). Write access exists
only in the new entrants — and **none exposes validated, invertible,
transactional mutation to agents**. Crafty's agent-command boundary (ADR 0006:
agents obey the same invariants as humans through the same commands) is
unclaimed in every primary source reviewed.

## 7. Crafty conclusion

1. **Crafty's architecture is the third-schema position, and that position is
   the only design-side survivor.** The durable wins observed across all three
   camps: one durable artifact; the code surface is a *projection* (render
   side) plus a *command-producing front-end* (edit side); divergence is
   detected and migrated, never silently resolved. The failures all share the
   same defect — a second editable representation silently re-serialized.
   Crafty's kernel (stable ids, validated invertible commands, one canonical
   document) is structurally the WindowBuilder pattern with the refusal made
   explicit, and the Gutenberg lesson (validation + deprecation ladder) is
   already the document-versioning doctrine.
2. **The document must express semantics for the bridge to be worth building.**
   Figma's pivot and Airbnb's verdict agree: pixel-fidelity round-trips fail
   because intent is not in the design file. Components, tokens, variants and
   states (records already in Crafty's schema) are the prerequisite for any
   code surface — roadmap 2.3/3.5 before any code mapping.
3. **The code side should enter as a projection with an ownership boundary.**
   Plasmic's ownership-split (generated presentation overwritten freely,
   developer-owned wrapper never touched) and Webstudio's
   same-data-model-for-agents-and-UI are the two live precedents; WFDL's
   per-node ids as source maps matches Crafty's stable-id doctrine.
   "Generated code can be overwritten" is only safe when ownership is
   partitioned by contract.
4. **The agent-native contract is the beachhead.** No MCP surface in the field
   exposes validated, invertible, transactional mutation. Crafty's kernel
   already has the mechanism (ADR 0006); roadmap 4.3 should surface it as the
   product claim, not a plumbing detail.
5. **The code↔document mapping (open decision #11) is not decided by this
   report.** It narrows the decision: code-canonical (camp A/B) is the
   incumbent default and fails the design-grade-canvas test; design-canonical
   with codegen (Anima/Webflow/DevLink) is demonstrably drift-bound; the
   third-schema position is Crafty's home and is proven survivable — but the
   *code representation of the document* (which framework, how a node tree
   maps to source files, what the write vocabulary is) remains open, and this
   report's evidence says it should be built as a validated projection with an
   explicit refusal surface, tested against the documented failure modes
   (silent rewrites, partial reads, stringly-typed binding) in that order.

## Sources

All captured 2026-08-09. Section 3: v0 Design Mode docs and launch thread
(https://v0.app/docs/design-mode,
https://community.vercel.com/t/introducing-design-mode-on-v0/13225), new-v0
post (https://vercel.com/blog/introducing-the-new-v0); Replit Agent 4 / Design
Canvas (https://replit.com/blog/introducing-agent-4-built-for-creativity,
https://replit.com/blog/whats-changed-agent3-to-agent4,
https://replit.com/blog/live-from-hq-agent4-launch-pt2),
Visual Editor docs (https://docs.replit.com/design/visual-editor,
https://docs.replit.com/design/canvas), Cartographer post
(https://replit.com/blog/cartographer); Lovable Visual Edits engineering post
(https://lovable.dev/blog/visual-edits), MCP (https://lovable.dev/mcp),
funding (https://techcrunch.com/2025/07/17/lovable-becomes-a-unicorn-with-200m-series-a-just-8-months-after-launch/,
https://www.reuters.com/business/finance/lovable-valued-66-billion-latest-funding-round-ai-coding-demand-surges-2025-12-18/);
bolt.new repo (https://github.com/stackblitz/bolt.new), Design System Agents
(https://bolt.new/blog/bolt-design-system-agents); Cursor browser visual editor
(https://cursor.com/blog/browser-visual-editor), independent analysis
(https://www.builder.io/blog/cursor-design-mode-visual-editing); Tempo
(https://docs.tempo.new/introduction); Firebase Studio sunset
(https://firebase.google.com/docs/studio/migrating-project); Claude Design
(https://www.anthropic.com/news/claude-design-anthropic-labs).

Section 4: Figma Dev Mode (https://www.figma.com/blog/how-we-built-dev-mode/),
Code Connect (https://developers.figma.com/docs/code-connect/); Anima
(https://www.animaapp.com/blog/product-updates/generate-responsive-react-code-from-any-figma-design/);
Plasmic (https://docs.plasmic.app/learn/codegen-components/,
https://docs.plasmic.app/learn/loader-vs-codegen/); Framer FAQ
(https://www.framer.com/developers/faq); Webflow WFDL
(https://webflow.com/blog/webflow-design-language), DevLink
(https://developers.webflow.com/devlink/docs/component-export/whats-exported);
Webstudio architecture (archived: https://web.archive.org/web/20241219072121/https://webstudio.is/blog/webstudios-architecture-an-overview),
CLI (https://docs.webstudio.is/university/cli.md), style-engine PR
(https://github.com/webstudio-is/webstudio/pull/5941); Penpot data guide
(https://help.penpot.app/technical-guide/developer/data-guide/), inspect blog
(https://penpot.app/blog/transform-your-designs-into-code-with-penpot/),
semantic tagger (https://github.com/elhombretecla/penpot-semantic-tagger);
react-sketchapp FAQ (https://react-sketchapp.airbnb.tech/docs/FAQ.html);
Visly (https://www.ycombinator.com/companies/visly); Quant-UX
(https://github.com/KlausSchaefers/qux-low-code).

Section 5: WinForms designer mechanics
(https://learn.microsoft.com/en-us/archive/blogs/rprabhu/how-does-the-windows-forms-designer-in-visual-studio-load-a-form),
modernization doc (https://github.com/dotnet/winforms/blob/main/docs/designer/modernization-of-code-behind-in-OOP-designer/modernization-of-code-behind-in-oop-designer.md),
designer errors (https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls-design/designer-errors);
WPF/XAML designer troubleshooting (https://learn.microsoft.com/en-us/visualstudio/xaml-tools/debugging-or-disabling-project-code-in-xaml-designer?view=vs-2022),
hot reload (https://learn.microsoft.com/en-us/visualstudio/xaml-tools/xaml-hot-reload?view=visualstudio),
abstract-base-class post (https://devblogs.microsoft.com/visualstudio/understanding-the-behavior-of-the-xaml-designer-with-abstract-base-classes/);
Qt uic (https://doc.qt.io/qt-6/uic.html), Design Studio code view
(https://doc.qt.io/qtdesignstudio/qtquick-text-editor.html); Delphi DFM/PAS
(https://etutorials.org/Programming/mastering+delphi+7/Part+I+Foundations/Chapter+1+Delphi+7+and+Its+IDE/The+Files+Produced+by+the+System/);
Android Studio divergence bugs (https://stackoverflow.com/questions/41954472,
Google issues 37119059, 64169967, 129457736, 37120776), Compose-first
(https://developer.android.com/develop/ui/compose/first); Apple WWDC19 204/233
(https://developer.apple.com/videos/play/wwdc2019/204/,
https://developer.apple.com/videos/play/wwdc2019/233/), Xcode 15.1/16 release
notes, Faire engineering (https://craft.faire.com/think-twice-before-scaling-your-app-with-interface-builder-90214ebdb12a);
Onlook (https://docs.onlook.com/developers/architecture,
https://github.com/onlook-dev/onlook); Puck (https://puckeditor.com/docs);
GrapesJS (https://grapesjs.com/docs/); Retool app builder
(https://docs.retool.com/build/apps/concepts/app-builder,
https://docs.retool.com/education/labs/fundamentals/retool-app-ide); Gutenberg
deprecation (https://developer.wordpress.org/news/2023/03/block-deprecation-a-tutorial/,
https://github.com/WordPress/gutenberg/issues/38978); NetBeans guarded blocks
(https://netbeans.apache.org/tutorial/main/kb/docs/java/quickstart-gui/,
https://issues.apache.org/jira/browse/NETBEANS-1410); WindowBuilder
(https://help.eclipse.org/latest/topic/org.eclipse.wb.doc.user/html/features/bidirectional.html);
Flutter (https://docs.flutter.dev/tools/hot-reload,
https://flutter.dev/blog/why-flutter-doesnt-use-oem-widgets); Framer Auto-Code
(https://medium.com/framer-prototyping/introducing-the-new-framer-ce5e5871dc44).

Section 6: Figma MCP (https://www.figma.com/blog/introducing-figma-mcp-server/),
Sketch MCP (https://www.sketch.com/docs/mcp-server/), Penpot MCP
(https://community.penpot.app/t/push-the-penpot-mcp-to-its-limits-join-the-beta-test/10363),
pen.dev MCP (https://docs.pen.dev/getting-started/ai-integration), Stitch
(https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/),
Replit funding (https://www.prnewswire.com/news-releases/georgian-leads-400m-series-d-investment-in-replit-to-support-continued-investment-in-replit-agent-302711218.html),
Figma IPO (https://www.figma.com/blog/ipo-pricing/), Figma FY2025 results
(https://investor.figma.com/news-events/news/news-details/2026/Figma-Announces-Fourth-Quarter-and-Fiscal-Year-2025-Financial-Results/default.aspx),
Creatie discontinuation (https://www.linkedin.com/company/creatie-ai),
Miro/Uizard (https://uizard.io/blog/uizard-joins-miro/).
