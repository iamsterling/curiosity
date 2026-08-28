//! Feature-gated ADR 0024 browser fixture. This module deliberately duplicates
//! the font callback collection and conversion rules instead of calling
//! `text::GlyphOutline`, `normalize_outline`, or `text_geometry` for its
//! reference side. Only the production side reaches that code through the
//! normal protocol-v5 text encoder.
#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

use std::collections::HashMap;

use serde::Serialize;
use ttf_parser::{Face, GlyphId, OutlineBuilder};

use crate::{
    Bounds, DrawCall, DrawFillRule, DrawPathGeometry, DrawPathHandle, DrawPathHandleMode,
    DrawPathPoint, DrawPathSubpath, PacketKind, RenderFrame, Transform, Viewport,
};

const GLYPHS: [char; 3] = ['O', 'B', '8'];
const SIZES: [f64; 3] = [16.0, 32.0, 64.0];
const TRANSFORMS: [(&str, Transform); 4] = [
    (
        "identity",
        Transform {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 0.0,
            f: 0.0,
        },
    ),
    (
        "fractional",
        Transform {
            a: 1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 0.375,
            f: 0.625,
        },
    ),
    (
        "affine",
        Transform {
            a: 1.25,
            b: 0.20,
            c: -0.15,
            d: 0.75,
            e: 17.25,
            f: 9.5,
        },
    ),
    (
        "reflection",
        Transform {
            a: -1.0,
            b: 0.0,
            c: 0.0,
            d: 1.0,
            e: 128.0,
            f: 0.0,
        },
    ),
];
// A 256-pixel pair stride preserves the compositor's spatial dither phase on
// the recorded Metal path. Smaller non-power-of-two strides produced isolated
// one-code-value compositor differences despite bit-identical Vello geometry.
const REGION_WIDTH: u32 = 256;
const REGION_HEIGHT: u32 = 160;
const COLUMNS: u32 = 4;
const ROWS: u32 = 9;

pub struct Fixture {
    pub encoding: vello_encoding::Encoding,
    pub viewport: Viewport,
    pub size: (u32, u32),
    pub metadata: String,
}

#[derive(Serialize)]
struct Region {
    glyph: char,
    glyph_id: u16,
    size: f64,
    transform: &'static str,
    matrix: [f64; 6],
    production: [u32; 4],
    reference: [u32; 4],
}

#[derive(Default)]
struct SourceCollector {
    contours: Vec<SourceContour>,
    active: Option<usize>,
    malformed: bool,
}

struct SourceContour {
    first: (f64, f64),
    segments: Vec<SourceSegment>,
    closes: usize,
}

enum SourceSegment {
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

impl OutlineBuilder for SourceCollector {
    fn move_to(&mut self, x: f32, y: f32) {
        if self.active.is_some() {
            self.malformed = true;
        }
        self.contours.push(SourceContour {
            first: (f64::from(x), f64::from(y)),
            segments: Vec::new(),
            closes: 0,
        });
        self.active = Some(self.contours.len() - 1);
    }
    fn line_to(&mut self, x: f32, y: f32) {
        match self.active {
            Some(index) => self.contours[index].segments.push(SourceSegment::Line {
                end: (f64::from(x), f64::from(y)),
            }),
            None => self.malformed = true,
        }
    }
    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        match self.active {
            Some(index) => self.contours[index].segments.push(SourceSegment::Quad {
                control: (f64::from(x1), f64::from(y1)),
                end: (f64::from(x), f64::from(y)),
            }),
            None => self.malformed = true,
        }
    }
    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        match self.active {
            Some(index) => self.contours[index].segments.push(SourceSegment::Cubic {
                control1: (f64::from(x1), f64::from(y1)),
                control2: (f64::from(x2), f64::from(y2)),
                end: (f64::from(x), f64::from(y)),
            }),
            None => self.malformed = true,
        }
    }
    fn close(&mut self) {
        match self.active.take() {
            Some(index) => self.contours[index].closes += 1,
            None => self.malformed = true,
        }
    }
}

fn endpoint(segment: &SourceSegment) -> (f64, f64) {
    match segment {
        SourceSegment::Line { end }
        | SourceSegment::Quad { end, .. }
        | SourceSegment::Cubic { end, .. } => *end,
    }
}

fn order_key(index: usize) -> String {
    format!("{index:08}")
}

/// Independently converts callback records to the shared path data shape.
/// Sharing that renderer-neutral shape and Vello's path encoder is intentional;
/// sharing production font normalization is forbidden and does not occur.
fn source_geometry(face: &Face<'_>, glyph: GlyphId, size: f64) -> Result<DrawPathGeometry, String> {
    let mut source = SourceCollector::default();
    face.outline_glyph(glyph, &mut source)
        .ok_or_else(|| "PIXEL_ORACLE_GLYPH_MISSING".to_owned())?;
    if source.malformed || source.active.is_some() {
        return Err("PIXEL_ORACLE_SOURCE_MALFORMED".to_owned());
    }
    let scale = size / f64::from(face.units_per_em());
    let ascender = f64::from(face.ascender()) * scale;
    let min_x = source
        .contours
        .iter()
        .flat_map(|contour| {
            std::iter::once(contour.first).chain(contour.segments.iter().map(endpoint))
        })
        .map(|point| point.0 * scale)
        .fold(f64::INFINITY, f64::min);
    let min_y = source
        .contours
        .iter()
        .flat_map(|contour| {
            std::iter::once(contour.first).chain(contour.segments.iter().map(endpoint))
        })
        .map(|point| ascender - point.1 * scale)
        .fold(f64::INFINITY, f64::min);
    let mut points = HashMap::new();
    let mut subpaths = HashMap::new();
    let mut point_index = 0usize;
    for (contour_index, contour) in source.contours.iter().enumerate() {
        if contour.closes != 1
            || contour.segments.len() < 2
            || endpoint(contour.segments.last().expect("length checked")) != contour.first
        {
            return Err("PIXEL_ORACLE_SOURCE_UNREPRESENTABLE".to_owned());
        }
        let count = contour.segments.len();
        let mut anchors = Vec::with_capacity(count);
        anchors.push((contour.first, None, None));
        for segment in contour.segments.iter().take(count - 1) {
            anchors.push((endpoint(segment), None, None));
        }
        for (index, segment) in contour.segments.iter().enumerate() {
            let next = (index + 1) % count;
            let start = anchors[index].0;
            let end = endpoint(segment);
            let controls = match segment {
                SourceSegment::Line { .. } => None,
                SourceSegment::Quad { control, .. } => Some((
                    (
                        (start.0 + 2.0 * control.0) / 3.0,
                        (start.1 + 2.0 * control.1) / 3.0,
                    ),
                    (
                        (2.0 * control.0 + end.0) / 3.0,
                        (2.0 * control.1 + end.1) / 3.0,
                    ),
                )),
                SourceSegment::Cubic {
                    control1, control2, ..
                } => Some((*control1, *control2)),
            };
            if let Some((c1, c2)) = controls {
                anchors[index].2 = Some((c1.0 - start.0, c1.1 - start.1));
                anchors[next].1 = Some((c2.0 - end.0, c2.1 - end.1));
            }
        }
        let subpath_id = format!("reference-contour-{contour_index:08}");
        for (point, handle_in, handle_out) in anchors {
            let convert = |handle: (f64, f64)| DrawPathHandle {
                dx: handle.0 * scale,
                dy: -handle.1 * scale,
            };
            points.insert(
                format!("reference-point-{point_index:08}"),
                DrawPathPoint {
                    subpath_id: subpath_id.clone(),
                    order: order_key(point_index),
                    x: point.0 * scale - min_x,
                    y: ascender - point.1 * scale - min_y,
                    handle_mode: if handle_in.is_some() || handle_out.is_some() {
                        DrawPathHandleMode::Free
                    } else {
                        DrawPathHandleMode::Corner
                    },
                    handle_in: handle_in.map(convert),
                    handle_out: handle_out.map(convert),
                },
            );
            point_index += 1;
        }
        subpaths.insert(subpath_id, DrawPathSubpath { closed: true });
    }
    Ok(DrawPathGeometry { points, subpaths })
}

fn command(
    node_id: String,
    transform: Transform,
    text: Option<char>,
    path: Option<DrawPathGeometry>,
    size: f64,
    order: u32,
) -> DrawCall {
    DrawCall {
        geometry: if text.is_some() {
            "text".to_owned()
        } else {
            "path".to_owned()
        },
        node_id,
        bounds: Bounds {
            x: 0.0,
            y: 0.0,
            width: size,
            height: size,
        },
        transform,
        fill: [0.93, 0.96, 1.0, 1.0],
        opacity: 1.0,
        z_index: 0,
        order,
        path,
        fill_rule: Some(DrawFillRule::NonZero),
        stroke: None,
        corner_radius: None,
        text: text.map(|value| value.to_string()),
        font_size: text.map(|_| size),
    }
}

pub fn fixture(mode: &str) -> Result<Fixture, String> {
    if !matches!(mode, "paired" | "production" | "reference") {
        return Err("PIXEL_ORACLE_MODE_INVALID".to_owned());
    }
    let face = Face::parse(crate::text::INTER_FONT, 0)
        .map_err(|_| "PIXEL_ORACLE_FONT_PARSE_FAILED".to_owned())?;
    let width = COLUMNS * REGION_WIDTH * if mode == "paired" { 2 } else { 1 };
    let height = ROWS * REGION_HEIGHT;
    let viewport = Viewport {
        pan_x: 0.0,
        pan_y: 0.0,
        zoom: 1.0,
        width: f64::from(width),
        height: f64::from(height),
        pixel_ratio: 1.0,
    };
    let mut commands = Vec::new();
    let mut regions = Vec::new();
    let mut order = 0u32;
    for (glyph_index, glyph) in GLYPHS.iter().enumerate() {
        let glyph_id = face
            .glyph_index(*glyph)
            .ok_or_else(|| "PIXEL_ORACLE_GLYPH_ZERO".to_owned())?;
        if glyph_id.0 == 0 {
            return Err("PIXEL_ORACLE_GLYPH_ZERO".to_owned());
        }
        for (size_index, size) in SIZES.iter().enumerate() {
            let row = (glyph_index * SIZES.len() + size_index) as u32;
            let reference = source_geometry(&face, glyph_id, *size)?;
            for (column, (name, matrix)) in TRANSFORMS.iter().enumerate() {
                let production_x =
                    column as u32 * REGION_WIDTH * if mode == "paired" { 2 } else { 1 };
                let reference_x = if mode == "paired" {
                    production_x + REGION_WIDTH
                } else {
                    production_x
                };
                let y = row * REGION_HEIGHT;
                let placed = |x: u32| Transform {
                    e: matrix.e + f64::from(x),
                    f: matrix.f + f64::from(y),
                    ..*matrix
                };
                if mode != "reference" {
                    commands.push(command(
                        format!("production-{glyph}-{size}-{name}"),
                        placed(production_x),
                        Some(*glyph),
                        None,
                        *size,
                        order,
                    ));
                    order += 1;
                }
                if mode != "production" {
                    commands.push(command(
                        format!("reference-{glyph}-{size}-{name}"),
                        placed(reference_x),
                        None,
                        Some(reference.clone()),
                        *size,
                        order,
                    ));
                    order += 1;
                }
                regions.push(Region {
                    glyph: *glyph,
                    glyph_id: glyph_id.0,
                    size: *size,
                    transform: name,
                    matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
                    production: [production_x, y, REGION_WIDTH, REGION_HEIGHT],
                    reference: [reference_x, y, REGION_WIDTH, REGION_HEIGHT],
                });
            }
        }
    }
    let frame = RenderFrame {
        protocol_version: 5,
        frame_id: "adr-0024-pixel-oracle".to_owned(),
        viewport,
        commands,
        glass_surfaces: Vec::new(),
        chrome_glass: Vec::new(),
        selection_bounds: None,
        document_revision: 0,
        packet_revision: 1,
        packet_kind: PacketKind::Full,
        changed_node_ids: Vec::new(),
        dirty_region: None,
        overlay: None,
    };
    let encoding = crate::vello_encoder::encode_frame(&frame.commands, &viewport, None)
        .map_err(|error| error.to_string())?;
    let metadata = serde_json::to_string(&serde_json::json!({
        "canvas": { "cssWidth": width, "cssHeight": height, "deviceWidth": width, "deviceHeight": height, "dpr": 1, "colorSpace": "srgb" },
        "regions": regions,
    })).map_err(|error| error.to_string())?;
    Ok(Fixture {
        encoding,
        viewport,
        size: (width, height),
        metadata,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sorted(geometry: &DrawPathGeometry) -> Vec<Vec<&DrawPathPoint>> {
        let mut contours: Vec<Vec<&DrawPathPoint>> = geometry
            .subpaths
            .keys()
            .map(|subpath| {
                let mut points: Vec<_> = geometry
                    .points
                    .values()
                    .filter(|point| &point.subpath_id == subpath)
                    .collect();
                points.sort_by(|left, right| left.order.cmp(&right.order));
                points
            })
            .collect();
        contours.sort_by(|left, right| left[0].subpath_id.cmp(&right[0].subpath_id));
        contours
    }

    #[test]
    fn independent_reference_coordinates_are_bit_exact_with_production() {
        let face = Face::parse(crate::text::INTER_FONT, 0).unwrap();
        for glyph in GLYPHS {
            let id = face.glyph_index(glyph).unwrap();
            for size in SIZES {
                let expected = source_geometry(&face, id, size).unwrap();
                let actual = crate::text::text_geometry(&glyph.to_string(), size).unwrap();
                let actual = sorted(&actual);
                let expected = sorted(&expected);
                assert_eq!(actual.len(), expected.len());
                for (actual_contour, expected_contour) in actual.iter().zip(expected.iter()) {
                    assert_eq!(actual_contour.len(), expected_contour.len());
                    for (actual, expected) in actual_contour.iter().zip(expected_contour.iter()) {
                        assert_eq!(
                            (actual.x.to_bits(), actual.y.to_bits()),
                            (expected.x.to_bits(), expected.y.to_bits()),
                            "{glyph} {size}"
                        );
                        assert_eq!(
                            actual.handle_in.map(|h| (h.dx.to_bits(), h.dy.to_bits())),
                            expected.handle_in.map(|h| (h.dx.to_bits(), h.dy.to_bits())),
                            "in {glyph} {size}"
                        );
                        assert_eq!(
                            actual.handle_out.map(|h| (h.dx.to_bits(), h.dy.to_bits())),
                            expected
                                .handle_out
                                .map(|h| (h.dx.to_bits(), h.dy.to_bits())),
                            "out {glyph} {size}"
                        );
                    }
                }
            }
        }
    }
}
