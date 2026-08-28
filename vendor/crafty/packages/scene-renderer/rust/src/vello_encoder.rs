use crate::{
    DrawCall, DrawFillRule, DrawLineCap, DrawLineJoin, DrawPathGeometry, DrawPathHandleMode,
    DrawPathPoint, DrawStrokeDescriptor, OverlayAxis, OverlayDot, OverlayGrid, OverlayPacket,
    OverlayWeight, Viewport,
};
use std::fmt;
use vello::peniko::kurbo::{Affine, Rect, RoundedRect, Stroke};
use vello::peniko::{Color, Fill};
use vello_encoding::{Encoding, Transform as VelloTransform};

pub const ERROR_CODE: &str = "VELLO_ENCODE_FAILED";

#[derive(Clone, Debug, PartialEq)]
pub struct EncodeError {
    pub node_id: String,
    pub detail: String,
}

impl fmt::Display for EncodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{ERROR_CODE}:{}:{}", self.node_id, self.detail)
    }
}

fn invalid(node_id: &str, detail: impl Into<String>) -> EncodeError {
    EncodeError {
        node_id: node_id.to_owned(),
        detail: detail.into(),
    }
}

/// A value Vello can consume: finite in f64 AND finite once cast to the
/// f32 the encoding streams are stored in.
fn check_finite(value: f64, node_id: &str, detail: &str) -> Result<(), EncodeError> {
    if value.is_finite() && (value as f32).is_finite() {
        Ok(())
    } else {
        Err(invalid(node_id, detail))
    }
}

fn affine_of(command: &DrawCall) -> Result<Affine, EncodeError> {
    let transform = command.transform;
    for (component, name) in [
        (transform.a, "transform.a"),
        (transform.b, "transform.b"),
        (transform.c, "transform.c"),
        (transform.d, "transform.d"),
        (transform.e, "transform.e"),
        (transform.f, "transform.f"),
    ] {
        check_finite(component, &command.node_id, name)?;
    }
    Ok(Affine::new([
        transform.a,
        transform.b,
        transform.c,
        transform.d,
        transform.e,
        transform.f,
    ]))
}

/// The packet's fill array is straight-alpha sRGB with opacity already
/// baked into the alpha channel (the existing encoder folds it there);
/// Vello premultiplies at encode time (peniko `DrawColor::from`).
fn color_of(command: &DrawCall) -> Color {
    let fill = command.fill;
    Color::new([fill[0], fill[1], fill[2], fill[3].clamp(0.0, 1.0)])
}

fn encode_rect(
    encoding: &mut Encoding,
    command: &DrawCall,
    viewport_affine: Affine,
) -> Result<(), EncodeError> {
    let bounds = command.bounds;
    for (component, name) in [
        (bounds.x, "bounds.x"),
        (bounds.y, "bounds.y"),
        (bounds.width, "bounds.width"),
        (bounds.height, "bounds.height"),
    ] {
        check_finite(component, &command.node_id, name)?;
    }
    // Rect fast path: a kurbo `Rect` encodes as four line segments with
    // no point records, no handles and no per-segment logic — the shape
    // the rect-only pipeline always was (byte-identical output). A corner
    // radius (authored on layers, or a chrome circle indicator) becomes a
    // `RoundedRect` — a kurbo shape with arcs at the corners; the radius
    // is clamped to the half-extents so circles (radius = half the minor
    // axis) stay exact.
    let radius = command
        .corner_radius
        .unwrap_or(0.0)
        .clamp(0.0, bounds.width.min(bounds.height) / 2.0);
    encoding.encode_transform(VelloTransform::from_kurbo(&combined_affine(
        viewport_affine,
        command,
    )?));
    encoding.encode_fill_style(Fill::NonZero);
    if radius > 0.0 {
        let shape = RoundedRect::new(
            bounds.x,
            bounds.y,
            bounds.x + bounds.width,
            bounds.y + bounds.height,
            radius,
        );
        if encoding.encode_shape(&shape, true) {
            encoding.encode_brush(color_of(command), 1.0);
        }
    } else {
        let shape = Rect::new(
            bounds.x,
            bounds.y,
            bounds.x + bounds.width,
            bounds.y + bounds.height,
        );
        if encoding.encode_shape(&shape, true) {
            encoding.encode_brush(color_of(command), 1.0);
        }
    }
    Ok(())
}

/// The command's world transform composed with the viewport root. The two
/// inputs are finite by construction (the viewport is validated at the
/// frame boundary; `affine_of` validates the command), but the product can
/// overflow to non-finite — the same rejection class the boundary exists
/// for (vello#470).
fn combined_affine(viewport_affine: Affine, command: &DrawCall) -> Result<Affine, EncodeError> {
    let combined = viewport_affine * affine_of(command)?;
    for (component, name) in [
        (combined.as_coeffs()[0], "transform.a"),
        (combined.as_coeffs()[1], "transform.b"),
        (combined.as_coeffs()[2], "transform.c"),
        (combined.as_coeffs()[3], "transform.d"),
        (combined.as_coeffs()[4], "transform.e"),
        (combined.as_coeffs()[5], "transform.f"),
    ] {
        check_finite(component, &command.node_id, name)?;
    }
    Ok(combined)
}

fn handle_out(point: &DrawPathPoint) -> Option<(f64, f64)> {
    match point.handle_mode {
        DrawPathHandleMode::Corner => None,
        _ => point.handle_out.map(|handle| (handle.dx, handle.dy)),
    }
}

fn handle_in(point: &DrawPathPoint) -> Option<(f64, f64)> {
    match point.handle_mode {
        DrawPathHandleMode::Corner => None,
        DrawPathHandleMode::Mirrored => point.handle_out.map(|handle| (-handle.dx, -handle.dy)),
        _ => point.handle_in.map(|handle| (handle.dx, handle.dy)),
    }
}

fn check_point(point: &DrawPathPoint, node_id: &str) -> Result<(), EncodeError> {
    check_finite(point.x, node_id, "path.point.x")?;
    check_finite(point.y, node_id, "path.point.y")?;
    if let Some(handle) = point.handle_in {
        check_finite(handle.dx, node_id, "path.handleIn.dx")?;
        check_finite(handle.dy, node_id, "path.handleIn.dy")?;
    }
    if let Some(handle) = point.handle_out {
        check_finite(handle.dx, node_id, "path.handleOut.dx")?;
        check_finite(handle.dy, node_id, "path.handleOut.dy")?;
    }
    Ok(())
}

/// Encodes one cubic segment `from → to` with authored handles. Control
/// points are point + handle delta, exactly as the kernel computes them
/// (`segmentControlPoints`); the sums are validated because two finite
/// f32-finite values can still sum to an f32 infinity.
fn encode_cubic_segment(
    path_encoder: &mut vello_encoding::PathEncoder<'_>,
    from: &DrawPathPoint,
    to: &DrawPathPoint,
    node_id: &str,
) -> Result<(), EncodeError> {
    let (out_dx, out_dy) = handle_out(from).unwrap_or((0.0, 0.0));
    let (in_dx, in_dy) = handle_in(to).unwrap_or((0.0, 0.0));
    let c1x = from.x + out_dx;
    let c1y = from.y + out_dy;
    let c2x = to.x + in_dx;
    let c2y = to.y + in_dy;
    check_finite(c1x, node_id, "path.control.c1.x")?;
    check_finite(c1y, node_id, "path.control.c1.y")?;
    check_finite(c2x, node_id, "path.control.c2.x")?;
    check_finite(c2y, node_id, "path.control.c2.y")?;
    path_encoder.cubic_to(
        c1x as f32,
        c1y as f32,
        c2x as f32,
        c2y as f32,
        to.x as f32,
        to.y as f32,
    );
    Ok(())
}

/// Encodes the path's subpaths. Fills close every subpath implicitly
/// (Vello's `is_fill` flag mirrors the SVG/canvas fill rule); strokes keep
/// authored closure so open subpaths get caps.
fn encode_path_geometry(
    encoding: &mut Encoding,
    geometry: &DrawPathGeometry,
    node_id: &str,
    is_fill: bool,
) -> Result<(), EncodeError> {
    let mut path_encoder = encoding.encode_path(is_fill);
    let mut subpath_ids: Vec<&String> = geometry.subpaths.keys().collect();
    subpath_ids.sort();
    for subpath_id in subpath_ids {
        let subpath = &geometry.subpaths[subpath_id];
        let mut points: Vec<&DrawPathPoint> = geometry
            .points
            .values()
            .filter(|point| &point.subpath_id == subpath_id)
            .collect();
        // Order keys are fixed-width base-62 strings: string order IS
        // numeric order (the kernel's own sorting rule). Stable so equal
        // keys keep their JSON order — determinism is a load-bearing
        // property of this encoder.
        points.sort_by(|left, right| left.order.cmp(&right.order));
        if points.is_empty() {
            continue;
        }
        for point in &points {
            check_point(point, node_id)?;
        }
        let mut previous: Option<&DrawPathPoint> = None;
        for point in &points {
            if let Some(prev) = previous {
                encode_cubic_segment(&mut path_encoder, prev, point, node_id)?;
            } else {
                path_encoder.move_to(point.x as f32, point.y as f32);
            }
            previous = Some(point);
        }
        if subpath.closed && points.len() > 1 {
            // The wrap segment last→first is authored geometry (the
            // kernel includes it in bounds); encode it before closing so
            // its handles render, then close (which adds the closing line
            // only if the current point is not already the first).
            let last = points.last().expect("points is not empty");
            let first = points.first().expect("points is not empty");
            encode_cubic_segment(&mut path_encoder, last, first, node_id)?;
            path_encoder.close();
        }
    }
    path_encoder.finish(true);
    Ok(())
}

fn encode_path(
    encoding: &mut Encoding,
    command: &DrawCall,
    viewport_affine: Affine,
) -> Result<(), EncodeError> {
    let geometry = command
        .path
        .as_ref()
        .ok_or_else(|| invalid(&command.node_id, "path"))?;
    let affine = combined_affine(viewport_affine, command)?;
    let color = color_of(command);
    match command.stroke.as_ref() {
        // A stroke descriptor makes the path render stroked (spec: without
        // one, the path renders filled only). The packet carries one
        // paint, so a stroked path has no fill pass.
        Some(stroke) => {
            if stroke.width == 0.0 {
                return Ok(());
            }
            check_finite(stroke.width, &command.node_id, "stroke.width")?;
            if stroke.width < 0.0 {
                // Vello encodes whatever width it is given; a negative
                // width is not a drawable stroke (the kernel never
                // produces one), so the boundary rejects it.
                return Err(invalid(&command.node_id, "stroke.width"));
            }
            for entry in &stroke.dash {
                check_finite(*entry, &command.node_id, "stroke.dash")?;
            }
            let style = stroke_style_of(stroke);
            encoding.encode_transform(VelloTransform::from_kurbo(&affine));
            if !encoding.encode_stroke_style(&style) {
                return Ok(());
            }
            encode_path_geometry(encoding, geometry, &command.node_id, false)?;
            encoding.encode_brush(color, 1.0);
        }
        None => {
            let fill = match command.fill_rule.unwrap_or(DrawFillRule::NonZero) {
                DrawFillRule::NonZero => Fill::NonZero,
                DrawFillRule::EvenOdd => Fill::EvenOdd,
            };
            encoding.encode_transform(VelloTransform::from_kurbo(&affine));
            encoding.encode_fill_style(fill);
            encode_path_geometry(encoding, geometry, &command.node_id, true)?;
            encoding.encode_brush(color, 1.0);
        }
    }
    Ok(())
}

/// Protocol v5 text: the glyph outlines are tessellated at encode time
/// from the embedded font and drawn through the same path machinery —
/// text is paths, so no rasterization backend is involved. A text
/// command without its payload is a contract violation; an empty
/// tessellation (all glyphs missing) draws nothing, never fails.
fn encode_text(
    encoding: &mut Encoding,
    command: &DrawCall,
    viewport_affine: Affine,
) -> Result<(), EncodeError> {
    let text = command
        .text
        .as_deref()
        .ok_or_else(|| invalid(&command.node_id, "text"))?;
    let font_size = command
        .font_size
        .ok_or_else(|| invalid(&command.node_id, "fontSize"))?;
    if text.is_empty() {
        return Ok(());
    }
    let geometry = super::text::text_geometry(text, font_size)
        .map_err(|message| invalid(&command.node_id, message))?;
    if geometry.points.is_empty() {
        return Ok(());
    }
    let affine = combined_affine(viewport_affine, command)?;
    let color = color_of(command);
    encoding.encode_transform(VelloTransform::from_kurbo(&affine));
    encoding.encode_fill_style(Fill::NonZero);
    encode_path_geometry(encoding, &geometry, &command.node_id, true)?;
    encoding.encode_brush(color, 1.0);
    Ok(())
}

fn stroke_style_of(stroke: &DrawStrokeDescriptor) -> Stroke {
    let mut style = Stroke::new(stroke.width);
    style.join = match stroke.joins {
        DrawLineJoin::Miter => vello::peniko::kurbo::Join::Miter,
        DrawLineJoin::Round => vello::peniko::kurbo::Join::Round,
        DrawLineJoin::Bevel => vello::peniko::kurbo::Join::Bevel,
    };
    style.start_cap = match stroke.caps {
        DrawLineCap::Butt => vello::peniko::kurbo::Cap::Butt,
        DrawLineCap::Round => vello::peniko::kurbo::Cap::Round,
        DrawLineCap::Square => vello::peniko::kurbo::Cap::Square,
    };
    style.end_cap = style.start_cap;
    // The packet has no miter-limit field; 4.0 is kurbo's default.
    style.miter_limit = 4.0;
    // Vello strokes dash on the CPU (GPU stroking has no dash support in
    // 0.9.0) and kurbo's dash storage holds at most four entries.
    style.dash_pattern = stroke.dash.iter().copied().take(4).collect();
    style
}

/// The entry point. Commands are re-sorted here so the module is
/// self-contained: the scene ALWAYS draws in `(zIndex, order)` sequence
/// regardless of what order the packet arrived in. The selection
/// indicator (outline + handles) is composed HOST-side as overlay draw
/// commands — the module draws it like every command; the encoder only
/// carries the grid and guides (the grey selection stroke retired with
/// the Figma-aligned selection overlay).
///
/// DRAW ORDER: authored commands encode first, then the grid and guides
/// composite as canvas overlays on top.
pub fn encode_frame(
    commands: &[DrawCall],
    viewport: &Viewport,
    overlay: Option<&OverlayPacket>,
) -> Result<Encoding, EncodeError> {
    let mut encoding = Encoding::new();
    let affine = validate_viewport_affine(viewport)?;
    encode_scene_into(&mut encoding, commands, viewport)?;
    encode_grid_bottom(&mut encoding, viewport, affine, overlay)?;
    encode_guides_top(&mut encoding, viewport, affine, overlay)?;
    Ok(encoding)
}

/// The scene half of the frame contains authored commands. Grid and guide
/// overlays are emitted in the overlay half so they composite above content.
pub fn encode_scene_frame(
    commands: &[DrawCall],
    viewport: &Viewport,
    _overlay: Option<&OverlayPacket>,
) -> Result<Encoding, EncodeError> {
    let mut encoding = Encoding::new();
    validate_viewport_affine(viewport)?;
    encode_scene_into(&mut encoding, commands, viewport)?;
    Ok(encoding)
}

/// The overlay half of the frame: grid and guides composite above authored
/// content. (The selection indicator composes HOST-side.)
pub fn encode_overlay_frame(
    viewport: &Viewport,
    overlay: Option<&OverlayPacket>,
) -> Result<Encoding, EncodeError> {
    let mut encoding = Encoding::new();
    let affine = validate_viewport_affine(viewport)?;
    encode_grid_bottom(&mut encoding, viewport, affine, overlay)?;
    encode_guides_top(&mut encoding, viewport, affine, overlay)?;
    Ok(encoding)
}

/// Shared by the single-encoding path and the split path: validates the
/// viewport and encodes the ordered command list under the root affine.
fn encode_scene_into(
    encoding: &mut Encoding,
    commands: &[DrawCall],
    viewport: &Viewport,
) -> Result<Affine, EncodeError> {
    let viewport_affine = validate_viewport_affine(viewport)?;
    let mut ordered = commands.to_vec();
    ordered.sort_by_key(|command| (command.z_index, command.order));
    for command in &ordered {
        match command.geometry.as_str() {
            "rect" => encode_rect(encoding, command, viewport_affine)?,
            "path" => encode_path(encoding, command, viewport_affine)?,
            // Protocol v5: text tessellates to path geometry at encode
            // time — glyphs are outlines like any other path.
            "text" => encode_text(encoding, command, viewport_affine)?,
            // An unknown geometry string is a packet-contract violation:
            // unknown schema versions are rejected, never coerced.
            _ => return Err(invalid(&command.node_id, "geometry")),
        }
    }
    Ok(viewport_affine)
}

/// The viewport validity checks and the root affine shared by every
/// encode entry: `device = (world × zoom + pan) × dpr`.
fn validate_viewport_affine(viewport: &Viewport) -> Result<Affine, EncodeError> {
    for (component, name) in [
        (viewport.pan_x, "viewport.panX"),
        (viewport.pan_y, "viewport.panY"),
        (viewport.zoom, "viewport.zoom"),
        (viewport.width, "viewport.width"),
        (viewport.height, "viewport.height"),
        // The render path derives the surface size from the pixel ratio;
        // a non-finite or non-positive ratio would silently produce a
        // degenerate canvas instead of a frame, the same failure class
        // the boundary exists for.
        (viewport.pixel_ratio, "viewport.pixelRatio"),
    ] {
        check_finite(component, "viewport", name)?;
    }
    if viewport.zoom <= 0.0
        || viewport.width <= 0.0
        || viewport.height <= 0.0
        || viewport.pixel_ratio <= 0.0
    {
        return Err(invalid("viewport", "dimensions"));
    }
    Ok(Affine::translate((
        viewport.pan_x * viewport.pixel_ratio,
        viewport.pan_y * viewport.pixel_ratio,
    )) * Affine::scale(viewport.zoom * viewport.pixel_ratio))
}

/// Total encoded bytes across the binary streams — the cheap "it encoded
/// something" witness for the wasm surface.
pub fn encoded_bytes(encoding: &Encoding) -> u64 {
    (encoding.path_tags.len()
        + encoding.path_data.len() * 4
        + encoding.draw_tags.len() * 4
        + encoding.draw_data.len() * 4
        + encoding.transforms.len() * 24
        + encoding.styles.len() * 8) as u64
}

/// FNV-1a over the encoding's binary streams, folded word by word so the
/// fingerprint is stable across platforms (no reliance on memory layout).
/// Deterministic given identical input — the parity witness for encode
/// equality across runs, builds and environments.
pub fn stream_fingerprint(encoding: &Encoding) -> u64 {
    const FNV_OFFSET: u64 = 0xcbf2_9ce4_8422_2325;
    const FNV_PRIME: u64 = 0x0000_0100_0000_01b3;
    let mut hash = FNV_OFFSET;
    let fold = |hash: &mut u64, value: u64| {
        *hash ^= value;
        *hash = hash.wrapping_mul(FNV_PRIME);
    };
    for tag in &encoding.path_tags {
        fold(&mut hash, tag.0 as u64);
    }
    for word in &encoding.path_data {
        fold(&mut hash, u64::from(*word));
    }
    for tag in &encoding.draw_tags {
        fold(&mut hash, u64::from(tag.0));
    }
    for word in &encoding.draw_data {
        fold(&mut hash, u64::from(*word));
    }
    for transform in &encoding.transforms {
        for component in transform.matrix {
            fold(&mut hash, u64::from(component.to_bits()));
        }
        for component in transform.translation {
            fold(&mut hash, u64::from(component.to_bits()));
        }
    }
    for style in &encoding.styles {
        fold(&mut hash, u64::from(style.flags_and_miter_limit));
        fold(&mut hash, u64::from(style.line_width.to_bits()));
    }
    fold(&mut hash, u64::from(encoding.n_paths));
    fold(&mut hash, u64::from(encoding.n_path_segments));
    fold(&mut hash, u64::from(encoding.n_clips));
    fold(&mut hash, u64::from(encoding.n_open_clips));
    fold(&mut hash, u64::from(encoding.flags));
    hash
}

// Overlay drawing. The overlay packet carries world positions only;
// screen-space thickness, colour and culling are renderer policy mirrored
// from the TypeScript host's grid-overlay.ts so the scene-encoded
// overlays match the rect-composited ones it draws today. The host's
// overlay builder retires with the TypeGPU submission path; this module
// becomes the only place that policy lives.
const MAX_GRID_OVERLAY_LINES: usize = 2000;
const MAX_GRID_OVERLAY_DOTS: usize = 2000;
const OVERLAY_CULL_MARGIN_PX: f64 = 2.0;
const GRID_MINOR_COLOR: [f32; 4] = [0.58, 0.58, 0.66, 0.06];
const GRID_MAJOR_COLOR: [f32; 4] = [0.58, 0.58, 0.66, 0.12];
const GRID_AXIS_COLOR: [f32; 4] = [0.58, 0.58, 0.66, 0.12];
const GRID_DOT_MINOR_COLOR: [f32; 4] = [0.58, 0.58, 0.66, 0.25];
const GRID_DOT_MAJOR_COLOR: [f32; 4] = [0.58, 0.58, 0.66, 0.4];
const GUIDE_COLOR: [f32; 4] = [0.93, 0.4, 0.38, 0.95];

fn world_span_x(viewport: &Viewport) -> f64 {
    viewport.width / viewport.zoom
}

fn world_span_y(viewport: &Viewport) -> f64 {
    viewport.height / viewport.zoom
}

fn world_min_x(viewport: &Viewport) -> f64 {
    -viewport.pan_x / viewport.zoom
}

fn world_min_y(viewport: &Viewport) -> f64 {
    -viewport.pan_y / viewport.zoom
}

fn screen_x_of(world_x: f64, viewport: &Viewport) -> f64 {
    world_x * viewport.zoom + viewport.pan_x
}

fn screen_y_of(world_y: f64, viewport: &Viewport) -> f64 {
    world_y * viewport.zoom + viewport.pan_y
}

fn culled(screen: f64, viewport: &Viewport, axis: OverlayAxis) -> bool {
    let limit = match axis {
        OverlayAxis::X => viewport.width,
        OverlayAxis::Y => viewport.height,
    };
    screen < -OVERLAY_CULL_MARGIN_PX || screen > limit + OVERLAY_CULL_MARGIN_PX
}

/// One overlay rect in world coordinates — overlays are host-projected
/// renderer state, not authored geometry, so they never ride a document
/// transform; the viewport root maps them to screen space like every
/// other shape.
fn draw_overlay_rect(
    encoding: &mut Encoding,
    rect: Rect,
    color: [f32; 4],
    viewport_affine: Affine,
) {
    encoding.encode_transform(VelloTransform::from_kurbo(&viewport_affine));
    encoding.encode_fill_style(Fill::NonZero);
    if encoding.encode_shape(&rect, true) {
        encoding.encode_brush(Color::new(color), 1.0);
    }
}

/// The device-pixel-snapped world rect for an overlay line: the rect is
/// solved back from an integer device-px span under the root affine
/// (device = (world × zoom + pan) × pixelRatio), so the line lands on
/// exact physical pixels at any zoom, pan and DPR. `None` when culled.
/// Callers check finiteness first — this never swallows a boundary error.
fn snap_overlay_line(
    axis: OverlayAxis,
    position: f64,
    thickness_px: f64,
    viewport: &Viewport,
) -> Option<Rect> {
    let device_thickness = (thickness_px * viewport.pixel_ratio).round().max(1.0);
    let thickness = device_thickness / (viewport.zoom * viewport.pixel_ratio);
    match axis {
        OverlayAxis::X => {
            let screen_x = screen_x_of(position, viewport);
            if culled(screen_x, viewport, axis) {
                return None;
            }
            let device_center = (position * viewport.zoom + viewport.pan_x) * viewport.pixel_ratio;
            let device_start = device_center.round() - (device_thickness / 2.0).floor();
            let x = (device_start / viewport.pixel_ratio - viewport.pan_x) / viewport.zoom;
            let y = world_min_y(viewport);
            Some(Rect::new(x, y, x + thickness, y + world_span_y(viewport)))
        }
        OverlayAxis::Y => {
            let screen_y = screen_y_of(position, viewport);
            if culled(screen_y, viewport, axis) {
                return None;
            }
            let device_center = (position * viewport.zoom + viewport.pan_y) * viewport.pixel_ratio;
            let device_start = device_center.round() - (device_thickness / 2.0).floor();
            let y = (device_start / viewport.pixel_ratio - viewport.pan_y) / viewport.zoom;
            let x = world_min_x(viewport);
            Some(Rect::new(x, y, x + world_span_x(viewport), y + thickness))
        }
    }
}

/// A vertical (axis X) or horizontal (axis Y) line at a world position,
/// as a rect of `thickness_px` screen px spanning the visible world
/// range. ZOOM-SAFE: `snap_overlay_line` solves the rect back from a
/// device-pixel-snapped span — a fractional device position would
/// rasterize soft and shimmer while panning.
fn overlay_line(
    encoding: &mut Encoding,
    axis: OverlayAxis,
    position: f64,
    thickness_px: f64,
    color: [f32; 4],
    viewport: &Viewport,
    viewport_affine: Affine,
) -> Result<(), EncodeError> {
    check_finite(position, "overlay", "line.position")?;
    let Some(rect) = snap_overlay_line(axis, position, thickness_px, viewport) else {
        return Ok(());
    };
    draw_overlay_rect(encoding, rect, color, viewport_affine);
    Ok(())
}

fn overlay_dot(
    encoding: &mut Encoding,
    dot: &OverlayDot,
    viewport: &Viewport,
    viewport_affine: Affine,
) -> Result<(), EncodeError> {
    check_finite(dot.x, "overlay", "dot.x")?;
    check_finite(dot.y, "overlay", "dot.y")?;
    let size_px = match dot.weight {
        OverlayWeight::Major => 3.0,
        OverlayWeight::Minor => 2.0,
    };
    let half = size_px / 2.0;
    let screen_x = screen_x_of(dot.x, viewport);
    let screen_y = screen_y_of(dot.y, viewport);
    if screen_x < -half
        || screen_x > viewport.width + half
        || screen_y < -half
        || screen_y > viewport.height + half
    {
        return Ok(());
    }
    // Zoom-safe like the lines: an integer device-size square anchored at
    // a whole device pixel. Odd sizes drift the centre by half a pixel
    // (unavoidable, invisible); they never rasterize soft.
    let device_size = (size_px * viewport.pixel_ratio).round().max(1.0);
    let device_x = ((dot.x * viewport.zoom + viewport.pan_x) * viewport.pixel_ratio).round();
    let device_y = ((dot.y * viewport.zoom + viewport.pan_y) * viewport.pixel_ratio).round();
    let x = ((device_x - (device_size / 2.0).floor()) / viewport.pixel_ratio - viewport.pan_x)
        / viewport.zoom;
    let y = ((device_y - (device_size / 2.0).floor()) / viewport.pixel_ratio - viewport.pan_y)
        / viewport.zoom;
    let size = device_size / (viewport.zoom * viewport.pixel_ratio);
    let base_color = match dot.weight {
        OverlayWeight::Major => GRID_DOT_MAJOR_COLOR,
        OverlayWeight::Minor => GRID_DOT_MINOR_COLOR,
    };
    let color = [
        base_color[0],
        base_color[1],
        base_color[2],
        base_color[3] * dot.alpha as f32,
    ];
    draw_overlay_rect(
        encoding,
        Rect::new(x, y, x + size, y + size),
        color,
        viewport_affine,
    );
    Ok(())
}

/// Grid lines: the LOD lines (minor/major), then dots, then axes, drawn
/// while their budgets last — the LOD ladder owns every zoom. There is no
/// pixel grid: a second scale at high zoom only beat against the ladder
/// (the moiré, then the wash, then the dot-grid — every pixel-grid variant
/// traced to layering a second grid over the LOD). The ladder's nice-number
/// world steps halve per octave past 400% (2 → 1 → 0.5 → 0.25 units),
/// holding the [6, 32] screen-px band to any zoom. Returns the remaining
/// budget for guides.
fn encode_grid(
    encoding: &mut Encoding,
    grid: &OverlayGrid,
    viewport: &Viewport,
    viewport_affine: Affine,
    mut budget: usize,
) -> Result<usize, EncodeError> {
    if let Some(dots) = &grid.dots {
        let mut dot_budget = MAX_GRID_OVERLAY_DOTS;
        for dot in dots {
            if dot_budget == 0 {
                break;
            }
            overlay_dot(encoding, dot, viewport, viewport_affine)?;
            dot_budget -= 1;
        }
    }

    // Fixed-world grids can contain thousands of visible lines when zoomed
    // out. Taking the first budget entries leaves the rest of the viewport
    // blank and creates large compositor-looking bands. Sample evenly instead
    // so both axes retain coverage and adjacent emitted lines stay drawable.
    let stride = (grid.lines.len().div_ceil(MAX_GRID_OVERLAY_LINES)).max(1);
    for (index, line) in grid.lines.iter().enumerate() {
        if index % stride != 0 {
            continue;
        }
        if budget == 0 {
            break;
        }
        let (thickness, color) = match line.weight {
            OverlayWeight::Major => (1.25, GRID_MAJOR_COLOR),
            OverlayWeight::Minor => (1.0, GRID_MINOR_COLOR),
        };
        // The cross-fade: per-line alpha scales the weight colour.
        let color = if line.alpha < 1.0 {
            [color[0], color[1], color[2], color[3] * line.alpha as f32]
        } else {
            color
        };
        overlay_line(
            encoding,
            line.axis,
            line.position,
            thickness,
            color,
            viewport,
            viewport_affine,
        )?;
        budget -= 1;
    }

    for axis in grid.axes.iter().flatten() {
        if budget == 0 {
            break;
        }
        let color = [
            GRID_AXIS_COLOR[0],
            GRID_AXIS_COLOR[1],
            GRID_AXIS_COLOR[2],
            GRID_AXIS_COLOR[3] * axis.alpha as f32,
        ];
        overlay_line(
            encoding,
            axis.axis,
            axis.position,
            2.0,
            color,
            viewport,
            viewport_affine,
        )?;
        budget -= 1;
    }

    Ok(budget)
}

/// The grid at the BOTTOM of the draw: lines, dots and axes encode first,
/// so authored content always composites above the grid (the grid is
/// beneath the elements, never over them). Shares the line budget with the
/// guides; dots have their own.
fn encode_grid_bottom(
    encoding: &mut Encoding,
    viewport: &Viewport,
    viewport_affine: Affine,
    overlay: Option<&OverlayPacket>,
) -> Result<(), EncodeError> {
    let Some(overlay) = overlay else {
        return Ok(());
    };
    if let Some(grid) = &overlay.grid {
        let mut line_budget = MAX_GRID_OVERLAY_LINES;
        line_budget = encode_grid(encoding, grid, viewport, viewport_affine, line_budget)?;
        // The remaining budget is not consumed here — guides take it on the
        // top. (The budget is shared; the bottom half reports nothing.)
        let _ = line_budget;
    }
    Ok(())
}

/// The guides on TOP of the draw: user-authored position lines composite
/// above the authored content (interaction aids, not backdrop).
fn encode_guides_top(
    encoding: &mut Encoding,
    viewport: &Viewport,
    viewport_affine: Affine,
    overlay: Option<&OverlayPacket>,
) -> Result<(), EncodeError> {
    let Some(overlay) = overlay else {
        return Ok(());
    };
    if let Some(guides) = &overlay.guides {
        let mut guide_budget = MAX_GRID_OVERLAY_LINES;
        for guide in guides {
            if !guide.visible || guide_budget == 0 {
                continue;
            }
            overlay_line(
                encoding,
                guide.axis,
                guide.position,
                1.5,
                GUIDE_COLOR,
                viewport,
                viewport_affine,
            )?;
            guide_budget -= 1;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        encode_frame, encoded_bytes, snap_overlay_line, stream_fingerprint, world_min_y,
        world_span_y, EncodeError, GRID_AXIS_COLOR, GRID_DOT_MINOR_COLOR, GRID_MAJOR_COLOR,
        GRID_MINOR_COLOR, GUIDE_COLOR,
    };
    use crate::RendererCore;
    use crate::{
        encode_layers, Bounds, DrawCall, DrawFillRule, DrawLineCap, DrawLineJoin, DrawPathGeometry,
        DrawPathHandle, DrawPathHandleMode, DrawPathPoint, DrawPathSubpath, DrawStrokeDescriptor,
        Layer, OverlayAxis, OverlayGuide, OverlayPacket, Transform, Viewport,
    };
    use std::collections::{HashMap, HashSet};
    use vello::peniko::Color;
    use vello_encoding::{DrawTag, Encoding, Style};

    fn viewport() -> Viewport {
        Viewport {
            pan_x: 0.0,
            pan_y: 0.0,
            zoom: 1.0,
            width: 640.0,
            height: 480.0,
            pixel_ratio: 1.0,
        }
    }

    /// A tiny viewport window for the culling tests.
    fn window(pan_x: f64, pan_y: f64) -> Viewport {
        Viewport {
            pan_x,
            pan_y,
            zoom: 1.0,
            width: 100.0,
            height: 100.0,
            pixel_ratio: 1.0,
        }
    }

    fn rect_command(node_id: &str, z_index: i64, order: u32, fill: [f32; 4]) -> DrawCall {
        DrawCall {
            geometry: "rect".to_owned(),
            node_id: node_id.to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 10.0,
                height: 10.0,
            },
            transform: Transform::default(),
            fill,
            opacity: fill[3],
            z_index,
            order,
            corner_radius: None,
            path: None,
            fill_rule: None,
            stroke: None,
            text: None,
            font_size: None,
        }
    }

    fn point(
        order: &str,
        x: f64,
        y: f64,
        handle_mode: DrawPathHandleMode,
        handle_in: Option<DrawPathHandle>,
        handle_out: Option<DrawPathHandle>,
    ) -> DrawPathPoint {
        DrawPathPoint {
            subpath_id: "s1".to_owned(),
            order: order.to_owned(),
            x,
            y,
            handle_mode,
            handle_in,
            handle_out,
        }
    }

    /// One closed subpath, three corner points — the minimal filled
    /// triangle, in the kernel's authored representation.
    fn triangle_geometry() -> DrawPathGeometry {
        DrawPathGeometry {
            points: HashMap::from([
                (
                    "p0".to_owned(),
                    point("00000000", 0.0, 0.0, DrawPathHandleMode::Corner, None, None),
                ),
                (
                    "p1".to_owned(),
                    point(
                        "00000001",
                        100.0,
                        0.0,
                        DrawPathHandleMode::Corner,
                        None,
                        None,
                    ),
                ),
                (
                    "p2".to_owned(),
                    point(
                        "00000002",
                        0.0,
                        100.0,
                        DrawPathHandleMode::Corner,
                        None,
                        None,
                    ),
                ),
            ]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: true })]),
        }
    }

    fn path_command(
        node_id: &str,
        z_index: i64,
        order: u32,
        fill: [f32; 4],
        fill_rule: DrawFillRule,
        geometry: DrawPathGeometry,
        stroke: Option<DrawStrokeDescriptor>,
    ) -> DrawCall {
        DrawCall {
            geometry: "path".to_owned(),
            node_id: node_id.to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 100.0,
                height: 100.0,
            },
            transform: Transform::default(),
            fill,
            opacity: fill[3],
            z_index,
            order,
            path: Some(geometry),
            fill_rule: Some(fill_rule),
            stroke,
            corner_radius: None,
            text: None,
            font_size: None,
        }
    }

    /// The rgba words of every draw, in draw order. This encoder only
    /// produces solid-colour draws, and `encode_brush` always emits a
    /// COLOR tag, so the colour sequence IS the draw sequence.
    fn draw_order(encoding: &Encoding) -> Vec<u32> {
        let mut colors = Vec::new();
        let mut data = encoding.draw_data.iter();
        for tag in &encoding.draw_tags {
            assert_eq!(tag.0, DrawTag::COLOR.0, "encoder emits only COLOR draws");
            colors.push(*data.next().expect("COLOR tag pairs with a draw word"));
        }
        assert!(data.next().is_none(), "no stray draw data");
        colors
    }

    /// The rgba a packet fill encodes to — the same premultiply path
    /// Vello applies to solid brushes.
    fn expected_rgba(fill: [f32; 4]) -> u32 {
        Color::new(fill).premultiply().to_rgba8().to_u32()
    }

    #[test]
    fn culls_layers_outside_the_viewport_but_never_the_selection() {
        // A 200×200 layer at (0,0); the window is the (100,100) box at
        // world (200,200): the layer is fully off-screen.
        let mut emitted = Vec::new();
        let mut changed = Vec::new();
        let mut dirty = None;
        let mut selection = None;
        let mut order = 1;
        let consistent = encode_layers(
            &[Layer {
                id: "offscreen".to_owned(),
                bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 200.0,
                },
                transform: Transform::default(),
                fill: "#ff0000".to_owned(),
                opacity: 1.0,
                visible: true,
                z_index: 0,
                corner_radius: None,
                r#type: None,
                children: None,
            }],
            true,
            Transform::default(),
            None,
            &mut selection,
            &mut order,
            &mut HashMap::new(),
            &mut emitted,
            &mut changed,
            &mut dirty,
            &HashSet::new(),
            false,
            true,
            Some(&window(200.0, 200.0)),
        );
        assert!(consistent);
        assert!(emitted.is_empty(), "the off-screen layer is culled");
        // The same layer, SELECTED, must still emit (its outline draws).
        let mut selected_emitted = Vec::new();
        let consistent = encode_layers(
            &[Layer {
                id: "offscreen".to_owned(),
                bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 200.0,
                    height: 200.0,
                },
                transform: Transform::default(),
                fill: "#ff0000".to_owned(),
                opacity: 1.0,
                visible: true,
                z_index: 0,
                corner_radius: None,
                r#type: None,
                children: None,
            }],
            true,
            Transform::default(),
            Some("offscreen"),
            &mut selection,
            &mut order,
            &mut HashMap::new(),
            &mut selected_emitted,
            &mut changed,
            &mut dirty,
            &HashSet::new(),
            false,
            true,
            Some(&window(200.0, 200.0)),
        );
        assert!(consistent);
        assert_eq!(selected_emitted.len(), 1, "the selection is never culled");
    }

    #[test]
    fn culled_parents_still_recurse_into_in_viewport_children() {
        // A parent box fully off-screen whose CHILD sits in-viewport:
        // the child draws (each layer is culled by its own box).
        let layers = vec![Layer {
            id: "parent".to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 50.0,
                height: 50.0,
            },
            transform: Transform::default(),
            fill: "#ff0000".to_owned(),
            opacity: 1.0,
            visible: true,
            z_index: 0,
            corner_radius: None,
            r#type: None,
            children: Some(vec![Layer {
                id: "child".to_owned(),
                bounds: Bounds {
                    x: 300.0,
                    y: 300.0,
                    width: 20.0,
                    height: 20.0,
                },
                transform: Transform::default(),
                fill: "#00ff00".to_owned(),
                opacity: 1.0,
                visible: true,
                z_index: 0,
                corner_radius: None,
                r#type: None,
                children: None,
            }]),
        }];
        let mut emitted = Vec::new();
        let mut changed = Vec::new();
        let mut dirty = None;
        let mut selection = None;
        let mut order = 1;
        let consistent = encode_layers(
            &layers,
            true,
            Transform::default(),
            None,
            &mut selection,
            &mut order,
            &mut HashMap::new(),
            &mut emitted,
            &mut changed,
            &mut dirty,
            &HashSet::new(),
            false,
            true,
            // pan (-300,-300) shows the world rect (300,300)-(400,400).
            Some(&window(-300.0, -300.0)),
        );
        assert!(consistent);
        assert_eq!(
            emitted.len(),
            1,
            "the off-screen parent is culled, the in-viewport child draws"
        );
        assert_eq!(emitted[0].node_id, "child");
    }

    #[test]
    fn text_commands_tessellate_glyphs_into_path_data() {
        // "Hi" at 32px: two glyph subpaths, real outline points, drawn
        // as a fill (the same draw_order witness as the rect/path tests).
        let command = DrawCall {
            geometry: "text".to_owned(),
            node_id: "text-a".to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 40.0,
                height: 32.0,
            },
            transform: Transform::default(),
            fill: [0.2, 0.4, 0.6, 1.0],
            opacity: 1.0,
            z_index: 1,
            order: 1,
            path: None,
            fill_rule: None,
            stroke: None,
            corner_radius: None,
            text: Some("Hi".to_owned()),
            font_size: Some(32.0),
        };
        let encoding = encode_frame(&[command], &viewport(), None).unwrap();
        // Both glyphs are one filled path (two contours, one brush) —
        // exactly how an authored outline would draw.
        assert_eq!(
            draw_order(&encoding),
            vec![expected_rgba([0.2, 0.4, 0.6, 1.0])]
        );
        assert_eq!(encoding.n_paths, 1, "both glyphs are one filled draw");
        let geometry = super::super::text::text_geometry("Hi", 32.0).unwrap();
        assert!(
            geometry.subpaths.len() >= 2,
            "two glyphs tessellate to at least two subpaths"
        );
        assert!(geometry.points.len() > 10);
    }

    #[test]
    fn empty_text_and_missing_glyphs_draw_nothing_but_never_fail() {
        for text in ["", "\n", "\u{1}\u{0}", "\u{200B}"] {
            let command = DrawCall {
                geometry: "text".to_owned(),
                node_id: "text-empty".to_owned(),
                bounds: Bounds {
                    x: 0.0,
                    y: 0.0,
                    width: 40.0,
                    height: 32.0,
                },
                transform: Transform::default(),
                fill: [0.2, 0.4, 0.6, 1.0],
                opacity: 1.0,
                z_index: 1,
                order: 1,
                path: None,
                fill_rule: None,
                stroke: None,
                corner_radius: None,
                text: Some(text.to_owned()),
                font_size: Some(32.0),
            };
            let encoding = encode_frame(&[command], &viewport(), None).unwrap();
            assert!(encoding.n_paths == 0, "nothing draws for {text:?}");
        }
    }

    #[test]
    fn text_command_without_payload_is_a_contract_violation() {
        let command = DrawCall {
            geometry: "text".to_owned(),
            node_id: "text-bad".to_owned(),
            bounds: Bounds {
                x: 0.0,
                y: 0.0,
                width: 40.0,
                height: 32.0,
            },
            transform: Transform::default(),
            fill: [0.2, 0.4, 0.6, 1.0],
            opacity: 1.0,
            z_index: 1,
            order: 1,
            path: None,
            fill_rule: None,
            stroke: None,
            corner_radius: None,
            text: None,
            font_size: Some(32.0),
        };
        assert!(encode_frame(&[command], &viewport(), None).is_err());
    }

    #[test]
    fn mixed_rects_and_paths_encode_in_z_index_order() {
        let commands = vec![
            path_command(
                "path-a",
                1,
                2,
                [1.0, 0.0, 0.0, 1.0],
                DrawFillRule::EvenOdd,
                triangle_geometry(),
                None,
            ),
            rect_command("rect-low", 0, 1, [0.0, 1.0, 0.0, 1.0]),
            rect_command("rect-high", 2, 1, [0.0, 0.0, 1.0, 1.0]),
            path_command(
                "path-b",
                1,
                1,
                [1.0, 1.0, 0.0, 1.0],
                DrawFillRule::NonZero,
                triangle_geometry(),
                None,
            ),
            rect_command("rect-mid", 1, 3, [0.0, 1.0, 1.0, 1.0]),
        ];

        let encoding = encode_frame(&commands, &viewport(), None).unwrap();

        let expected = vec![
            expected_rgba([0.0, 1.0, 0.0, 1.0]),
            expected_rgba([1.0, 1.0, 0.0, 1.0]),
            expected_rgba([1.0, 0.0, 0.0, 1.0]),
            expected_rgba([0.0, 1.0, 1.0, 1.0]),
            expected_rgba([0.0, 0.0, 1.0, 1.0]),
        ];
        assert_eq!(draw_order(&encoding), expected);
        // Two filled triangles plus three rects; the two triangles also
        // encode their three-segment subpaths (move + two cubics + wrap).
        assert_eq!(encoding.n_paths, 5);
        assert_eq!(encoding.n_path_segments, 3 + 3 + 4 + 4 + 4);
    }

    #[test]
    fn viewport_pan_and_zoom_are_applied_as_the_root_transform() {
        let mut viewport = viewport();
        viewport.pan_x = 100.0;
        viewport.pan_y = 50.0;
        viewport.zoom = 2.0;
        let commands = vec![rect_command("rect-1", 0, 1, [1.0, 0.0, 0.0, 1.0])];

        let encoding = encode_frame(&commands, &viewport, None).unwrap();

        // screen = world × zoom + pan — the retired host's
        // `encodeCommandsVertices` convention, applied as the root of the
        // encoding (command transforms compose on top).
        let root = encoding.transforms.last().unwrap();
        assert_eq!(root.matrix, [2.0, 0.0, 0.0, 2.0]);
        assert_eq!(root.translation, [100.0, 50.0]);
    }

    #[test]
    fn viewport_pixel_ratio_scales_the_root_transform() {
        // The surface is sized in device pixels (width × pixel_ratio);
        // the root affine must map world → device so the presented frame
        // lands where the harness's CSS-pixel pointer math expects on a
        // retina display: device = (world × zoom + pan) × dpr.
        let mut viewport = viewport();
        viewport.pan_x = 100.0;
        viewport.pan_y = 50.0;
        viewport.zoom = 2.0;
        viewport.pixel_ratio = 2.0;
        let commands = vec![rect_command("rect-1", 0, 1, [1.0, 0.0, 0.0, 1.0])];

        let encoding = encode_frame(&commands, &viewport, None).unwrap();

        let root = encoding.transforms.last().unwrap();
        assert_eq!(root.matrix, [4.0, 0.0, 0.0, 4.0]);
        assert_eq!(root.translation, [200.0, 100.0]);
    }

    #[test]
    fn command_transforms_compose_under_the_viewport_root() {
        let mut viewport = viewport();
        viewport.pan_x = 100.0;
        viewport.pan_y = 50.0;
        viewport.zoom = 2.0;
        let mut command = rect_command("rect-1", 0, 1, [1.0, 0.0, 0.0, 1.0]);
        command.transform = Transform {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 10.0,
            f: 20.0,
        };

        let encoding = encode_frame(&[command], &viewport, None).unwrap();

        // world (10,20) × 2 + (100,50) → translation (120, 90).
        let root = encoding.transforms.last().unwrap();
        assert_eq!(root.matrix, [2.0, 0.0, 0.0, 2.0]);
        assert_eq!(root.translation, [120.0, 90.0]);
    }

    #[test]
    fn unsorted_input_is_drawn_in_z_index_order() {
        // The same commands fed in reverse arrive in (zIndex, order)
        // sequence — the encoder sorts, the packet order never reaches
        // the scene.
        let commands = vec![
            rect_command("a", 3, 1, [1.0, 0.0, 0.0, 1.0]),
            rect_command("b", 1, 2, [0.0, 1.0, 0.0, 1.0]),
            rect_command("c", 1, 1, [0.0, 0.0, 1.0, 1.0]),
            rect_command("d", 2, 1, [1.0, 1.0, 0.0, 1.0]),
        ];
        let encoding = encode_frame(&commands, &viewport(), None).unwrap();
        let colors = draw_order(&encoding);
        assert_eq!(colors[0], expected_rgba([0.0, 0.0, 1.0, 1.0])); // c (1,1)
        assert_eq!(colors[1], expected_rgba([0.0, 1.0, 0.0, 1.0])); // b (1,2)
        assert_eq!(colors[2], expected_rgba([1.0, 1.0, 0.0, 1.0])); // d (2,1)
        assert_eq!(colors[3], expected_rgba([1.0, 0.0, 0.0, 1.0])); // a (3,1)
    }

    #[test]
    fn grid_draws_over_the_authored_packet_and_guides_on_top() {
        let commands = vec![rect_command("authored", 0, 1, [0.2, 0.4, 0.6, 0.8])];
        let overlay = OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![
                    crate::OverlayLine {
                        axis: OverlayAxis::X,
                        position: 100.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                    crate::OverlayLine {
                        axis: OverlayAxis::Y,
                        position: 200.0,
                        weight: crate::OverlayWeight::Major,
                        alpha: 1.0,
                    },
                ],
                dots: Some(vec![crate::OverlayDot {
                    x: 50.0,
                    y: 50.0,
                    weight: crate::OverlayWeight::Minor,
                    alpha: 1.0,
                }]),
                axes: Some(vec![crate::OverlayLine {
                    axis: OverlayAxis::X,
                    position: 0.0,
                    weight: crate::OverlayWeight::Major,
                    alpha: 1.0,
                }]),
            }),
            guides: Some(vec![
                OverlayGuide {
                    axis: OverlayAxis::X,
                    position: 250.0,
                    visible: true,
                },
                // Hidden guides draw nothing.
                OverlayGuide {
                    axis: OverlayAxis::Y,
                    position: 300.0,
                    visible: false,
                },
            ]),
        };

        let encoding = encode_frame(&commands, &viewport(), Some(&overlay)).unwrap();

        // The authored rect draws first, then the grid overlay, then the
        // visible guide on top.
        let mut expected = vec![expected_rgba([0.2, 0.4, 0.6, 0.8])];
        expected.push(expected_rgba(GRID_DOT_MINOR_COLOR));
        expected.push(expected_rgba(GRID_MINOR_COLOR));
        expected.push(expected_rgba(GRID_MAJOR_COLOR));
        expected.push(expected_rgba(GRID_AXIS_COLOR));
        expected.push(expected_rgba(GUIDE_COLOR));
        assert_eq!(draw_order(&encoding), expected);
    }

    #[test]
    fn overlay_lines_cull_offscreen() {
        let overlay = OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![
                    crate::OverlayLine {
                        axis: OverlayAxis::X,
                        position: 1_000_000.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                    crate::OverlayLine {
                        axis: OverlayAxis::Y,
                        position: 100.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                ],
                dots: None,
                axes: None,
            }),
            guides: None,
        };
        let encoding = encode_frame(&[], &viewport(), Some(&overlay)).unwrap();
        // The offscreen x-line is culled; only the visible y-line draws.
        assert_eq!(draw_order(&encoding), vec![expected_rgba(GRID_MINOR_COLOR)]);
    }

    #[test]
    fn lod_grid_renders_at_every_zoom_no_pixel_grid() {
        // The LOD ladder owns every zoom: there is no pixel grid and no
        // suppression — minor/major lines, dots and axes draw at any zoom,
        // and the ladder's nice-number steps hold the [6, 32] screen-px band
        // (8 px nominal: step = 8 / zoom).
        let overlay = |_viewport: &Viewport| OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![
                    crate::OverlayLine {
                        axis: OverlayAxis::X,
                        position: 0.0,
                        weight: crate::OverlayWeight::Major,
                        alpha: 1.0,
                    },
                    crate::OverlayLine {
                        axis: OverlayAxis::Y,
                        position: 40.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                ],
                dots: Some(vec![crate::OverlayDot {
                    x: 8.0,
                    y: 8.0,
                    weight: crate::OverlayWeight::Minor,
                    alpha: 1.0,
                }]),
                axes: Some(vec![crate::OverlayLine {
                    axis: OverlayAxis::X,
                    position: 0.0,
                    weight: crate::OverlayWeight::Major,
                    alpha: 1.0,
                }]),
            }),
            guides: None,
        };
        // Zoom 4 (the former pixel-grid gate): the LOD line, the dot and the
        // axis ALL draw — nothing is suppressed by a second scale.
        let mut zoomed = viewport();
        zoomed.zoom = 4.0;
        let high = encode_frame(&[], &zoomed, Some(&overlay(&zoomed))).unwrap();
        let colors = draw_order(&high);
        assert!(colors.contains(&expected_rgba(GRID_MAJOR_COLOR)));
        assert!(colors.contains(&expected_rgba(GRID_MINOR_COLOR)));
        assert!(colors.contains(&expected_rgba(GRID_DOT_MINOR_COLOR)));
        assert!(colors.contains(&expected_rgba(GRID_AXIS_COLOR)));
        // The same at the maximum zoom — one grid, all zooms.
        let mut max = viewport();
        max.zoom = 16.0;
        let max_high = encode_frame(&[], &max, Some(&overlay(&max))).unwrap();
        let max_colors = draw_order(&max_high);
        assert!(max_colors.contains(&expected_rgba(GRID_MAJOR_COLOR)));
        assert!(max_colors.contains(&expected_rgba(GRID_DOT_MINOR_COLOR)));
    }

    #[test]
    fn overlay_lines_at_low_zoom_render_at_the_right_scale() {
        // The 5% zoom case from the browser: the packet's lines at 160-unit
        // steps must project to 8px apart on screen. If the vertical lines
        // land at 200px apart (as observed), the affine or the rect
        // construction is wrong at low zoom.
        let mut low = viewport();
        low.zoom = 0.05;
        low.pan_x = 423.2086344481033;
        low.pan_y = 237.51347050404416;
        low.width = 1280.0;
        low.height = 577.0;
        let overlay = |_v: &Viewport| OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![
                    crate::OverlayLine {
                        axis: OverlayAxis::X,
                        position: -8320.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                    crate::OverlayLine {
                        axis: OverlayAxis::X,
                        position: -8160.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                    crate::OverlayLine {
                        axis: OverlayAxis::Y,
                        position: -4640.0,
                        weight: crate::OverlayWeight::Minor,
                        alpha: 1.0,
                    },
                ],
                dots: None,
                axes: None,
            }),
            guides: None,
        };
        let encoding = encode_frame(&[], &low, Some(&overlay(&low))).unwrap();
        let colors = draw_order(&encoding);
        assert_eq!(colors.len(), 3, "all three lines must draw at low zoom");
    }

    #[test]
    fn overlay_lines_at_low_zoom_snap_to_device_pixels() {
        let mut pan = viewport();
        pan.pan_x = 3.7;
        pan.pan_y = -11.3;
        pan.pixel_ratio = 2.0;
        // Vertical line at world 0: device center = (0×1 + 3.7)×2 = 7.4 →
        // snapped start 6, span [6, 8) device px → world x ∈ [−0.7, 0.3).
        let vertical = snap_overlay_line(OverlayAxis::X, 0.0, 1.0, &pan).unwrap();
        let x0_device = (vertical.x0 * pan.zoom + pan.pan_x) * pan.pixel_ratio;
        let x1_device = (vertical.x1 * pan.zoom + pan.pan_x) * pan.pixel_ratio;
        assert!((x0_device - 6.0).abs() < 1e-9, "x0 device {x0_device}");
        assert!((x1_device - 8.0).abs() < 1e-9, "x1 device {x1_device}");
        // Horizontal major line at world 40: thickness 1.25px → 2.5
        // device px → rounds to 2 (crisp, integer).
        let horizontal = snap_overlay_line(OverlayAxis::Y, 40.0, 1.25, &pan).unwrap();
        let y0_device = (horizontal.y0 * pan.zoom + pan.pan_y) * pan.pixel_ratio;
        let y1_device = (horizontal.y1 * pan.zoom + pan.pan_y) * pan.pixel_ratio;
        assert!(
            (y0_device - y0_device.round()).abs() < 1e-9,
            "y0 device {y0_device}"
        );
        assert!(
            (y1_device - y1_device.round()).abs() < 1e-9,
            "y1 device {y1_device}"
        );
        assert_eq!(y1_device - y0_device, 3.0);
        // The span edges (the viewport-facing dimension) are untouched.
        assert_eq!(vertical.y0, world_min_y(&pan));
        assert_eq!(vertical.y1, world_min_y(&pan) + world_span_y(&pan));
    }

    fn encode_error(result: Result<Encoding, EncodeError>) -> EncodeError {
        match result {
            Err(error) => error,
            Ok(_) => panic!("expected an encode error"),
        }
    }

    fn non_finite_fill_rule_error(command: &DrawCall) -> String {
        encode_error(encode_frame(
            std::slice::from_ref(command),
            &viewport(),
            None,
        ))
        .to_string()
    }

    #[test]
    fn scene_rects_encode_under_the_kernel_composition() {
        // The coordinate-model alignment: the legacy Scene keeps the
        // placement in the bounds, but the renderer must draw every rect
        // where the kernel's authoritative math says it is —
        // parent × translate(bounds.x, y) × transform over LOCAL
        // geometry (rotation around the node's own origin, children in
        // the parent's transformed space). The encoder folds the
        // placement at encode time: bounds become local, the transform
        // carries it. This is what keeps the selection box on the drawn
        // element.
        let mk = |id: &str, bounds: Bounds, transform: Transform| Layer {
            id: id.to_owned(),
            bounds,
            transform,
            fill: "#112233".to_owned(),
            opacity: 1.0,
            visible: true,
            z_index: 0,
            corner_radius: None,
            r#type: None,
            children: None,
        };
        let mut rotated = mk(
            "rotated",
            Bounds {
                x: 260.0,
                y: 150.0,
                width: 340.0,
                height: 210.0,
            },
            Transform {
                a: 0.0,
                b: 1.0,
                c: -1.0,
                d: 0.0,
                e: 0.0,
                f: 0.0,
            },
        );
        rotated.children = Some(vec![mk(
            "child",
            Bounds {
                x: 40.0,
                y: 20.0,
                width: 60.0,
                height: 30.0,
            },
            Transform::default(),
        )]);
        let layers = vec![rotated];
        let mut emitted = Vec::new();
        let mut changed = Vec::new();
        let mut dirty = None;
        let mut selection = None;
        let mut order = 1;
        let consistent = encode_layers(
            &layers,
            true,
            Transform::default(),
            None,
            &mut selection,
            &mut order,
            &mut HashMap::new(),
            &mut emitted,
            &mut changed,
            &mut dirty,
            &HashSet::new(),
            false,
            true,
            Some(&viewport()),
        );
        assert!(consistent);
        // The rotated rect: local bounds, the placement folded into the
        // transform (translate(260, 150) × rotation).
        let rotated_draw = emitted
            .iter()
            .find(|draw| draw.node_id == "rotated")
            .unwrap();
        assert_eq!(
            rotated_draw.bounds,
            Bounds {
                x: 0.0,
                y: 0.0,
                width: 340.0,
                height: 210.0
            }
        );
        assert_eq!(
            rotated_draw.transform,
            Transform {
                a: 0.0,
                b: 1.0,
                c: -1.0,
                d: 0.0,
                e: 260.0,
                f: 150.0
            }
        );
        // The child lands in the parent's transformed space: the parent's
        // full transform composed with the child's placement — its local
        // origin maps to R(40, 20) + (260, 150) = (240, 190).
        let child_draw = emitted.iter().find(|draw| draw.node_id == "child").unwrap();
        assert_eq!(
            child_draw.transform,
            Transform {
                a: 0.0,
                b: 1.0,
                c: -1.0,
                d: 0.0,
                e: 240.0,
                f: 190.0
            }
        );
    }

    #[test]
    fn non_finite_transforms_are_rejected_at_the_boundary() {
        let mut command = rect_command("node-1", 0, 1, [1.0, 0.0, 0.0, 1.0]);
        command.transform = Transform {
            a: f64::NAN,
            ..Transform::default()
        };
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-1:transform.a"
        );

        command.transform = Transform {
            f: f64::INFINITY,
            ..Transform::default()
        };
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-1:transform.f"
        );

        // Finite as f64, infinite once cast to the f32 stream — the same
        // vello#470 failure class.
        command.transform = Transform {
            e: 1e300,
            ..Transform::default()
        };
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-1:transform.e"
        );
    }

    #[test]
    fn non_finite_rect_bounds_are_rejected() {
        let mut command = rect_command("node-2", 0, 1, [1.0, 0.0, 0.0, 1.0]);
        command.bounds = Bounds {
            x: f64::NAN,
            y: 0.0,
            width: 10.0,
            height: 10.0,
        };
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-2:bounds.x"
        );
    }

    #[test]
    fn non_finite_path_coordinates_and_handles_are_rejected() {
        let geometry = DrawPathGeometry {
            points: HashMap::from([(
                "p0".to_owned(),
                point(
                    "00000000",
                    f64::NAN,
                    0.0,
                    DrawPathHandleMode::Corner,
                    None,
                    None,
                ),
            )]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: false })]),
        };
        let command = path_command(
            "node-3",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            geometry,
            None,
        );
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-3:path.point.x"
        );

        let geometry = DrawPathGeometry {
            points: HashMap::from([(
                "p0".to_owned(),
                point(
                    "00000000",
                    0.0,
                    0.0,
                    DrawPathHandleMode::Free,
                    None,
                    Some(DrawPathHandle {
                        dx: f64::INFINITY,
                        dy: 0.0,
                    }),
                ),
            )]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: false })]),
        };
        let command = path_command(
            "node-4",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            geometry,
            None,
        );
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-4:path.handleOut.dx"
        );
    }

    #[test]
    fn non_finite_stroke_width_is_rejected() {
        let stroke = DrawStrokeDescriptor {
            width: 1e300,
            caps: DrawLineCap::Round,
            joins: DrawLineJoin::Round,
            dash: vec![],
        };
        let command = path_command(
            "node-5",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            triangle_geometry(),
            Some(stroke),
        );
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-5:stroke.width"
        );

        let negative = DrawStrokeDescriptor {
            width: -2.0,
            caps: DrawLineCap::Round,
            joins: DrawLineJoin::Round,
            dash: vec![],
        };
        let command = path_command(
            "node-5",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            triangle_geometry(),
            Some(negative),
        );
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-5:stroke.width"
        );
    }

    #[test]
    fn contract_violations_are_rejected() {
        // A "path" geometry with no path records.
        let mut command = rect_command("node-6", 0, 1, [1.0, 0.0, 0.0, 1.0]);
        command.geometry = "path".to_owned();
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-6:path"
        );

        // An unknown geometry string is never coerced into a draw.
        let mut command = rect_command("node-7", 0, 1, [1.0, 0.0, 0.0, 1.0]);
        command.geometry = "ellipse".to_owned();
        assert_eq!(
            non_finite_fill_rule_error(&command),
            "VELLO_ENCODE_FAILED:node-7:geometry"
        );
    }

    #[test]
    fn non_finite_overlay_positions_are_rejected() {
        let overlay = OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![crate::OverlayLine {
                    axis: OverlayAxis::X,
                    position: f64::NAN,
                    weight: crate::OverlayWeight::Minor,
                    alpha: 1.0,
                }],
                dots: None,
                axes: None,
            }),
            guides: None,
        };
        let error = encode_error(encode_frame(&[], &viewport(), Some(&overlay)));
        assert_eq!(
            error.to_string(),
            "VELLO_ENCODE_FAILED:overlay:line.position"
        );
    }

    #[test]
    fn invalid_viewports_are_rejected() {
        let mut zero_zoom = viewport();
        zero_zoom.zoom = 0.0;
        let error = encode_error(encode_frame(&[], &zero_zoom, None));
        assert_eq!(error.to_string(), "VELLO_ENCODE_FAILED:viewport:dimensions");

        let mut nan_pan = viewport();
        nan_pan.pan_x = f64::NAN;
        let error = encode_error(encode_frame(&[], &nan_pan, None));
        assert_eq!(
            error.to_string(),
            "VELLO_ENCODE_FAILED:viewport:viewport.panX"
        );

        // The render path derives the surface size from the pixel ratio:
        // a non-finite or non-positive ratio is the same degenerate-input
        // class as a zero viewport.
        let mut nan_ratio = viewport();
        nan_ratio.pixel_ratio = f64::NAN;
        let error = encode_error(encode_frame(&[], &nan_ratio, None));
        assert_eq!(
            error.to_string(),
            "VELLO_ENCODE_FAILED:viewport:viewport.pixelRatio"
        );

        let mut zero_ratio = viewport();
        zero_ratio.pixel_ratio = 0.0;
        let error = encode_error(encode_frame(&[], &zero_ratio, None));
        assert_eq!(error.to_string(), "VELLO_ENCODE_FAILED:viewport:dimensions");
    }

    #[test]
    fn fill_rules_reach_the_style_stream() {
        let nonzero = path_command(
            "nonzero",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            triangle_geometry(),
            None,
        );
        let evenodd = path_command(
            "evenodd",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::EvenOdd,
            triangle_geometry(),
            None,
        );
        let nonzero_encoding = encode_frame(&[nonzero], &viewport(), None).unwrap();
        let evenodd_encoding = encode_frame(&[evenodd], &viewport(), None).unwrap();
        let nonzero_style = &nonzero_encoding.styles[0];
        let evenodd_style = &evenodd_encoding.styles[0];
        assert_eq!(
            nonzero_style.flags_and_miter_limit & Style::FLAGS_FILL_BIT,
            0
        );
        assert_ne!(
            evenodd_style.flags_and_miter_limit & Style::FLAGS_FILL_BIT,
            0
        );
        assert_ne!(nonzero_encoding.styles, evenodd_encoding.styles);
    }

    #[test]
    fn stroke_descriptors_encode_a_stroke_style_and_zero_width_draws_nothing() {
        let stroked = path_command(
            "stroked",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            triangle_geometry(),
            Some(DrawStrokeDescriptor {
                width: 2.0,
                caps: DrawLineCap::Round,
                joins: DrawLineJoin::Bevel,
                dash: vec![],
            }),
        );
        let encoding = encode_frame(&[stroked], &viewport(), None).unwrap();
        let style = &encoding.styles[0];
        assert_ne!(style.flags_and_miter_limit & Style::FLAGS_STYLE_BIT, 0);
        assert_eq!(style.line_width, 2.0);
        assert_eq!(encoding.n_paths, 1);

        let invisible = path_command(
            "invisible",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            triangle_geometry(),
            Some(DrawStrokeDescriptor {
                width: 0.0,
                caps: DrawLineCap::Butt,
                joins: DrawLineJoin::Miter,
                dash: vec![],
            }),
        );
        let encoding = encode_frame(&[invisible], &viewport(), None).unwrap();
        assert!(draw_order(&encoding).is_empty());
    }

    #[test]
    fn mirrored_handles_derive_handle_in_from_handle_out() {
        // Open subpath with two points: p0 corner at (0,0), p1 mirrored
        // with handleOut (10, 0). The segment p0→p1 must use p1's derived
        // handleIn (-10, 0): control points (0,0) → (40,50).
        let geometry = DrawPathGeometry {
            points: HashMap::from([
                (
                    "p0".to_owned(),
                    point("00000000", 0.0, 0.0, DrawPathHandleMode::Corner, None, None),
                ),
                (
                    "p1".to_owned(),
                    point(
                        "00000001",
                        50.0,
                        50.0,
                        DrawPathHandleMode::Mirrored,
                        None,
                        Some(DrawPathHandle { dx: 10.0, dy: 0.0 }),
                    ),
                ),
            ]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: false })]),
        };
        let command = path_command(
            "mirror",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            geometry,
            None,
        );
        let encoding = encode_frame(&[command], &viewport(), None).unwrap();
        // move (0,0) then one cubic (c1, c2, end): six f32 words, then the
        // fill's implicit close back to (0,0) — fills close open subpaths
        // per SVG/canvas semantics (Vello's is_fill flag).
        assert_eq!(encoding.path_data.len(), 10);
        assert_eq!(encoding.n_path_segments, 2);
        assert_eq!(f32::from_bits(encoding.path_data[4]), 40.0);
        assert_eq!(f32::from_bits(encoding.path_data[5]), 50.0);
        assert_eq!(f32::from_bits(encoding.path_data[6]), 50.0);
        assert_eq!(f32::from_bits(encoding.path_data[7]), 50.0);
    }

    #[test]
    fn closed_subpaths_encode_the_wrap_segment_with_its_handles() {
        // Closed subpath, two points: p0 mirrored with handleOut (10, 0),
        // p1 corner at (100, 0). Segments: p0→p1, then the wrap p1→p0
        // whose handleIn comes from p0's mirror: c2 = p0 + (-10, 0).
        let geometry = DrawPathGeometry {
            points: HashMap::from([
                (
                    "p0".to_owned(),
                    point(
                        "00000000",
                        0.0,
                        0.0,
                        DrawPathHandleMode::Mirrored,
                        None,
                        Some(DrawPathHandle { dx: 10.0, dy: 0.0 }),
                    ),
                ),
                (
                    "p1".to_owned(),
                    point(
                        "00000001",
                        100.0,
                        0.0,
                        DrawPathHandleMode::Corner,
                        None,
                        None,
                    ),
                ),
            ]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: true })]),
        };
        let command = path_command(
            "closed",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            geometry,
            None,
        );
        let encoding = encode_frame(&[command], &viewport(), None).unwrap();
        // Two cubic segments (p0→p1 and the wrap p1→p0) — the wrap is
        // authored geometry, not a straight close.
        assert_eq!(encoding.n_path_segments, 2);
        // move (2 words) + cubic (6) + wrap cubic (6): the wrap's c2 is
        // (-10, 0) — the mirrored handleIn of p0.
        assert_eq!(encoding.path_data.len(), 14);
        assert_eq!(f32::from_bits(encoding.path_data[10]), -10.0);
        assert_eq!(f32::from_bits(encoding.path_data[13]), 0.0);
    }

    #[test]
    fn points_sort_by_order_key_within_a_subpath() {
        // Points are fed in shuffled order; the order key decides the
        // sequence (fixed-width base-62: string order IS numeric order).
        let geometry = DrawPathGeometry {
            points: HashMap::from([
                (
                    "p2".to_owned(),
                    point(
                        "00000002",
                        200.0,
                        200.0,
                        DrawPathHandleMode::Corner,
                        None,
                        None,
                    ),
                ),
                (
                    "p0".to_owned(),
                    point("00000000", 0.0, 0.0, DrawPathHandleMode::Corner, None, None),
                ),
                (
                    "p1".to_owned(),
                    point(
                        "00000001",
                        100.0,
                        0.0,
                        DrawPathHandleMode::Corner,
                        None,
                        None,
                    ),
                ),
            ]),
            subpaths: HashMap::from([("s1".to_owned(), DrawPathSubpath { closed: false })]),
        };
        let command = path_command(
            "sorted",
            0,
            1,
            [1.0, 0.0, 0.0, 1.0],
            DrawFillRule::NonZero,
            geometry,
            None,
        );
        let encoding = encode_frame(&[command], &viewport(), None).unwrap();
        // move (0,0), cubic to (100,0), cubic to (200,200), then the
        // fill's implicit close back to (0,0): three segments.
        assert_eq!(encoding.n_path_segments, 3);
        assert_eq!(encoding.path_data.len(), 2 + 6 + 6 + 2);
    }

    #[test]
    fn encoding_is_deterministic_across_runs() {
        let commands = vec![
            path_command(
                "path-a",
                1,
                2,
                [1.0, 0.0, 0.0, 1.0],
                DrawFillRule::EvenOdd,
                triangle_geometry(),
                Some(DrawStrokeDescriptor {
                    width: 3.0,
                    caps: DrawLineCap::Square,
                    joins: DrawLineJoin::Miter,
                    dash: vec![4.0, 2.0],
                }),
            ),
            rect_command("rect-low", 0, 1, [0.0, 1.0, 0.0, 0.5]),
            rect_command("rect-high", 2, 1, [0.0, 0.0, 1.0, 1.0]),
        ];
        let overlay = OverlayPacket {
            grid: Some(crate::OverlayGrid {
                lines: vec![crate::OverlayLine {
                    axis: OverlayAxis::Y,
                    position: 100.0,
                    weight: crate::OverlayWeight::Major,
                    alpha: 1.0,
                }],
                dots: None,
                axes: None,
            }),
            guides: Some(vec![OverlayGuide {
                axis: OverlayAxis::X,
                position: 50.0,
                visible: true,
            }]),
        };

        let first = encode_frame(&commands, &viewport(), Some(&overlay)).unwrap();
        let second = encode_frame(&commands, &viewport(), Some(&overlay)).unwrap();

        assert!(
            first.path_tags == second.path_tags,
            "path tag streams differ"
        );
        assert_eq!(first.path_data, second.path_data);
        assert!(
            first.draw_tags == second.draw_tags,
            "draw tag streams differ"
        );
        assert_eq!(first.draw_data, second.draw_data);
        assert_eq!(first.transforms, second.transforms);
        assert_eq!(first.styles, second.styles);
        assert_eq!(first.n_paths, second.n_paths);
        assert_eq!(first.n_path_segments, second.n_path_segments);
        assert_eq!(draw_order(&first), draw_order(&second));
        assert_eq!(stream_fingerprint(&first), stream_fingerprint(&second));
        assert_eq!(encoded_bytes(&first), encoded_bytes(&second));
        assert!(encoded_bytes(&first) > 0);
    }

    #[test]
    fn encode_frame_entry_is_deterministic() {
        let mut core = RendererCore::new();
        let frame = serde_json::json!({
                "protocolVersion": 3,
                "frameId": "frame-1",
                "viewport": {"panX": 0.0, "panY": 0.0, "zoom": 1.0, "width": 640.0, "height": 480.0, "pixelRatio": 1.0},
                "commands": [
                    {"geometry": "rect", "nodeId": "r1", "bounds": {"x": 0.0, "y": 0.0, "width": 10.0, "height": 10.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 5.0, "f": 0.0}, "fill": [0.2, 0.4, 0.6, 0.8], "opacity": 0.8, "zIndex": 0, "order": 1},
                    {"geometry": "path", "nodeId": "p1", "bounds": {"x": 0.0, "y": 0.0, "width": 100.0, "height": 100.0}, "transform": {"a": 1.0, "b": 0.0, "c": 0.0, "d": 1.0, "e": 0.0, "f": 0.0}, "fill": [1.0, 0.0, 0.0, 1.0], "opacity": 1.0, "zIndex": 1, "order": 1, "fillRule": "evenodd", "path": {"points": {"p0": {"subpathId": "s1", "order": "00000000", "x": 0.0, "y": 0.0, "handleMode": "corner"}, "p1": {"subpathId": "s1", "order": "00000001", "x": 100.0, "y": 0.0, "handleMode": "corner"}, "p2": {"subpathId": "s1", "order": "00000002", "x": 0.0, "y": 100.0, "handleMode": "corner"}}, "subpaths": {"s1": {"closed": true}}}}
                ],
                "documentRevision": 1,
                "packetRevision": 1
            })
            .to_string();

        let first = core.encode_frame(&frame).unwrap();
        let second = core.encode_frame(&frame).unwrap();
        assert_eq!(first, second);
        assert!(first.starts_with("{\"bytes\":"));
        assert!(first.contains("\"paths\":2"));
    }
}
