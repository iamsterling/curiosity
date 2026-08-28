#!/usr/bin/env bash
# Generates four independent logo concepts for Crafty, sequentially.
# Sequential because the pen CLI binds a fixed socket path (~/.pencil/socket/pencil-cli.sock).
cd "$(dirname "$0")" || exit 1

BRAND='Brand facts (use these, do not invent a palette): Crafty is a professional interface-design environment — an infinite canvas with files, pages, frames, components and design systems, rendered by a custom Rust/WASM/WebGPU engine, and explicitly built to be operated by AI agents as well as humans. Its thesis: the authored document is the truth and the canvas is only a projection of it; every change, human or agent, is a validated, invertible command. Taglines in use: "Stop sketching. Start authoring." and "Give your agents a real document." Palette, non-negotiable: warm amber/brass accent #d9a441, near-black ink #0c0b09, panel #16150f, hairline #2b2921, text #efede4, muted #9a9589. Warm-tinted greys only, never blue-grey. NO gradients from the 2008 web, no purple, no magenta. Typography: system sans, 600 weight headings, tight -0.02em tracking; uppercase mono at 0.22em tracking does a lot of the brand work. Aesthetic: hairlines, precision, dark surfaces, a single amber accent used sparingly like a selection highlight.'

DELIVERABLE='Produce a logo exploration sheet: (1) the icon mark alone, large, on near-black; (2) the horizontal lockup of mark plus the wordmark "Crafty"; (3) a 128px app icon; (4) the mark at 16px and 24px to prove it survives at favicon size. Keep it disciplined and professional — this is a developer tool, not a consumer app.'

run() {
  name="$1"; shift
  echo "=== Generating: $name ==="
  pen --out "concept-$name.pen" \
      --prompt "$BRAND

CONCEPT TO EXPLORE: $1

$DELIVERABLE" \
      --export "concept-$name.png" --export-scale 2
}

run "grippy" 'Build the mark from Crafty'"'"'s own on-canvas selection vocabulary — the single most Crafty-specific shape that already exists in the product. The editor draws a "grippy": a white filled dot with a near-black ring, and an amber core when active. Selection is an axis-aligned bounding box with eight of these handles. Crucially, the brand accent color IS the selection color — the theme accent is read at runtime to tint the on-canvas overlay. So: a logo made of selection handles and a bounding box. Something is selected, and the thing selected is the C or the frame itself. Precision, direct manipulation, "this object is under your control."'

run "tree" 'Build the mark from Crafty'"'"'s core claim that "the tree is the truth." The document is a flat record of stable ids forming a parent/child tree — pages, frames, groups, nodes — and the canvas is merely a projection of that tree. Explore a mark where a structured node tree and a rendered frame are the same object seen two ways: hairline nodes and edges resolving into a solid shape, or a frame whose corner unfolds into its own hierarchy. The idea to land: structure underneath the picture. Not a generic org chart or flowchart.'

run "loom" 'Build the mark from the craft in "Crafty" — the name as craftsmanship and weaving, never as sly or cunning. The codebase already carries this metaphor in its own design tokens: --warp, --undyed, and per-kind dyes (--dye-frame, --dye-component, --dye-token, --dye-text). Explore an interlocking warp-and-weft mark — threads crossing at right angles, an over-under weave, undyed threads picking up the amber dye where they cross. Precise and geometric like a technical drawing, not homespun or rustic. It should read as a grid that is also a woven fabric — which is exactly what a design canvas is.'

run "agent" 'Build the mark from Crafty'"'"'s sharpest differentiator: humans and AI agents converge on one mutation substrate. There is no agent-only write path and no escape hatch that skips validation. Every command is invertible — each accepted change carries its own inverse — and an agent edit is one labelled transaction, one undo step, visible live on the canvas while it happens. Explore a mark about two operators, one document: two strokes or two paths meeting at a single shared anchor point; or a reversible/invertible glyph that reads the same forwards and backwards; or a cursor and a command converging. It must feel like engineering and provenance, not like a chat bubble, a robot, a brain, or sparkles. Absolutely no sparkle/star "AI" cliches.'

echo "=== All concepts complete ==="
