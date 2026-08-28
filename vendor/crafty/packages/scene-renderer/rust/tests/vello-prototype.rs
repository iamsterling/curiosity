// Vello phase-A de-risking prototype (openspec change vector-path-rendering,
// section 1). Headless: encodes the existing comparison fixtures through
// vello_cpu 0.2.0's RenderContext API and rasterizes to a CPU pixmap. This
// runs as an integration test because the fixture is constructed in Rust and
// the vello types are consumed directly; it does not need the crate's private
// encoder, and src/ is a live in-flight surface.
//
// The parity claim is deliberately narrow: byte-identical output across runs
// on the same machine and toolchain, recorded with the environment in
// benchmarks/vello-cpu-prototype-report.md. Cross-platform byte-identity is
// NOT claimed — vello_cpu 0.2.0 exposes no public scalar fallback level
// (`Level::fallback` is gated behind a feature vello_common does not enable),
// so SIMD level varies by host.
#![forbid(unsafe_code)]

use sha2::{Digest, Sha256};
use std::time::Instant;
use vello_cpu::{
    kurbo::{BezPath, Rect},
    peniko::{Color, Fill},
    Pixmap, RenderContext, Resources,
};

const VIEWPORT_WIDTH: u16 = 1_000;
const VIEWPORT_HEIGHT: u16 = 800;
const TEN_THOUSAND: usize = 10_000;

// Deterministic rect fixture, re-derived from the TypeScript fixture
// benchmarks/renderer-comparison-fixtures.ts (commandAt): x=(i%125)*8,
// y=(i/125)*8, w=6, h=6, fill=[(i*17%256)/255, (i*31%256)/255, (i*47%256)/255, 1].
// Re-derived in Rust rather than imported because the fixture is generated
// code and the parity harness must be runnable without the TS toolchain.
// The colour formula cycles with period 256, so exactly 256 distinct colours
// appear across the 10,000 rects.
fn fixture_rect(index: usize) -> (Rect, Color) {
    let x = ((index % 125) * 8) as f64;
    let y = ((index / 125) * 8) as f64;
    let color = Color::from_rgba8(
        (index * 17 % 256) as u8,
        (index * 31 % 256) as u8,
        (index * 47 % 256) as u8,
        255,
    );
    (Rect::new(x, y, x + 6.0, y + 6.0), color)
}

fn encode_rect_fixture(count: usize) -> RenderContext {
    let mut context = RenderContext::new(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    for index in 0..count {
        let (rect, color) = fixture_rect(index);
        context.set_paint(color);
        context.fill_rect(&rect);
    }
    context.flush();
    context
}

fn render(context: &RenderContext, resources: &mut Resources) -> Pixmap {
    let mut pixmap = Pixmap::new(context.width(), context.height());
    context.render(&mut pixmap, resources);
    pixmap
}

fn sha256_of_pixmap(pixmap: &Pixmap) -> String {
    let mut hasher = Sha256::new();
    for pixel in pixmap.data() {
        hasher.update([pixel.r, pixel.g, pixel.b, pixel.a]);
    }
    let digest = hasher.finalize();
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

// (opaque pixel count, distinct opaque colours) — the two cheap
// "not a blank image" witnesses that do not depend on cross-platform
// byte-identity.
fn coverage(pixmap: &Pixmap) -> (usize, usize) {
    let mut opaque = 0usize;
    let mut distinct = std::collections::HashSet::new();
    for pixel in pixmap.data() {
        if pixel.a > 0 {
            opaque += 1;
            distinct.insert(u32::from_le_bytes([pixel.r, pixel.g, pixel.b, pixel.a]));
        }
    }
    (opaque, distinct.len())
}

#[test]
fn ten_thousand_rect_fixture_renders_a_non_trivial_image() {
    let mut resources = Resources::new();
    let pixmap = render(&encode_rect_fixture(TEN_THOUSAND), &mut resources);

    assert_eq!(pixmap.width(), VIEWPORT_WIDTH);
    assert_eq!(pixmap.height(), VIEWPORT_HEIGHT);

    // Each 6x6 rect at integer coordinates covers 36 pixels; the fixture has
    // 10,000 of them on a 1000x800 target. The band is generous against AA
    // fringe differences while still proving the whole fixture drew.
    let (opaque, distinct) = coverage(&pixmap);
    assert!(
        (300_000..420_000).contains(&opaque),
        "expected ~360k covered pixels, got {opaque}"
    );
    // gcd(17,256)=gcd(31,256)=gcd(47,256)=1, so the colour triple cycles with
    // period exactly 256 — the whole palette appears in the first 256 rects
    // and every colour is opaque and distinct after premultiplication.
    assert_eq!(distinct, 256, "expected the full 256-colour palette");
    // Gaps between rects stay transparent — the image is not an opaque block.
    let transparent = VIEWPORT_WIDTH as usize * VIEWPORT_HEIGHT as usize - opaque;
    assert!(transparent > 100_000);
}

#[test]
fn representative_fixture_renders_byte_identically_across_runs() {
    let mut first = Resources::new();
    let mut second = Resources::new();
    let first = sha256_of_pixmap(&render(&encode_rect_fixture(12), &mut first));
    let second = sha256_of_pixmap(&render(&encode_rect_fixture(12), &mut second));

    assert_eq!(first, second);
    assert!(!first.is_empty());
}

// Two overlapping cubic-approximated circles in one BezPath, both subpaths
// counterclockwise. The overlap lens has winding number 2, so nonzero fills
// it and evenodd cuts a hole — the canonical witness that the fill rule
// reaches the rasterizer (research vello-vector-rasterization.md §5, the
// documented conflation case). A single-lobe figure-eight does not diverge:
// its winding stays ±1 everywhere, which is why this fixture uses overlap.
fn overlapping_circle_figure() -> BezPath {
    const K: f64 = 0.552_284_749_830_793_6;
    let mut path = BezPath::new();
    for (cx, cy) in [(120.0, 100.0), (180.0, 100.0)] {
        let r = 45.0;
        path.move_to((cx + r, cy));
        path.curve_to((cx + r, cy - K * r), (cx + K * r, cy - r), (cx - r, cy - r));
        path.curve_to((cx - K * r, cy - r), (cx - r, cy - K * r), (cx - r, cy));
        path.curve_to((cx - r, cy + K * r), (cx - K * r, cy + r), (cx + r, cy + r));
        path.curve_to((cx + K * r, cy + r), (cx + r, cy + K * r), (cx + r, cy));
        path.close_path();
    }
    path
}

fn encode_figure(fill_rule: Fill) -> RenderContext {
    let mut context = RenderContext::new(300, 200);
    context.set_fill_rule(fill_rule);
    context.set_paint(Color::from_rgba8(0, 128, 255, 255));
    context.fill_path(&overlapping_circle_figure());
    context.flush();
    context
}

#[test]
fn self_overlapping_bezier_differs_between_fill_rules() {
    let mut nonzero_resources = Resources::new();
    let mut evenodd_resources = Resources::new();
    let nonzero = render(&encode_figure(Fill::NonZero), &mut nonzero_resources);
    let evenodd = render(&encode_figure(Fill::EvenOdd), &mut evenodd_resources);

    let (nonzero_opaque, _) = coverage(&nonzero);
    let (evenodd_opaque, _) = coverage(&evenodd);
    assert!(nonzero_opaque > 0, "nonzero render is blank");
    assert!(evenodd_opaque > 0, "evenodd render is blank");
    // The lens (winding 2) is filled under nonzero and a hole under evenodd,
    // so nonzero covers strictly more pixels and the hashes diverge.
    assert!(nonzero_opaque > evenodd_opaque);
    assert_ne!(sha256_of_pixmap(&nonzero), sha256_of_pixmap(&evenodd));
}

// Record-generation harness, not a CI assertion: measures the 10k encode and
// render as distributions (median of 7, min/max) and prints the reference
// hashes for transcription into benchmarks/vello-cpu-prototype-report.md.
// Run with:
//   cargo test --release --test vello-prototype -- --ignored --nocapture
// It is ignored so normal `cargo test` output stays clean; the numbers below
// are environment-dependent and deliberately not asserted.
#[test]
#[ignore]
fn record_generation_harness() {
    let iterations = 7;
    let mut encodes = Vec::with_capacity(iterations);
    let mut renders = Vec::with_capacity(iterations);
    let mut resources = Resources::new();
    let mut context = RenderContext::new(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    for _ in 0..iterations {
        let encode_start = Instant::now();
        context.reset();
        for index in 0..TEN_THOUSAND {
            let (rect, color) = fixture_rect(index);
            context.set_paint(color);
            context.fill_rect(&rect);
        }
        context.flush();
        encodes.push(encode_start.elapsed().as_secs_f64() * 1_000.0);

        let render_start = Instant::now();
        let mut pixmap = Pixmap::new(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        context.render(&mut pixmap, &mut resources);
        renders.push(render_start.elapsed().as_secs_f64() * 1_000.0);
    }

    let mut representative_resources = Resources::new();
    let representative = render(&encode_rect_fixture(12), &mut representative_resources);
    println!(
        "REFERENCE_REPRESENTATIVE={}",
        sha256_of_pixmap(&representative)
    );

    let mut sorted_encodes = encodes.clone();
    sorted_encodes.sort_by(f64::total_cmp);
    let mut sorted_renders = renders.clone();
    sorted_renders.sort_by(f64::total_cmp);
    let median = |sorted: &[f64]| sorted[sorted.len() / 2];

    println!(
        "ENCODE_10K median={:.4}ms min={:.4}ms max={:.4}ms samples={:?}",
        median(&sorted_encodes),
        sorted_encodes[0],
        *sorted_encodes.last().unwrap(),
        encodes
    );
    println!(
        "RENDER_10K median={:.4}ms min={:.4}ms max={:.4}ms samples={:?}",
        median(&sorted_renders),
        sorted_renders[0],
        *sorted_renders.last().unwrap(),
        renders
    );

    let mut ten_k_resources = Resources::new();
    let ten_k_pixmap = render(&encode_rect_fixture(TEN_THOUSAND), &mut ten_k_resources);
    println!("REFERENCE_TEN_THOUSAND={}", sha256_of_pixmap(&ten_k_pixmap));
    println!("COVERAGE_TEN_THOUSAND={:?}", coverage(&ten_k_pixmap));

    let mut figure_resources = Resources::new();
    let figure_nonzero = render(&encode_figure(Fill::NonZero), &mut figure_resources);
    let figure_evenodd = render(&encode_figure(Fill::EvenOdd), &mut figure_resources);
    println!(
        "REFERENCE_FIGURE_NONZERO={}\nREFERENCE_FIGURE_EVENODD={}",
        sha256_of_pixmap(&figure_nonzero),
        sha256_of_pixmap(&figure_evenodd)
    );
    println!(
        "COVERAGE_FIGURE={:?}",
        (coverage(&figure_nonzero).0, coverage(&figure_evenodd).0)
    );
}
