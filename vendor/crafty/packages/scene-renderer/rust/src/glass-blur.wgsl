// The blur pyramid's level generator: a two-pass separable Gaussian over the
// already-rendered scene, one pass per axis. The pyramid makes glass cost
// constant per surface regardless of blur radius — the composite samples a
// pre-blurred level (or interpolates between two adjacent levels), it never
// runs its own blur per surface.
//
// One fullscreen triangle covers the clip square with no vertex or index
// buffer (the module's present.wgsl convention).

struct BlurUniforms {
    direction: vec2<f32>,
    radius: f32,
    resolution: vec2<f32>,
    _padding: f32,
}

@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var source_sampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: BlurUniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {
    let positions = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0),
    );
    let position = positions[index];
    var out: VertexOutput;
    // uv.y flips the texture: the offscreen's row 0 is the top row (y-down
    // world coordinates), and WebGPU's framebuffer row 0 is the top too —
    // clip y = +1 is the top of the surface, so it must map to uv.y = 0.
    out.position = vec4<f32>(position, 0.0, 1.0);
    out.uv = vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    return out;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    if (uniforms.radius < 0.5) {
        return textureSampleLevel(source, source_sampler, in.uv, 0.0);
    }
    let texel = uniforms.direction / uniforms.resolution;
    // sigma = radius × 0.4 is the standard parameterization under which a
    // 25-tap kernel (12 either side) covers the radius's support with
    // negligible truncation.
    let sigma = max(uniforms.radius * 0.4, 1.0);
    let coeff = -0.5 / (sigma * sigma);
    var color = vec4<f32>(0.0);
    var total_weight = 0.0;
    for (var i = -12; i <= 12; i = i + 1) {
        let offset = f32(i) * (uniforms.radius / 12.0);
        let weight = exp(offset * offset * coeff);
        let sample_uv = clamp(in.uv + texel * offset, vec2<f32>(0.0), vec2<f32>(1.0));
        color = color + textureSampleLevel(source, source_sampler, sample_uv, 0.0) * weight;
        total_weight = total_weight + weight;
    }
    return color / total_weight;
}
