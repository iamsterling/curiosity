// The encoder has no reason to need unsafe: it is pure data transformation over
// owned values. This makes that a compile error rather than a code-review
// convention, so the property survives contributors who did not know it held.
#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;
mod layout;
#[cfg(target_arch = "wasm32")]
use web_sys::HtmlCanvasElement;

/// Runs once when the module is instantiated, before any export is callable.
///
/// A Rust panic on `wasm32-unknown-unknown` aborts into an `unreachable` trap.
/// Without a hook the JS side sees `RuntimeError: unreachable` with no message,
/// no location and no stack — which is unbudgetable to diagnose from an alpha
/// bug report. The hook prints the panic message and a stack trace to the
/// console first.
///
/// This does NOT make panics recoverable: a trapped instance stays poisoned and
/// the host must rebuild the renderer. Not panicking on bad input is handled
/// separately, at the deserialization boundary.
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn resolve_layout(layout_json: &str) -> Result<String, JsValue> {
    layout::resolve_layout_json(layout_json).map_err(|code| JsValue::from_str(&code))
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
pub struct Transform {
    pub a: f64,
    pub b: f64,
    pub c: f64,
    pub d: f64,
    pub e: f64,
    pub f: f64,
}

impl Default for Transform {
    fn default() -> Self {
        Self {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 0.0,
            f: 0.0,
        }
    }
}

fn multiply(parent: Transform, child: Transform) -> Transform {
    Transform {
        a: parent.a * child.a + parent.c * child.b,
        b: parent.b * child.a + parent.d * child.b,
        c: parent.a * child.c + parent.c * child.d,
        d: parent.b * child.c + parent.d * child.d,
        e: parent.a * child.e + parent.c * child.f + parent.e,
        f: parent.b * child.e + parent.d * child.f + parent.f,
    }
}

fn transform_point(point: (f64, f64), transform: Transform) -> (f64, f64) {
    (
        transform.a * point.0 + transform.c * point.1 + transform.e,
        transform.b * point.0 + transform.d * point.1 + transform.f,
    )
}

fn transform_bounds(bounds: Bounds, transform: Transform) -> Bounds {
    let points = [
        transform_point((bounds.x, bounds.y), transform),
        transform_point((bounds.x + bounds.width, bounds.y), transform),
        transform_point((bounds.x, bounds.y + bounds.height), transform),
        transform_point(
            (bounds.x + bounds.width, bounds.y + bounds.height),
            transform,
        ),
    ];
    let min_x = points
        .iter()
        .map(|point| point.0)
        .fold(f64::INFINITY, f64::min);
    let max_x = points
        .iter()
        .map(|point| point.0)
        .fold(f64::NEG_INFINITY, f64::max);
    let min_y = points
        .iter()
        .map(|point| point.1)
        .fold(f64::INFINITY, f64::min);
    let max_y = points
        .iter()
        .map(|point| point.1)
        .fold(f64::NEG_INFINITY, f64::max);
    Bounds {
        x: min_x,
        y: min_y,
        width: max_x - min_x,
        height: max_y - min_y,
    }
}

fn union_bounds(left: Option<Bounds>, right: Bounds) -> Bounds {
    match left {
        None => right,
        Some(left) => {
            let min_x = left.x.min(right.x);
            let min_y = left.y.min(right.y);
            let max_x = (left.x + left.width).max(right.x + right.width);
            let max_y = (left.y + left.height).max(right.y + right.height);
            Bounds {
                x: min_x,
                y: min_y,
                width: max_x - min_x,
                height: max_y - min_y,
            }
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
struct Scene {
    #[serde(default)]
    revision: i64,
    frames: Vec<Frame>,
}

#[derive(Clone, Debug, Deserialize)]
struct Frame {
    id: String,
    bounds: Bounds,
    layers: Vec<Layer>,
}

#[derive(Clone, Debug, Deserialize)]
struct Layer {
    id: String,
    bounds: Bounds,
    #[serde(default)]
    transform: Transform,
    fill: String,
    opacity: f64,
    visible: bool,
    #[serde(rename = "zIndex")]
    z_index: i64,
    #[serde(rename = "cornerRadius", default)]
    corner_radius: Option<f64>,
    #[serde(rename = "type", default)]
    r#type: Option<String>,
    children: Option<Vec<Layer>>,
}

/// Protocol v2 delta. `changedNodeIds` lists the nodes whose subtrees changed.
/// Any id that cannot be located in the active frame forces a full re-encode
/// (the correctness fallback for removals and unknown ids).
#[derive(Clone, Debug, Deserialize)]
struct SceneDelta {
    #[serde(rename = "changedNodeIds")]
    changed_node_ids: Vec<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
struct Viewport {
    #[serde(rename = "panX")]
    pan_x: f64,
    #[serde(rename = "panY")]
    pan_y: f64,
    zoom: f64,
    width: f64,
    height: f64,
    #[serde(rename = "pixelRatio")]
    pixel_ratio: f64,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DrawFillRule {
    NonZero,
    EvenOdd,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DrawPathHandleMode {
    Corner,
    Free,
    Asymmetric,
    Mirrored,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DrawLineCap {
    Butt,
    Round,
    Square,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum DrawLineJoin {
    Miter,
    Round,
    Bevel,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
struct DrawPathHandle {
    dx: f64,
    dy: f64,
}

/// Protocol v3 path point record, mirroring the packet's kernel-neutral shape
/// (draw-protocol.ts `DrawPathPoint`): node-local coordinates, cubic handles
/// and the authored handle mode. `mirrored` stores only `handleOut`, `corner`
/// stores neither — exactly as authored, and exactly how the kernel reads them.
/// The point's `id` is not mirrored: membership is the `subpathId` and the map
/// key, and serde ignores the JSON id.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DrawPathPoint {
    #[serde(rename = "subpathId")]
    subpath_id: String,
    order: String,
    x: f64,
    y: f64,
    #[serde(rename = "handleMode")]
    handle_mode: DrawPathHandleMode,
    #[serde(rename = "handleIn")]
    handle_in: Option<DrawPathHandle>,
    #[serde(rename = "handleOut")]
    handle_out: Option<DrawPathHandle>,
}

/// A subpath is closure plus membership; the subpath's identity is the map
/// key, exactly as in the authored model.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DrawPathSubpath {
    closed: bool,
}

/// Protocol v3 path geometry: point records keyed by id, subpaths with
/// closure. Points carry their membership and order key; the encoder sorts
/// them per subpath by `order` (fixed-width base-62 strings, so string order
/// is numeric order — the kernel's own rule).
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DrawPathGeometry {
    points: HashMap<String, DrawPathPoint>,
    subpaths: HashMap<String, DrawPathSubpath>,
}

/// Optional stroke descriptor on a path command (draw-protocol.ts
/// `DrawStrokeDescriptor`). A path without one renders filled only, so the
/// encoder never invents stroke state that was not encoded.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DrawStrokeDescriptor {
    width: f64,
    caps: DrawLineCap,
    joins: DrawLineJoin,
    dash: Vec<f64>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum OverlayAxis {
    X,
    Y,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum OverlayWeight {
    Minor,
    Major,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OverlayLine {
    axis: OverlayAxis,
    position: f64,
    weight: OverlayWeight,
    /// 0..1 draw opacity (1 at rest) — the level cross-fade lowers it.
    #[serde(default = "one", skip_serializing_if = "is_one")]
    alpha: f64,
}

fn one() -> f64 {
    1.0
}

fn is_one(value: &f64) -> bool {
    *value == 1.0
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OverlayDot {
    x: f64,
    y: f64,
    weight: OverlayWeight,
    #[serde(default = "one", skip_serializing_if = "is_one")]
    alpha: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OverlayGrid {
    lines: Vec<OverlayLine>,
    dots: Option<Vec<OverlayDot>>,
    axes: Option<Vec<OverlayLine>>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OverlayGuide {
    axis: OverlayAxis,
    position: f64,
    visible: bool,
}

/// Kernel-neutral mirror of the host-composed overlay packet
/// (draw-protocol.ts `DrawOverlayPacket`). Only the fields the drawer
/// consumes are mirrored; the rest of the packet (mode, level, minorStep,
/// majorStep) is host bookkeeping that serde ignores on decode. Overlays are
/// renderer state composed by the host after the authored packet (I31) —
/// their drawing moves into the scene, their composition never leaves the
/// host.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OverlayPacket {
    grid: Option<OverlayGrid>,
    guides: Option<Vec<OverlayGuide>>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DrawCall {
    geometry: String,
    #[serde(rename = "nodeId")]
    node_id: String,
    bounds: Bounds,
    transform: Transform,
    fill: [f32; 4],
    opacity: f32,
    #[serde(rename = "zIndex")]
    z_index: i64,
    order: u32,
    #[serde(rename = "path", skip_serializing_if = "Option::is_none")]
    path: Option<DrawPathGeometry>,
    #[serde(rename = "fillRule", skip_serializing_if = "Option::is_none")]
    fill_rule: Option<DrawFillRule>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stroke: Option<DrawStrokeDescriptor>,
    #[serde(rename = "cornerRadius", skip_serializing_if = "Option::is_none")]
    corner_radius: Option<f64>,
    /// Protocol v5 text: the string and its size. The encoder tessellates
    /// glyphs from the embedded font — the packet never carries outlines.
    #[serde(skip_serializing_if = "Option::is_none")]
    text: Option<String>,
    #[serde(rename = "fontSize", skip_serializing_if = "Option::is_none")]
    font_size: Option<f64>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct RenderFrame {
    #[serde(rename = "protocolVersion")]
    protocol_version: u8,
    #[serde(rename = "frameId")]
    frame_id: String,
    viewport: Viewport,
    commands: Vec<DrawCall>,
    #[serde(
        rename = "glassSurfaces",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    glass_surfaces: Vec<GlassSurface>,
    #[serde(rename = "chromeGlass", default, skip_serializing_if = "Vec::is_empty")]
    chrome_glass: Vec<ChromeGlassSurface>,
    #[serde(rename = "selectionBounds", skip_serializing_if = "Option::is_none")]
    selection_bounds: Option<Bounds>,
    #[serde(rename = "documentRevision")]
    document_revision: i64,
    #[serde(rename = "packetRevision")]
    packet_revision: u64,
    #[serde(rename = "packetKind", default = "full_packet_kind")]
    packet_kind: PacketKind,
    #[serde(
        rename = "changedNodeIds",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    changed_node_ids: Vec<String>,
    #[serde(rename = "dirtyRegion", skip_serializing_if = "Option::is_none")]
    dirty_region: Option<Bounds>,
    #[serde(skip_serializing_if = "Option::is_none")]
    overlay: Option<OverlayPacket>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum PacketKind {
    Full,
    Batch,
}

fn full_packet_kind() -> PacketKind {
    PacketKind::Full
}

/// A rect-geometry glass surface from the packet: the composite pass draws it
/// sampling the blur pyramid of the already-rendered scene. Kernel-neutral
/// mirror of draw-protocol.ts `DrawGlassSurface`. `flat` marks a surface the
/// host degraded past the budget cap — it draws as plain tint, never
/// vanishing (the budget's explicit degradation, the overlay precedent).
/// Surfaces are validated at the host boundary (`glassSurfaceError`) before
/// they reach the module; the module still defends with its own hard cap.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct GlassSurface {
    #[serde(rename = "nodeId")]
    node_id: String,
    bounds: Bounds,
    transform: Transform,
    #[serde(rename = "blurRadius")]
    blur_radius: f32,
    tint: [f32; 4],
    saturation: f32,
    refraction: f32,
    opacity: f32,
    #[serde(rename = "zIndex")]
    z_index: i64,
    order: u32,
    #[serde(default, skip_serializing_if = "is_false")]
    flat: bool,
}

/// A screen-anchored chrome glass surface: canvas-relative CSS-px `bounds`
/// (the vertex shader maps them straight to device px via `pixelRatio`, no
/// world affine), the pill's corner `radius`, the spring-integrated squash
/// (`scale_x`/`scale_y`, host-side integration) and the DOM-derived lift
/// states (`pressed`/`hovered`, 0..1). Kernel-neutral mirror of
/// draw-protocol.ts `DrawChromeGlassSurface`. The chrome fragment of the
/// composite shader applies the light model; authored surfaces (screen = 0)
/// are untouched. Chrome surfaces composite after the overlay blit and are
/// validated at the host boundary (`chromeGlassSurfaceError`) before they
/// reach the module, which still defends with its own hard cap.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct ChromeGlassSurface {
    id: String,
    bounds: Bounds,
    radius: f32,
    #[serde(rename = "scaleX")]
    scale_x: f32,
    #[serde(rename = "scaleY")]
    scale_y: f32,
    pressed: f32,
    hovered: f32,
    #[serde(default, skip_serializing_if = "is_false")]
    flat: bool,
}

fn is_false(value: &bool) -> bool {
    !*value
}

/// The composite surface record is 28 f32: `[bounds(4), tint(4),
/// transform(6), saturation, refraction, opacity, level0, level1, mix,
/// flat, screen, radius, scale_x, scale_y, pressed, hovered, pad]`. The
/// WGSL struct layout matches this exactly (the shader's contract test pins
/// the offsets). Pure packing, crate-level so the native test target
/// exercises it (the wasm32-only GPU module is not compiled natively).
///
/// The `screen`..`hovered` fields were the chrome-glass path (liquid-chrome,
/// rejected: the interface bans glass after the performance verdict) —
/// authored surfaces pack them inert (screen = 0, scale = 1, lifts = 0) and
/// the composite shader ignores them. The record stays 28 f32 so the buffer
/// stride and the WGSL struct never drift apart again — the layout-mismatch
/// bug class that blanked the canvas.
#[allow(dead_code)] // consumed by the wasm32-only GPU module and the native tests
pub(crate) mod glass_params {
    use super::{ChromeGlassSurface, GlassSurface, Viewport};

    pub(super) const SURFACE_PARAM_FLOATS: usize = 28;

    /// The demo's look constants, module-side defaults for chrome surfaces
    /// (the packet carries springs and geometry, never the light model).
    pub(super) const CHROME_TINT: [f32; 4] = [1.0, 1.0, 1.0, 0.35];
    pub(super) const CHROME_SATURATION: f32 = 1.0;
    pub(super) const CHROME_OPACITY: f32 = 1.0;

    /// Maps a device-px blur radius onto a pyramid level pair and the
    /// interpolation between them (the pyramid makes glass cheap regardless
    /// of radius: per-surface cost is two samples).
    pub(super) fn pyramid_levels(radius_dev: f32) -> (f32, f32, f32) {
        const RADII: [f32; 5] = [0.0, 8.0, 16.0, 32.0, 64.0];
        let radius = radius_dev.clamp(0.0, RADII[RADII.len() - 1]);
        if radius >= RADII[RADII.len() - 1] {
            return (RADII.len() as f32 - 1.0, RADII.len() as f32 - 1.0, 0.0);
        }
        for index in 0..(RADII.len() - 1) {
            if radius <= RADII[index + 1] {
                let span = RADII[index + 1] - RADII[index];
                let mix = if span > 0.0 {
                    (radius - RADII[index]) / span
                } else {
                    0.0
                };
                return (index as f32, (index + 1) as f32, mix);
            }
        }
        (0.0, 0.0, 0.0)
    }

    /// The 28-f32 surface param record the composite shader reads: `[bounds(4),
    /// tint(4), transform(6), saturation, refraction, opacity, level0, level1,
    /// mix, flat, screen, radius, scale_x, scale_y, pressed, hovered, pad]`.
    /// The shader's struct layout (vec4 @0/@16, mat3x2 @32, scalars @56..108,
    /// one f32 pad to 112) matches this flat record exactly.
    pub(super) fn surface_params(
        surface: &GlassSurface,
        viewport: &Viewport,
        force_flat: bool,
    ) -> [f32; SURFACE_PARAM_FLOATS] {
        let device_radius =
            surface.blur_radius * viewport.zoom as f32 * viewport.pixel_ratio as f32;
        let (level0, level1, mix) = pyramid_levels(device_radius);
        let mut params = [0.0f32; SURFACE_PARAM_FLOATS];
        params[0..4].copy_from_slice(&[
            surface.bounds.x as f32,
            surface.bounds.y as f32,
            surface.bounds.width as f32,
            surface.bounds.height as f32,
        ]);
        params[4..8].copy_from_slice(&surface.tint);
        params[8..14].copy_from_slice(&[
            surface.transform.a as f32,
            surface.transform.b as f32,
            surface.transform.c as f32,
            surface.transform.d as f32,
            surface.transform.e as f32,
            surface.transform.f as f32,
        ]);
        params[14] = surface.saturation;
        params[15] = surface.refraction;
        params[16] = surface.opacity;
        params[17] = level0;
        params[18] = level1;
        params[19] = mix;
        params[20] = if surface.flat || force_flat { 1.0 } else { 0.0 };
        params[21] = 0.0; // screen — authored surfaces stay world-anchored
        params[22] = 0.0; // radius — authored glass is rect geometry
        params[23] = 1.0; // scale_x — rest
        params[24] = 1.0; // scale_y — rest
        params[25] = 0.0; // pressed — no lift
        params[26] = 0.0; // hovered — no lift
        params
    }

    /// The chrome surface param record: screen-anchored (screen = 1), the
    /// pill's corner radius and spring-integrated squash and lifts packed
    /// for real. The light model's tint/saturation are module-side defaults;
    /// `level0`/`level1`/`mix` are inert for chrome (the fragment derives
    /// the progressive levels per-fragment from the bezel distance).
    pub(super) fn chrome_surface_params(
        surface: &ChromeGlassSurface,
        force_flat: bool,
    ) -> [f32; SURFACE_PARAM_FLOATS] {
        let mut params = [0.0f32; SURFACE_PARAM_FLOATS];
        params[0..4].copy_from_slice(&[
            surface.bounds.x as f32,
            surface.bounds.y as f32,
            surface.bounds.width as f32,
            surface.bounds.height as f32,
        ]);
        params[4..8].copy_from_slice(&CHROME_TINT);
        params[8..14].copy_from_slice(&[1.0, 0.0, 0.0, 1.0, 0.0, 0.0]); // identity — unused on screen surfaces
        params[14] = CHROME_SATURATION;
        params[15] = 0.0; // refraction — the chrome fragment displaces itself
        params[16] = CHROME_OPACITY;
        params[17] = 0.0; // level0 — fragment-derived
        params[18] = 0.0; // level1 — fragment-derived
        params[19] = 0.0; // mix — fragment-derived
        params[20] = if surface.flat || force_flat { 1.0 } else { 0.0 };
        params[21] = 1.0; // screen — chrome surfaces are canvas-relative
        params[22] = surface.radius;
        params[23] = surface.scale_x;
        params[24] = surface.scale_y;
        params[25] = surface.pressed;
        params[26] = surface.hovered;
        params
    }
}

/// Glass surfaces draw in `(zIndex, order)` sequence, exactly like scene
/// commands — array order is never trusted (I33).
fn sort_glass_surfaces(surfaces: &mut [GlassSurface]) {
    surfaces.sort_by_key(|surface| (surface.z_index, surface.order));
}

/// The split-encoding gate: a frame splits when it has authored glass
/// (composite between scene and overlay) OR chrome glass (composite after
/// the overlay blit) — chrome-only frames take the split path too, because
/// chrome composites above the overlay, which must render into its own
/// target.
fn needs_split(glass: &[GlassSurface], chrome: &[ChromeGlassSurface]) -> bool {
    !glass.is_empty() || !chrome.is_empty()
}

#[derive(Default)]
struct DrawEncoder {
    draws: Vec<DrawCall>,
}

impl DrawEncoder {
    // clippy::too_many_arguments — a draw call genuinely has this many
    // independent fields; grouping them into a struct here would only move the
    // argument list to the call site.
    #[allow(clippy::too_many_arguments)]
    fn encode_rect(
        &mut self,
        node_id: &str,
        bounds: Bounds,
        transform: Transform,
        fill: [f32; 3],
        opacity: f64,
        z_index: i64,
        order: u32,
    ) {
        self.draws.push(DrawCall {
            geometry: "rect".to_owned(),
            node_id: node_id.to_owned(),
            bounds,
            transform,
            fill: [fill[0], fill[1], fill[2], opacity.clamp(0.0, 1.0) as f32],
            opacity: opacity.clamp(0.0, 1.0) as f32,
            z_index,
            order,
            path: None,
            fill_rule: None,
            stroke: None,
            corner_radius: None,
            text: None,
            font_size: None,
        });
    }

    fn submit(mut self) -> Vec<DrawCall> {
        self.draws.sort_by_key(|draw| (draw.z_index, draw.order));
        self.draws
    }
}

fn parse_hex(value: &str, fallback: [f32; 3]) -> [f32; 3] {
    let Some(hex) = value.strip_prefix('#') else {
        return fallback;
    };
    if hex.len() != 6 || !hex.chars().all(|character| character.is_ascii_hexdigit()) {
        return fallback;
    }
    let channel =
        |start: usize| u8::from_str_radix(&hex[start..start + 2], 16).unwrap_or(0) as f32 / 255.0;
    [channel(0), channel(2), channel(4)]
}

fn build_draw(
    layer: &Layer,
    bounds: Bounds,
    transform: Transform,
    fill: [f32; 3],
    opacity: f32,
    order: u32,
) -> DrawCall {
    DrawCall {
        geometry: "rect".to_owned(),
        node_id: layer.id.clone(),
        bounds,
        transform,
        fill: [fill[0], fill[1], fill[2], opacity],
        opacity,
        z_index: layer.z_index,
        order,
        path: None,
        fill_rule: None,
        stroke: None,
        corner_radius: layer.corner_radius,
        text: None,
        font_size: None,
    }
}

/// The layer's LOCAL geometry: the legacy Scene shape keeps the placement in
/// the bounds (it is a persistence format), so the encoder draws the content
/// at the origin and folds `bounds.x/y` into the transform at encode time —
/// the kernel's authoritative composition (`interaction.ts`).
fn local_bounds(bounds: &Bounds) -> Bounds {
    Bounds {
        x: 0.0,
        y: 0.0,
        width: bounds.width,
        height: bounds.height,
    }
}

fn placement_transform(bounds: &Bounds) -> Transform {
    Transform {
        a: 1.0,
        b: 0.0,
        c: 0.0,
        d: 1.0,
        e: bounds.x,
        f: bounds.y,
    }
}

/// Depth-first path from the frame root to `id`, nearest node first.
fn find_path<'a>(layers: &'a [Layer], id: &str) -> Option<Vec<&'a str>> {
    for layer in layers {
        if layer.id == id {
            return Some(vec![layer.id.as_str()]);
        }
        if let Some(children) = &layer.children {
            if let Some(mut path) = find_path(children, id) {
                path.push(layer.id.as_str());
                return Some(path);
            }
        }
    }
    None
}

/// Traverses layers exactly like the full encoder, but reuses cached world-space
/// draws for clean subtrees. Returns `false` when the cache is inconsistent with
/// the current scene (a clean node has no cached draw), which aborts the batch
/// so the caller can fall back to a full re-encode.
///
/// * `full` — encode every node fresh and collect the complete command list.
/// * `emitted` — full-mode: every draw in traversal order; batch-mode: changed draws only.
/// * `changed_ids` / `dirty_bounds` — batch-mode bookkeeping for the packet.
// clippy::too_many_arguments — acknowledged, deliberately not refactored yet.
// This is the hot traversal and the single place full-encode and batch-encode
// share their logic, which is what makes the batch path provably equal to the
// full path. Folding the parameters into a context struct is the right cleanup,
// but it should land AFTER the differential/property tests that would catch a
// regression in the delta path, not before them.
#[allow(clippy::too_many_arguments)]
fn encode_layers(
    layers: &[Layer],
    inherited_visible: bool,
    parent_transform: Transform,
    selected_id: Option<&str>,
    selection: &mut Option<Bounds>,
    order: &mut u32,
    cache: &mut HashMap<String, DrawCall>,
    emitted: &mut Vec<DrawCall>,
    changed_ids: &mut Vec<String>,
    dirty_bounds: &mut Option<Bounds>,
    dirty_set: &HashSet<String>,
    in_dirty_subtree: bool,
    full: bool,
    viewport: Option<&Viewport>,
) -> bool {
    for layer in layers {
        let visible = inherited_visible && layer.visible;
        // The kernel's authoritative composition (interaction.ts): the node's
        // content is LOCAL geometry and the world transform is
        // parent × translate(bounds.x, y) × transform — the placement rides
        // the transform, rotation happens around the node's own origin, and
        // children land in the parent's transformed space. The legacy Scene
        // shape keeps bounds-with-placement (it is a persistence format), so
        // the placement is folded in HERE, at encode time — never baked into
        // the scene data. This is what makes rendered rects land exactly
        // where the kernel's hit tests and the selection box say they are
        // (the coordinate-model alignment fix — the alternative, changing
        // the scene shape, would break scene.json migration, which reads the
        // placement from bounds).
        let placement = placement_transform(&layer.bounds);
        let transform = multiply(parent_transform, multiply(placement, layer.transform));
        let local = local_bounds(&layer.bounds);
        // Viewport culling: a layer whose WORLD box cannot intersect the
        // viewport is skipped — the encoder's cost scales with what is on
        // screen, not with document size. The SELECTED layer is never culled
        // (its outline must draw even when the box is off-screen), and a
        // culled PARENT still recurses — a child outside the parent's bounds
        // but inside the viewport must draw. Children get their own test.
        let culled = match viewport {
            Some(vp) => {
                selected_id != Some(layer.id.as_str())
                    && !intersects_viewport(&transform_bounds(local, transform), vp)
            }
            None => false,
        };
        let subtree_dirty = full || in_dirty_subtree || dirty_set.contains(&layer.id);
        if subtree_dirty {
            // A dirty node that no longer draws is still part of the batch.
            // Its absence from `emitted` is the retained-state removal signal;
            // omitting the id makes visibility changes indistinguishable from
            // an unchanged node. Descendants inherit the dirty flag, so hiding
            // an ancestor reports every previously drawable descendant too.
            if !full {
                changed_ids.push(layer.id.clone());
            }
            // A dirty node that is no longer drawable must evict its old
            // retained draw. Leaving it cached makes a later batch which
            // touches an unrelated node resurrect this stale draw when the
            // node is clean during traversal.
            if !visible || culled || layer.r#type.as_deref() == Some("text") {
                cache.remove(&layer.id);
            }
            if visible {
                // Text layers draw through the packet's text commands (the
                // host's overlay channel, protocol v5): their scene rect is
                // invisible scaffolding — the encoder never draws the solid
                // box the legacy scene shape would otherwise produce. Order
                // slots still advance so the glyph draws interleave exactly
                // where the text layer sits.
                if layer.r#type.as_deref() != Some("text") && !culled {
                    let opacity = layer.opacity.clamp(0.0, 1.0) as f32;
                    let draw = build_draw(
                        layer,
                        local,
                        transform,
                        parse_hex(&layer.fill, [0.4, 0.4, 0.42]),
                        opacity,
                        *order,
                    );
                    cache.insert(layer.id.clone(), draw.clone());
                    emitted.push(draw.clone());
                    if !full {
                        *dirty_bounds = Some(union_bounds(
                            *dirty_bounds,
                            transform_bounds(local, transform),
                        ));
                    }
                }
                *order += 1;
            }
            if selected_id == Some(layer.id.as_str()) && visible {
                *selection = Some(transform_bounds(local, transform));
            }
        } else {
            if visible {
                // Text layers have no cached rect (see the dirty branch): the
                // batch path must not treat their absence as a cache miss.
                if layer.r#type.as_deref() != Some("text") && !culled {
                    let Some(cached) = cache.get(&layer.id) else {
                        return false;
                    };
                    if selected_id == Some(layer.id.as_str()) {
                        *selection = Some(transform_bounds(local, cached.transform));
                    }
                }
                *order += 1;
            }
        }
        if let Some(children) = &layer.children {
            if !encode_layers(
                children,
                visible,
                transform,
                selected_id,
                selection,
                order,
                cache,
                emitted,
                changed_ids,
                dirty_bounds,
                dirty_set,
                subtree_dirty,
                full,
                viewport,
            ) {
                return false;
            }
        }
    }
    true
}

/// Structured render-path failure: `VELLO_RENDER_FAILED:<stage>[:<detail>]`.
/// The stage is a stable machine-readable key; detail carries the underlying
/// wgpu/vello error for the diagnostic message. The host maps these strings
/// onto the failure-policy vocabulary (`failure-policy.ts`) — the module
/// reports strings, the policy file is the only producer of diagnostics.
const VELLO_RENDER_FAILED: &str = "VELLO_RENDER_FAILED";

/// The glass composite pass uses the same structured module error channel as
/// Vello presentation. Native encoder tests do not exercise this wasm-only
/// path, hence the dead-code allowance on the host test build.
#[allow(dead_code)]
const GLASS_COMPOSITE_FAILED: &str = "GLASS_COMPOSITE_FAILED";

fn intersects_viewport(bounds: &Bounds, viewport: &Viewport) -> bool {
    let zoom = viewport.zoom.max(f64::EPSILON);
    let world_left = -viewport.pan_x / zoom;
    let world_top = -viewport.pan_y / zoom;
    let world_right = world_left + viewport.width / zoom;
    let world_bottom = world_top + viewport.height / zoom;
    bounds.x < world_right
        && bounds.x + bounds.width > world_left
        && bounds.y < world_bottom
        && bounds.y + bounds.height > world_top
}

/// The layer's world box, for culling and dirty-region bookkeeping.
fn render_error(stage: &str, detail: Option<&str>) -> String {
    match detail {
        Some(detail) => format!("{VELLO_RENDER_FAILED}:{stage}:{detail}"),
        None => format!("{VELLO_RENDER_FAILED}:{stage}"),
    }
}

#[allow(dead_code)]
fn glass_error(prefix: &str, detail: &str) -> String {
    format!("{prefix}:{detail}")
}

/// Little-endian host-order f32 bytes for buffer uploads (the module's only
/// byte-level write; avoids a bytemuck-style dependency for one cast).
/// Production uploads are wasm32-only; native tests compile the helper with
/// the present module.
#[cfg(any(target_arch = "wasm32", test))]
#[cfg_attr(test, allow(dead_code))]
fn f32_bytes(values: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(values.len() * 4);
    for value in values {
        bytes.extend_from_slice(&value.to_ne_bytes());
    }
    bytes
}

/// The surface and offscreen size in device pixels: the packet's CSS-px
/// viewport scaled by its pixel ratio, floored and clamped to at least one
/// pixel. Exactly the size the retired host wrote onto the canvas
/// (`Math.max(1, Math.floor(size * pixelRatio))`), so the surface always
/// matches the backing store the host sized. The packet is the single source
/// of truth; the module never reads canvas CSS.
fn device_size(viewport: &Viewport) -> (u32, u32) {
    (
        (viewport.width * viewport.pixel_ratio).floor().max(1.0) as u32,
        (viewport.height * viewport.pixel_ratio).floor().max(1.0) as u32,
    )
}

#[wasm_bindgen]
pub struct RendererCore {
    scene: Option<Scene>,
    frame_id: Option<String>,
    viewport: Viewport,
    selected_layer_id: Option<String>,
    packet_revision: u64,
    pending_delta: Option<Vec<String>>,
    draw_cache: HashMap<String, DrawCall>,
    #[cfg(target_arch = "wasm32")]
    gpu: Option<wgpu_present::PresentState>,
    /// Devices replaced by the recovery path. Retained, never dropped: wgpu
    /// 29's wasm `WebDevice::drop` is a no-op, so the browser-side GPUDevice
    /// keeps `onuncapturederror` and the `lost()` promise reactions registered
    /// after the Rust device is gone, and a replaced device can still deliver
    /// late events (validation errors from in-flight work, device-lost
    /// resolution). Dropping the Rust `Closure`s behind those registrations
    /// while the browser still holds them throws wasm-bindgen's "closure
    /// invoked recursively or after being dropped" on the next event
    /// (wasm-bindgen#3294). Keeping the dead state alive keeps every
    /// registered closure slot valid for the module's lifetime; the cost is a
    /// handful of Rust-side handles per device loss, which is rare.
    #[cfg(target_arch = "wasm32")]
    retired_gpus: Vec<wgpu_present::PresentState>,
    #[cfg(target_arch = "wasm32")]
    error_callback: Option<js_sys::Function>,
}

#[wasm_bindgen]
impl RendererCore {
    // clippy::new_without_default — `new` is the JS-facing constructor exported
    // by wasm-bindgen. A Rust `Default` impl would be an unused second entry
    // point into a type that is only ever constructed from the host.
    #[allow(clippy::new_without_default)]
    #[wasm_bindgen(constructor)]
    pub fn new() -> RendererCore {
        RendererCore {
            scene: None,
            frame_id: None,
            viewport: Viewport {
                pan_x: 0.0,
                pan_y: 0.0,
                zoom: 1.0,
                width: 0.0,
                height: 0.0,
                pixel_ratio: 1.0,
            },
            selected_layer_id: None,
            packet_revision: 0,
            pending_delta: None,
            draw_cache: HashMap::new(),
            #[cfg(target_arch = "wasm32")]
            gpu: None,
            #[cfg(target_arch = "wasm32")]
            retired_gpus: Vec::new(),
            #[cfg(target_arch = "wasm32")]
            error_callback: None,
        }
    }

    pub fn set_scene(
        &mut self,
        scene_bytes: &[u8],
        frame_id: &str,
        delta_json: Option<String>,
    ) -> Result<(), JsValue> {
        let scene: Scene = serde_json::from_slice(scene_bytes)
            .map_err(|error| JsValue::from_str(&format!("Scene decode failed: {error}")))?;
        if !scene.frames.iter().any(|frame| frame.id == frame_id) {
            return Err(JsValue::from_str("Scene frame was not found."));
        }
        self.pending_delta = match delta_json {
            None => None,
            Some(json) => match serde_json::from_str::<SceneDelta>(&json) {
                Err(_) => None,
                Ok(delta) => {
                    let mut ids: Vec<String> = Vec::new();
                    let mut seen: HashSet<String> = HashSet::new();
                    for id in delta.changed_node_ids {
                        if id.is_empty() || !seen.insert(id.clone()) {
                            continue;
                        }
                        ids.push(id);
                    }
                    if ids.is_empty() {
                        None
                    } else {
                        Some(ids)
                    }
                }
            },
        };
        if let Some(frame) = scene
            .frames
            .iter()
            .find(|candidate| candidate.id == frame_id)
        {
            if let Some(delta) = self.pending_delta.as_ref() {
                if delta
                    .iter()
                    .any(|id| find_path(&frame.layers, id).is_none())
                {
                    self.pending_delta = None;
                }
            }
        }
        self.scene = Some(scene);
        self.frame_id = Some(frame_id.to_owned());
        Ok(())
    }

    pub fn set_viewport(
        &mut self,
        pan_x: f64,
        pan_y: f64,
        zoom: f64,
        width: f64,
        height: f64,
        pixel_ratio: f64,
    ) -> Result<(), JsValue> {
        let values = [pan_x, pan_y, zoom, width, height, pixel_ratio];
        if !values.iter().all(|value| value.is_finite())
            || zoom <= 0.0
            || width <= 0.0
            || height <= 0.0
            || pixel_ratio <= 0.0
        {
            return Err(JsValue::from_str("Viewport values are invalid."));
        }
        self.viewport = Viewport {
            pan_x,
            pan_y,
            zoom,
            width,
            height,
            pixel_ratio,
        };
        Ok(())
    }

    pub fn set_selection(&mut self, selected_layer_id: Option<String>) {
        self.selected_layer_id = selected_layer_id;
    }

    pub fn render(&mut self) -> Result<String, JsValue> {
        let scene = self
            .scene
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Scene is not initialized."))?;
        let frame_id = self
            .frame_id
            .as_ref()
            .ok_or_else(|| JsValue::from_str("Frame is not initialized."))?;
        let frame = scene
            .frames
            .iter()
            .find(|candidate| &candidate.id == frame_id)
            .ok_or_else(|| JsValue::from_str("Scene frame was not found."))?;
        let document_revision = scene.revision;
        self.packet_revision += 1;

        let mut batch = None;
        if let Some(delta_ids) = self.pending_delta.take() {
            if let Some(dirty_set) = self.collect_dirty_set(frame, &delta_ids) {
                let mut emitted: Vec<DrawCall> = Vec::new();
                let mut changed_ids: Vec<String> = Vec::new();
                let mut dirty_bounds: Option<Bounds> = None;
                let mut selection = None;
                let mut order = 1;
                let consistent = encode_layers(
                    &frame.layers,
                    true,
                    Transform::default(),
                    self.selected_layer_id.as_deref(),
                    &mut selection,
                    &mut order,
                    &mut self.draw_cache,
                    &mut emitted,
                    &mut changed_ids,
                    &mut dirty_bounds,
                    &dirty_set,
                    false,
                    false,
                    Some(&self.viewport),
                );
                if consistent {
                    batch = Some((emitted, changed_ids, dirty_bounds, selection));
                }
            }
        }

        let (commands, changed_node_ids, dirty_region, selection_bounds) = match batch {
            Some((emitted, changed_ids, dirty_bounds, selection)) => {
                (emitted, changed_ids, dirty_bounds, selection)
            }
            None => {
                let mut encoder = DrawEncoder::default();
                encoder.encode_rect(
                    &frame.id,
                    frame.bounds,
                    Transform::default(),
                    [0.11, 0.11, 0.12],
                    1.0,
                    i64::MIN,
                    0,
                );
                let mut selection = None;
                let mut order = 1;
                let mut emitted: Vec<DrawCall> = Vec::new();
                let mut changed_ids: Vec<String> = Vec::new();
                let mut dirty_bounds: Option<Bounds> = None;
                let consistent = encode_layers(
                    &frame.layers,
                    true,
                    Transform::default(),
                    self.selected_layer_id.as_deref(),
                    &mut selection,
                    &mut order,
                    &mut self.draw_cache,
                    &mut emitted,
                    &mut changed_ids,
                    &mut dirty_bounds,
                    &HashSet::new(),
                    false,
                    true,
                    Some(&self.viewport),
                );
                debug_assert!(consistent);
                let mut commands = encoder.submit();
                commands.append(&mut emitted);
                commands.sort_by_key(|draw| (draw.z_index, draw.order));
                (commands, Vec::new(), None, selection)
            }
        };

        serde_json::to_string(&RenderFrame {
            protocol_version: 5,
            frame_id: frame_id.clone(),
            viewport: self.viewport,
            commands,
            glass_surfaces: Vec::new(),
            chrome_glass: Vec::new(),
            selection_bounds,
            document_revision,
            packet_revision: self.packet_revision,
            packet_kind: if changed_node_ids.is_empty() {
                PacketKind::Full
            } else {
                PacketKind::Batch
            },
            changed_node_ids,
            dirty_region,
            overlay: None,
        })
        .map_err(|error| JsValue::from_str(&format!("Render submission failed: {error}")))
    }

    /// Encodes a version-3 packet JSON into a `vello_encoding::Encoding` and
    /// returns deterministic evidence about it: total encoded bytes and the
    /// stream fingerprint. Headless — no device, no surface; this is the
    /// encode-level parity hook (task 7.1) and keeps the encoder reachable in
    /// the wasm module so module-size records measure the real dependency
    /// cost. Non-finite input fails with `VELLO_ENCODE_FAILED:<node>:<field>`.
    pub fn encode_frame(&mut self, frame_json: &str) -> Result<String, JsValue> {
        let frame: RenderFrame = serde_json::from_str(frame_json)
            .map_err(|error| JsValue::from_str(&format!("Frame decode failed: {error}")))?;
        let encoding =
            vello_encoder::encode_frame(&frame.commands, &frame.viewport, frame.overlay.as_ref())
                .map_err(|error| JsValue::from_str(&error.to_string()))?;
        Ok(format!(
            "{{\"bytes\":{},\"fingerprint\":\"{:016x}\",\"paths\":{},\"segments\":{}}}",
            vello_encoder::encoded_bytes(&encoding),
            vello_encoder::stream_fingerprint(&encoding),
            encoding.n_paths,
            encoding.n_path_segments
        ))
    }

    fn collect_dirty_set(&self, frame: &Frame, delta_ids: &[String]) -> Option<HashSet<String>> {
        let mut dirty = HashSet::new();
        for id in delta_ids {
            let path = find_path(&frame.layers, id)?;
            for node_id in path {
                dirty.insert(node_id.to_owned());
            }
        }
        Some(dirty)
    }

    /// Registers the host callback that receives module diagnostics. One
    /// callback serves both wgpu error surfaces: device loss and uncaptured
    /// validation/internal errors. It must be registered before
    /// `init_canvas`: device loss can fire at any point after `requestDevice`,
    /// and a renderer that loses its device silently is a blank canvas with no
    /// diagnostic. The module only reports strings; the host maps them onto
    /// the failure-policy vocabulary (`failure-policy.ts`).
    #[cfg(target_arch = "wasm32")]
    pub fn set_error_callback(&mut self, callback: js_sys::Function) {
        self.error_callback = Some(callback);
    }

    /// Creates the module-owned wgpu device, the canvas surface and Vello's
    /// renderer — the react-vello model (Decision 2): from here on the module
    /// owns device, surface, render and present, and the only per-frame
    /// crossing is the packet. The canvas element is handed over once.
    ///
    /// Calling this again after a device loss is the recovery path: a fresh
    /// device and its resources replace the failed one. The failed state is
    /// *retained*, never dropped — wgpu's wasm backend cannot unregister the
    /// browser-side error listeners (`WebDevice::drop` is a no-op), so a
    /// replaced device may still deliver events, and a dropped closure slot
    /// would throw wasm-bindgen's "closure invoked recursively or after being
    /// dropped" when the browser fires it. Retained devices are dead Rust
    /// handles whose registrations stay valid for the module's lifetime.
    #[cfg(target_arch = "wasm32")]
    pub async fn init_canvas(&mut self, canvas: HtmlCanvasElement) -> Result<(), JsValue> {
        let error_callback = self
            .error_callback
            .clone()
            .ok_or_else(|| JsValue::from_str(&render_error("init", Some("callback"))))?;
        let gpu = wgpu_present::init(canvas, error_callback)
            .await
            .map_err(|error| JsValue::from_str(&error))?;
        if let Some(previous) = self.gpu.replace(gpu) {
            self.retired_gpus.push(previous);
        }
        Ok(())
    }

    /// Encodes a version-3 packet into the Vello scene, renders it on the
    /// module-owned device into the offscreen target, and presents it to the
    /// surface. One crossing per frame: the packet, JS → WASM. No pixels
    /// return to the host. Fails with `VELLO_ENCODE_FAILED:<node>:<field>` for
    /// a packet the encoder rejects and `VELLO_RENDER_FAILED:<stage>[:<detail>]`
    /// for GPU failures; on failure nothing is presented, so the surface keeps
    /// showing the last valid frame.
    pub fn render_packet(&mut self, frame_json: &str) -> Result<(), JsValue> {
        self.render_packet_inner(frame_json)
            .map_err(|error| JsValue::from_str(&error))
    }

    /// Test-artifact-only ADR 0024 A/B fixture. This export is absent from the
    /// ordinary WASM artifact; `scripts/vello-text-pixel-oracle.mjs` builds a
    /// separate feature-gated module in a temporary directory.
    #[cfg(all(target_arch = "wasm32", feature = "pixel-oracle"))]
    pub fn render_text_pixel_oracle(&mut self, mode: &str) -> Result<String, JsValue> {
        let fixture =
            text_pixel_oracle::fixture(mode).map_err(|error| JsValue::from_str(&error))?;
        let gpu = self
            .gpu
            .as_mut()
            .ok_or_else(|| JsValue::from_str(&render_error("device-not-initialized", None)))?;
        gpu.render_and_present(
            fixture.encoding,
            None,
            &[],
            &[],
            &fixture.viewport,
            fixture.size,
        )
        .map_err(|error| JsValue::from_str(&error))?;
        Ok(fixture.metadata)
    }

    #[cfg(all(target_arch = "wasm32", feature = "pixel-oracle"))]
    pub fn pixel_oracle_adapter_info(&self) -> Result<String, JsValue> {
        wgpu_present::adapter_info_json().map_err(|error| JsValue::from_str(&error))
    }

    /// The device-loss recovery path. Unlike a plain re-`init_canvas` (which
    /// REUSES the shared device — correct for a remount, wrong for a dead
    /// device), this resets the shared GPU stack so the next init builds a
    /// fresh device. The reset runs before the new request chain, so the new
    /// requestAdapter cannot race anything: the original chain settled long
    /// ago, and a settled promise cannot be cancelled (the two-concurrent-
    /// requests mechanism behind the closure panic).
    #[cfg(target_arch = "wasm32")]
    pub async fn recover_canvas(&mut self, canvas: HtmlCanvasElement) -> Result<(), JsValue> {
        wgpu_present::reset_shared_gpu();
        self.init_canvas(canvas).await
    }
}

/// The packet-driven render path, separate from the wasm edge so it is
/// testable headless: it returns the module's structured error string instead
/// of a `JsValue` (which cannot be constructed off-wasm — renderer-build.md
/// known gap 3).
impl RendererCore {
    fn render_packet_inner(&mut self, frame_json: &str) -> Result<(), String> {
        let mut frame: RenderFrame = serde_json::from_str(frame_json)
            .map_err(|error| format!("Frame decode failed: {error}"))?;
        let size = device_size(&frame.viewport);
        // Glass surfaces draw in (zIndex, order) sequence like scene commands
        // — re-sort every packet, never trust array order (I33). Chrome
        // surfaces draw in array order (screen space has no z-index).
        sort_glass_surfaces(&mut frame.glass_surfaces);
        let (encoding, overlay_encoding) =
            encode_packet_layers(&frame, &frame.glass_surfaces, &frame.chrome_glass)?;
        let glass = frame.glass_surfaces;
        let chrome = frame.chrome_glass;
        #[cfg(target_arch = "wasm32")]
        {
            let gpu = self
                .gpu
                .as_mut()
                .ok_or_else(|| render_error("device-not-initialized", None))?;
            gpu.render_and_present(
                encoding,
                overlay_encoding,
                &glass,
                &chrome,
                &frame.viewport,
                size,
            )
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            let _ = (encoding, overlay_encoding, glass, chrome, size);
            // The native build has no surface; report the same structured
            // error a wasm build reports before init_canvas succeeds.
            Err(render_error("device-not-initialized", None))
        }
    }
}

fn encode_packet_layers(
    frame: &RenderFrame,
    glass: &[GlassSurface],
    chrome: &[ChromeGlassSurface],
) -> Result<(vello_encoding::Encoding, Option<vello_encoding::Encoding>), String> {
    if needs_split(glass, chrome) {
        // Glass and chrome need separate scene/overlay encodings so the
        // composite can sit between authored content and editor chrome.
        let encoding = vello_encoder::encode_scene_frame(
            &frame.commands,
            &frame.viewport,
            frame.overlay.as_ref(),
        )
        .map_err(|error| error.to_string())?;
        let overlay_encoding =
            vello_encoder::encode_overlay_frame(&frame.viewport, frame.overlay.as_ref())
                .map_err(|error| error.to_string())?;
        Ok((encoding, Some(overlay_encoding)))
    } else {
        let encoding =
            vello_encoder::encode_frame(&frame.commands, &frame.viewport, frame.overlay.as_ref())
                .map_err(|error| error.to_string())?;
        Ok((encoding, None))
    }
}

/// Encodes the version-3 packet into a `vello_encoding::Encoding` — the scene
/// model the wgpu renderer consumes (`Scene::from(Encoding)`). One seam:
/// everything the renderer draws comes from the packet, in `(zIndex, order)`
/// sequence, with overlays appended after the authored content. Overlays stay
/// renderer state composed by the host (I31); only their drawing lives here.
///
/// Non-finite transforms and coordinates are rejected at the boundary —
/// vello#470 documents that a NaN or overflowing float value drops a scene to
/// ~12fps, so the encoder fails loudly (`VELLO_ENCODE_FAILED`) instead of
/// producing a slow blank canvas. The finiteness check also covers f64 values
/// that overflow the f32 the encoding streams are stored in: `1e300` is
/// finite as f64 but becomes inf in the stream, the same failure class.
mod vello_encoder;

mod text;

#[cfg(feature = "pixel-oracle")]
mod text_pixel_oracle;

#[cfg(any(target_arch = "wasm32", test))]
#[cfg_attr(test, allow(dead_code))]
mod wgpu_present;

#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
pub(crate) fn offscreen_texture_usage() -> wgpu::TextureUsages {
    wgpu::TextureUsages::STORAGE_BINDING
        | wgpu::TextureUsages::TEXTURE_BINDING
        | wgpu::TextureUsages::RENDER_ATTACHMENT
        | wgpu::TextureUsages::COPY_SRC
}

#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
pub(crate) fn glass_quad_buffer_usage() -> wgpu::BufferUsages {
    wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::{
        encode_packet_layers, find_path, needs_split, sort_glass_surfaces, transform_bounds,
        transform_point, vello_encoder, Bounds, DrawCall, DrawEncoder, Layer, OverlayPacket,
        RenderFrame, RendererCore, Scene, Transform,
    };
    use serde_json::Value;

    #[test]
    fn overlay_blit_uses_vello_output_alpha_convention() {
        assert_eq!(
            super::wgpu_present::overlay_blit_blend_state(),
            wgpu::BlendState::ALPHA_BLENDING
        );
    }

    /// Every shipped WGSL must parse and pass naga's full validator. This
    /// catches syntax, type, and layout failures before browser execution, but
    /// pinned naga does not enforce fragment derivative-uniformity rules; real
    /// browser WebGPU validation remains the oracle for those. The composite's
    /// storage-buffer layout (the 28-f32 surface record) is validated here.
    #[test]
    fn shipped_wgsl_shaders_parse_and_validate() {
        for (name, source) in [
            ("glass-blur.wgsl", include_str!("glass-blur.wgsl")),
            ("glass-composite.wgsl", include_str!("glass-composite.wgsl")),
            ("present.wgsl", include_str!("present.wgsl")),
        ] {
            let module = wgpu::naga::front::wgsl::parse_str(source).unwrap_or_else(|error| {
                panic!("{name} failed to parse: {}", error.emit_to_string(source))
            });
            let mut validator = wgpu::naga::valid::Validator::new(
                wgpu::naga::valid::ValidationFlags::all(),
                wgpu::naga::valid::Capabilities::all(),
            );
            validator
                .validate(&module)
                .unwrap_or_else(|error| panic!("{name} failed to validate: {error:?}"));
        }
    }

    #[test]
    fn transforms_world_geometry_before_submission() {
        let transform = Transform {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 20.0,
            f: 30.0,
        };
        assert_eq!(transform_point((2.0, 3.0), transform), (22.0, 33.0));
        assert_eq!(
            transform_bounds(
                Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 10.0,
                    height: 5.0
                },
                transform
            )
            .x,
            20.0
        );
    }

    #[test]
    fn submit_orders_explicit_draw_calls() {
        let mut encoder = DrawEncoder::default();
        encoder.encode_rect(
            "first",
            Bounds {
                x: 0.0,
                y: 0.0,
                width: 1.0,
                height: 1.0,
            },
            Transform::default(),
            [1.0, 0.0, 0.0],
            1.0,
            3,
            1,
        );
        encoder.encode_rect(
            "second",
            Bounds {
                x: 0.0,
                y: 0.0,
                width: 1.0,
                height: 1.0,
            },
            Transform::default(),
            [0.0, 1.0, 0.0],
            1.0,
            1,
            2,
        );
        let draws = encoder.submit();
        assert_eq!(draws[0].z_index, 1);
        assert_eq!(draws[1].z_index, 3);
    }

    #[test]
    fn find_path_locates_nested_layers() {
        let scene = sample_scene();
        let frame = &scene.frames[0];
        let path = find_path(&frame.layers, "child-2").expect("path exists");
        assert_eq!(path, vec!["child-2", "group-1", "root-1"]);
        assert!(find_path(&frame.layers, "missing").is_none());
    }

    /// A minimal v3 packet: one rect at the origin. `pixel_ratio` is 2 so the
    /// device-size path is exercised.
    fn v3_packet() -> String {
        serde_json::json!({
            "protocolVersion": 3,
            "frameId": "frame-1",
            "viewport": {"panX": 0.0, "panY": 0.0, "zoom": 1.0, "width": 640.0, "height": 480.0, "pixelRatio": 2.0},
            "commands": [
                {"geometry": "rect", "nodeId": "r1", "bounds": {"x": 0.0, "y": 0.0, "width": 10.0, "height": 10.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 0.0, "f": 0.0}, "fill": [0.2, 0.4, 0.6, 0.8], "opacity": 0.8, "zIndex": 0, "order": 1}
            ],
            "documentRevision": 1,
            "packetRevision": 1
        })
        .to_string()
    }

    #[test]
    fn render_packet_without_device_returns_structured_error_and_stays_usable() {
        let mut core = RendererCore::new();
        // The GPU path is only reachable after init_canvas (wasm32); until
        // then the module reports the failure as a structured render error.
        let error = core.render_packet_inner(&v3_packet()).unwrap_err();
        assert_eq!(error, "VELLO_RENDER_FAILED:device-not-initialized");
        // A failed render leaves the module usable: the encode surface still
        // works, and the document is untouched (nothing mutated it).
        assert!(core.encode_frame(&v3_packet()).is_ok());
    }

    #[test]
    fn render_packet_surfaces_encode_errors_before_device_errors() {
        // A non-finite packet fails at the boundary with the encode code, not
        // with a device error: the encoder runs before any GPU step, so bad
        // input is diagnosed as bad input. 1e300 is finite as f64 but overflows
        // the f32 encoding stream — the same failure class as NaN.
        let mut core = RendererCore::new();
        let packet = v3_packet().replace("\"a\":1.0", "\"a\":1e300");
        let error = core.render_packet_inner(&packet).unwrap_err();
        assert_eq!(error, "VELLO_ENCODE_FAILED:r1:transform.a");
        // The module stays usable after the rejected packet.
        assert!(core.encode_frame(&v3_packet()).is_ok());
    }

    /// A v4 packet with two glass surfaces listed out of draw order.
    fn glass_packet() -> String {
        serde_json::json!({
            "protocolVersion": 4,
            "frameId": "frame-1",
            "viewport": {"panX": 0.0, "panY": 0.0, "zoom": 1.0, "width": 640.0, "height": 480.0, "pixelRatio": 2.0},
            "commands": [
                {"geometry": "rect", "nodeId": "r1", "bounds": {"x": 0.0, "y": 0.0, "width": 10.0, "height": 10.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 0.0, "f": 0.0}, "fill": [0.2, 0.4, 0.6, 0.8], "opacity": 0.8, "zIndex": 0, "order": 1}
            ],
            "glassSurfaces": [
                {"nodeId": "glass-b", "bounds": {"x": 0.0, "y": 0.0, "width": 40.0, "height": 40.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 0.0, "f": 0.0}, "blurRadius": 16.0, "tint": [1.0, 1.0, 1.0, 0.6], "saturation": 1.4, "refraction": 0.15, "opacity": 1.0, "zIndex": 5, "order": 3, "flat": true},
                {"nodeId": "glass-a", "bounds": {"x": 0.0, "y": 0.0, "width": 40.0, "height": 40.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 0.0, "f": 0.0}, "blurRadius": 8.0, "tint": [1.0, 1.0, 1.0, 0.5], "saturation": 1.0, "refraction": 0.0, "opacity": 1.0, "zIndex": 2, "order": 2}
            ],
            "documentRevision": 1,
            "packetRevision": 1
        })
        .to_string()
    }

    #[test]
    fn authored_surface_params_default_the_inert_fields() {
        use super::GlassSurface;
        use crate::glass_params::surface_params;
        let core = RendererCore::new();
        let params = surface_params(
            &GlassSurface {
                node_id: "glass-a".into(),
                bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 40.0,
                    height: 40.0,
                },
                transform: Transform {
                    a: 1.0,
                    b: 0.0,
                    c: 0.0,
                    d: 1.0,
                    e: 0.0,
                    f: 0.0,
                },
                blur_radius: 8.0,
                tint: [1.0, 1.0, 1.0, 0.5],
                saturation: 1.0,
                refraction: 0.0,
                opacity: 1.0,
                z_index: 2,
                order: 2,
                flat: false,
            },
            &core.viewport,
            false,
        );
        assert_eq!(params[21], 0.0); // screen
        assert_eq!(params[22], 0.0); // radius
        assert_eq!(params[23], 1.0); // scale_x
        assert_eq!(params[24], 1.0); // scale_y
        assert_eq!(params[25], 0.0); // pressed
        assert_eq!(params[26], 0.0); // hovered
    }

    #[test]
    fn glass_surfaces_round_trip_serde_with_flat_defaulting_to_false() {
        let packet: RenderFrame = serde_json::from_str(&glass_packet()).unwrap();
        assert_eq!(packet.glass_surfaces.len(), 2);
        let flat = packet
            .glass_surfaces
            .iter()
            .find(|surface| surface.node_id == "glass-b")
            .unwrap();
        assert!(flat.flat);
        assert_eq!(flat.blur_radius, 16.0);
        let plain = packet
            .glass_surfaces
            .iter()
            .find(|surface| surface.node_id == "glass-a")
            .unwrap();
        assert!(!plain.flat);
    }

    /// A v5 packet with a chrome glass surface.
    fn chrome_packet() -> String {
        serde_json::json!({
            "protocolVersion": 5,
            "frameId": "frame-2",
            "viewport": {"panX": 0.0, "panY": 0.0, "zoom": 1.0, "width": 640.0, "height": 480.0, "pixelRatio": 2.0},
            "commands": [],
            "chromeGlass": [
                {"id": "chrome-topbar", "bounds": {"x": 12.0, "y": 12.0, "width": 600.0, "height": 42.0}, "radius": 999.0, "scaleX": 0.97, "scaleY": 0.93, "pressed": 0.8, "hovered": 0.4}
            ],
            "documentRevision": 1,
            "packetRevision": 1
        })
        .to_string()
    }

    #[test]
    fn chrome_surfaces_round_trip_serde() {
        let packet: RenderFrame = serde_json::from_str(&chrome_packet()).unwrap();
        assert_eq!(packet.chrome_glass.len(), 1);
        let surface = &packet.chrome_glass[0];
        assert_eq!(surface.id, "chrome-topbar");
        assert_eq!(surface.bounds.x, 12.0);
        assert_eq!(surface.bounds.width, 600.0);
        assert_eq!(surface.radius, 999.0);
        assert_eq!(surface.scale_x, 0.97);
        assert_eq!(surface.scale_y, 0.93);
        assert_eq!(surface.pressed, 0.8);
        assert_eq!(surface.hovered, 0.4);
    }

    #[test]
    fn chrome_surface_params_pack_the_screen_fields() {
        use super::ChromeGlassSurface;
        use crate::glass_params::chrome_surface_params;
        let params = chrome_surface_params(
            &ChromeGlassSurface {
                id: "chrome-topbar".into(),
                bounds: Bounds {
                    x: 12.0,
                    y: 12.0,
                    width: 600.0,
                    height: 42.0,
                },
                radius: 999.0,
                scale_x: 0.97,
                scale_y: 0.93,
                pressed: 0.8,
                hovered: 0.4,
                flat: false,
            },
            false,
        );
        assert_eq!(params[0], 12.0);
        assert_eq!(params[3], 42.0);
        assert_eq!(params[21], 1.0); // screen
        assert_eq!(params[22], 999.0); // radius
        assert_eq!(params[23], 0.97); // scale_x
        assert_eq!(params[24], 0.93); // scale_y
        assert_eq!(params[25], 0.8); // pressed
        assert_eq!(params[26], 0.4); // hovered
    }

    #[test]
    fn chrome_surface_params_degrade_to_flat_past_the_cap() {
        use super::ChromeGlassSurface;
        use crate::glass_params::chrome_surface_params;
        let surface = ChromeGlassSurface {
            id: "chrome-pill".into(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 40.0,
            },
            radius: 20.0,
            scale_x: 1.0,
            scale_y: 1.0,
            pressed: 0.0,
            hovered: 0.0,
            flat: false,
        };
        assert_eq!(chrome_surface_params(&surface, true)[20], 1.0); // flat
        assert_eq!(chrome_surface_params(&surface, false)[20], 0.0);
    }

    /// The split gate: chrome-only packets take the split path (chrome
    /// composites after the overlay blit, so the overlay must render into its
    /// own target), even when no authored glass exists.
    #[test]
    fn chrome_only_packets_take_the_split_path() {
        use super::ChromeGlassSurface;
        let chrome = ChromeGlassSurface {
            id: "chrome-pill".into(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 40.0,
            },
            radius: 20.0,
            scale_x: 1.0,
            scale_y: 1.0,
            pressed: 0.0,
            hovered: 0.0,
            flat: false,
        };
        assert!(needs_split(&[], std::slice::from_ref(&chrome)));
        assert!(needs_split(&[empty_glass()], &[]));
        assert!(!needs_split(&[], &[]));
    }

    #[test]
    fn split_packets_encode_scene_and_overlay_separately() {
        let frame: RenderFrame = serde_json::from_str(&glass_packet()).unwrap();
        let (scene, overlay) = encode_packet_layers(&frame, &frame.glass_surfaces, &[]).unwrap();
        let _ = scene;
        assert!(overlay.is_some());
    }

    fn empty_glass() -> super::GlassSurface {
        use super::GlassSurface;
        GlassSurface {
            node_id: "glass-a".into(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 40.0,
                height: 40.0,
            },
            transform: Transform {
                a: 1.0,
                b: 0.0,
                c: 0.0,
                d: 1.0,
                e: 0.0,
                f: 0.0,
            },
            blur_radius: 8.0,
            tint: [1.0, 1.0, 1.0, 0.5],
            saturation: 1.0,
            refraction: 0.0,
            opacity: 1.0,
            z_index: 2,
            order: 2,
            flat: false,
        }
    }

    #[test]
    fn glass_surfaces_sort_by_z_index_then_order_never_array_order() {
        let packet: RenderFrame = serde_json::from_str(&glass_packet()).unwrap();
        let mut surfaces = packet.glass_surfaces;
        sort_glass_surfaces(&mut surfaces);
        let ids: Vec<&str> = surfaces
            .iter()
            .map(|surface| surface.node_id.as_str())
            .collect();
        // Array order was [glass-b (z5/o3), glass-a (z2/o2)]; draw order is
        // (zIndex, order): glass-a first.
        assert_eq!(ids, vec!["glass-a", "glass-b"]);
    }

    #[test]
    fn glass_split_encodings_partition_paths_between_scene_and_overlays() {
        // The glass frame splits the single encoding into scene + overlay
        // halves. Each half encodes exactly its own content, so Vello's path
        // counts must partition the combined frame — a structural witness
        // that nothing is lost or duplicated in the split, and that the
        // scene half carries frame commands while the overlay half carries
        // grid and guides — never selection.
        let commands = serde_json::from_str::<RenderFrame>(&glass_packet()).unwrap();
        let overlay: OverlayPacket = serde_json::from_value(serde_json::json!({
            "grid": {
                "mode": "lines", "level": 2, "minorStep": 16, "majorStep": 80,
                "lines": [
                    {"axis": "x", "position": 0.0, "weight": "major"},
                    {"axis": "y", "position": 80.0, "weight": "minor"}
                ],
                "axes": [{"axis": "x", "position": 0.0, "weight": "major"}]
            },
            "guides": [{"id": "guide-a", "axis": "x", "position": 120.0, "visible": true}]
        }))
        .unwrap();
        let combined =
            vello_encoder::encode_frame(&commands.commands, &commands.viewport, Some(&overlay))
                .unwrap();
        let scene = vello_encoder::encode_scene_frame(
            &commands.commands,
            &commands.viewport,
            Some(&overlay),
        )
        .unwrap();
        let overlays =
            vello_encoder::encode_overlay_frame(&commands.viewport, Some(&overlay)).unwrap();
        // Path counts partition exactly between the halves — the split loses
        // nothing and duplicates nothing.
        assert_eq!(
            combined.n_paths,
            scene.n_paths + overlays.n_paths,
            "the split must partition the combined frame's paths exactly"
        );
        assert!(
            scene.n_paths > 0,
            "the scene half carries the authored rect"
        );
        assert!(
            overlays.n_paths > 0,
            "the overlay half carries grid and guide paths"
        );
        assert_ne!(
            vello_encoder::stream_fingerprint(&combined),
            vello_encoder::stream_fingerprint(&scene)
        );
    }

    #[test]
    fn device_size_matches_the_retired_hosts_canvas_sizing() {
        // The exact rule the retired host applied to the canvas element
        // (Math.max(1, Math.floor(size * pixelRatio))).
        let mut viewport = super::Viewport {
            pan_x: 0.0,
            pan_y: 0.0,
            zoom: 1.0,
            width: 640.0,
            height: 480.0,
            pixel_ratio: 2.0,
        };
        assert_eq!(super::device_size(&viewport), (1280, 960));
        viewport.width = 100.9;
        viewport.height = 50.1;
        viewport.pixel_ratio = 1.0;
        assert_eq!(super::device_size(&viewport), (100, 50));
        // Zero sizes are clamped to one pixel, never a zero-sized surface.
        viewport.width = 0.0;
        viewport.height = 0.0;
        assert_eq!(super::device_size(&viewport), (1, 1));
    }

    #[test]
    fn render_error_is_structured() {
        assert_eq!(
            super::render_error("device-not-initialized", None),
            "VELLO_RENDER_FAILED:device-not-initialized"
        );
        assert_eq!(
            super::render_error("present", Some("timeout")),
            "VELLO_RENDER_FAILED:present:timeout"
        );
    }

    fn json_scene() -> String {
        let mut layers = String::new();
        for index in 0..30 {
            let id = format!("layer-{index}");
            if layers.is_empty() {
                layers.push_str(&format!(
                    "{{\"id\":\"{id}\",\"bounds\":{{\"x\":{index}.0,\"y\":0.0,\"width\":10.0,\"height\":10.0}},\"transform\":{{\"a\":1.0,\"b\":0.0,\"c\":0.0,\"d\":1.0,\"e\":{index}.0,\"f\":0.0}},\"fill\":\"#{:02x}0000\",\"opacity\":1.0,\"visible\":true,\"zIndex\":{index}}}",
                    (index * 7) % 256,
                ));
            } else {
                layers.push_str(&format!(
                    ",{{\"id\":\"{id}\",\"bounds\":{{\"x\":{index}.0,\"y\":0.0,\"width\":10.0,\"height\":10.0}},\"transform\":{{\"a\":1.0,\"b\":0.0,\"c\":0.0,\"d\":1.0,\"e\":{index}.0,\"f\":0.0}},\"fill\":\"#{:02x}0000\",\"opacity\":1.0,\"visible\":true,\"zIndex\":{index}}}",
                    (index * 7) % 256,
                ));
            }
        }
        let mut nested = String::new();
        for index in 0..12 {
            let id = format!("nested-{index}");
            if nested.is_empty() {
                nested.push_str(&format!(
                    "{{\"id\":\"{id}\",\"bounds\":{{\"x\":0.0,\"y\":0.0,\"width\":4.0,\"height\":4.0}},\"fill\":\"#00{index:02x}00\",\"opacity\":0.8,\"visible\":true,\"zIndex\":{index},\"children\":[]}}"
                ));
            } else {
                nested.push_str(&format!(
                    ",{{\"id\":\"{id}\",\"bounds\":{{\"x\":0.0,\"y\":0.0,\"width\":4.0,\"height\":4.0}},\"fill\":\"#00{index:02x}00\",\"opacity\":0.8,\"visible\":true,\"zIndex\":{index},\"children\":[]}}"
                ));
            }
        }
        format!(
            "{{\"revision\":7,\"frames\":[{{\"id\":\"frame-1\",\"bounds\":{{\"x\":0.0,\"y\":0.0,\"width\":400.0,\"height\":300.0}},\"layers\":[{layers},{{\"id\":\"group-1\",\"bounds\":{{\"x\":0.0,\"y\":0.0,\"width\":50.0,\"height\":50.0}},\"transform\":{{\"a\":1.0,\"b\":0.0,\"c\":0.0,\"d\":1.0,\"e\":2.0,\"f\":3.0}},\"fill\":\"#334455\",\"opacity\":1.0,\"visible\":true,\"zIndex\":0,\"children\":[{nested}]}}]}}]}}"
        )
    }

    fn delta_json(ids: &[&str]) -> String {
        let ids = ids
            .iter()
            .map(|id| format!("\"{id}\""))
            .collect::<Vec<_>>()
            .join(",");
        format!("{{\"changedNodeIds\":[{ids}]}}")
    }

    fn render_commands(core: &mut RendererCore) -> (Vec<DrawCall>, Vec<String>, u64, i64) {
        let packet: RenderFrame = serde_json::from_str(&core.render().unwrap()).unwrap();
        (
            packet.commands,
            packet.changed_node_ids,
            packet.packet_revision,
            packet.document_revision,
        )
    }

    #[test]
    fn batch_encode_of_the_final_scene_matches_full_encode_output() {
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();
        let scene = json_scene();

        core.set_scene(scene.as_bytes(), "frame-1", None).unwrap();
        let (full_commands, full_changed, full_packet, full_document) = render_commands(&mut core);
        assert!(full_changed.is_empty());
        assert!(!full_commands.is_empty());

        core.set_scene(
            scene.as_bytes(),
            "frame-1",
            Some(delta_json(&["layer-3", "layer-17", "group-1"])),
        )
        .unwrap();
        let (partial_commands, batch_changed, batch_packet, batch_document) =
            render_commands(&mut core);
        assert!(!batch_changed.is_empty());
        assert!(partial_commands.len() < full_commands.len());
        assert_eq!(batch_changed.len(), partial_commands.len());
        assert!(batch_changed.iter().any(|id| id == "layer-3"));
        assert!(batch_changed.iter().any(|id| id == "nested-7"));
        assert_eq!(batch_packet, full_packet + 1);
        assert_eq!(batch_document, full_document);
        assert_eq!(batch_document, 7);

        let mut merged: std::collections::HashMap<&str, super::DrawCall> = full_commands
            .iter()
            .map(|draw| (draw.node_id.as_str(), draw.clone()))
            .collect();
        for id in &batch_changed {
            if let Some(draw) = partial_commands.iter().find(|draw| &draw.node_id == id) {
                merged.insert(id.as_str(), draw.clone());
            } else {
                merged.remove(id.as_str());
            }
        }
        let mut merged_commands: Vec<super::DrawCall> = merged.into_values().collect();
        merged_commands.sort_by_key(|draw| (draw.z_index, draw.order));
        assert_eq!(merged_commands, full_commands);
    }

    #[test]
    fn delta_with_unknown_node_ids_falls_back_to_full_reencode() {
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();
        let scene = json_scene();

        core.set_scene(scene.as_bytes(), "frame-1", None).unwrap();
        let (full_commands, _, full_packet, _) = render_commands(&mut core);

        core.set_scene(
            scene.as_bytes(),
            "frame-1",
            Some(delta_json(&["layer-5", "does-not-exist"])),
        )
        .unwrap();
        let (fallback_commands, fallback_changed, fallback_packet, _) = render_commands(&mut core);
        assert!(fallback_changed.is_empty());
        assert_eq!(fallback_commands, full_commands);
        assert_eq!(fallback_packet, full_packet + 1);
    }

    #[test]
    fn visibility_removal_is_named_in_the_batch_without_a_draw_call() {
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();
        let visible = json_scene();
        core.set_scene(visible.as_bytes(), "frame-1", None).unwrap();
        let (before, _, _, _) = render_commands(&mut core);
        assert!(before.iter().any(|draw| draw.node_id == "layer-0"));

        let hidden = visible.replacen("\"visible\":true", "\"visible\":false", 1);
        core.set_scene(hidden.as_bytes(), "frame-1", Some(delta_json(&["layer-0"])))
            .unwrap();
        let (after, changed, _, _) = render_commands(&mut core);
        assert!(changed.iter().any(|id| id == "layer-0"));
        assert!(!after.iter().any(|draw| draw.node_id == "layer-0"));
    }

    #[test]
    fn invisible_ancestor_names_every_cached_descendant_for_removal() {
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();
        let visible = json_scene();
        core.set_scene(visible.as_bytes(), "frame-1", None).unwrap();
        let (before, _, _, _) = render_commands(&mut core);
        assert!(before.iter().any(|draw| draw.node_id == "nested-7"));

        // The ancestor's dirty bit is inherited during traversal. Every
        // descendant that was retained must therefore be named even though
        // none of them emits a replacement draw call.
        let hidden = visible;
        // Change the only group visibility field without depending on the
        // ordering of unrelated layers in the fixture.
        let group_start = hidden.find("\"id\":\"group-1\"").unwrap();
        let group_tail = &hidden[group_start..];
        let visibility = group_tail.find("\"visible\":true").unwrap();
        let offset = group_start + visibility;
        let mut hidden = hidden;
        hidden.replace_range(
            offset..offset + "\"visible\":true".len(),
            "\"visible\":false",
        );
        core.set_scene(hidden.as_bytes(), "frame-1", Some(delta_json(&["group-1"])))
            .unwrap();
        let (after, changed, _, _) = render_commands(&mut core);
        assert!(changed.iter().any(|id| id == "group-1"));
        assert!(changed.iter().any(|id| id == "nested-7"));
        assert!(!after.iter().any(|draw| draw.node_id == "group-1"));
        assert!(!after.iter().any(|draw| draw.node_id == "nested-7"));
    }

    #[test]
    fn malformed_or_empty_delta_triggers_full_reencode() {
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();
        let scene = json_scene();

        core.set_scene(scene.as_bytes(), "frame-1", None).unwrap();
        let (full_commands, _, full_packet, _) = render_commands(&mut core);

        core.set_scene(scene.as_bytes(), "frame-1", Some("not json".to_owned()))
            .unwrap();
        let (malformed_commands, malformed_changed, malformed_packet, _) =
            render_commands(&mut core);
        assert!(malformed_changed.is_empty());
        assert_eq!(malformed_commands, full_commands);
        assert_eq!(malformed_packet, full_packet + 1);

        core.set_scene(scene.as_bytes(), "frame-1", Some(delta_json(&[])))
            .unwrap();
        let (empty_commands, empty_changed, empty_packet, _) = render_commands(&mut core);
        assert!(empty_changed.is_empty());
        assert_eq!(empty_commands, full_commands);
        assert_eq!(empty_packet, malformed_packet + 1);
    }

    #[test]
    fn batch_sequences_merge_to_the_same_commands_as_full_references() {
        // Differential/property-style coverage of the retained cache. Each
        // transition exercises a distinct mutation class; the reference core
        // always performs a full encode and is compared after the batch merge.
        let mut retained = RendererCore::new();
        retained
            .set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0)
            .unwrap();
        let base = json_scene();
        retained
            .set_scene(base.as_bytes(), "frame-1", None)
            .unwrap();
        let (mut retained_commands, _, _, _) = render_commands(&mut retained);

        let delete_layer = |source: &str, id: &str| {
            fn remove(value: &mut Value, id: &str) -> bool {
                if let Some(layers) = value.get_mut("layers").and_then(Value::as_array_mut) {
                    if let Some(index) = layers
                        .iter()
                        .position(|layer| layer.get("id").and_then(Value::as_str) == Some(id))
                    {
                        layers.remove(index);
                        return true;
                    }
                    for layer in layers {
                        if remove(layer, id) {
                            return true;
                        }
                    }
                }
                if let Some(children) = value.get_mut("children").and_then(Value::as_array_mut) {
                    if let Some(index) = children
                        .iter()
                        .position(|child| child.get("id").and_then(Value::as_str) == Some(id))
                    {
                        children.remove(index);
                        return true;
                    }
                    for child in children {
                        if remove(child, id) {
                            return true;
                        }
                    }
                }
                if let Some(object) = value.as_object_mut() {
                    for child in object.values_mut() {
                        if remove(child, id) {
                            return true;
                        }
                    }
                }
                if let Some(array) = value.as_array_mut() {
                    for child in array {
                        if remove(child, id) {
                            return true;
                        }
                    }
                }
                false
            }
            let mut value: Value = serde_json::from_str(source).unwrap();
            assert!(remove(&mut value, id));
            serde_json::to_string(&value).unwrap()
        };
        let update_layer = |source: &str, id: &str, field: &str, replacement: Value| {
            fn update(node: &mut Value, id: &str, field: &str, replacement: &Value) -> bool {
                if node.get("id").and_then(Value::as_str) == Some(id) {
                    node.as_object_mut()
                        .unwrap()
                        .insert(field.to_owned(), replacement.clone());
                    return true;
                }
                if let Some(object) = node.as_object_mut() {
                    for child in object.values_mut() {
                        if update(child, id, field, replacement) {
                            return true;
                        }
                    }
                }
                if let Some(array) = node.as_array_mut() {
                    for child in array {
                        if update(child, id, field, replacement) {
                            return true;
                        }
                    }
                }
                false
            }
            let mut value: Value = serde_json::from_str(source).unwrap();
            assert!(update(&mut value, id, field, &replacement));
            serde_json::to_string(&value).unwrap()
        };
        let scene1 = update_layer(
            &base,
            "layer-3",
            "fill",
            Value::String("#00ff00".to_owned()),
        );
        let scene2 = update_layer(
            &scene1,
            "nested-7",
            "fill",
            Value::String("#0000ff".to_owned()),
        );
        let scene3 = update_layer(&scene2, "group-1", "visible", Value::Bool(false));
        let transitions: Vec<(String, Vec<&str>)> = vec![
            (scene1, vec!["layer-3"]),
            (scene2, vec!["nested-7"]),
            (scene3.clone(), vec!["group-1"]),
            (delete_layer(&scene3, "layer-5"), vec!["layer-5"]),
        ];
        for (transition, (scene, ids)) in transitions.into_iter().enumerate() {
            retained
                .set_scene(scene.as_bytes(), "frame-1", Some(delta_json(&ids)))
                .unwrap();
            let (batch, changed, _, _) = render_commands(&mut retained);
            let mut reference = RendererCore::new();
            reference
                .set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0)
                .unwrap();
            reference
                .set_scene(scene.as_bytes(), "frame-1", None)
                .unwrap();
            let (full, _, _, _) = render_commands(&mut reference);
            if changed.is_empty() {
                retained_commands = batch;
            } else {
                let mut map: HashMap<String, DrawCall> = retained_commands
                    .into_iter()
                    .map(|draw| (draw.node_id.clone(), draw))
                    .collect();
                for id in changed {
                    if let Some(draw) = batch.iter().find(|draw| draw.node_id == id) {
                        map.insert(id, draw.clone());
                    } else {
                        map.remove(&id);
                    }
                }
                retained_commands = map.into_values().collect();
                retained_commands.sort_by_key(|draw| (draw.z_index, draw.order));
            }
            assert_eq!(retained_commands, full, "transition {transition}");
        }
    }

    #[test]
    fn moving_a_parent_moves_its_children_exactly_once() {
        // The parallax regression: when a parent moves, every descendant must
        // move with it as one unit — the delta re-encodes the dirty subtree
        // under the parent's NEW placement, and the merged frame must place
        // the child at old + exactly the parent's delta, never twice (a stale
        // cached child transform) and never not at all (a skipped subtree).
        let mut core = RendererCore::new();
        core.set_viewport(0.0, 0.0, 1.0, 640.0, 480.0, 1.0).unwrap();

        let scene = |gx: f64, gy: f64| {
            format!(
            "{{\"revision\":1,\"frames\":[{{\"id\":\"frame-1\",\"bounds\":{{\"x\":0.0,\"y\":0.0,\"width\":400.0,\"height\":300.0}},\"layers\":[{{\"id\":\"group-1\",\"bounds\":{{\"x\":{gx}.0,\"y\":{gy}.0,\"width\":40.0,\"height\":40.0}},\"transform\":{{\"a\":1.0,\"b\":0.0,\"c\":0.0,\"d\":1.0,\"e\":0.0,\"f\":0.0}},\"fill\":\"#334455\",\"opacity\":1.0,\"visible\":true,\"zIndex\":0,\"children\":[{{\"id\":\"child-2\",\"bounds\":{{\"x\":20.0,\"y\":10.0,\"width\":10.0,\"height\":10.0}},\"transform\":{{\"a\":1.0,\"b\":0.0,\"c\":0.0,\"d\":1.0,\"e\":0.0,\"f\":0.0}},\"fill\":\"#112233\",\"opacity\":1.0,\"visible\":true,\"zIndex\":1}}]}}]}}]}}"
        )
        };

        core.set_scene(scene(100.0, 50.0).as_bytes(), "frame-1", None)
            .unwrap();
        let (full_commands, _, _, _) = render_commands(&mut core);
        let child_before = full_commands
            .iter()
            .find(|d| d.node_id == "child-2")
            .unwrap();
        // translate(group 100,50) × translate(child 20,10)
        assert_eq!(child_before.transform.e, 120.0);
        assert_eq!(child_before.transform.f, 60.0);

        // Move the group by (30, 20); the delta names only the group.
        core.set_scene(
            scene(130.0, 70.0).as_bytes(),
            "frame-1",
            Some(delta_json(&["group-1"])),
        )
        .unwrap();
        let (partial_commands, changed, _, _) = render_commands(&mut core);
        assert!(
            changed.iter().any(|id| id == "child-2"),
            "the dirty subtree must re-encode the child"
        );
        let child_after = partial_commands
            .iter()
            .find(|d| d.node_id == "child-2")
            .unwrap();
        // translate(group 130,70) × translate(child 20,10) — exactly once:
        // the child moved by exactly the parent's delta, no more.
        assert_eq!(child_after.transform.e, 150.0);
        assert_eq!(child_after.transform.f, 80.0);
    }

    fn sample_scene() -> Scene {
        Scene {
            revision: 3,
            frames: vec![super::Frame {
                id: "frame-1".to_owned(),
                bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 100.0,
                    height: 100.0,
                },
                layers: vec![layer(
                    "root-1",
                    vec![layer("group-1", vec![layer("child-2", vec![])])],
                )],
            }],
        }
    }

    fn layer(id: &str, children: Vec<Layer>) -> Layer {
        Layer {
            id: id.to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 10.0,
                height: 10.0,
            },
            transform: Transform::default(),
            fill: "#112233".to_owned(),
            opacity: 1.0,
            visible: true,
            z_index: 0,
            corner_radius: None,
            r#type: None,
            children: if children.is_empty() {
                None
            } else {
                Some(children)
            },
        }
    }

    #[test]
    fn offscreen_usage_supports_the_glass_pyramid_copy_source() {
        assert_eq!(
            super::offscreen_texture_usage(),
            wgpu::TextureUsages::STORAGE_BINDING
                | wgpu::TextureUsages::TEXTURE_BINDING
                | wgpu::TextureUsages::RENDER_ATTACHMENT
                | wgpu::TextureUsages::COPY_SRC
        );
    }

    #[test]
    fn glass_quad_usage_supports_corner_uploads() {
        assert_eq!(
            super::glass_quad_buffer_usage(),
            wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST
        );
    }
}
