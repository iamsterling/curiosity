// The glass composite: draws each glass surface's rect sampling the blur
// pyramid of the already-rendered scene. Two surface kinds share the pass:
//
// - Authored surfaces (screen = 0, the ADR 0012 path, unchanged): a world
//   quad built in the vertex shader from the packet's node-local bounds and
//   world transform under the frame's root affine, tinted,
//   saturation-adjusted and refraction-offset. Runs between the scene render
//   and the overlay render so selection chrome, grid and guides composite
//   above glass and are never blurred by it.
// - Chrome surfaces (screen = 1, the returned chrome-glass path): the
//   floating chrome's pills, screen-anchored in canvas-relative CSS px. The
//   fragment applies the liquid light model — edge-progressive blur sampled
//   per-fragment from the pyramid, Snell bezel refraction over the
//   squircle-lip profile, the directional specular, chromatic RGB split at
//   the edges, spring-scaled SDF and a soft offset shadow. Content and
//   interaction stay DOM above the canvas. Chrome composites after the
//   overlay blit, sampling the scene-only pyramid — grid and selection stay
//   sharp through chrome v1 (the recorded fidelity gap; the second-pyramid
//   fix is the triggered follow-up).
//
// The overlay render fills its whole target with its base color (Vello's
// documented behavior), so the overlay can never share the scene target: it
// renders into its own transparent target on glass frames and is blitted
// over this composite's result — the scene survives, the grid and selection
// composite above authored glass.
//
// Budget degradation (flat = 1) draws the tint only: a degraded surface stays
// visible and ordered, it never vanishes silently.
//
// The look constants are the demo's defaults, module-side (the packet never
// carries the light model): white tint at low opacity, specularOpacity 0.8 /
// thickness 2 / blur 2 / angle pi/3, refractiveIndex 1.5,
// maxDisplacementScale 0.8, chromatic 0.2/0.4. Implemented independently in
// this module's own pipeline; the demo's WGSL was never vendored (the
// liquid-glass-chrome research record).

struct ViewportUniforms {
    pan: vec2<f32>,
    zoom: f32,
    pixel_ratio: f32,
    size: vec2<f32>,
    _padding: f32,
}

struct SurfaceParams {
    bounds: vec4<f32>,       // x, y, width, height (world units, or CSS px for screen)
    tint: vec4<f32>,         // straight-alpha sRGB
    transform: mat3x2<f32>,  // affine a, b, c, d, e, f — composed world
    saturation: f32,         // >= 0, 1 = neutral
    refraction: f32,         // 0..1 sample-offset scale (authored)
    opacity: f32,            // authored node opacity (authored) / 1 (chrome)
    level0: f32,             // first pyramid level (blur radius)
    level1: f32,             // second level (== level0 when clamped)
    mix: f32,                // interpolation between the two levels
    flat: f32,               // 1 = budget-degraded: plain tint, no sampling
    screen: f32,             // 1 = chrome: canvas-relative CSS-px bounds
    radius: f32,             // chrome pill corner radius, CSS px
    scale_x: f32,            // spring squash around the pill centre
    scale_y: f32,
    pressed: f32,            // 0..1 glass opacity lift (host-integrated spring)
    hovered: f32,            // 0..1 specular lift (host-integrated spring)
    _pad: f32,
}

@group(0) @binding(0) var<uniform> viewport: ViewportUniforms;
@group(0) @binding(1) var pyramid: texture_2d_array<f32>;
@group(0) @binding(2) var pyramid_sampler: sampler;
@group(0) @binding(3) var<storage, read> surfaces: array<SurfaceParams>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    // `instance_index` is a vertex-stage-only builtin; the fragment reads the
    // per-instance surface index through this varying instead. Integral
    // vertex outputs MUST be flat-interpolated — a device compiler rejects
    // the non-flat form (naga accepts it, which is how this shipped once
    // and blanked every glass frame in the browser).
    @location(1) @interpolate(flat) instance: u32,
}

const CORNERS = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0), vec2<f32>(1.0, 1.0), vec2<f32>(0.0, 1.0),
);

@vertex
fn vertex_main(
    @builtin(vertex_index) vertex: u32,
    @builtin(instance_index) instance: u32,
) -> VertexOutput {
    let surface = surfaces[instance];
    let corner = CORNERS[vertex];
    var out: VertexOutput;
    if (surface.screen > 0.5) {
        // Chrome: canvas-relative CSS-px bounds mapped straight to device
        // px — no world affine, no zoom, no pan (screen anchors are what
        // they are; the canvas stage measures the DOM rects every frame).
        let device = (surface.bounds.xy + corner * surface.bounds.zw) * viewport.pixel_ratio;
        out.position = vec4<f32>(
            device.x / viewport.size.x * 2.0 - 1.0,
            1.0 - device.y / viewport.size.y * 2.0,
            0.0,
            1.0,
        );
        out.uv = device / viewport.size;
        out.instance = instance;
        return out;
    }
    let local = surface.bounds.xy + corner * surface.bounds.zw;
    let world = surface.transform * vec3<f32>(local, 1.0);
    let device = (world * viewport.zoom + viewport.pan) * viewport.pixel_ratio;
    // clip y = +1 is the top of the surface; device y grows downward.
    out.position = vec4<f32>(
        device.x / viewport.size.x * 2.0 - 1.0,
        1.0 - device.y / viewport.size.y * 2.0,
        0.0,
        1.0,
    );
    out.uv = device / viewport.size;
    out.instance = instance;
    return out;
}

// -- The light model (chrome surfaces) --------------------------------------

// The demo's look constants, module-side defaults.
const CHROME_BASE_BLUR: f32 = 2.0;
const CHROME_PROGRESSIVE: f32 = 50.0;
const CHROME_SPECULAR_OPACITY: f32 = 0.8;
const CHROME_SPECULAR_IDLE: f32 = 0.4;
const CHROME_SPECULAR_THICKNESS: f32 = 2.0;
const CHROME_LIGHT_ANGLE: f32 = 1.0471975512; // pi/3
const CHROME_REFRACTIVE_INDEX: f32 = 1.5;
const CHROME_MAX_DISPLACEMENT: f32 = 0.8;
const CHROME_CHROMATIC_R: f32 = 0.2;
const CHROME_CHROMATIC_B: f32 = 0.4;
const CHROME_BEZEL_FRACTION: f32 = 0.25;
const CHROME_SHADOW_OFFSET: f32 = 6.0; // device px below the pill
const CHROME_SHADOW_BLUR: f32 = 4.0;   // device px
const CHROME_SHADOW_MARGIN: f32 = 16.0; // device px quad padding (host-aligned)
const CHROME_PRESSED_OPACITY: f32 = 0.62;

const PYRAMID_RADII = array<f32, 5>(0.0, 8.0, 16.0, 32.0, 64.0);

/// Maps a device-px blur radius onto a pyramid level pair and the
/// interpolation between them — the same mapping the Rust packer uses for
/// authored surfaces, mirrored here for the chrome fragment's per-fragment
/// progressive radius.
fn pyramid_levels(radius: f32) -> vec3<f32> {
    let clamped = clamp(radius, 0.0, PYRAMID_RADII[4]);
    if (clamped >= PYRAMID_RADII[4]) {
        return vec3<f32>(4.0, 4.0, 0.0);
    }
    for (var index = 0u; index < 4u; index = index + 1u) {
        if (clamped <= PYRAMID_RADII[index + 1u]) {
            let span = PYRAMID_RADII[index + 1u] - PYRAMID_RADII[index];
            let mix = select(0.0, (clamped - PYRAMID_RADII[index]) / span, span > 0.0);
            return vec3<f32>(f32(index), f32(index + 1u), mix);
        }
    }
    return vec3<f32>(0.0, 0.0, 0.0);
}

fn sample_pyramid(uv: vec2<f32>, radius: f32) -> vec4<f32> {
    let levels = pyramid_levels(radius);
    let sharp = textureSampleLevel(pyramid, pyramid_sampler, uv, i32(levels.x), 0.0);
    let blurred = textureSampleLevel(pyramid, pyramid_sampler, uv, i32(levels.y), 0.0);
    return mix(sharp, blurred, levels.z);
}

/// The signed distance to the rounded rect (the squircle-lip profile): the
/// SDF gradient is the surface normal the light model reads.
fn rounded_rect_sd(p: vec2<f32>, half: vec2<f32>, radius: f32) -> f32 {
    let q = abs(p) - half + vec2<f32>(radius);
    return length(max(q, vec2<f32>(0.0))) - radius;
}

/// The demo's calculate_displacement, in this module's terms: the backdrop
/// sample is pushed inward over the bezel's curved profile (edge_t^2, whose
/// derivative is the surface height the Snell lens reads), in the direction
/// of the SDF gradient normal, capped by maxDisplacementScale. Device-px
/// scale, radius-independent — the lensing lives at the bezel, not the
/// surface's size.
fn bezel_displacement(edge_t: f32, normal: vec2<f32>, bezel_w: f32) -> vec2<f32> {
    let derivative = 2.0 * edge_t / max(bezel_w, 1.0);
    let capped = min(derivative * CHROME_MAX_DISPLACEMENT, CHROME_MAX_DISPLACEMENT);
    // Snell's law: the offset scales with the index contrast (index 1.5).
    let snell = (CHROME_REFRACTIVE_INDEX - 1.0) / CHROME_REFRACTIVE_INDEX;
    return normal * capped * snell;
}

/// The demo's calculate_specular, in this module's terms: the rim highlight
/// along the fixed light direction, thickness tapering with
/// dot(normal, lightDir)^2, quarter-circle falloff, intensity squared.
fn directional_specular(edge_t: f32, normal: vec2<f32>, intensity: f32) -> f32 {
    let light = normalize(vec2<f32>(-cos(CHROME_LIGHT_ANGLE), -sin(CHROME_LIGHT_ANGLE)));
    let taper = dot(normal, light);
    let rim = pow(max(taper, 0.0), 2.0);
    let falloff = sqrt(max(0.0, 1.0 - (1.0 - rim) * (1.0 - rim)));
    let edge_window = smoothstep(0.0, 1.0, edge_t);
    return intensity * intensity * falloff * edge_window;
}

/// The demo's chromatic split: the displaced samples separate at the edges
/// (R shifted one way, B the other, by the chromatic constants).
fn chromatic_split(uv: vec2<f32>, radius: f32, direction: vec2<f32>, edge_t: f32) -> vec4<f32> {
    let strength = edge_t * 0.5;
    let r_uv = uv + direction * CHROME_CHROMATIC_R * strength;
    let b_uv = uv - direction * CHROME_CHROMATIC_B * strength;
    let r = sample_pyramid(r_uv, radius).r;
    let g = sample_pyramid(uv, radius).g;
    let b = sample_pyramid(b_uv, radius).b;
    return vec4<f32>(r, g, b, 1.0);
}

// -- Fragment ---------------------------------------------------------------

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let instance = in.instance;
    let surface = surfaces[instance];
    let is_screen = surface.screen > 0.5;
    // Derivatives require uniform control flow. Select neutral, finite SDF
    // inputs for authored surfaces so the chrome prelude can run before the
    // non-uniform surface-kind branch without changing either result.
    let device_pos = in.uv * viewport.size;
    let margin = CHROME_SHADOW_MARGIN / viewport.pixel_ratio;
    let neutral_bounds = vec4<f32>(0.0, 0.0, 2.0 * margin + 1.0, 2.0 * margin + 1.0);
    let screen_bounds = select(neutral_bounds, surface.bounds, is_screen);
    let screen_radius = select(0.0, surface.radius, is_screen);
    let squash = select(vec2<f32>(1.0), vec2<f32>(surface.scale_x, surface.scale_y), is_screen);
    let inner_bounds = screen_bounds + vec4<f32>(margin, margin, -2.0 * margin, -2.0 * margin);
    let radius_dev = screen_radius * viewport.pixel_ratio;
    let local = device_pos - inner_bounds.xy * viewport.pixel_ratio;
    let half = inner_bounds.zw * viewport.pixel_ratio * 0.5;
    let squashed = half + (local - half) / squash;
    let sd = rounded_rect_sd(squashed, half, radius_dev);
    // A zero gradient means no surface curvature, so its normal is zero.
    let gradient = vec2<f32>(dpdx(sd), dpdy(sd));
    let gradient_length_squared = dot(gradient, gradient);
    let gradient_normalized = gradient * inverseSqrt(max(gradient_length_squared, 1e-12));
    let normal = select(gradient_normalized, vec2<f32>(0.0), gradient_length_squared < 1e-12);
    var color: vec4<f32>;
    if (is_screen) {
        // -- Chrome: the liquid light model over the spring-squashed SDF. --
        // Edge -> centre normalised distance (1 at the bezel, 0 at the
        // centre): the bezel profile, the progressive blur's ramp input.
        let bezel_w = max(2.0, radius_dev * CHROME_BEZEL_FRACTION);
        let edge_t = clamp(1.0 - (-sd) / bezel_w, 0.0, 1.0);
        let inside = sd <= 0.0;

        if (surface.flat > 0.5) {
            // Budget degradation: plain tint, no sampling — the pill stays
            // visible and ordered.
            color = vec4<f32>(surface.tint.rgb, surface.tint.a);
        } else {
            // Progressive blur: frosted away from the bezel, near-clear edge.
            let blur_radius = CHROME_BASE_BLUR + (1.0 - edge_t) * CHROME_PROGRESSIVE;
            // Snell bezel refraction: the sampled backdrop is displaced
            // inward over the lip, capped by maxDisplacementScale.
            let disp = bezel_displacement(edge_t, normal, bezel_w);
            let refracted_uv = in.uv + disp / viewport.size;
            var sampled = chromatic_split(refracted_uv, blur_radius, disp / viewport.size, edge_t);
            // Saturation around the sampled luma (the authored path's term).
            let luma = dot(sampled.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
            sampled = vec4<f32>(mix(vec3<f32>(luma), sampled.rgb, surface.saturation), 1.0);
            // The white fill at low opacity (the demo's glass theme); press
            // raises the glass opacity.
            let bg_opacity = mix(surface.tint.a, CHROME_PRESSED_OPACITY, surface.pressed);
            color = vec4<f32>(sampled.rgb * surface.tint.rgb, bg_opacity);
            // The directional specular: the hovered spring lifts it from its
            // idle value toward the demo's specularOpacity.
            let specular = directional_specular(edge_t, normal, mix(CHROME_SPECULAR_IDLE, CHROME_SPECULAR_OPACITY, surface.hovered));
            color = vec4<f32>(color.rgb + vec3<f32>(specular), color.a);
        }

        if (inside) {
            // The soft offset shadow draws only outside the pill, within the
            // padded quad (the host measures the DOM rect; the margin is the
            // shadow's room).
            let shadow_dist = -sd;
            let shadow_alpha = smoothstep(0.0, CHROME_SHADOW_BLUR, shadow_dist - CHROME_SHADOW_OFFSET);
            color = mix(color, vec4<f32>(0.0, 0.0, 0.0, shadow_alpha * 0.35), shadow_alpha * 0.85);
        } else {
            // Outside the pill (shadow quad padding): only the shadow shows.
            let shadow_alpha = smoothstep(0.0, CHROME_SHADOW_BLUR, -sd - CHROME_SHADOW_OFFSET);
            color = vec4<f32>(0.0, 0.0, 0.0, shadow_alpha * 0.35);
        }
        return color;
    }

    // -- Authored: the ADR 0012 path, unchanged. --
    if (surface.flat > 0.5) {
        color = vec4<f32>(surface.tint.rgb, surface.tint.a);
    } else {
        // Refraction: sample the backdrop scaled around the surface centre —
        // a bounded lens offset, deterministic and radius-independent.
        let refract_uv = vec2<f32>(0.5) + (in.uv - vec2<f32>(0.5)) * (1.0 - surface.refraction);
        let sharp = textureSampleLevel(pyramid, pyramid_sampler, refract_uv, i32(surface.level0), 0.0);
        let blurred = textureSampleLevel(pyramid, pyramid_sampler, refract_uv, i32(surface.level1), 0.0);
        let sampled = mix(sharp, blurred, surface.mix);
        let luma = dot(sampled.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
        let adjusted = mix(vec3<f32>(luma), sampled.rgb, surface.saturation);
        color = vec4<f32>(adjusted * surface.tint.rgb, surface.tint.a);
    }
    color.a = color.a * surface.opacity;
    return color;
}
