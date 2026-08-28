"use client";

import { useEffect, useState, type ReactNode } from "react";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * A braille spinner at the fps it was tuned for. Returns the resting frame when
 * inactive, so nothing animates before the kernel convenes or after it seals.
 */
function useBraille(frames: readonly string[], active: boolean, fps: number) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setI((v) => (v + 1) % frames.length),
      Math.round(1000 / fps)
    );
    return () => clearInterval(id);
  }, [frames, active, fps]);

  return active ? frames[i % frames.length]! : frames[0]!;
}

const SPINNER = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"] as const;
const SCAN = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃", "▂"] as const;

/** Eased slice: how far `p` has travelled inside `[a, b]`, clamped to 0–1. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export const TASK = "build a pricing card";

const SUBMIT = 0.15;

/** The four layers of the running system — the demo's "seats". */
const LAYERS = ["kernel", "document", "renderer", "store"] as const;
type Layer = (typeof LAYERS)[number] | "system";

/**
 * Read straight from the `@layer` variables in globals.css so this component
 * is never a second copy of the palette.
 */
const theme = {
  text: "var(--text)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  undyed: "var(--undyed)",
  signal: "var(--accent)",
  signalDim: "var(--accent-line)",
  structure: "var(--warp)",
  ok: "var(--success)",
  alert: "var(--danger)",
  revise: "var(--warning)",
  sealed: "var(--dye-token-dim)"
} as const;

/** Post kinds, glyphs and tones — the document's own action vocabulary. */
type Kind =
  | "root"
  | "create"
  | "bind"
  | "instantiate"
  | "commentary"
  | "evidence"
  | "dissent"
  | "vote";

const KIND_GLYPH: Record<Kind, string> = {
  root: "◈",
  create: "▣",
  bind: "◎",
  instantiate: "◆",
  commentary: "·",
  evidence: "≡",
  dissent: "✗",
  vote: "▪"
};

const KIND_TONE: Record<Kind, string> = {
  root: theme.signal,
  create: "var(--dye-frame)",
  bind: "var(--dye-token)",
  instantiate: "var(--dye-component)",
  commentary: theme.muted,
  evidence: theme.faint,
  dissent: theme.alert,
  vote: theme.ok
};

const PHASE_VERB = {
  scaffold: "building the tree",
  discovery: "reading the document",
  definition: "authoring components",
  gates: "weighing the votes",
  execution: "validating writes",
  review: "checking invariants",
  close: "writing the package"
} as const;

const VOICE = {
  busy: "the kernel is across…",
  cancel: "esc  unpick",
  submit: "⏎ commit",
  idle: "document empty",
  working: "authoring",
  ready: "sealed",
  resolved: "committed",
  silent: "still empty"
} as const;

/** The phases, in order. Scroll is divided so every phase gets room to read. */
const OPEN = 0.44;

const PHASES = [
  { name: "scaffold", blurb: PHASE_VERB.scaffold, at: OPEN },
  { name: "discovery", blurb: PHASE_VERB.discovery, at: 0.52 },
  { name: "definition", blurb: PHASE_VERB.definition, at: 0.6 },
  { name: "gates", blurb: PHASE_VERB.gates, at: 0.74 },
  { name: "execution", blurb: PHASE_VERB.execution, at: 0.78 },
  { name: "review", blurb: PHASE_VERB.review, at: 0.85 },
  { name: "close", blurb: PHASE_VERB.close, at: 0.94 }
] as const;

/** What a layer can do to a post. `flag` is `!`. */
type Reactions = { up?: number; down?: number; flag?: number };

type Entry =
  | { at: number; kind: "phase"; name: string; blurb: string }
  | { at: number; kind: "op"; name: string; status: string; state: "ok" | "run" | "fail" }
  | { at: number; kind: "tool"; name: string; args: string; timing: string }
  | { at: number; kind: "user"; text: string }
  | {
      at: number;
      kind: "post";
      id: string;
      /** The post this replies to. Absent means it opens a thread. */
      parent?: string;
      agent: Layer;
      post: Kind;
      body: string[];
      reactions?: Reactions;
      /** Replies folded away under this post — `▸ 3`. */
      fold?: number;
      /** The post the policy gate weighs. */
      gate?: true;
      /** The counter-thread the gate weighs separately. */
      counter?: true;
    }
  | { at: number; kind: "code"; of: string; lang: string; meta: string; lines: string[] }
  | { at: number; kind: "diff"; of: string; lines: [string, string][] }
  | { at: number; kind: "vote"; id: string; of: string; up: number; down: number; summary: string }
  | { at: number; kind: "silence"; seats: string[] }
  | { at: number; kind: "notice"; tone: "ok" | "alert"; label: string; meta: string };

type PostEntry = Extract<Entry, { kind: "post" }>;
type VoteEntry = Extract<Entry, { kind: "vote" }>;

/**
 * The session, beat by beat.
 *
 * The definition phase is the document's own thread tree: a component proposal,
 * a dissent hung off it, evidence hung off the dissent, a counter-argument
 * beside that evidence, and a vote that closes the run. Reaction counts are the
 * ones the gate actually sums: the proposal carries +5/−1 and the counter-thread
 * +1/−3, so the gate reads weight +4 and the counter −2.
 *
 * Copy is budgeted to ~40 columns: the transcript is ~360px wide until the
 * hero's text column collapses, and the spine spends two more columns per level
 * of reply.
 */
const SCRIPT: Entry[] = [
  { at: OPEN, kind: "user", text: "build a pricing card" },

  { at: 0.45, kind: "phase", name: "scaffold", blurb: PHASE_VERB.scaffold },
  { at: 0.46, kind: "op", name: "Goal Setting", status: "done", state: "ok" },
  { at: 0.48, kind: "tool", name: "read", args: "AGENTS.md", timing: "0.1s" },
  { at: 0.5, kind: "op", name: "Context Scan", status: "done", state: "ok" },

  { at: 0.52, kind: "phase", name: "discovery", blurb: PHASE_VERB.discovery },
  { at: 0.53, kind: "op", name: "Intent Confirmation", status: "done", state: "ok" },
  { at: 0.54, kind: "tool", name: "grep", args: "color.*token", timing: "0.4s" },
  {
    at: 0.56,
    kind: "post",
    id: "frame",
    agent: "document",
    post: "create",
    body: ["frame /pricing · four slots"]
  },
  { at: 0.57, kind: "op", name: "Signal Gathering", status: "done", state: "ok" },
  {
    at: 0.58,
    kind: "post",
    id: "rect",
    agent: "document",
    post: "create",
    body: ["rect /card · 320 wide"]
  },
  // Two layers have a place in this phase and have not used it. A stream cannot
  // show that; a forum can, so it does.
  { at: 0.59, kind: "silence", seats: ["kernel", "renderer"] },

  { at: 0.6, kind: "phase", name: "definition", blurb: PHASE_VERB.definition },
  { at: 0.61, kind: "op", name: "Analysis", status: "done", state: "ok" },

  // The thread tree itself — proposal, spec, dissent, evidence, counter, vote.
  {
    at: 0.62,
    kind: "post",
    id: "card",
    agent: "kernel",
    post: "instantiate",
    gate: true,
    body: ["component card · base, wide"],
    reactions: { up: 5, down: 1 }
  },
  {
    at: 0.66,
    kind: "code",
    of: "card",
    lang: "ts",
    meta: "spec",
    lines: ["variants: [base, wide]"]
  },
  {
    at: 0.68,
    kind: "post",
    id: "narrow",
    parent: "card",
    agent: "renderer",
    post: "dissent",
    counter: true,
    body: ["wide breaks below 320px"],
    reactions: { up: 1, down: 3 }
  },
  {
    at: 0.7,
    kind: "post",
    id: "at",
    parent: "narrow",
    agent: "document",
    post: "evidence",
    body: ["frames/pricing.pen:41"]
  },
  {
    at: 0.72,
    kind: "post",
    id: "case",
    parent: "narrow",
    agent: "store",
    post: "commentary",
    body: ["base is the 95% case"]
  },
  {
    at: 0.74,
    kind: "vote",
    id: "carried",
    of: "card",
    up: 5,
    down: 1,
    summary: "card ships with a wide variant"
  },

  { at: 0.745, kind: "op", name: "Planning", status: "done", state: "ok" },
  { at: 0.75, kind: "notice", tone: "ok", label: "gate: validation passed", meta: "+4 · 0 denials" },

  { at: 0.76, kind: "phase", name: "execution", blurb: PHASE_VERB.execution },
  { at: 0.77, kind: "op", name: "Prototype", status: "done", state: "ok" },
  { at: 0.78, kind: "notice", tone: "ok", label: "gate: write pricing.pen", meta: "denylist clear" },
  { at: 0.79, kind: "tool", name: "apply", args: "INSTANTIATE card@pricing", timing: "1.2s" },
  {
    at: 0.8,
    kind: "post",
    id: "instance",
    agent: "kernel",
    post: "instantiate",
    body: ["instance card@pricing · delta 2"]
  },
  {
    at: 0.81,
    kind: "diff",
    of: "instance",
    lines: [
      ["+", "instance card@pricing"],
      ["-", "rect /card duplicated"]
    ]
  },
  {
    at: 0.82,
    kind: "post",
    id: "surface",
    agent: "kernel",
    post: "bind",
    body: ["bind color/surface → card"]
  },
  { at: 0.83, kind: "tool", name: "render", args: "packet · 214 nodes", timing: "2.1ms" },
  { at: 0.84, kind: "op", name: "Main Build", status: "done", state: "ok" },

  { at: 0.85, kind: "phase", name: "review", blurb: PHASE_VERB.review },
  { at: 0.86, kind: "op", name: "Quality Check", status: "done", state: "ok" },
  { at: 0.87, kind: "op", name: "cycle check", status: "none", state: "ok" },
  { at: 0.88, kind: "op", name: "renderer probe", status: "device lost", state: "fail" },
  {
    at: 0.89,
    kind: "post",
    id: "lost",
    agent: "renderer",
    post: "dissent",
    body: ["device lost at packet 17 —", "document untouched"],
    reactions: { flag: 1 }
  },
  { at: 0.91, kind: "notice", tone: "alert", label: "renderer: device lost", meta: "last packet kept" },
  { at: 0.92, kind: "tool", name: "recover", args: "rebuild pipelines", timing: "0.9s" },
  { at: 0.93, kind: "op", name: "Verification", status: "passed", state: "ok" },

  { at: 0.94, kind: "phase", name: "close", blurb: PHASE_VERB.close },
  { at: 0.95, kind: "op", name: "Outcome Summary", status: "done", state: "ok" },
  {
    at: 0.96,
    kind: "post",
    id: "summary",
    agent: "store",
    post: "commentary",
    fold: 3,
    body: ["sealed · one dissent kept"]
  },
  { at: 0.97, kind: "op", name: "Next Steps", status: "done", state: "ok" },
  { at: 0.98, kind: "notice", tone: "ok", label: "document sealed", meta: "pricing.ui · r17" }
];

export const CHAPTERS = [
  { at: 0, index: "00", label: "idle", caption: "A blank document. One kernel, one schema, no state." },
  { at: 0.05, index: "01", label: "intent", caption: "You state the task once — no prompt-engineering ritual." },
  { at: SUBMIT, index: "02", label: "convene", caption: "That's the last instruction it needs. The kernel takes the wheel." },
  { at: OPEN, index: "03", label: "scaffold", caption: "It commits to a goal and reads the tree before a single write." },
  { at: 0.52, index: "04", label: "discovery", caption: "It greps and reads, then names the risks — before proposing." },
  { at: 0.62, index: "05", label: "authoring", caption: "A component is a reference plus a sparse delta — never a copy." },
  { at: 0.68, index: "06", label: "dissent", caption: "The counter-thread is weighed, not averaged away." },
  { at: 0.75, index: "07", label: "gates", caption: "The vote sums to +4. Below the line, nothing advances." },
  { at: 0.78, index: "08", label: "execution", caption: "Writes land as commands. The packet carries no product semantics." },
  { at: 0.88, index: "09", label: "verdict", caption: "The renderer lost the device. The document and the last packet survived." },
  { at: 0.94, index: "10", label: "close", caption: "Canonical, deterministic, versioned — the .ui package." }
] as const;

export function chapterAt(p: number): (typeof CHAPTERS)[number] {
  let current: (typeof CHAPTERS)[number] = CHAPTERS[0]!;
  for (const chapter of CHAPTERS) if (p >= chapter.at) current = chapter;
  return current;
}

const net = (r: Reactions | undefined) => (r?.up ?? 0) - (r?.down ?? 0);
const total = (r: Reactions | undefined) => (r?.up ?? 0) + (r?.down ?? 0) + (r?.flag ?? 0);

/**
 * Every live figure the scene can report, from one pass over `SCRIPT`.
 *
 * The demo and the explainer rail beside it both read this, so a number can
 * never disagree with itself across the two surfaces.
 */
export function sceneStateAt(p: number) {
  const shown = SCRIPT.filter((entry) => p >= entry.at);

  const phaseIndex = PHASES.reduce((acc, phase, i) => (p >= phase.at ? i : acc), -1);
  const phase = PHASES[phaseIndex];
  const nextPhase = PHASES[phaseIndex + 1];

  const posts = shown.filter((e): e is PostEntry => e.kind === "post");

  // Weight is per thread, not a running total: the gate reads the proposal's
  // own +4, and the counter-thread's −2 sits under it as a separate artifact.
  const gated = posts.find((e) => e.gate);
  const counter = posts.find((e) => e.counter);

  return {
    shown,
    phase,
    phaseIndex,
    /** Position inside the current phase — the rail's hairline needs something
     *  that keeps moving between chapter switches. */
    phaseProgress: phase ? seg(p, phase.at, nextPhase?.at ?? 0.98) : 0,
    ops: shown.filter((e) => e.kind === "op").length,
    nodes: posts.length,
    tools: shown.filter((e) => e.kind === "tool").length,
    reactions: posts.reduce((sum, e) => sum + total(e.reactions), 0),
    dissents: posts.filter((e) => e.post === "dissent").length,
    retries: shown.filter((e) => e.kind === "notice" && e.tone === "alert").length,
    weight: net(gated?.reactions),
    counterWeight: net(counter?.reactions),
    /** Revision number for the document, ticking as the run proceeds. */
    revision: Math.round(seg(p, OPEN, 0.98) * 13),
    /** Wall clock for the run. Continuous rather than summed, so the rail has
     *  one figure that never sits still. */
    elapsed: seg(p, OPEN, 0.98) * 16.2
  };
}

/**
 * The spine.
 *
 * One standing thread per open reply, drawn in box characters so depth reads
 * without counting indents. Two columns per level, which puts a post's prose
 * exactly two columns right of its own glyph at every depth.
 *
 * Direct children of a thread root are not indented: the root is the topic, and
 * spending a level on it would cost two columns on every line to say something
 * the phase heading already said. So a depth-0 post has no connector, and its
 * children's connectors start at column 0.
 *
 * Recomputed from the *visible* posts every frame rather than from the finished
 * script, so a reply that is currently the last of its run closes with `╰─` and
 * reopens to `├─` when the next one lands — which is what a live session does.
 */
const BAR = "│ ";
const BLANK = "  ";

type Placed = {
  depth: number;
  /** Connector for the post's own header row. */
  head: string;
  /** Standing threads beside the post's prose, and beside anything it attaches. */
  body: string;
  /** Standing threads on the blank line that opens this post. */
  gutter: string;
};

function placeThreads(
  nodes: readonly { id: string; parent?: string | undefined }[]
): Map<string, Placed> {
  const known = new Set(nodes.map((n) => n.id));
  const children = new Map<string, string[]>();
  const ROOT = "\0";

  for (const node of nodes) {
    // A reply whose parent has not arrived yet stands on its own rather than
    // vanishing — the script never does this, but the render must not depend
    // on that.
    const key = node.parent && known.has(node.parent) ? node.parent : ROOT;
    const list = children.get(key);
    if (list) list.push(node.id);
    else children.set(key, [node.id]);
  }

  const out = new Map<string, Placed>();

  const walk = (parent: string, depth: number, ancestors: readonly boolean[]) => {
    const kids = children.get(parent) ?? [];
    kids.forEach((id, i) => {
      const last = i === kids.length - 1;
      // The depth-0 flag is dropped: that level is not drawn, so it can never
      // contribute a column.
      const standing = ancestors.slice(1).map((wasLast) => (wasLast ? BLANK : BAR));

      const bodySegments = [...standing];
      if (depth > 0) bodySegments.push(last ? BLANK : BAR);
      // The post's own thread, always standing beside its prose.
      bodySegments.push(BAR);

      out.set(id, {
        depth,
        head: depth === 0 ? "" : standing.join("") + (last ? "╰─" : "├─"),
        body: bodySegments.join(""),
        gutter: depth === 0 ? "" : standing.join("") + BAR
      });

      walk(id, depth + 1, [...ancestors, last]);
    });
  };

  walk(ROOT, 0, []);
  return out;
}

/**
 * Glass surfaces. The blur is applied once on the window; everything inside is
 * a translucent tint that composites over that blurred backdrop, so nested
 * `backdrop-filter` (expensive, and buggy when stacked) is never needed.
 */
const glass = {
  window: "rgba(18,17,13,0.76)",
  raised: "rgba(255,255,255,0.05)",
  sunken: "rgba(0,0,0,0.3)",
  edge: "rgba(255,255,255,0.10)",
  edgeSoft: "rgba(255,255,255,0.06)",
  blur: "blur(22px) saturate(150%)"
} as const;

/** One dye per layer — the same four layers the panel names. */
const dyes: Record<Layer, { full: string; dim: string }> = {
  kernel: { full: "var(--dye-frame)", dim: "var(--dye-frame-dim)" },
  document: { full: "var(--dye-token)", dim: "var(--dye-token-dim)" },
  renderer: { full: "var(--dye-text)", dim: "var(--dye-text-dim)" },
  store: { full: "var(--dye-component)", dim: "var(--dye-component-dim)" },
  system: { full: "var(--undyed)", dim: "var(--undyed-dim)" }
};

/**
 * The landing wordmark, one glyph per letter so each can carry a different
 * layer's dye — the mark is literally woven from the four threads.
 */
const LOGO = ["crafty"].join("").split("").map((ch, i) => ({
  ch,
  fill: dyes[LAYERS[i % LAYERS.length]!]!.full
}));

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const CHROME_H = 34;
const BODY_H = 24;
/** One transcript line. Every row is a multiple of it, so the spine lines up. */
const LINE = 19;
/** Rows kept in the DOM. The window shows fewer; the rest run off the top. */
const WINDOW = 22;
/** Vertical air before a row that opens a new block. */
const LEAD = 5;

const ellipsis = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
} as const;

const rowStyle = { display: "flex", alignItems: "center", minWidth: 0 } as const;

/** A run of box characters, held to the mono grid so it lines up column-wise. */
function Spine({ prefix, lines = 1 }: { prefix: string; lines?: number }) {
  if (!prefix) return null;
  return (
    <span
      style={{
        color: theme.structure,
        whiteSpace: "pre",
        flexShrink: 0,
        alignSelf: "stretch"
      }}
    >
      {Array.from({ length: lines }, () => prefix).join("\n")}
    </span>
  );
}

const REACTION = [
  ["up", "↑", theme.ok],
  ["down", "↓", theme.alert],
  ["flag", "!", theme.revise]
] as const;

/** What the council did about a post, hard right on its header row. */
function Reactions({ counts }: { counts?: Reactions | undefined }) {
  if (!counts) return null;
  const shown = REACTION.filter(([key]) => (counts[key] ?? 0) > 0);
  if (shown.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
      {shown.map(([key, glyph, tone]) => (
        <span key={key} style={{ color: tone }}>
          {glyph} {counts[key]}
        </span>
      ))}
    </div>
  );
}

export function EditorDemo({
  p,
  reduced = false,
  compact = false,
  className
}: {
  p: number;
  reduced?: boolean;
  /**
   * Phone layout: the transcript takes the whole window and the side panel is
   * dropped.
   *
   * The panel is a fixed 168px. On a 342px-wide phone that leaves ~140px for
   * the transcript — every post truncates to an ellipsis and the scene stops
   * being readable, which is worse than not showing the panel at all. The
   * transcript is the argument; state and layers are supporting detail.
   */
  compact?: boolean;
  className?: string;
}) {
  const typed = TASK.slice(0, Math.round(seg(p, 0.05, SUBMIT - 0.01) * TASK.length));
  const submitted = p >= SUBMIT;
  const sealed = p >= 0.98;

  // The landing holds through the whole pause and only hands off once the hero
  // copy has almost finished collapsing, so the session never plays behind it.
  const chromeIn = seg(p, 0.4, OPEN);
  const landing = 1 - seg(p, 0.38, 0.43);

  const live = submitted && !sealed && !reduced;
  const speakerFrame = useBraille(SPINNER, live, 8);
  const caretFrame = useBraille(SCAN, live, 14);

  const { shown, phase: currentPhase, phaseIndex, nodes, tools, reactions } = sceneStateAt(p);

  const phaseRail = PHASES.map((_, i) =>
    i < phaseIndex ? "●" : i === phaseIndex ? "◉" : "○"
  ).join("");

  // The renderer's rejection flips the goal glyph to `revise` and back.
  const rejecting = p >= 0.88 && p < 0.92;
  const goalGlyph = !submitted ? "○" : sealed ? "✓" : rejecting ? "↻" : "●";
  const goalTone = !submitted
    ? theme.structure
    : sealed
      ? theme.ok
      : rejecting
        ? theme.revise
        : theme.signal;

  const posts = shown.filter((e): e is PostEntry => e.kind === "post");
  const votes = shown.filter((e): e is VoteEntry => e.kind === "vote");
  // Whoever posted most recently — not the last *seated* layer to post. The
  // renderer speaks during the rejection, so scoping this to `LAYERS` would
  // mark a seat "speaking" through the whole device-loss beat.
  const latest = posts[posts.length - 1];
  const spokenBy = new Set(posts.map((e) => e.agent));

  // The tree is rebuilt from what is on screen, and votes take part in it: a
  // vote is the last child of the post it decides, so it closes that run with
  // `╰─` and the replies above it reopen to `├─`.
  const place = placeThreads([
    ...posts.map((e) => ({ id: e.id, parent: e.parent })),
    ...votes.map((e) => ({ id: e.id, parent: e.of }))
  ]);
  const at = (id: string): Placed => place.get(id) ?? { depth: 0, head: "", body: BAR, gutter: "" };

  // Layers heard from in each phase, so a phase heading can report how much of
  // the system actually used it. Collected up front because the heading is
  // emitted before the posts under it.
  const spokeInPhase = new Map<number, Set<string>>();
  let phaseAt = -1;
  for (const entry of shown) {
    if (entry.kind === "phase") {
      phaseAt = PHASES.findIndex((x) => x.name === entry.name);
      if (!spokeInPhase.has(phaseAt)) spokeInPhase.set(phaseAt, new Set());
    } else if (
      entry.kind === "post" &&
      phaseAt >= 0 &&
      LAYERS.includes(entry.agent as (typeof LAYERS)[number])
    ) {
      spokeInPhase.get(phaseAt)?.add(entry.agent);
    }
  }

  /**
   * The transcript, as rows rather than entries.
   *
   * A post is a header, its prose lines, and whatever it attaches — each one a
   * line on the same grid. Building rows first means the window can be clipped
   * to the newest N of them without a post ever losing its own body.
   */
  const rows: { key: string; lead: boolean; node: ReactNode }[] = [];
  const push = (key: string, node: ReactNode, lead = false) =>
    rows.push({ key, lead, node });

  let seenPhase = -1;
  for (const entry of shown) {
    const key = `${entry.at}-${entry.kind}`;

    if (entry.kind === "phase") {
      seenPhase = PHASES.findIndex((x) => x.name === entry.name);
      const spoke = spokeInPhase.get(seenPhase)?.size ?? 0;
      push(
        key,
        // The rule runs past the column and is clipped — it is texture, not
        // information, so it never needs to be measured.
        <div style={{ ...rowStyle, gap: 8, overflow: "hidden" }}>
          <span style={{ color: theme.signalDim, flexShrink: 0 }}>──</span>
          <span style={{ color: theme.signal, flexShrink: 0 }}>{entry.name}</span>
          <span style={{ color: theme.faint, flexShrink: 0 }}>{entry.blurb}</span>
          {spoke > 0 ? (
            <span style={{ color: theme.muted, flexShrink: 0 }}>{`${spoke}/${LAYERS.length} spoke`}</span>
          ) : null}
          <span
            style={{
              color: theme.structure,
              flex: 1,
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden"
            }}
          >
            {"─".repeat(80)}
          </span>
        </div>,
        true
      );
      continue;
    }

    if (entry.kind === "user") {
      // Not a node in the reply tree — it is the boundary between one piece of
      // work and the next. The document's spine runs down the left of the
      // transcript, yours down the right. Two edges, two parties.
      push(
        key,
        <div style={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              minWidth: 0,
              maxWidth: "82%",
              paddingRight: 8,
              borderRight: `1px solid ${theme.signalDim}`
            }}
          >
            <span style={{ color: theme.undyed }}>you</span>
            <span style={{ color: theme.text, ...ellipsis }}>{entry.text}</span>
          </div>
        </div>,
        true
      );
      continue;
    }

    if (entry.kind === "op") {
      const tone =
        entry.state === "ok" ? theme.ok : entry.state === "fail" ? theme.alert : theme.signal;
      push(
        key,
        <div style={{ ...rowStyle, gap: 8 }}>
          <span style={{ color: tone, width: 10, flexShrink: 0 }}>
            {entry.state === "ok" ? "✓" : entry.state === "fail" ? "✗" : "⢕"}
          </span>
          <span style={{ color: theme.muted, ...ellipsis }}>{entry.name}</span>
          <span style={{ flex: 1, minWidth: 8 }} />
          <span style={{ color: entry.state === "fail" ? tone : theme.faint, flexShrink: 0 }}>
            {entry.status}
          </span>
        </div>
      );
      continue;
    }

    if (entry.kind === "tool") {
      push(
        key,
        <div style={{ ...rowStyle, gap: 8 }}>
          <span style={{ color: theme.signalDim, width: 10, flexShrink: 0 }}>⚒</span>
          <span style={{ color: theme.muted, flexShrink: 0 }}>{entry.name}</span>
          <span style={{ color: theme.faint, ...ellipsis }}>{entry.args}</span>
          <span style={{ flex: 1, minWidth: 8 }} />
          <span style={{ color: theme.ok, flexShrink: 0 }}>✓</span>
          <span style={{ color: theme.faint, flexShrink: 0 }}>{entry.timing}</span>
        </div>
      );
      continue;
    }

    if (entry.kind === "silence") {
      push(
        key,
        <div style={rowStyle}>
          <Spine prefix={BAR} />
          <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
            <span style={{ color: theme.structure, ...ellipsis }}>{entry.seats.join("  ")}</span>
            <span style={{ color: theme.faint, flexShrink: 0 }}>{VOICE.silent}</span>
          </div>
        </div>
      );
      continue;
    }

    if (entry.kind === "notice") {
      const tone = entry.tone === "ok" ? theme.ok : theme.alert;
      push(
        key,
        <div
          style={{
            ...rowStyle,
            gap: 8,
            padding: "3px 8px",
            borderRadius: 5,
            backgroundColor: glass.raised,
            borderLeft: `2px solid ${tone}`,
            overflow: "hidden"
          }}
        >
          <span style={{ color: tone, flexShrink: 0 }}>{entry.tone === "ok" ? "✓" : "✗"}</span>
          <span style={{ color: theme.text, ...ellipsis }}>{entry.label}</span>
          <span style={{ flex: 1, minWidth: 8 }} />
          <span style={{ color: theme.faint, flexShrink: 0 }}>{entry.meta}</span>
        </div>,
        true
      );
      continue;
    }

    if (entry.kind === "code" || entry.kind === "diff") {
      // Hung off the post's own gutter, on the same grid as its prose: the
      // block's rows are exactly `LINE` tall and carry no vertical padding, so
      // the spine beside them repeats line for line.
      const spine = at(entry.of).body;
      const lines = entry.kind === "code" ? entry.lines.length + 1 : entry.lines.length;
      push(
        key,
        <div style={{ display: "flex", minWidth: 0 }}>
          <Spine prefix={spine} lines={lines} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: glass.sunken,
              borderRadius: 4,
              padding: "0 8px",
              overflow: "hidden"
            }}
          >
            {entry.kind === "code" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", color: theme.faint }}>
                  <span>{entry.lang}</span>
                  <span style={ellipsis}>{entry.meta}</span>
                </div>
                {entry.lines.map((line) => (
                  <div key={line} style={{ color: theme.muted, ...ellipsis }}>
                    {line}
                  </div>
                ))}
              </>
            ) : (
              entry.lines.map(([sign, text]) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    gap: 8,
                    color: sign === "+" ? theme.ok : sign === "-" ? theme.alert : theme.muted
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{sign}</span>
                  <span style={ellipsis}>{text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      );
      continue;
    }

    if (entry.kind === "vote") {
      // A vote is not a post with a body — it is the document converging, so it
      // reads as a count and an outcome rather than prose.
      const spot = at(entry.id);
      const outcome = entry.up > entry.down ? "carried" : "fell";
      push(`${key}-gutter`, <Spine prefix={spot.gutter} />);
      push(
        key,
        <div style={rowStyle}>
          <Spine prefix={spot.head} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ color: KIND_TONE.vote, flexShrink: 0 }}>{KIND_GLYPH.vote}</span>
            <span style={{ color: theme.muted, flexShrink: 0 }}>vote</span>
            <span style={{ flex: 1, minWidth: 8 }} />
            <span style={{ color: theme.faint, flexShrink: 0 }}>{`${entry.up} · ${entry.down}`}</span>
            <span style={{ color: outcome === "carried" ? theme.ok : theme.alert, flexShrink: 0 }}>
              {outcome}
            </span>
          </div>
        </div>
      );
      // The selvedge — the finished edge, and the one thing a stream
      // structurally cannot show: that an argument is over, and what it settled.
      if (outcome === "carried") {
        push(
          `${key}-selvedge`,
          <div style={{ ...rowStyle, gap: 8, overflow: "hidden" }}>
            <span style={{ color: theme.ok, flexShrink: 0 }}>━━</span>
            <span style={{ color: theme.ok, flexShrink: 0 }}>{VOICE.resolved}</span>
            <span style={{ color: theme.muted, ...ellipsis }}>{entry.summary}</span>
            <span style={{ color: theme.faint, flexShrink: 0 }}>{`${entry.up}–${entry.down}`}</span>
            <span
              style={{
                color: theme.sealed,
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}
            >
              {"━".repeat(80)}
            </span>
          </div>
        );
      }
      continue;
    }

    // A post: who, what kind, what the session did about it — then its prose,
    // each line carrying the spine so a reply never floats free of its parent.
    const spot = at(entry.id);
    const dye = dyes[entry.agent] ?? dyes.system;
    const speaking = live && latest?.id === entry.id;

    if (spot.depth > 0) push(`${key}-gutter`, <Spine prefix={spot.gutter} />);

    push(
      key,
      <div style={rowStyle}>
        <Spine prefix={spot.head} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ color: KIND_TONE[entry.post], flexShrink: 0 }}>
            {KIND_GLYPH[entry.post]}
          </span>
          <span style={{ color: dye.full, flexShrink: 0 }}>{entry.agent}</span>
          <span style={{ color: theme.faint, flexShrink: 0 }}>{entry.post}</span>
          {entry.fold ? (
            <span style={{ color: theme.structure, flexShrink: 0 }}>{`▸ ${entry.fold}`}</span>
          ) : null}
          {speaking ? (
            <span style={{ color: dye.full, flexShrink: 0, whiteSpace: "pre" }}>{speakerFrame}</span>
          ) : null}
          <span style={{ flex: 1, minWidth: 8 }} />
          <Reactions counts={entry.reactions} />
        </div>
      </div>,
      spot.depth === 0
    );

    entry.body.forEach((line, i) => {
      push(
        `${key}-body-${i}`,
        <div style={{ display: "flex", minWidth: 0 }}>
          <Spine prefix={spot.body} />
          <span style={{ color: theme.muted, flex: 1, minWidth: 0, ...ellipsis }}>{line}</span>
        </div>
      );
    });
  }

  const visible = rows.slice(-WINDOW);

  const weave = (() => {
    const woven = Math.max(0, phaseIndex);
    const active = phaseIndex >= 0 && !sealed ? 1 : 0;
    return { woven, active, pending: PHASES.length - woven - active };
  })();

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        // On a phone the window fills whatever the stage has left rather than
        // asserting a fixed height, so the same markup fits a 667px SE and an
        // 852px Pro without a breakpoint per device.
        // The cap belongs on the window, not on the transcript inside it. With
        // it on the transcript, a stage taller than the content still stretched
        // the window — leaving a band of empty panel below the status bar,
        // inside the border. Capping here lets the window size to its content
        // and stretch only when the stage is shorter than that.
        ...(compact
          ? {
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              maxHeight: `${BODY_H + 6}rem`
            }
          : null),
        borderRadius: 14,
        border: `1px solid ${glass.edge}`,
        backgroundColor: glass.window,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        boxShadow:
          "0 32px 64px -16px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)",
        fontFamily: MONO,
        fontSize: 12,
        lineHeight: `${LINE}px`
      }}
    >
      {/* Header — arrives with the session, absent on the landing */}
      <div
        style={{
          height: CHROME_H * chromeIn,
          opacity: chromeIn,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          overflow: "hidden",
          backgroundColor: glass.raised,
          borderBottom: `1px solid ${glass.edgeSoft}`
        }}
      >
        <span style={{ color: theme.signal }}>◇</span>
        <span style={{ color: theme.text }}>crafty · pricing.ui</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ color: theme.faint, flexShrink: 0, letterSpacing: 1 }}>{phaseRail}</span>
          <span style={{ color: theme.signal, flexShrink: 0 }}>
            {currentPhase?.name ?? "idle"}
          </span>
          <span style={{ color: theme.faint, ...ellipsis }}>
            {currentPhase?.blurb ?? "waiting"}
          </span>
        </div>
        <span style={{ color: theme.faint, fontVariantNumeric: "tabular-nums" }}>
          r{Math.max(1, sceneStateAt(p).revision)}
        </span>
      </div>

      <div
        style={
          compact
            ? // Takes whatever the window has left after the chrome, composer
              // and status row. The ceiling lives on the window itself.
              { position: "relative", flex: 1, minHeight: 0 }
            : { position: "relative", height: `${BODY_H}rem` }
        }
      >
        {/* Landing — the wordmark, woven from the four layer dyes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: landing > 0 ? "flex" : "none",
            opacity: landing,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            pointerEvents: "none"
          }}
          aria-hidden
        >
          <div style={{ display: "flex", gap: 6, fontFamily: MONO, fontSize: 30 }}>
            {LOGO.map((letter, i) => (
              <span key={i} style={{ color: letter.fill }}>
                {letter.ch}
              </span>
            ))}
          </div>
          {/* Padded and centred: at phone width this line is long enough to
              reach both edges and read as escaping the window's border. */}
          <div
            style={{
              color: submitted ? theme.signal : theme.faint,
              padding: "0 14px",
              textAlign: "center"
            }}
          >
            {submitted
              ? "convening the kernel…"
              : "a document is built, not drawn"}
          </div>
        </div>

        {/* Session — transcript beside the panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: chromeIn
          }}
        >
          {/* Transcript, with the spine gutter down its left edge.
              `data-crafty-transcript` carries one rule in globals.css that
              stops the rows shrinking — see there for why.

              No `gap`: inside a thread the spacing is a gutter *row* carrying
              the standing threads, so the spine never breaks between a post and
              its replies. Rows that open a block ask for their own lead. */}
          <div
            data-crafty-transcript
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              overflow: "hidden",
              padding: "10px 10px",
              borderLeft: `1px solid ${theme.structure}`,
              // Rows are contiguous now — no `gap` for the clip to land in — so
              // the oldest one leaves the top sliced through its glyphs. Fading
              // the first line's worth of pixels lets it dissolve instead.
              maskImage: "linear-gradient(to bottom, transparent 0, #000 20px)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 20px)"
            }}
          >
            {visible.length === 0 ? (
              <div style={{ color: theme.faint }}>awaiting task…</div>
            ) : (
              visible.map(({ key, lead, node }, i) => (
                <div key={key} style={i > 0 && lead ? { marginTop: LEAD } : undefined}>
                  {node}
                </div>
              ))
            )}
          </div>

          {/* Panel — the document, the layers, the state. Dropped on phones;
              see `compact`. */}
          <div
            style={{
              // 23 mono columns, which is what `✓ document` plus the widest
              // status word (`speaking`) needs.
              width: 168,
              flexShrink: 0,
              overflow: "hidden",
              display: compact ? "none" : undefined,
              backgroundColor: glass.raised,
              borderLeft: `1px solid ${glass.edgeSoft}`
            }}
          >
            <div style={{ padding: "8px 8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme.faint }}>DOCUMENT</span>
                <span style={{ color: theme.muted }}>{submitted ? "1" : "—"}</span>
              </div>
              {submitted ? (
                <div style={{ marginTop: 7 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: goalTone }}>{goalGlyph}</span>
                    <span style={{ color: theme.text, ...ellipsis }}>pricing card</span>
                  </div>
                  {/* Woven behind, the shed being crossed now, warp still to
                      come — one bar per phase, same seven as the header rail. */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 6,
                      paddingLeft: 13
                    }}
                  >
                    <span style={{ color: theme.faint, ...ellipsis }}>
                      {currentPhase?.name ?? "intake"}
                    </span>
                    <span style={{ flexShrink: 0, whiteSpace: "pre" }}>
                      <span style={{ color: theme.signalDim }}>{"▰".repeat(weave.woven)}</span>
                      <span style={{ color: theme.signal }}>{"▰".repeat(weave.active)}</span>
                      <span style={{ color: theme.structure }}>{"▰".repeat(weave.pending)}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 7, color: theme.faint }}>bare document</div>
              )}
            </div>

            <div style={{ padding: "8px 8px 10px", borderTop: `1px solid ${glass.edgeSoft}` }}>
              <div style={{ color: theme.faint }}>LAYERS</div>
              <div style={{ marginTop: 7 }}>
                {!submitted ? (
                  <div style={{ color: theme.faint }}>stringing the warp…</div>
                ) : (
                  LAYERS.map((layer, i) => {
                    const present = p >= SUBMIT + i * 0.02;
                    const speaking = live && latest?.agent === layer;
                    const spoke = spokenBy.has(layer);
                    const dye = dyes[layer]!;
                    const status = !present
                      ? ""
                      : speaking
                        ? "speaking"
                        : sealed
                          ? "done"
                          : spoke
                            ? "done"
                            : "seated";
                    return (
                      <div
                        key={layer}
                        style={{ display: "flex", justifyContent: "space-between", gap: 4 }}
                      >
                        <span
                          style={{
                            color: !present
                              ? theme.structure
                              : spoke || speaking
                                ? dye.full
                                : theme.muted,
                            ...ellipsis
                          }}
                        >
                          {present ? (speaking ? speakerFrame : spoke ? "✓" : "·") : "·"}{" "}
                          {layer}
                        </span>
                        <span style={{ color: theme.faint, flexShrink: 0 }}>{status}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ padding: "8px 8px 10px", borderTop: `1px solid ${glass.edgeSoft}` }}>
              <div style={{ color: theme.faint }}>STATE</div>
              <div style={{ marginTop: 7 }}>
                {[
                  ["nodes", nodes],
                  ["commands", sceneStateAt(p).ops],
                  ["packets", tools],
                  ["reactions", reactions]
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: theme.muted }}>{label}</span>
                    <span style={{ color: theme.text }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          borderTop: `1px solid ${glass.edgeSoft}`,
          height: CHROME_H + 8,
          backgroundColor: glass.sunken
        }}
      >
        <div
          style={{
            width: 2,
            height: 17,
            backgroundColor: submitted ? theme.signalDim : theme.signal,
            flexShrink: 0
          }}
        />
        <span
          style={{
            color: submitted ? theme.signalDim : theme.signal,
            flexShrink: 0,
            whiteSpace: "pre"
          }}
        >
          {submitted && !sealed ? caretFrame : "›"}
        </span>
        {submitted ? (
          <span style={{ color: theme.faint, ...ellipsis }}>
            {sealed ? "Describe a document…" : VOICE.busy}
          </span>
        ) : (
          <>
            <span style={{ color: theme.text, ...ellipsis }}>{typed}</span>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 14,
                backgroundColor: theme.text,
                animation: "c-caret 1.1s steps(1) infinite",
                flexShrink: 0
              }}
            />
          </>
        )}
        <div style={{ flex: 1, minWidth: 8 }} />
        <span style={{ color: theme.faint, flexShrink: 0, whiteSpace: "pre" }}>
          {submitted && !sealed ? VOICE.cancel : VOICE.submit}
        </span>
      </div>

      {/* Status line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "5px 10px",
          borderTop: `1px solid ${glass.edgeSoft}`,
          backgroundColor: glass.raised
        }}
      >
        {/* Control-key hints are a desktop affordance and the widest thing in
            this row — together with the state they overflow a 375px phone and
            clip at both ends. A phone has no ^r to press, so dropping them is
            both the fix and the more honest render. */}
        {compact
          ? null
          : [
              ["^r", "show document"],
              ["^t", "hide panel"],
              ["^c", "exit"]
            ].map(([keys, label]) => (
              <span key={keys} style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <span style={{ color: theme.muted }}>{keys}</span>
                <span style={{ color: theme.faint }}>{label}</span>
              </span>
            ))}
        <div style={{ flex: 1, minWidth: 8 }} />
        <span style={{ color: submitted ? theme.ok : theme.faint, flexShrink: 0 }}>
          {submitted ? "●" : "○"}
        </span>
        <span
          style={{
            color: submitted && !sealed ? theme.signal : theme.faint,
            flexShrink: 0
          }}
        >
          {sealed ? VOICE.ready : submitted ? VOICE.working : VOICE.idle}
        </span>
      </div>
    </div>
  );
}
