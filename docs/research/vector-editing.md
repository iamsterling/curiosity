# Vector editing across eight products: point models, handle semantics, booleans, and editing UX — survey for Crafty

Status: research, 2026-08-08. Eight products surveyed, one subagent per
product: **source-cloned reverse engineering** for Inkscape (1.5.x dev,
`eb8e1430`, lib2geom `c7d8378`), FontForge (`aea51e8`), Krita (`51704f4`),
and Boxy SVG (shipped-binary archive; no public source — see §1); **published
material only** for Figma, Affinity Designer, Illustrator, and Sketch. Every
claim in the per-product briefs carries its citation; this report synthesizes
them and draws the Crafty conclusion. Nothing was copied; the concepts below
are extracted under the repository's research policy. Crafty's existing core
is inventoried in §8 (id-keyed point map, fractional order keys, handle modes
corner/free/asymmetric/mirrored, seven validated invertible path commands,
point selection in history, declared pen/node tool seam).

## 1. Provenance corrections (read first)

- **Figma's vector-networks post is Evan Wallace, 2016-02-09** — not Ryan
  Nystrom, not 2018. The data-model deep dive is Jamie Wong, "Delete and Heal
  for Vector Networks", 2016-11-17.
- **Figma's handle vocabulary is `NONE | ANGLE | ANGLE_AND_LENGTH`** (per-vertex
  `handleMirroring`). `MIRRORED`/`ASYMMETRIC` and `handleType` existed only in
  legacy REST API docs and are unverifiable today.
- **"Booleans as a byproduct of the vector network" is not published.** Figma's
  boolean groups are separate non-destructive node types.
- **Boxy SVG has no public source and is proprietary** (verified: no public
  repos; Flathub manifest tags `proprietary`). Its editing engine was
  reverse-engineered from archived shipped binaries (v2.16.4 readable
  Traceur modules; v3.79.3 via string-table decoding) plus the author's
  MIT-published `path-data-polyfill`.
- Inkscape's GitHub mirror is stale; the GitLab clone is authoritative.
  Inkscape removed smart guides itself; the SnapManager taxonomy replaced them.

## 2. The point-type vocabularies converge on a small set

| Concept | Crafty | FontForge | Inkscape | Sketch | Affinity | Figma | Krita |
|---|---|---|---|---|---|---|---|
| Free handles / none | corner / free | corner | cusp | Independent | Sharp | NONE | corner (no flags) |
| Collinear, lengths free | asymmetric | curve | smooth | Mirror angle | Smooth | ANGLE | smooth |
| Collinear, equal length | mirrored | — | symmetric | Mirror angle+length | — | ANGLE_AND_LENGTH | symmetric |
| Derived from neighbours | — | — (auto via cpdef) | auto | — | Smart | — | — |
| One side forced straight | — | tangent | — | — | — | — | — |
| H/V-constrained | — | half-curve | — | — | — | — | — |
| Corner with radius | (cornerRadius ignored) | — | — | Straight + radius | parametric shapes | per-vertex radius | — |

Convergence: every product has **corner / smooth(collinear, lengths free) /
symmetric(equal length)**; the rest are variants. Crafty's four modes cover
the common set; `mirrored` (store only `handleOut`, derive the incoming as
its negation) is exactly Figma's published ANGLE_AND_LENGTH invariant.
Notable gaps: no *auto* mode (authored intent, computed at resolution,
demotes on manual edit — independently discovered in Affinity's Smart nodes
and Inkscape's NODE_AUTO), no *tangent* (a line-join semantic, not a handle
mode), no per-point corner radius.

## 3. Where handle constraints live: the single most transferable lesson

Every serious implementation enforces handle constraints **at the mutation
boundary, not in the stored point**:

- FontForge: point type = a constraint pair + per-handle "user-set" flags
  (`nextcpdef`/`prevcpdef`, serialized), enforced at four chokepoints —
  handle drag (`SPAdjustControl`), spline refit (`SplineRefigure3`),
  topology change (default-compute + join fixup), save/load.
- Krita: constraints live in the edit command (`KoPathControlPointMoveCommand`)
  — smooth drag projects the other handle onto the node+handle line *keeping
  its own length*; symmetric mirrors exactly; the document stores flags only.
- Inkscape: `Handle::move`/`Node::setType`/`fixNeighbors` — one enforcement
  point per type, with invariant repair **deferred until the whole selection
  has moved** (order-independent multi-point results, one transaction).

Crafty's command-only mutation rule is the natural home: point commands must
recompute the paired handle inside the same validated command so invariant
and inverse stay atomic. The per-side "auto" bit (FontForge's `cpdef`) is the
missing primitive — the kernel should store intent (type + which handles are
user-defined) and recompute derived handles, never writing resolved values
back (the authored/resolved invariant, again).

**Derived facts, not stored state:** a line is a degenerate cubic — FontForge
derives `nonextcp` (`handle == me`), Inkscape uses zero-length handles, Boxy
promotes L→C on edit and demotes back on release. Crafty's
`segmentControlPoints` already renders a handle-less segment as a line; there
must never be a separate "straight" flag to desync. Smoothness is also
re-derivable from geometry (collinearity + equal lengths, 2 dp) — Boxy's
inference is the right *display* default, but storing the kind is strictly
better (Boxy's inference silently drifts under floating-point rounding and
cannot express intent).

## 4. Conversion, insertion, deletion

**Conversion is not lossless, and the destructive steps are explicit:**
FontForge's `SPChangePointType` is the reference: corner→curve averages
handle directions then recomputes lengths; curve→corner keeps handles
(lossless); tangent conversion **flattens one adjacent curve** (destroys it).
Krita's type command **rewrites the neighbours' shared handles and snapshots
them for undo** — the record-and-restore pattern for blast radius. Auto-handle
derivation algorithms, all re-derivable: chord-tangent direction with 0.39×
length (FontForge), perpendicular-to-angle-bisector with ⅓ lengths
(Inkscape), ⅓ of adjacent segment length (Krita/Illustrator guidance),
angle-averaging with π-wraparound (FontForge `SPAverageCps`). Crafty's
convert-point-type command must carry this asymmetry: deterministic,
invertible, collateral-snapshotting.

**Insertion is exact de Casteljau everywhere**: the new anchor is the curve
point at t, its handles are the exact sub-spline controls, the neighbours'
handles are replaced by the sub-spline handles, and undo restores the
**pre-split** records. This is precisely the kernel's existing
`insert-path-point` contract (including the pre-split-neighbour inverse).

**Deletion splits into two schools**: no-refit (Krita keeps the neighbours'
surviving CPs as-is; Boxy bridges smooth/sharp) and refit (Figma's
delete-and-heal: odd-degree vertices delete all incident edges, even-degree
pair edges by angular opposites, curved edges sorted by **tangent angle
leaving the vertex**, region loops spliced, curvature approximated by
Schneider `FitCurves`; Inkscape's delete-mode grammar — Del=curve-fit,
Shift=inverse, Alt=break, Ctrl=line, with a 135° flat-cusp threshold).
Min-points guards are universal. If healing lands, Figma's published edge
cases are the spec to implement, not rediscover.

## 5. Booleans: the engine lesson

The surveyed engines: Inkscape's Livarot pipeline (the quality bar), Figma's
non-destructive boolean groups (no published internals), Sketch's funded
VectorBoolean (bezier clipping, documented fragility + flatten warnings),
Affinity's area-based joins + compounds, Illustrator's Pathfinder planar
subdivision + compounds, Boxy's paper.js round-trip (wrapped, no kernel),
Krita's QPainterPath (documented buggy closedness + resolution-scaled
workaround).

**Inkscape's pipeline is the reference architecture**:
exact curve intersections (lib2geom) → flatten to polyline **with backdata**
(every edge remembers `{pathID, pieceID, tStart, tEnd}`) → Bentley–Ottmann
sweepline combine computing winding numbers vs per-operand fill rule →
re-emit **original cubic fragments between cuts**. Results keep bezier
pieces, not polylines. Robustness comes from **quantizing the topology phase
to a 1/512 grid**, not from chasing exact arithmetic. Preconditions are
published and diagnosed everywhere: booleans are area-based (Affinity: "if it
doesn't fill it won't work"), multi-region Intersect fails (Illustrator),
"all objects must intersect" (Affinity) — the loud-on-precondition rule.

**The non-destructive/compound split is universal**: Figma boolean groups,
Affinity compounds (per-member mode, releaseable, Divide excluded),
Illustrator compound shapes (frontmost attributes, irreversible Expand),
Sketch combined shapes (per-member op, flatten = the bake). The merged
outline is a resolution product; the compound is authored state. Flatten is
the destructive bake everywhere, and Sketch publishes the warning when a
result needs holes or disjoint contours. Crafty's boolean engine choice
(own Livarot-style pipeline vs a polygon-sweep library like
Martinez–Rueda–Feit) and the compound node kind are an ADR + schema decision;
the kernel already has flattening and `pointInSubpath`.

## 6. Pen/node UX conventions (all published, adoptable wholesale)

- **Rubber band preview** (Illustrator default-on, Esc ends; Boxy previews
  the pending segment; not a Figma convention).
- **Auto add/delete at anchors** (Illustrator default-on, Shift hover
  temporarily disables, global pref off).
- **Close affordances**: hollow first anchor + circle cursor, click *or drag*
  to close (Illustrator); click the start node (Boxy); hover-dot to connect
  into an existing network (Figma).
- **Click-endpoint-to-convert** for curve↔straight transitions; **C/S-curve
  drag direction semantics**; **45° Shift constraints**; **spacebar
  repositioning** of the just-placed anchor; **one-third-distance handle
  guidance**.
- **Modifier grammar** (live re-evaluation during drag): Ctrl=sharp,
  Shift=smooth, Ctrl+Shift=symmetric (Boxy); Ctrl=angle-snap, Alt=preserve
  length, Shift=link handles (Inkscape); Alt=break symmetry while drawing
  (Krita). **Gesture-driven, not mode-driven**: Krita's single non-modal edit
  tool with click-select, Ctrl-click type cycling, double-click insert,
  drag-segment bend — a closed effect vocabulary triggered by gestures.
- **Screen-constant hit geometry** (÷zoom for grippie radii and tolerances —
  Crafty's rule exactly) and **snapping as a taxonomy**: node-cusp vs
  node-smooth sources, tangent/perpendicular vectors for straight segments
  (Inkscape), screen-px thresholds, selected points excluded as targets.
- **Simplify**: the two-parameter model (Illustrator: Curve Precision +
  Angle Threshold with corner/endpoint exemption, Straight Lines mode, live
  before/after counts) and the threshold+forced-points model with node-count
  rejection (Inkscape); freehand fitting is Schneider's algorithm everywhere
  (Boxy: tolerance 6·smoothing/zoom, committed debounced). **Pencil
  smoothing/stabilizers are capture-time tool effects** — the document stores
  the smoothed geometry and the authored width profile, never the raw input
  or the stabilizer state.
- **Undo**: one gesture = one entry universally; Inkscape's merge-key window
  and Krita's accumulated-delta commands are alternatives to Crafty's
  transaction model, not improvements on it.

## 7. The network question (Figma)

Figma's published model is an **undirected multigraph with edge identity**:
explicit non-directional segments with per-segment tangents
(`tangentStart`/`tangentEnd`, `{0,0}` = a line), regions as lists of loops
over edges with a winding rule, "all enclosed space filled by default, holes
punched explicitly". Published benefits: branch vertices (3+ edges at one
point with independent curvature), duplicate edges, direction-independent
fills, delete-anywhere. Published costs: delete-and-heal complexity (angular
pairing, tangent-angle sorting, curve fitting, region-loop repair) and the
vendor's own warning that the network is "significantly more complicated and
very easy to get wrong". Crafty's subpath model cannot express branches,
duplicate edges, or region records today. The pragmatic middle path: keep the
id-keyed point map and subpaths, add an explicit **edge layer** (point-pair
refs + per-end tangent deltas) that subpaths index into, keep `fillRule`,
add optional region records later — the network as a *generalization* of the
subpath model, exactly as Figma positions it. Two projections, one canonical
form (`vectorPaths` for interchange, `vectorNetwork` for editing) is the
round-trip lesson: the authored form is canonical, the SVG path string is a
boundary projection.

## 8. Crafty's core, mapped (the inventory)

Already shipped and validated by this survey (every product reinvents or
paper over these): stable point ids with fractional order keys (Boxy's
index-based identity is the failure mode this fixes — five separate Z-boundary
special cases); validated invertible commands with pre-split-neighbour
inverses; `mirrored` derivation; degenerate-cubic lines; true-extrema bounds;
point selection in history; the declared pen/node tool seam
(`interaction.ts`), explicitly awaiting "the path ergonomics".

**The deltas the research identifies:**

1. **`set-point-type` command** — the conversion matrix (corner↔curve↔
   symmetric with FontForge's asymmetry: curve→corner lossless, corner→curve
   averages then recomputes, tangent flattens), auto-handle derivation
   (deterministic, invertible, collateral-snapshotting per Krita), the
   per-side auto bit as authored intent, and the demote-on-manual-edit rule
   as an explicit command, not an accident.
2. **Pen/node tool effects** — the interaction vocabulary behind the declared
   seam: click-add, drag-handle with the modifier grammar, insert-on-segment
   (double-click), double-click type cycling, rubber band preview,
   close/join affordances, snapping taxonomy, screen-constant grippies.
3. **Utility commands**: join/average (Illustrator's published semantics),
   simplify (the two-parameter model), break/merge, stroke-to-path —
   each with an inverse, none as one-shot DOM rewrites.
4. **Booleans**: an ADR on the engine (Inkscape-style pipeline as the
   reference), preconditions with diagnostics, and the non-destructive
   compound node kind (authored state; the merged outline is a resolution
   product; flatten is the destructive bake with Sketch's published
   warnings).
5. **The network generalization** — the edge layer + region records decision
   belongs in the vector-editing proposal, with the published costs on the
   table; the subpath-only model suffices until branch authoring is a real
   need.

**Rejected en masse**: index/positional identity (Boxy, Inkscape nodetypes,
FontForge's array-position-as-identity), XML-diff undo with coalescing
windows (a workaround for missing previews), geometry-only inference as the
stored model (Boxy), convert-on-edit arc loss (Boxy/Inkscape — wrong for a
durable document), Qt QPainterPath booleans (documented bugs), paper.js
round-trip feature pipelines (no validation, no inverses), soft constraints
that tolerate "smooth but not smooth" states.

## 9. Sources

Per-product briefs with full citations (files, line numbers, URLs): compiled
2026-08-08 by one researcher per product — Inkscape (cloned GitLab
`eb8e1430`, lib2geom `c7d8378`; `src/ui/tool/node.cpp`,
`src/ui/tools/node-tool.cpp`, `src/path/path-boolop.cpp`,
`src/livarot/ShapeSweep.cpp`), FontForge (cloned `aea51e8`;
`fontforge/splinechar.h`, `splineutil2.c`, `splineutil.c`, `cvaddpoints.c`,
`cvpointer.c`, `cvundoes.c`), Krita (cloned `51704f4`; `libs/flake` —
`KoPathShape.h`, `KoPathPoint.h`, `KoPathSegment.cpp`,
`KoPathControlPointMoveCommand.cpp`, `KoPathPointTypeCommand.cpp`,
`KoPathPointInsertCommand.cpp`, `KoPathTool.cpp`), Boxy SVG (shipped binaries
v2.16.4/v3.1.4/v3.79.3, `path-data-polyfill`), Figma (Wallace 2016, Wong
2016, plugin API docs, `plugin-typings`/`rest-api-spec` git history), Affinity
Designer (official help + Serif forum), Illustrator (Adobe Help + CC2015/CS4
manuals + SIGGRAPH 2015 paper), Sketch (official docs, manual, changelogs,
VectorBoolean provenance).
