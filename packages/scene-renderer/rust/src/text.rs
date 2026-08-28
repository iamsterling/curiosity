//! Single-line text tessellation: glyph outlines → the packet's path
//! geometry. The keystone that unblocks measurement readouts, rulers, frame
//! labels and the text tool — text is drawn as ordinary Vello paths, so no
//! rasterization backend is needed.
//!
//! The font is Inter (SIL OFL 1.1 — fonts/Inter-LICENSE.txt), embedded into
//! the module. The model carries no font metrics, so the layout is the
//! single-line advance ladder: each glyph advances by its hmtx width scaled
//! to the requested font size; the ascent (hhea) places the baseline below
//! the box's top. Unsupported characters (control codes, newlines, missing
//! glyphs) are skipped — a text draw is never a hard failure.

use std::collections::HashMap;

use ttf_parser::{Face, GlyphId, OutlineBuilder};

use crate::{DrawPathGeometry, DrawPathHandle, DrawPathHandleMode, DrawPathPoint, DrawPathSubpath};

/// The embedded font's bytes — Inter Regular, OFL 1.1.
pub static INTER_FONT: &[u8] = include_bytes!("../fonts/Inter-Regular.ttf");

/// The kernel's order-key alphabet (path-geometry.ts) — fixed-width base-62,
/// so string order IS numeric order, the encoder's own sorting rule.
const ORDER_ALPHABET: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ORDER_WIDTH: usize = 8;

/// The n-th fixed-width base-62 order key (0 → "00000000").
fn order_key(index: u32) -> String {
    let mut value = u64::from(index);
    let mut chars = vec![b'0'; ORDER_WIDTH];
    for slot in (0..ORDER_WIDTH).rev() {
        chars[slot] = ORDER_ALPHABET[(value % 62) as usize];
        value /= 62;
    }
    String::from_utf8(chars).expect("order key is ASCII")
}

/// A character whose outline cannot be resolved (control codes, newlines,
/// zero-width spaces) — skipped by the tessellator, never a failure.
fn is_skippable(c: char) -> bool {
    c.is_control() || c == '\u{200B}'
}

#[derive(Default)]
struct GlyphOutline {
    contours: Vec<RawContour>,
    active: Option<usize>,
    malformed: bool,
}

#[derive(Default)]
struct RawContour {
    first: (f64, f64),
    segments: Vec<RawSegment>,
    closes: usize,
}

enum RawSegment {
    Line {
        end: (f64, f64),
    },
    Quad {
        control: (f64, f64),
        end: (f64, f64),
    },
    Cubic {
        control1: (f64, f64),
        control2: (f64, f64),
        end: (f64, f64),
    },
}

struct OutlineAnchor {
    point: (f64, f64),
    handle_in: Option<DrawPathHandle>,
    handle_out: Option<DrawPathHandle>,
}

impl OutlineBuilder for GlyphOutline {
    fn move_to(&mut self, x: f32, y: f32) {
        if self.active.is_some() {
            self.malformed = true;
        }
        self.contours.push(RawContour {
            first: (f64::from(x), f64::from(y)),
            ..RawContour::default()
        });
        self.active = Some(self.contours.len() - 1);
    }

    fn line_to(&mut self, x: f32, y: f32) {
        if let Some(index) = self.active {
            self.contours[index].segments.push(RawSegment::Line {
                end: (f64::from(x), f64::from(y)),
            });
        } else {
            self.malformed = true;
        }
    }

    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        if let Some(index) = self.active {
            self.contours[index].segments.push(RawSegment::Quad {
                control: (f64::from(x1), f64::from(y1)),
                end: (f64::from(x), f64::from(y)),
            });
        } else {
            self.malformed = true;
        }
    }

    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        if let Some(index) = self.active {
            self.contours[index].segments.push(RawSegment::Cubic {
                control1: (f64::from(x1), f64::from(y1)),
                control2: (f64::from(x2), f64::from(y2)),
                end: (f64::from(x), f64::from(y)),
            });
        } else {
            self.malformed = true;
        }
    }

    fn close(&mut self) {
        if let Some(index) = self.active.take() {
            self.contours[index].closes += 1;
        } else {
            self.malformed = true;
        }
    }
}

fn normalize_outline(outline: GlyphOutline) -> Result<Vec<Vec<OutlineAnchor>>, ()> {
    if outline.malformed || outline.active.is_some() {
        return Err(());
    }
    outline
        .contours
        .into_iter()
        .map(normalize_contour)
        .collect()
}

fn normalize_contour(contour: RawContour) -> Result<Vec<OutlineAnchor>, ()> {
    if contour.closes != 1
        || contour.segments.len() < 2
        || segment_end(contour.segments.last().ok_or(())?) != contour.first
    {
        return Err(());
    }
    let count = contour.segments.len();
    let mut anchors = Vec::with_capacity(count);
    anchors.push(OutlineAnchor {
        point: contour.first,
        handle_in: None,
        handle_out: None,
    });
    for segment in contour.segments.iter().take(count - 1) {
        anchors.push(OutlineAnchor {
            point: segment_end(segment),
            handle_in: None,
            handle_out: None,
        });
    }
    for (index, segment) in contour.segments.iter().enumerate() {
        let next = (index + 1) % count;
        if let Some((control1, control2)) = cubic_controls(anchors[index].point, segment) {
            anchors[index].handle_out = Some(DrawPathHandle {
                dx: control1.0 - anchors[index].point.0,
                dy: control1.1 - anchors[index].point.1,
            });
            anchors[next].handle_in = Some(DrawPathHandle {
                dx: control2.0 - anchors[next].point.0,
                dy: control2.1 - anchors[next].point.1,
            });
        }
    }
    Ok(anchors)
}

fn segment_end(segment: &RawSegment) -> (f64, f64) {
    match segment {
        RawSegment::Line { end } | RawSegment::Quad { end, .. } | RawSegment::Cubic { end, .. } => {
            *end
        }
    }
}

fn cubic_controls(start: (f64, f64), segment: &RawSegment) -> Option<((f64, f64), (f64, f64))> {
    match segment {
        RawSegment::Line { .. } => None,
        RawSegment::Quad { control, end } => Some((
            (
                (start.0 + 2.0 * control.0) / 3.0,
                (start.1 + 2.0 * control.1) / 3.0,
            ),
            (
                (2.0 * control.0 + end.0) / 3.0,
                (2.0 * control.1 + end.1) / 3.0,
            ),
        )),
        RawSegment::Cubic {
            control1, control2, ..
        } => Some((*control1, *control2)),
    }
}

/// Tessellates a single-line string into the packet's path geometry, laid
/// out at the requested font size with the baseline below the box top by
/// the font's ascent. Each source contour becomes one closed subpath.
/// The geometry is rebased onto the (0,0) min corner — the pinned form
/// authored paths use, with the caller's bounds carrying the placement.
///
/// Returns an empty geometry when nothing could be drawn (all glyphs
/// missing) — the encoder draws nothing, never fails.
pub fn text_geometry(text: &str, font_size: f64) -> Result<DrawPathGeometry, String> {
    let face =
        Face::parse(INTER_FONT, 0).map_err(|error| format!("FONT_PARSE_FAILED:{error:?}"))?;
    if !font_size.is_finite() || font_size <= 0.0 {
        return Err("TEXT_FONT_SIZE_INVALID".to_owned());
    }
    let units_per_em = f64::from(face.units_per_em().max(1));
    let scale = font_size / units_per_em;
    let ascender = f64::from(face.ascender()) * scale;
    let hmtx = face
        .tables()
        .hmtx
        .ok_or_else(|| "FONT_HMTX_MISSING".to_owned())?;
    let advance_of =
        |id: GlyphId| f64::from(hmtx.advance(id).unwrap_or(units_per_em as u16)) * scale;

    // Pass one: tessellate every glyph at its pen position, into the box's
    // y-down space (baseline below the top), tracking the min corner.
    let mut points: HashMap<String, DrawPathPoint> = HashMap::new();
    let mut subpaths: HashMap<String, DrawPathSubpath> = HashMap::new();
    let mut min_x = f64::INFINITY;
    let mut min_y = f64::INFINITY;
    let mut pen_x = 0.0f64;
    let mut point_index = 0u32;
    let mut glyph_index = 0u32;
    for c in text.chars() {
        if is_skippable(c) {
            continue;
        }
        let glyph_id = face.glyph_index(c).unwrap_or(GlyphId(0));
        let advance = advance_of(glyph_id);
        if glyph_id.0 == 0 {
            pen_x += advance; // a missing glyph advances like a space
            continue;
        }
        let mut outline = GlyphOutline::default();
        if face.outline_glyph(glyph_id, &mut outline).is_none() {
            pen_x += advance;
            continue;
        }
        let Ok(contours) = normalize_outline(outline) else {
            pen_x += advance;
            continue;
        };
        // Build glyph-local records first: any malformed contour rejects this
        // occurrence without leaking a partial contour into the presentation.
        let mut glyph_points = Vec::new();
        let mut glyph_subpaths = Vec::new();
        for (contour_index, contour) in contours.iter().enumerate() {
            let subpath_id = format!("glyph-{glyph_index:08}-contour-{contour_index:08}");
            for anchor in contour {
                let px = anchor.point.0 * scale + pen_x;
                let py = ascender - anchor.point.1 * scale;
                glyph_points.push((
                    subpath_id.clone(),
                    DrawPathPoint {
                        subpath_id: subpath_id.clone(),
                        order: order_key(point_index + glyph_points.len() as u32),
                        x: px,
                        y: py,
                        handle_mode: if anchor.handle_in.is_some() || anchor.handle_out.is_some() {
                            DrawPathHandleMode::Free
                        } else {
                            DrawPathHandleMode::Corner
                        },
                        handle_in: anchor.handle_in.map(|handle| DrawPathHandle {
                            dx: handle.dx * scale,
                            dy: -handle.dy * scale,
                        }),
                        handle_out: anchor.handle_out.map(|handle| DrawPathHandle {
                            dx: handle.dx * scale,
                            dy: -handle.dy * scale,
                        }),
                    },
                ));
            }
            glyph_subpaths.push(subpath_id);
        }
        if glyph_points.is_empty() {
            pen_x += advance;
            continue;
        }
        for (_, point) in &glyph_points {
            min_x = min_x.min(point.x);
            min_y = min_y.min(point.y);
        }
        for (_, point) in glyph_points {
            let id = format!("pt-{point_index}");
            point_index += 1;
            points.insert(id, point);
        }
        for subpath_id in glyph_subpaths {
            subpaths.insert(subpath_id, DrawPathSubpath { closed: true });
        }
        pen_x += advance;
        glyph_index += 1;
    }

    if points.is_empty() {
        return Ok(DrawPathGeometry {
            points: HashMap::new(),
            subpaths: HashMap::new(),
        });
    }

    // Pass two: rebase onto the (0,0) min corner.
    for point in points.values_mut() {
        point.x -= min_x;
        point.y -= min_y;
    }
    Ok(DrawPathGeometry { points, subpaths })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{transform_point, Transform};

    /// Deliberately independent from the production outline adapter: this is the
    /// source-font callback oracle for the topology contract.
    #[derive(Default)]
    struct RawCollector {
        contours: Vec<RawContour>,
        active: Option<usize>,
        next_ordinal: usize,
    }

    #[derive(Debug)]
    struct RawContour {
        first: (f64, f64),
        segments: Vec<RawSegment>,
        closes: usize,
    }

    #[derive(Debug)]
    enum RawSegment {
        Line {
            ordinal: usize,
            end: (f64, f64),
        },
        Quad {
            ordinal: usize,
            control: (f64, f64),
            end: (f64, f64),
        },
        Cubic {
            ordinal: usize,
            control1: (f64, f64),
            control2: (f64, f64),
            end: (f64, f64),
        },
    }

    impl OutlineBuilder for RawCollector {
        fn move_to(&mut self, x: f32, y: f32) {
            self.contours.push(RawContour {
                first: (f64::from(x), f64::from(y)),
                segments: vec![],
                closes: 0,
            });
            self.active = Some(self.contours.len() - 1);
            self.next_ordinal = 0;
        }
        fn line_to(&mut self, x: f32, y: f32) {
            if let Some(index) = self.active {
                self.contours[index].segments.push(RawSegment::Line {
                    ordinal: self.next_ordinal,
                    end: (f64::from(x), f64::from(y)),
                });
                self.next_ordinal += 1;
            }
        }
        fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
            if let Some(index) = self.active {
                self.contours[index].segments.push(RawSegment::Quad {
                    ordinal: self.next_ordinal,
                    control: (f64::from(x1), f64::from(y1)),
                    end: (f64::from(x), f64::from(y)),
                });
                self.next_ordinal += 1;
            }
        }
        fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
            if let Some(index) = self.active {
                self.contours[index].segments.push(RawSegment::Cubic {
                    ordinal: self.next_ordinal,
                    control1: (f64::from(x1), f64::from(y1)),
                    control2: (f64::from(x2), f64::from(y2)),
                    end: (f64::from(x), f64::from(y)),
                });
                self.next_ordinal += 1;
            }
        }
        fn close(&mut self) {
            if let Some(index) = self.active.take() {
                self.contours[index].closes += 1;
            }
        }
    }

    #[test]
    fn embedded_hole_glyphs_preserve_one_closed_subpath_per_source_contour() {
        let face = Face::parse(INTER_FONT, 0).unwrap();
        for character in ['O', 'B', '8'] {
            let mut raw = RawCollector::default();
            let glyph_id = face.glyph_index(character).expect("embedded Inter glyph");
            assert_ne!(glyph_id.0, 0);
            assert!(face.outline_glyph(glyph_id, &mut raw).is_some());
            assert!(raw.contours.len() > 1, "{character} must witness a hole");
            assert!(raw.contours.iter().all(|contour| contour.closes == 1));

            let geometry = text_geometry(&character.to_string(), 32.0).unwrap();
            assert_eq!(geometry.subpaths.len(), raw.contours.len(), "{character}");
            assert!(
                geometry.subpaths.values().all(|subpath| subpath.closed),
                "{character}"
            );
        }
    }

    fn raw_end(segment: &RawSegment) -> (f64, f64) {
        match segment {
            RawSegment::Line { end, .. }
            | RawSegment::Quad { end, .. }
            | RawSegment::Cubic { end, .. } => *end,
        }
    }

    fn raw_ordinal(segment: &RawSegment) -> usize {
        match segment {
            RawSegment::Line { ordinal, .. }
            | RawSegment::Quad { ordinal, .. }
            | RawSegment::Cubic { ordinal, .. } => *ordinal,
        }
    }

    fn raw_controls(start: (f64, f64), segment: &RawSegment) -> ((f64, f64), (f64, f64)) {
        match segment {
            RawSegment::Line { end, .. } => (start, *end),
            RawSegment::Quad { control, end, .. } => (
                (
                    (start.0 + 2.0 * control.0) / 3.0,
                    (start.1 + 2.0 * control.1) / 3.0,
                ),
                (
                    (2.0 * control.0 + end.0) / 3.0,
                    (2.0 * control.1 + end.1) / 3.0,
                ),
            ),
            RawSegment::Cubic {
                control1, control2, ..
            } => (*control1, *control2),
        }
    }

    fn assert_point_eq(actual: Option<(f64, f64)>, expected: (f64, f64)) {
        let actual = actual.expect("curve side must retain its control");
        // Handles are stored as deltas, so reconstructing a control performs
        // one subtraction/addition round-trip not present in the raw callback.
        assert!((actual.0 - expected.0).abs() <= 1e-10);
        assert!((actual.1 - expected.1).abs() <= 1e-10);
    }

    #[test]
    fn source_callback_oracle_reconstructs_every_embedded_hole_glyph_segment_once() {
        let face = Face::parse(INTER_FONT, 0).unwrap();
        for character in ['O', 'B', '8'] {
            let mut raw = RawCollector::default();
            let glyph_id = face.glyph_index(character).unwrap();
            face.outline_glyph(glyph_id, &mut raw).unwrap();
            // Do not invoke GlyphOutline or normalize_outline here. The production
            // geometry is the other side of this oracle; the expected contour is
            // derived only from the independently collected callback stream.
            let font_size = 32.0;
            let scale = font_size / f64::from(face.units_per_em());
            let ascender = f64::from(face.ascender()) * scale;
            let min_x = raw
                .contours
                .iter()
                .flat_map(|contour| {
                    std::iter::once(contour.first).chain(contour.segments.iter().map(raw_end))
                })
                .map(|point| point.0 * scale)
                .fold(f64::INFINITY, f64::min);
            let min_y = raw
                .contours
                .iter()
                .flat_map(|contour| {
                    std::iter::once(contour.first).chain(contour.segments.iter().map(raw_end))
                })
                .map(|point| ascender - point.1 * scale)
                .fold(f64::INFINITY, f64::min);
            let geometry = text_geometry(&character.to_string(), font_size).unwrap();
            let mut production: Vec<_> = geometry
                .subpaths
                .keys()
                .map(|subpath_id| {
                    let mut anchors: Vec<_> = geometry
                        .points
                        .values()
                        .filter(|point| point.subpath_id == *subpath_id)
                        .collect();
                    anchors.sort_by(|left, right| left.order.cmp(&right.order));
                    (subpath_id, anchors)
                })
                .collect();
            production.sort_by(|(left, _), (right, _)| left.cmp(right));
            assert_eq!(production.len(), raw.contours.len(), "{character}");
            for (source, (_, stored)) in raw.contours.iter().zip(production.iter()) {
                assert_eq!(stored.len(), source.segments.len());
                assert_eq!(
                    (stored[0].x, stored[0].y),
                    (
                        source.first.0 * scale - min_x,
                        ascender - source.first.1 * scale - min_y
                    ),
                    "first anchor {character}"
                );
                for (index, segment) in source.segments.iter().enumerate() {
                    assert_eq!(raw_ordinal(segment), index, "callback ordinal {character}");
                    let next = &stored[(index + 1) % stored.len()];
                    let start = (stored[index].x, stored[index].y);
                    let (c1, c2) = raw_controls(
                        (
                            (start.0 + min_x) / scale,
                            (ascender - (start.1 + min_y)) / scale,
                        ),
                        segment,
                    );
                    let end = raw_end(segment);
                    assert_eq!(
                        (next.x, next.y),
                        (end.0 * scale - min_x, ascender - end.1 * scale - min_y),
                        "endpoint {character}:{index}"
                    );
                    match segment {
                        RawSegment::Line { .. } => {
                            assert!(stored[index].handle_out.is_none());
                            assert!(next.handle_in.is_none());
                        }
                        _ => {
                            assert_point_eq(
                                stored[index].handle_out.as_ref().map(|handle| {
                                    (
                                        (stored[index].x + handle.dx + min_x) / scale,
                                        (ascender - (stored[index].y + handle.dy + min_y)) / scale,
                                    )
                                }),
                                c1,
                            );
                            assert_point_eq(
                                next.handle_in.as_ref().map(|handle| {
                                    (
                                        (next.x + handle.dx + min_x) / scale,
                                        (ascender - (next.y + handle.dy + min_y)) / scale,
                                    )
                                }),
                                c2,
                            );
                        }
                    }
                }
            }
        }
    }

    fn cubic_area(points: [(f64, f64); 4]) -> f64 {
        let polynomial = |values: [f64; 4]| {
            [
                values[0],
                3.0 * (values[1] - values[0]),
                3.0 * (values[0] - 2.0 * values[1] + values[2]),
                -values[0] + 3.0 * values[1] - 3.0 * values[2] + values[3],
            ]
        };
        let x = polynomial([points[0].0, points[1].0, points[2].0, points[3].0]);
        let y = polynomial([points[0].1, points[1].1, points[2].1, points[3].1]);
        let derivative = |value: [f64; 4]| [value[1], 2.0 * value[2], 3.0 * value[3]];
        let dx = derivative(x);
        let dy = derivative(y);
        let mut integral = 0.0;
        for (left_index, left) in x.iter().enumerate() {
            for (right_index, right) in dy.iter().enumerate() {
                integral += left * right / f64::from((left_index + right_index + 1) as u32);
            }
        }
        for (left_index, left) in y.iter().enumerate() {
            for (right_index, right) in dx.iter().enumerate() {
                integral -= left * right / f64::from((left_index + right_index + 1) as u32);
            }
        }
        integral * 0.5
    }

    fn raw_contour_area(contour: &RawContour) -> f64 {
        let mut start = contour.first;
        contour
            .segments
            .iter()
            .map(|segment| {
                let end = raw_end(segment);
                let (c1, c2) = raw_controls(start, segment);
                let area = cubic_area([start, c1, c2, end]);
                start = end;
                area
            })
            .sum()
    }

    fn geometry_contour_area(points: &[&DrawPathPoint], transform: Transform) -> f64 {
        let apply = |point: (f64, f64)| transform_point(point, transform);
        (0..points.len())
            .map(|index| {
                let start = points[index];
                let end = points[(index + 1) % points.len()];
                let out = start
                    .handle_out
                    .map(|handle| (handle.dx, handle.dy))
                    .unwrap_or((0.0, 0.0));
                let incoming = end
                    .handle_in
                    .map(|handle| (handle.dx, handle.dy))
                    .unwrap_or((0.0, 0.0));
                cubic_area([
                    apply((start.x, start.y)),
                    apply((start.x + out.0, start.y + out.1)),
                    apply((end.x + incoming.0, end.y + incoming.1)),
                    apply((end.x, end.y)),
                ])
            })
            .sum()
    }

    #[test]
    fn transformed_bezier_winding_preserves_nonzero_outer_hole_relationships() {
        let face = Face::parse(INTER_FONT, 0).unwrap();
        for character in ['O', 'B', '8'] {
            let mut raw = RawCollector::default();
            face.outline_glyph(face.glyph_index(character).unwrap(), &mut raw)
                .unwrap();
            let source_areas: Vec<_> = raw.contours.iter().map(raw_contour_area).collect();
            assert!(source_areas.iter().all(|area| area.abs() > f64::EPSILON));
            let outer_sign = source_areas
                .iter()
                .max_by(|left, right| left.abs().total_cmp(&right.abs()))
                .unwrap()
                .signum();
            assert!(
                source_areas.iter().any(|area| area.signum() == -outer_sign),
                "{character} must retain a nonzero hole winding"
            );

            let geometry = text_geometry(&character.to_string(), 32.0).unwrap();
            let mut subpath_ids: Vec<_> = geometry.subpaths.keys().collect();
            subpath_ids.sort();
            for transform in [
                Transform::default(),
                Transform {
                    a: 1.25,
                    b: 0.2,
                    c: -0.15,
                    d: 0.75,
                    e: 17.25,
                    f: 9.5,
                },
                Transform {
                    a: -1.0,
                    b: 0.0,
                    c: 0.0,
                    d: 1.0,
                    e: 128.0,
                    f: 0.0,
                },
            ] {
                let determinant_sign =
                    (transform.a * transform.d - transform.b * transform.c).signum();
                for (source_area, subpath_id) in source_areas.iter().zip(subpath_ids.iter()) {
                    let mut points: Vec<_> = geometry
                        .points
                        .values()
                        .filter(|point| &point.subpath_id == *subpath_id)
                        .collect();
                    points.sort_by(|left, right| left.order.cmp(&right.order));
                    let actual = geometry_contour_area(&points, transform);
                    // text_geometry's font-y-up → canvas-y-down conversion flips once.
                    assert_eq!(
                        actual.signum(),
                        -source_area.signum() * determinant_sign,
                        "{character}"
                    );
                }
            }
        }
    }

    fn collect_synthetic(
        commands: impl Fn(&mut dyn OutlineBuilder),
    ) -> (RawCollector, GlyphOutline) {
        let mut reference = RawCollector::default();
        commands(&mut reference);
        let mut production = GlyphOutline::default();
        commands(&mut production);
        (reference, production)
    }

    fn assert_synthetic_matches_reference(name: &str, commands: impl Fn(&mut dyn OutlineBuilder)) {
        let (reference, production) = collect_synthetic(commands);
        let actual = normalize_outline(production).expect(name);
        assert_eq!(reference.contours.len(), 1, "{name}");
        assert_eq!(actual.len(), 1, "{name}");
        let source = &reference.contours[0];
        let stored = &actual[0];
        assert_eq!(stored.len(), source.segments.len(), "{name}");
        assert_eq!(stored[0].point, source.first, "{name}:first");
        for (index, segment) in source.segments.iter().enumerate() {
            assert_eq!(raw_ordinal(segment), index, "{name}:ordinal");
            let start = &stored[index];
            let end = &stored[(index + 1) % stored.len()];
            let expected_end = raw_end(segment);
            let (expected_c1, expected_c2) = raw_controls(start.point, segment);
            assert_eq!(end.point, expected_end, "{name}:endpoint:{index}");
            match segment {
                RawSegment::Line { .. } => {
                    assert!(start.handle_out.is_none(), "{name}:line-out:{index}");
                    assert!(end.handle_in.is_none(), "{name}:line-in:{index}");
                }
                _ => {
                    assert_point_eq(
                        start
                            .handle_out
                            .map(|handle| (start.point.0 + handle.dx, start.point.1 + handle.dy)),
                        expected_c1,
                    );
                    assert_point_eq(
                        end.handle_in
                            .map(|handle| (end.point.0 + handle.dx, end.point.1 + handle.dy)),
                        expected_c2,
                    );
                }
            }
        }
    }

    #[test]
    fn synthetic_callback_oracle_covers_segment_and_degenerate_classes() {
        assert_synthetic_matches_reference("line", |builder| {
            builder.move_to(0.0, 0.0);
            builder.line_to(3.0, 4.0);
            builder.line_to(0.0, 0.0);
            builder.close();
        });
        assert_synthetic_matches_reference("quadratic", |builder| {
            builder.move_to(0.0, 0.0);
            builder.quad_to(3.0, 6.0, 9.0, 3.0);
            builder.quad_to(6.0, -3.0, 0.0, 0.0);
            builder.close();
        });
        assert_synthetic_matches_reference("cubic", |builder| {
            builder.move_to(0.0, 0.0);
            builder.curve_to(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);
            builder.curve_to(4.0, 5.0, 2.0, 1.0, 0.0, 0.0);
            builder.close();
        });
        assert_synthetic_matches_reference("repeated-coordinate", |builder| {
            builder.move_to(0.0, 0.0);
            builder.line_to(2.0, 0.0);
            builder.line_to(2.0, 0.0);
            builder.line_to(0.0, 0.0);
            builder.close();
        });
        assert_synthetic_matches_reference("zero-length-curve", |builder| {
            builder.move_to(0.0, 0.0);
            builder.line_to(0.0, 0.0);
            builder.quad_to(0.0, 0.0, 0.0, 0.0);
            builder.close();
        });
    }

    #[test]
    fn synthetic_callback_oracle_rejects_one_segment_and_malformed_close_classes() {
        fn one_segment(builder: &mut dyn OutlineBuilder) {
            builder.move_to(0.0, 0.0);
            builder.line_to(0.0, 0.0);
            builder.close();
        }
        fn missing_close(builder: &mut dyn OutlineBuilder) {
            builder.move_to(0.0, 0.0);
            builder.line_to(1.0, 0.0);
            builder.line_to(0.0, 0.0);
        }
        fn double_close(builder: &mut dyn OutlineBuilder) {
            builder.move_to(0.0, 0.0);
            builder.line_to(1.0, 0.0);
            builder.line_to(0.0, 0.0);
            builder.close();
            builder.close();
        }
        fn wrong_terminal(builder: &mut dyn OutlineBuilder) {
            builder.move_to(0.0, 0.0);
            builder.line_to(1.0, 0.0);
            builder.line_to(1.0, 1.0);
            builder.close();
        }
        for (name, commands) in [
            ("one-segment", one_segment as fn(&mut dyn OutlineBuilder)),
            ("missing-close", missing_close),
            ("double-close", double_close),
            ("wrong-terminal", wrong_terminal),
        ] {
            let (_, production) = collect_synthetic(commands);
            assert!(normalize_outline(production).is_err(), "{name}");
        }
    }
}
