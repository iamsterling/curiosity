#[cfg(test)]
mod retained_contour_acceptance_oracle {
    use super::*;

    #[derive(Default)]
    struct Collector {
        contours: Vec<Contour>,
        active: Option<usize>,
        next_ordinal: usize,
    }

    struct Contour {
        first: (f64, f64),
        segments: Vec<Segment>,
        closes: usize,
    }

    enum Segment {
        Line { ordinal: usize, end: (f64, f64) },
        Quad { ordinal: usize, control: (f64, f64), end: (f64, f64) },
        Cubic { ordinal: usize, control1: (f64, f64), control2: (f64, f64), end: (f64, f64) },
    }

    impl OutlineBuilder for Collector {
        fn move_to(&mut self, x: f32, y: f32) {
            self.contours.push(Contour {
                first: (f64::from(x), f64::from(y)),
                segments: Vec::new(),
                closes: 0,
            });
            self.active = Some(self.contours.len() - 1);
            self.next_ordinal = 0;
        }
        fn line_to(&mut self, x: f32, y: f32) {
            self.contours[self.active.expect("line without contour")]
                .segments
                .push(Segment::Line { ordinal: self.next_ordinal, end: (f64::from(x), f64::from(y)) });
            self.next_ordinal += 1;
        }
        fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
            self.contours[self.active.expect("quad without contour")]
                .segments
                .push(Segment::Quad { ordinal: self.next_ordinal, control: (f64::from(x1), f64::from(y1)), end: (f64::from(x), f64::from(y)) });
            self.next_ordinal += 1;
        }
        fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
            self.contours[self.active.expect("cubic without contour")]
                .segments
                .push(Segment::Cubic { ordinal: self.next_ordinal, control1: (f64::from(x1), f64::from(y1)), control2: (f64::from(x2), f64::from(y2)), end: (f64::from(x), f64::from(y)) });
            self.next_ordinal += 1;
        }
        fn close(&mut self) {
            let index = self.active.take().expect("close without contour");
            self.contours[index].closes += 1;
        }
    }

    fn end(segment: &Segment) -> (f64, f64) {
        match segment {
            Segment::Line { end, .. } | Segment::Quad { end, .. } | Segment::Cubic { end, .. } => *end,
        }
    }

    fn ordinal(segment: &Segment) -> usize {
        match segment {
            Segment::Line { ordinal, .. } | Segment::Quad { ordinal, .. } | Segment::Cubic { ordinal, .. } => *ordinal,
        }
    }

    fn controls(start: (f64, f64), segment: &Segment) -> ((f64, f64), (f64, f64)) {
        match segment {
            Segment::Line { end, .. } => (start, *end),
            Segment::Quad { control, end, .. } => (
                ((start.0 + 2.0 * control.0) / 3.0, (start.1 + 2.0 * control.1) / 3.0),
                ((2.0 * control.0 + end.0) / 3.0, (2.0 * control.1 + end.1) / 3.0),
            ),
            Segment::Cubic { control1, control2, .. } => (*control1, *control2),
        }
    }

    fn assert_near(actual: (f64, f64), expected: (f64, f64), message: &str) {
        assert!((actual.0 - expected.0).abs() <= 1e-10 && (actual.1 - expected.1).abs() <= 1e-10, "{message}: actual={actual:?} expected={expected:?}");
    }

    fn fixture(character: char) -> (Face<'static>, Collector, DrawPathGeometry, f64, f64, f64) {
        let face = Face::parse(INTER_FONT, 0).unwrap();
        let mut source = Collector::default();
        face.outline_glyph(face.glyph_index(character).unwrap(), &mut source)
            .unwrap();
        let size = 32.0;
        let scale = size / f64::from(face.units_per_em());
        let ascender = f64::from(face.ascender()) * scale;
        let min_x = source
            .contours
            .iter()
            .flat_map(|contour| std::iter::once(contour.first).chain(contour.segments.iter().map(end)))
            .map(|point| point.0 * scale)
            .fold(f64::INFINITY, f64::min);
        let min_y = source
            .contours
            .iter()
            .flat_map(|contour| std::iter::once(contour.first).chain(contour.segments.iter().map(end)))
            .map(|point| ascender - point.1 * scale)
            .fold(f64::INFINITY, f64::min);
        let geometry = text_geometry(&character.to_string(), size).unwrap();
        (face, source, geometry, scale, min_x, min_y)
    }

    fn first_points(geometry: &DrawPathGeometry) -> Vec<&DrawPathPoint> {
        let mut subpath_ids: Vec<_> = geometry.subpaths.keys().collect();
        subpath_ids.sort();
        subpath_ids
            .into_iter()
            .map(|subpath_id| {
                let mut points: Vec<_> = geometry
                    .points
                    .values()
                    .filter(|point| point.subpath_id == *subpath_id)
                    .collect();
                points.sort_by(|left, right| left.order.cmp(&right.order));
                points[0]
            })
            .collect()
    }

    #[test]
    fn retains_contour_topology() {
        for character in ['O', 'B', '8'] {
            let (_, source, geometry, _, _, _) = fixture(character);
            assert!(source.contours.len() > 1, "source fixture must contain holes");
            assert_eq!(
                geometry.subpaths.len(),
                source.contours.len(),
                "TOPOLOGY: {character} source contours must remain distinct"
            );
        }
    }

    #[test]
    fn retains_contour_closure() {
        for character in ['O', 'B', '8'] {
            let (_, _, geometry, _, _, _) = fixture(character);
            assert!(
                geometry.subpaths.values().all(|subpath| subpath.closed),
                "CLOSURE: {character} source contours must be closed"
            );
        }
    }

    #[test]
    fn retains_move_anchors() {
        let (face, source, geometry, scale, min_x, min_y) = fixture('O');
        let ascender = f64::from(face.ascender()) * scale;
        let actual = first_points(&geometry);
        assert_eq!(actual.len(), source.contours.len(), "ANCHOR: contour mapping");
        for (point, contour) in actual.into_iter().zip(source.contours.iter()) {
            assert_eq!(
                (point.x, point.y),
                (
                    contour.first.0 * scale - min_x,
                    ascender - contour.first.1 * scale - min_y,
                ),
                "ANCHOR: move_to must be the first stored anchor"
            );
        }
    }

    #[test]
    fn retains_curve_control_sides() {
        let (_, source, geometry, _, _, _) = fixture('O');
        let mut subpath_ids: Vec<_> = geometry.subpaths.keys().collect();
        subpath_ids.sort();
        for (subpath_id, contour) in subpath_ids.into_iter().zip(source.contours.iter()) {
            let mut points: Vec<_> = geometry
                .points
                .values()
                .filter(|point| point.subpath_id == *subpath_id)
                .collect();
            points.sort_by(|left, right| left.order.cmp(&right.order));
            assert_eq!(points.len(), contour.segments.len(), "CONTROL: one anchor per segment");
            for (index, segment) in contour.segments.iter().enumerate() {
                if matches!(segment, Segment::Quad { .. } | Segment::Cubic { .. }) {
                    let next = &points[(index + 1) % points.len()];
                    assert!(
                        points[index].handle_out.is_some() && next.handle_in.is_some(),
                        "CONTROL: both curve sides must be present"
                    );
                }
            }
        }
    }

    #[test]
    fn reconstructs_every_callback_segment_and_terminal_wrap_exactly_once() {
        let (face, source, geometry, scale, min_x, min_y) = fixture('O');
        let ascender = f64::from(face.ascender()) * scale;
        let canvas = |point: (f64, f64)| (point.0 * scale - min_x, ascender - point.1 * scale - min_y);
        let mut subpath_ids: Vec<_> = geometry.subpaths.keys().collect();
        subpath_ids.sort();
        assert_eq!(subpath_ids.len(), source.contours.len(), "SEGMENT: contour mapping");
        for (subpath_id, contour) in subpath_ids.into_iter().zip(source.contours.iter()) {
            let mut points: Vec<_> = geometry.points.values().filter(|point| point.subpath_id == *subpath_id).collect();
            points.sort_by(|left, right| left.order.cmp(&right.order));
            assert_eq!(points.len(), contour.segments.len(), "SEGMENT: n callbacks must produce n anchors");
            let mut source_start = contour.first;
            for (index, segment) in contour.segments.iter().enumerate() {
                assert_eq!(ordinal(segment), index, "SEGMENT: callback ordinal");
                let actual_start = points[index];
                let actual_end = points[(index + 1) % points.len()];
                let source_end = end(segment);
                let (source_c1, source_c2) = controls(source_start, segment);
                let actual_c1 = actual_start.handle_out.map(|handle| (actual_start.x + handle.dx, actual_start.y + handle.dy)).unwrap_or((actual_start.x, actual_start.y));
                let actual_c2 = actual_end.handle_in.map(|handle| (actual_end.x + handle.dx, actual_end.y + handle.dy)).unwrap_or((actual_end.x, actual_end.y));
                assert_near((actual_start.x, actual_start.y), canvas(source_start), "SEGMENT: start");
                assert_near(actual_c1, canvas(source_c1), "CONTROL: outgoing cubic control");
                assert_near(actual_c2, canvas(source_c2), "CONTROL: incoming cubic control");
                assert_near((actual_end.x, actual_end.y), canvas(source_end), "SEGMENT: endpoint");
                source_start = source_end;
            }
            assert_eq!(source_start, contour.first, "WRAP: terminal segment must end at first anchor");
        }
    }
}
