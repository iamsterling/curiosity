// The module-owned present pipeline: draws Vello's offscreen target 1:1 onto
// the surface. The shape — a textured quad over the offscreen target — is the
// one react-vello ships as present.wgsl (research-ledger: concepts adopted,
// code written here independently).
//
// One fullscreen triangle covers the clip square with no vertex or index
// buffer, so there is nothing to resize when the canvas size changes.

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
    // uv.y flips the texture: Vello's row 0 is the top row (y-down world
    // coordinates), and WebGPU's framebuffer row 0 is the top too — clip
    // y = +1 is the top of the surface, so it must map to uv.y = 0.
    out.position = vec4<f32>(position, 0.0, 1.0);
    out.uv = vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    return out;
}

@group(0) @binding(0) var vello_target: texture_2d<f32>;
@group(0) @binding(1) var vello_target_sampler: sampler;

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Linear filtering: the offscreen and the surface are the same size in
    // steady state (identity sampling), and the filter degrades gracefully
    // on the single frame where a resize races the packet.
    return textureSample(vello_target, vello_target_sampler, in.uv);
}
