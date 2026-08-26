# Curiosity visual language

Curiosity uses **precision sci-fi minimalism**: quiet at rest, explicit under
focus, and information-dense only when the work requires it. The system keeps
the terminal's directness and negative space without borrowing retro-terminal,
cyberpunk, or decorative HUD conventions.

The executable TUI contract lives in
`apps/custom-harness/src/tui/design-system.ts`. This document defines how those
tokens and patterns extend to future visual surfaces.

## System principles

1. **State creates emphasis.** Accent color belongs to focus, activity, links,
   warnings, and system status—not branding or decoration.
2. **Structure before containers.** Prefer alignment, spacing, a single rail,
   or a thin rule over nested borders and card grids.
3. **Layer near-black surfaces.** Canvas, quiet history, and active input are
   separate layers. Do not make every region flat black or lift it with glow.
4. **Reveal capability in context.** Resting workspaces expose only identity,
   the primary action, and kernel status. Controls and dense instrumentation
   appear when their associated object is focused or active.
5. **Keep geometry stable.** Streaming, status changes, and motion may change
   content or luminance, but should not move surrounding controls.

## Foundations

### Color roles

| Role           | Token               | Value     | Use                               |
| -------------- | ------------------- | --------- | --------------------------------- |
| Canvas         | `canvas`            | `#07090B` | Workspace ground                  |
| Quiet surface  | `surfaceQuiet`      | `#0C1114` | History and secondary regions     |
| Active surface | `surface`           | `#10161A` | Composer and focused instruments  |
| Primary text   | `textPrimary`       | `#E7EDF0` | Content and critical labels       |
| Secondary text | `textSecondary`     | `#9AA8AF` | Supporting hierarchy              |
| Muted text     | `textMuted`         | `#74828A` | Metadata and inactive controls    |
| Structure      | `line`              | `#2A353C` | Rules, rails, and boundaries      |
| Focus/activity | `focus`, `activity` | `#8BD5F7` | Current focus and live work only  |
| Success        | `success`           | `#82C7A5` | Healthy or durable system state   |
| Warning        | `warning`           | `#D7B873` | Attention without failure         |
| Danger         | `danger`            | `#E8847E` | Failed or destructive state       |
| Code           | `code`              | `#A7CFB2` | Inline and block code distinction |

Color never carries state alone. Pair it with a stable label, glyph, or
position. Do not add gradients, broad glow, tinted glass, or extra accents.

### Typography

- **Product and workspace titles:** crisp sans-serif on graphical surfaces;
  terminal-native bold text in the TUI. Use tight but readable display spacing.
- **Body and conversation:** sans-serif for graphical reading surfaces and the
  native terminal face in the TUI. Optimize line length before shrinking type.
- **Metadata, code, and instrumentation:** monospace. Uppercase is reserved for
  short system labels such as `THREAD`, `ACTIVE`, and `KERNEL / DURABLE`.
- **Hierarchy:** establish order through weight, spacing, and contrast. Do not
  use size alone or turn every label into monospace instrumentation.

Graphical surfaces should use an 8 px spacing rhythm with 4 px half-steps. The
TUI maps the same rhythm to character cells and blank rows.

## Reusable primitives

- **Focus rail:** one vertical hairline marking the active or editable object.
  It replaces full focus borders and uses the focus role only while engaged.
- **Quiet surface:** a low-contrast layer for submitted prompts, history, and
  secondary context. It must remain close to the canvas.
- **Rule header:** a short semantic label, title, and optional trailing line.
  Use it to establish a workspace or thread without adding a title card.
- **Status mark:** a dot plus a concise state label. Luminous color is valid
  only for live, healthy, warning, or failed system state.
- **Response receipt:** subdued provenance beneath generated content: surface,
  model or agent, duration, and evidence state as applicable.
- **Context strip:** object-specific controls that appear at focus or hover and
  disappear at rest. Never reserve a permanent toolbar for occasional actions.
- **Instrument row:** dense aligned values with one shared header, not a set of
  independent metric cards.

## Interaction states

| State   | Visual behavior                                                         |
| ------- | ----------------------------------------------------------------------- |
| Rest    | Maximum negative space; muted metadata; no ambient animation            |
| Focus   | Focus rail and relevant controls appear; active surface lifts one layer |
| Active  | One stable activity mark animates; streaming does not reflow controls   |
| Success | Brief semantic confirmation, then return to the resting hierarchy       |
| Warning | Amber label and recovery action; no pulsing or full-surface tint        |
| Failure | Red rail or mark, plain failure language, and one next action           |

## Motion

- Active TUI instrumentation advances at `120ms` per frame.
- Nothing animates merely to make the interface feel alive.
- Transitions on graphical surfaces should generally complete in 140–220 ms
  with ease-out entry and ease-in exit. Layout transitions may take up to
  280 ms when progressive disclosure changes workspace geometry.
- Reduced motion replaces loops with a stable filled mark and removes spatial
  transitions. Information and geometry remain equivalent.

## Workspace behavior

- **Chat:** cap the reading measure, center it within large terminals, keep the
  composer as the only persistent instrument, and attach provenance to replies.
- **Coding:** allow the work canvas to use available width. Reveal navigation,
  diagnostics, and diff controls beside the selected artifact rather than as a
  permanent dashboard.
- **Research:** make claims primary and citations/provenance progressively
  inspectable. Use instrument rows for source status, confidence, and recency.
- **Crafty:** let the artifact dominate. Tool controls form a contextual strip;
  exact values and generation activity use the same status and metadata roles.
- **Agents:** show activity only while work is live. Expand into a dense trace
  on request; keep delegation, authority, and completion receipts explicit.
- **Companion surfaces:** preserve token roles and state behavior, not literal
  TUI glyphs. A rail may become a one-pixel line and a receipt may become a
  compact metadata row, but their semantics remain stable.

## Guardrails

Reject changes that add permanent chrome, decorative grids, oversized borders,
multiple simultaneous accents, unexplained glyphs, idle animation, generic card
collections, or effects that reduce text contrast. Every visible element must
communicate hierarchy, state, affordance, provenance, or content.
