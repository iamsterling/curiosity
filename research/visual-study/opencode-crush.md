# Curiosity TUI visual study: OpenCode + Crush

Date: 2026-08-25

## Decision

Reproduce OpenCode's visual composition before applying a Curiosity-specific
identity. Use Crush as the implementation and state-rendering reference where
OpenCode's OpenTUI renderer is not acceptable.

This is a visual-language clone, not an authority or runtime clone. Curiosity's
kernel remains the sole command, provider, completion, failure, and persistence
authority.

## Pinned evidence

| Product  | Ref    | Resolved commit                            | Retained visual                                                                                                  |
| -------- | ------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| OpenCode | `dev`  | `a7444bf944c219b9eaba2f794847b3001237795f` | [`opencode-active.png`](references/opencode-active.png), [`opencode-splash.png`](references/opencode-splash.png) |
| Crush    | `main` | `06345cc328127ae6e71ca83c32d3bba1a4f8342c` | [`crush-demo`](references/crush-demo), extracted frames `crush-{0,1.5,3,4.5,6}.png`                              |

## Executive visual comparison

### OpenCode

**Documented**

- A nearly black canvas (`#0a0a0a`) with no decorative chrome inside the TUI.
- Empty state centers a large gray pixel wordmark above a 75-column composer.
- The composer is the visual anchor: one colored left rule, `#1e1e1e`
  background, one row of input, and one metadata row.
- Metadata order is agent, separator, model, provider, separator, variant.
- Shortcut hints sit outside the composer, right aligned.
- The global footer is pinned to the bottom: working directory/status on the
  left, version or connectivity on the right.
- Active sessions replace the center-stage logo with a top title panel, a
  scrolling transcript, and a bottom composer.
- User messages are `#141414` panels with a colored left rule and 2-cell left,
  1-row vertical padding.
- Assistant prose is unboxed and left-inset by 3 cells.
- Tool activity is compact, mostly one-line, and muted; verbs and state symbols
  carry color rather than containers.
- Assistant completion metadata is `▣ Mode · model · duration`, left-inset by
  3 cells.
- Error states return to a panel with a red left rule.

**Source geometry**

- Home prompt defaults to 75 columns and may expand to 70% of the terminal when
  configured as automatic.
- Session content has 2-cell horizontal padding and 1-row bottom padding.
- The composer has 2-cell horizontal padding, 1-row top padding, a minimum
  1-row textarea, a maximum height of one-third of the terminal (minimum 6),
  and a one-row metadata line.
- The optional session sidebar appears only above 120 columns and consumes 42
  columns.

### Crush

**Documented**

- A full-screen `#201f26` canvas using the CharmTone Pantera palette.
- The standard wide chat layout is approximately 75–80% transcript and 20–25%
  right sidebar.
- The sidebar fixes a large gradient logo above scrollable operational state:
  session title, path, model, reasoning, context use, cost, modified files,
  LSPs, MCPs, and skills.
- The prompt is intentionally light: mint prompt symbol, textarea, and a global
  key-hint footer rather than a heavy box.
- User and thinking content use low-contrast bands; tools use status glyphs and
  blue action names; code and diffs use full-width tinted rows.
- Dialogs are centered overlays with purple borders, gradient title rules, and
  a solid purple selected row.
- At widths below 120 columns or heights below 30 rows, Crush enters compact
  mode; its textarea ranges from 3 to 15 rows.

**Palette**

| Role                | Hex       |
| ------------------- | --------- |
| Canvas / Pepper     | `#201F26` |
| Lowest panel / BBQ  | `#2D2C36` |
| Panel / Char        | `#3A3943` |
| Strong panel / Iron | `#4D4C57` |
| Muted / Oyster      | `#605F6B` |
| Subtle / Squid      | `#858392` |
| Body / Smoke        | `#BFBCC8` |
| Bright body / Sash  | `#ECEBF0` |
| Purple / Charple    | `#6B50FF` |
| Pink / Dolly        | `#FF60FF` |
| Mint / Julep        | `#00FFB2` |
| Cyan / Malibu       | `#00A4FF` |

## Target visual system

### Composition

Use OpenCode as the primary composition:

1. Centered splash wordmark and narrow composer on an empty thread.
2. Full-width title panel and transcript after the first turn.
3. Persistent bottom composer and global footer.
4. No right sidebar in the initial clone.

Use Crush for behaviors OpenCode's retained screenshots do not fully specify:

1. Working shimmer/status glyphs.
2. Tool success/error/pending symbols.
3. Banded tool output and syntax/diff rows.
4. Stable width-bounded Markdown rendering.
5. Compact mode at 120 columns / 30 rows.

### Tokens

The initial clone uses the exact OpenCode dark theme tokens:

| Role           | Hex       |
| -------------- | --------- |
| Background     | `#0A0A0A` |
| User panel     | `#141414` |
| Composer       | `#1E1E1E` |
| Border subtle  | `#3C3C3C` |
| Border         | `#484848` |
| Muted          | `#808080` |
| Text           | `#EEEEEE` |
| Primary        | `#FAB283` |
| Agent/build    | `#5C9CF5` |
| Accent/heading | `#9D7CD8` |
| Error          | `#E06C75` |
| Success        | `#7FD88F` |
| Info           | `#56B6C2` |
| Code           | `#7FD88F` |
| Strong/warning | `#F5A742` |

### Typography and symbols

- Terminal monospace only; no proportional UI font.
- Normal weight by default. Bold is reserved for Markdown strong text,
  selection, and important status.
- Primary structural glyphs: `│`, `╹`, `▣`, `→`, `✓`, `×`, `◇`, `•`, `⋯`.
- No `YOU`, `ASSISTANT`, or product-name labels in the transcript.
- No rounded boxes for ordinary messages or the composer.

### Component specification

#### Splash

- Center group vertically with slightly more free space below than above.
- Pixel wordmark: `curiosity`, rendered in neutral steps, not a new decorative
  logo treatment.
- Composer width: 75 cells or 70% when the terminal is very wide.
- One blank row between logo and composer.
- Shortcut row directly below composer.
- Global footer pinned to the last row.

#### Composer

- Active agent-colored left rule.
- `#1e1e1e` fill.
- 2-cell horizontal and 1-row top padding.
- Input first; metadata second.
- Metadata: `Chat · model provider · effort`.
- Model and effort must reflect options actually sent to the provider.
- Status/shortcut row outside the panel.

#### User message

- `#141414` full available width.
- Same colored left rule as its originating composer.
- 2-cell left and 1-row vertical padding.
- No role label.

#### Assistant message

- No panel or role label.
- 3-cell left inset.
- Width-aware Markdown semantic colors.
- Completion line: `▣ Chat · model · duration`.
- Provider/effort may be added only when they remain visually subordinate.

#### Tool and working states

- One-line tool header: state glyph + colored action + muted target.
- Pending: animated or stepped `⋯`; success `✓`; failure `×`.
- Output: 2-cell inset, low-contrast band, bounded height with explicit
  truncation.
- Diffs: green/red line backgrounds and syntax colors, switching from split to
  unified in compact mode.

#### Error

- User-panel geometry with red left rule.
- Muted error prose; no giant badge.
- Recovery action appears as a concise secondary line.

#### Footer

- Bottom-left: directory or local/durable status.
- Bottom-right: available command hints/status.
- Never show fabricated token, context, cost, tool, LSP, or MCP values.

## Responsive matrix

| Size                           | Behavior                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `>120` columns and `>=30` rows | Full layout, 75-cell splash composer, full provider and shortcut metadata             |
| `80–120` columns               | No sidebar, transcript and composer fill available width, compact shortcut row        |
| `<80` columns                  | Hide provider before model or effort; collapse shortcut descriptions before keys      |
| `<30` rows                     | Remove splash wordmark first, reduce vertical gaps, keep composer and latest messages |

## Acceptance frames

1. **Splash, 120×40:** pixel Curiosity wordmark, centered OpenCode composer,
   metadata, shortcuts, global footer.
2. **Active Markdown, 120×40:** title panel, user panel, heading/list/code/link,
   completion metadata, bottom composer.
3. **Working/tool, 120×40:** pending indicator, compact tool lines, one banded
   output block, no layout jump.
4. **Error, 100×32:** red-rule panel and recovery hint.
5. **Compact, 72×24:** no logo/sidebar, no horizontal overflow, model and effort
   remain discoverable.

## Unknowns and constraints

- **Unknown:** exact raster appearance varies with terminal font, line height,
  and color profile. Acceptance is by terminal-cell geometry and semantic color,
  not marketing-screenshot pixels.
- **Documented mismatch:** the official OpenCode screenshot and current `dev`
  source can evolve independently. This study pins both to the same repository
  commit and treats the retained screenshot as the visual baseline.
- **Constraint:** readline cannot faithfully maintain a centered splash,
  persistent transcript viewport, composer footer below the cursor, resize, and
  fixed global footer. A full-screen cell renderer is required.
- **Constraint:** the renderer may own terminal presentation and input editing,
  but never command admission, provider execution, or durable state.

## Adaptive bibliography

1. OpenCode official active/splash screenshots, commit
   `a7444bf944c219b9eaba2f794847b3001237795f`.
   Selected because they are the project's own canonical marketing captures and
   expose the complete visual hierarchy better than prose documentation.
2. OpenCode `packages/tui/src/{routes/home.tsx,component/prompt/index.tsx,routes/session/index.tsx,theme/assets/opencode.json}`.
   Selected because these files define exact breakpoints, padding, message
   geometry, metadata order, and semantic colors.
3. Crush official README demo, commit
   `06345cc328127ae6e71ca83c32d3bba1a4f8342c`.
   Selected because it covers live chat, tools, diffs, dialogs, sidebar, prompt,
   and model selection in one first-party animation.
4. Crush `internal/ui/{model/ui.go,model/sidebar.go,styles/themes.go,styles/quickstyle.go,chat/*}`.
   Selected because these files define compact breakpoints, sidebar composition,
   glyphs, component styles, and stable Markdown/tool rendering.
5. CharmTone source at `github.com/charmbracelet/x/exp/charmtone@009e6338d40d`.
   Selected because Crush refers to named colors; this is the authoritative
   source for their hex values.

## Stop decision

Coverage is sufficient for visual cloning: all required regions and states have
both first-party visual evidence and source-level implementation evidence.
Further screenshot collection is saturated and would not change the target.

`CURIOSITY_NO_GO`: copying OpenCode's sidebar, modal system, mouse behavior, or
animation engine now. Those do not improve the first clone's acceptance frames
enough to justify expanding scope.

## Runtime clone acceptance

The initial runtime clone is implemented without OpenTUI under
`apps/custom-harness/src/tui/`:

- `screen-terminal.ts` owns alternate-screen entry/exit, raw key events, resize
  events, cursor placement, and changed-line drawing.
- `frame.ts`, `composer-view.ts`, and `transcript-view.ts` implement the pinned
  cell geometry without taking command or provider authority.
- `theme.ts` uses the exact OpenCode dark tokens listed above.
- `markdown.ts` remains the only Markdown dependency adapter.
- The composer expands to six rows (three in compact mode) and accepts
  Shift/Ctrl/Alt+Enter or Ctrl+J for newlines.

Automated frame acceptance covers splash, active Markdown, working, error, and
72×24 compact states. A 120×40 tmux pseudo-terminal fixture additionally proves
the alternate-screen path, in-place pending state, completed streamed Markdown,
and live resize to 72×24. In compact mode the provider is removed before the
model or effort, matching the responsive contract.

Tool and diff treatments remain design-frame specifications only. Curiosity's
current authority exposes no tool execution, and the clone does not fabricate
tool, token, context, or cost state merely for visual parity.

### Braille animation addendum

The animation vocabulary is modeled after Ledi Hildawan's MIT-licensed
[Unicode Braille Animations](https://ledihildawan.github.io/unicode-braille-animations/),
pinned at commit `28b7b8832da40d1c484e57c9f1e3a8a9b0bf8d32`.

**Documented:** the reference combines step-based braille shape changes with a
luminance sweep while preserving fixed monospace width. Its Satellite Orbit is
an eight-frame, one-cell loop; Breathing Focus is a gradual fill/unfill loop;
Ripple Wave is a four-cell traveling pattern. It explicitly provides a static
reduced-motion treatment through `prefers-reduced-motion`.

**Terminal adaptation:** Curiosity uses the exact one-cell orbit vocabulary at
an 80ms clock and one semantic agent color. Breathing and a shortened two-cell
wave are deterministic dormant capabilities for future semantic states. The
only active animation is provider work, so at most one transcript cell changes
per tick. `CURIOSITY_MOTION=reduce` replaces it with static `⠿` and does not
start the clock.

**Unknown:** terminals cannot expose the browser's
`prefers-reduced-motion` media query consistently, so reduction is an explicit
environment preference rather than an inferred OS setting.

`CURIOSITY_NO_GO`: simulated glow characters, rainbow cycling, animated splash
art, simultaneous transcript and footer spinners, and activating tool animation
before authoritative tool events exist. Each adds motion without improving
state comprehension.

The source and MIT license were selected over derivative spinner lists because
they are the supplied primary reference and define both exact frames and motion
accessibility behavior. Coverage is saturated after the frame, cadence, width,
license, and reduced-motion decisions; additional collection entries do not
change the implementation.

## Canvas artefact

The visual clone lives in [`curiosity-visual-clone.pen`](curiosity-visual-clone.pen).
It holds four top-level sections:

| Section                          | Contents                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `01 Reference OpenCode`          | Splash and active-session reproductions, 120×40                                         |
| `02 Reference Crush`             | Wide chat with sidebar and split diff, plus the command-palette overlay, 160×40         |
| `03 Curiosity visual clone`      | The five acceptance frames: splash, active thread, working/tools, error, compact        |
| `04 Visual system and decisions` | Token swatches, CharmTone reference, glyph set, geometry, responsive matrix, no-go list |

### Cell model

Every frame is drawn on a real terminal cell grid rather than as free-form
artwork, so measurements transfer directly to the renderer:

- JetBrains Mono at 15px with a 1.6 line height gives a 9 × 24 px cell.
- A frame captioned `N×M` is exactly `N × 9` by `M × 24` pixels plus the 2-cell
  horizontal and 1-row vertical terminal padding.
- Left rules are 3px inner strokes on the panel itself, not separate glyph
  columns, so panel padding stays on the cell grid.

### Variable contract

Section 03 binds every color, font, and metric to a `$cu-*` document variable;
no literal hex appears in a Curiosity frame. Retheming is one `SetVariables`
call and touches no nodes. Sections 01 and 02 deliberately use literal values —
they are pinned reference captures and must not move when the theme changes.

The initial values are OpenCode's dark theme verbatim. `$cu-agent` drives the
composer rule, the mode label, and `▣`; `$cu-error` drives the failure rule and
`×`; `$cu-warning` drives the pending `⋯`. Recoloring the identity means
changing those three plus `$cu-accent` — the geometry is unaffected.

### Deviations from the retained screenshots

- The Crush capture contains a terminal rendering artifact where the working
  indicator should be (`D#0@e6aF+Dc=(+c Thinking.`). The reproduction renders the
  intended state, `◈ Thinking...` in Charple, and this note is the record of the
  substitution.
- The Crush reproduction is drawn at 160 columns rather than the capture's
  native width so that the reference prose lines wrap where they do in the
  screenshot.
- Both reproductions sit in window chrome for presentation only. The chrome is
  not part of the target and is absent from the acceptance criteria.
