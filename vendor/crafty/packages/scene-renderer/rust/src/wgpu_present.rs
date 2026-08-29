#[cfg(target_arch = "wasm32")]
use std::cell::RefCell;
#[cfg(target_arch = "wasm32")]
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsValue;
#[cfg(target_arch = "wasm32")]
use web_sys::HtmlCanvasElement;
#[cfg(target_arch = "wasm32")]
use wgpu::SurfaceTarget;
use wgpu::{
    Adapter, BindGroup, BindGroupLayout, Buffer, CompositeAlphaMode, Device, FilterMode, Instance,
    PresentMode, Queue, RenderPipeline, Sampler, ShaderStages, Surface, SurfaceConfiguration,
    TexelCopyTextureInfo, Texture, TextureDescriptor, TextureFormat, TextureUsages, TextureView,
};
#[cfg(any(target_arch = "wasm32", target_vendor = "apple"))]
use wgpu::{Backends, DeviceDescriptor, InstanceDescriptor};

use crate::{
    f32_bytes, glass_error, glass_quad_buffer_usage, offscreen_texture_usage, render_error,
    GLASS_COMPOSITE_FAILED,
};

/// The surface format is independent of Vello's offscreen target (which
/// must be Rgba8Unorm). The present pass samples the offscreen and writes
/// the surface, so this choice only affects swapchain byte order and
/// compositor cost. Rgba8Unorm is preferred: it matches the offscreen
/// format, making the present pass a pure copy on every platform.
/// Bgra8Unorm — the browser-preferred format on macOS/Windows, which the
/// retired TypeGPU host used — is the fallback; displayed pixels are
/// identical either way.
fn pick_surface_format(formats: &[TextureFormat]) -> Option<TextureFormat> {
    if formats.contains(&TextureFormat::Rgba8Unorm) {
        Some(TextureFormat::Rgba8Unorm)
    } else if formats.contains(&TextureFormat::Bgra8Unorm) {
        Some(TextureFormat::Bgra8Unorm)
    } else {
        formats.first().copied()
    }
}

/// PreMultiplied matches the retired host's `context.configure`
/// (alphaMode "premultiplied"); the presented content is fully opaque
/// (Vello's base color alpha is 1), so the composite result equals opaque
/// mode. Auto is the fallback for a hypothetical implementation that
/// offers neither.
fn pick_alpha_mode(modes: &[CompositeAlphaMode]) -> CompositeAlphaMode {
    if modes.contains(&CompositeAlphaMode::PreMultiplied) {
        CompositeAlphaMode::PreMultiplied
    } else {
        CompositeAlphaMode::Auto
    }
}

pub(crate) fn overlay_blit_blend_state() -> wgpu::BlendState {
    wgpu::BlendState::ALPHA_BLENDING
}

/// Vello renders into this texture (`render_to_texture` requires
/// Rgba8Unorm with STORAGE_BINDING); the present pipeline samples it, so
/// it carries TEXTURE_BINDING as well. It is recreated only when the
/// packet's device size changes.
struct Offscreen {
    /// Owned for its lifetime, not its name: the view and bind group are
    /// the handles the renderer and present pass use, and dropping the
    /// texture would invalidate them mid-frame. (The glass pyramid reads
    /// it as its blur source, so it is genuinely used too.)
    texture: Texture,
    view: TextureView,
    bind_group: BindGroup,
    size: (u32, u32),
}

impl Offscreen {
    fn new(device: &Device, size: (u32, u32), layout: &BindGroupLayout, sampler: &Sampler) -> Self {
        let texture = device.create_texture(&TextureDescriptor {
            label: Some("crafty vello offscreen"),
            size: wgpu::Extent3d {
                width: size.0,
                height: size.1,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            // RENDER_ATTACHMENT: the glass composite draws into the
            // offscreen between the scene render and the overlay render.
            usage: offscreen_texture_usage(),
            view_formats: &[],
        });
        let view = texture.create_view(&Default::default());
        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("crafty present bind group"),
            layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::Sampler(sampler),
                },
            ],
        });
        Self {
            texture,
            view,
            bind_group,
            size,
        }
    }
}

/// The present pass: one fullscreen triangle (present.wgsl) samples the
/// offscreen target with a linear sampler and writes the surface. No
/// blending: the offscreen already holds the composited frame (Vello
/// blended against the base color), so presenting is a copy. The
/// `blend_pipeline` is the same shader with source-over
/// blending, used to composite the overlay target over the scene+glass
/// offscreen on glass frames (Vello's render fills its whole target with
/// the base color, so rendering the overlay into the same target would
/// wipe the scene — the overlay renders into its own transparent target
/// and is blitted over instead).
struct PresentPipeline {
    pipeline: RenderPipeline,
    blend_pipeline: RenderPipeline,
    layout: BindGroupLayout,
    sampler: Sampler,
}

impl PresentPipeline {
    fn new(device: &Device, surface_format: TextureFormat) -> Self {
        let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("crafty present shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("present.wgsl").into()),
        });
        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("crafty present bind group layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("crafty present pipeline layout"),
            // wgpu 29 lets bind-group slots be None (auto layout per slot);
            // the present shader uses one explicit group.
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("crafty present pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &module,
                entry_point: Some("vertex_main"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                unclipped_depth: false,
                polygon_mode: wgpu::PolygonMode::Fill,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &module,
                entry_point: Some("fragment_main"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format: surface_format,
                    blend: None,
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("crafty present sampler"),
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            mipmap_filter: wgpu::MipmapFilterMode::Nearest,
            ..Default::default()
        });
        // The overlay blit pipeline: the same fullscreen-triangle shader,
        // but source-over — it composites the overlay target
        // over the already-composited offscreen instead of copying.
        let blend_pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("crafty overlay blit pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &module,
                entry_point: Some("vertex_main"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                unclipped_depth: false,
                polygon_mode: wgpu::PolygonMode::Fill,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &module,
                entry_point: Some("fragment_main"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format: TextureFormat::Rgba8Unorm,
                    blend: Some(overlay_blit_blend_state()),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        Self {
            pipeline,
            blend_pipeline,
            layout,
            sampler,
        }
    }
}

/// Blur pyramid levels, in device pixels. The composite maps any radius
/// onto a level pair and interpolates, so per-surface cost is constant —
/// the pyramid makes glass cheap regardless of blur radius.
const BLUR_RADII: [f32; 5] = [0.0, 8.0, 16.0, 32.0, 64.0];
const PYRAMID_LEVELS: u32 = 5;
/// The module's defensive surface cap. The host enforces the real budget
/// (flat-tint degradation + diagnostic); this is the grid-overlay
/// precedent's second half — the Rust mirror drops silently past a hard
/// bound, unreachable when the host honours its own cap.
const MAX_GLASS_SURFACES: usize = 256;
/// The module's defensive chrome cap: 16, the host's budget. Chrome
/// surfaces past it pack flat (the host marks them first) and the buffer
/// write stops at the bound — the same mirror discipline as authored.
const MAX_CHROME_GLASS_SURFACES: usize = 16;

/// The glass machinery: the blur pyramid (separable Gaussian over the
/// already-rendered scene) and the composite pass (per-surface quads
/// sampling the pyramid). One object per PresentState, built on the first
/// glass frame; the pyramid targets are recreated only when the device
/// size changes, like the offscreen and surface.
struct GlassPass {
    blur_pipeline: RenderPipeline,
    blur_layout: BindGroupLayout,
    blur_uniform: Buffer,
    sampler: Sampler,
    pyramid: Option<Texture>,
    temp: Option<Texture>,
    pyramid_size: (u32, u32),
    composite_pipeline: RenderPipeline,
    composite_layout: BindGroupLayout,
    viewport_uniform: Buffer,
    params_buffer: Buffer,
    quad_buffer: Buffer,
}

impl GlassPass {
    fn new(device: &Device) -> Self {
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("crafty glass sampler"),
            mag_filter: FilterMode::Linear,
            min_filter: FilterMode::Linear,
            mipmap_filter: wgpu::MipmapFilterMode::Nearest,
            ..Default::default()
        });
        let (blur_layout, blur_pipeline, blur_uniform) = Self::build_blur(device);
        let (composite_layout, composite_pipeline, viewport_uniform, params_buffer, quad_buffer) =
            Self::build_composite(device);
        Self {
            blur_pipeline,
            blur_layout,
            blur_uniform,
            sampler,
            pyramid: None,
            temp: None,
            pyramid_size: (0, 0),
            composite_pipeline,
            composite_layout,
            viewport_uniform,
            params_buffer,
            quad_buffer,
        }
    }

    fn build_blur(device: &Device) -> (BindGroupLayout, RenderPipeline, Buffer) {
        let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("crafty glass blur shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("glass-blur.wgsl").into()),
        });
        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("crafty glass blur bind group layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("crafty glass blur pipeline layout"),
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("crafty glass blur pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &module,
                entry_point: Some("vertex_main"),
                compilation_options: Default::default(),
                buffers: &[],
            },
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                unclipped_depth: false,
                polygon_mode: wgpu::PolygonMode::Fill,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &module,
                entry_point: Some("fragment_main"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format: TextureFormat::Rgba8Unorm,
                    blend: None,
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        let blur_uniform = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("crafty glass blur uniforms"),
            size: 32,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        (layout, pipeline, blur_uniform)
    }

    /// The composite: per-surface quads sampling the pyramid array. The
    /// surface params (24 f32 per surface — bounds, tint, world affine,
    /// six scalars, three padding) ride a storage buffer; the vertex
    /// shader builds the world quad under the frame's root affine, so the
    /// surface lands exactly where the scene math puts it.
    #[allow(clippy::type_complexity)]
    fn build_composite(
        device: &Device,
    ) -> (BindGroupLayout, RenderPipeline, Buffer, Buffer, Buffer) {
        let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("crafty glass composite shader"),
            source: wgpu::ShaderSource::Wgsl(include_str!("glass-composite.wgsl").into()),
        });
        let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("crafty glass composite bind group layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::VERTEX | ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2Array,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 3,
                    visibility: ShaderStages::VERTEX | ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });
        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("crafty glass composite pipeline layout"),
            bind_group_layouts: &[Some(&layout)],
            immediate_size: 0,
        });
        let quad_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("crafty glass quad corners"),
            // Six vec2 corners of the unit rect (two triangles), the same
            // static data the shader indexes with CORNERS.
            size: 6 * 8,
            usage: glass_quad_buffer_usage(),
            mapped_at_creation: false,
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("crafty glass composite pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &module,
                entry_point: Some("vertex_main"),
                compilation_options: Default::default(),
                buffers: &[wgpu::VertexBufferLayout {
                    array_stride: 8,
                    step_mode: wgpu::VertexStepMode::Vertex,
                    attributes: &[wgpu::VertexAttribute {
                        format: wgpu::VertexFormat::Float32x2,
                        offset: 0,
                        shader_location: 0,
                    }],
                }],
            },
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                strip_index_format: None,
                front_face: wgpu::FrontFace::Ccw,
                cull_mode: None,
                unclipped_depth: false,
                polygon_mode: wgpu::PolygonMode::Fill,
                conservative: false,
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &module,
                entry_point: Some("fragment_main"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format: TextureFormat::Rgba8Unorm,
                    blend: Some(wgpu::BlendState {
                        color: wgpu::BlendComponent {
                            src_factor: wgpu::BlendFactor::SrcAlpha,
                            dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                            operation: wgpu::BlendOperation::Add,
                        },
                        alpha: wgpu::BlendComponent {
                            src_factor: wgpu::BlendFactor::One,
                            dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
                            operation: wgpu::BlendOperation::Add,
                        },
                    }),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        let viewport_uniform = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("crafty glass viewport uniforms"),
            size: 32,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let params_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("crafty glass surface params"),
            // 28 f32 per surface; the module's defensive cap bounds it.
            size: (MAX_GLASS_SURFACES as u64)
                * (crate::glass_params::SURFACE_PARAM_FLOATS as u64)
                * 4,
            usage: wgpu::BufferUsages::STORAGE | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        (
            layout,
            pipeline,
            viewport_uniform,
            params_buffer,
            quad_buffer,
        )
    }

    /// Recreates the pyramid array and the blur temp target when the
    /// device size changed. Texture reallocation is a GPU sync point, so
    /// it happens only on resize — never per frame.
    fn ensure_targets(&mut self, device: &Device, size: (u32, u32)) {
        if self.pyramid_size == size {
            return;
        }
        self.pyramid = Some(device.create_texture(&TextureDescriptor {
            label: Some("crafty glass blur pyramid"),
            size: wgpu::Extent3d {
                width: size.0,
                height: size.1,
                depth_or_array_layers: PYRAMID_LEVELS,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING
                | TextureUsages::RENDER_ATTACHMENT
                | TextureUsages::COPY_DST,
            view_formats: &[],
        }));
        self.temp = Some(device.create_texture(&TextureDescriptor {
            label: Some("crafty glass blur temp"),
            size: wgpu::Extent3d {
                width: size.0,
                height: size.1,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING | TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        }));
        self.pyramid_size = size;
    }

    /// The pyramid rebuild: copy the finished scene into level 0, then
    /// blur each of the four upper levels from the ORIGINAL scene (each
    /// level is a fresh blur — no cascading error, the demo's quality
    /// choice, implemented in the module's own pipeline). One encoder,
    /// one submission.
    fn generate_pyramid(
        &mut self,
        device: &Device,
        queue: &Queue,
        source: &Texture,
        source_view: &TextureView,
        size: (u32, u32),
    ) -> Result<(), String> {
        self.ensure_targets(device, size);
        let pyramid = self
            .pyramid
            .as_ref()
            .expect("pyramid was just created for the current size");
        let temp = self
            .temp
            .as_ref()
            .expect("temp target was just created for the current size");
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("crafty glass pyramid"),
        });
        encoder.copy_texture_to_texture(
            TexelCopyTextureInfo {
                texture: source,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            TexelCopyTextureInfo {
                texture: pyramid,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::Extent3d {
                width: size.0,
                height: size.1,
                depth_or_array_layers: 1,
            },
        );
        for level in 1..PYRAMID_LEVELS {
            let radius = BLUR_RADII[level as usize];
            self.blur_pass(
                device,
                queue,
                &mut encoder,
                source_view,
                &temp.create_view(&Default::default()),
                size,
                radius,
                1.0,
                0.0,
            );
            self.blur_pass(
                device,
                queue,
                &mut encoder,
                &temp.create_view(&Default::default()),
                &pyramid.create_view(&wgpu::TextureViewDescriptor {
                    label: Some("crafty glass pyramid layer view"),
                    format: None,
                    dimension: Some(wgpu::TextureViewDimension::D2),
                    aspect: wgpu::TextureAspect::All,
                    base_mip_level: 0,
                    mip_level_count: None,
                    base_array_layer: level,
                    array_layer_count: Some(1),
                    usage: Some(TextureUsages::RENDER_ATTACHMENT),
                }),
                size,
                radius,
                0.0,
                1.0,
            );
        }
        queue.submit([encoder.finish()]);
        Ok(())
    }

    /// One separable blur pass: sample `source` along `direction`, write
    /// `target`. The uniform buffer is rewritten before the pass records,
    /// so the queue sees the new value ahead of the submission.
    #[allow(clippy::too_many_arguments)]
    fn blur_pass(
        &self,
        device: &Device,
        queue: &Queue,
        encoder: &mut wgpu::CommandEncoder,
        source: &TextureView,
        target: &TextureView,
        size: (u32, u32),
        radius: f32,
        dir_x: f32,
        dir_y: f32,
    ) {
        let uniforms: [f32; 8] = [
            dir_x,
            dir_y,
            radius,
            0.0,
            size.0 as f32,
            size.1 as f32,
            0.0,
            0.0,
        ];
        queue.write_buffer(&self.blur_uniform, 0, &f32_bytes(&uniforms));
        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("crafty glass blur bind group"),
            layout: &self.blur_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(source),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::Sampler(&self.sampler),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Buffer(wgpu::BufferBinding {
                        buffer: &self.blur_uniform,
                        offset: 0,
                        size: None,
                    }),
                },
            ],
        });
        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("crafty glass blur pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view: target,
                depth_slice: None,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: None,
            timestamp_writes: None,
            occlusion_query_set: None,
            multiview_mask: None,
        });
        pass.set_pipeline(&self.blur_pipeline);
        pass.set_bind_group(0, &bind_group, &[]);
        pass.draw(0..3, 0..1);
    }

    /// Writes the viewport uniforms and the surface params for the
    /// frame's authored and chrome surfaces, and returns the written
    /// counts as the instance ranges of the two composite stages:
    /// `[0, authored)` draws between the scene render and the overlay
    /// render; `[authored, authored + chrome)` draws after the overlay
    /// blit, sampling the same scene-only pyramid (grid and selection
    /// stay sharp through chrome — the recorded fidelity gap). Surfaces
    /// past their cap pack `flat` — visible and ordered, never vanishing.
    fn prepare_composite(
        &self,
        queue: &Queue,
        authored: &[crate::GlassSurface],
        chrome: &[crate::ChromeGlassSurface],
        viewport: &crate::Viewport,
    ) -> Result<(u32, u32), String> {
        // The viewport uniforms are shared by every composite draw in the
        // frame; this write covers both stages' draw calls.
        let viewport_uniforms: [f32; 8] = [
            viewport.pan_x as f32,
            viewport.pan_y as f32,
            viewport.zoom as f32,
            viewport.pixel_ratio as f32,
            viewport.width as f32,
            viewport.height as f32,
            0.0,
            0.0,
        ];
        queue.write_buffer(&self.viewport_uniform, 0, &f32_bytes(&viewport_uniforms));
        let mut params: Vec<[f32; crate::glass_params::SURFACE_PARAM_FLOATS]> =
            Vec::with_capacity(authored.len() + chrome.len());
        for (index, surface) in authored.iter().enumerate() {
            params.push(crate::glass_params::surface_params(
                surface,
                viewport,
                index >= MAX_GLASS_SURFACES,
            ));
        }
        let authored_written = (params.len() as u64).min(MAX_GLASS_SURFACES as u64);
        for (index, surface) in chrome.iter().enumerate() {
            params.push(crate::glass_params::chrome_surface_params(
                surface,
                surface.flat || index >= MAX_CHROME_GLASS_SURFACES,
            ));
        }
        let chrome_written =
            (params.len() as u64).min(MAX_GLASS_SURFACES as u64 + MAX_CHROME_GLASS_SURFACES as u64);
        let mut flat: Vec<f32> = Vec::with_capacity(
            (chrome_written as usize) * crate::glass_params::SURFACE_PARAM_FLOATS,
        );
        for entry in &params[..chrome_written as usize] {
            flat.extend_from_slice(entry);
        }
        queue.write_buffer(&self.params_buffer, 0, &f32_bytes(&flat));
        Ok((
            authored_written as u32,
            (chrome_written - authored_written) as u32,
        ))
    }

    /// The shared composite draw: the bind group, the pass and the
    /// instance range. The pyramid must exist (the caller generates it
    /// on the first glass frame).
    fn draw_composite(
        &self,
        device: &Device,
        queue: &Queue,
        target: &TextureView,
        first_instance: u32,
        instance_count: u32,
    ) -> Result<(), String> {
        if instance_count == 0 {
            return Ok(());
        }
        // The quad corners are static data; writing 48 bytes per draw is
        // cheaper than a second buffer and a second lifetime.
        let corners: [f32; 12] = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        queue.write_buffer(&self.quad_buffer, 0, &f32_bytes(&corners));
        let pyramid = self
            .pyramid
            .as_ref()
            .ok_or_else(|| glass_error(GLASS_COMPOSITE_FAILED, "pyramid-missing"))?;
        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("crafty glass composite bind group"),
            layout: &self.composite_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::Buffer(wgpu::BufferBinding {
                        buffer: &self.viewport_uniform,
                        offset: 0,
                        size: None,
                    }),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(&pyramid.create_view(
                        &wgpu::TextureViewDescriptor {
                            label: Some("crafty glass pyramid array view"),
                            format: None,
                            dimension: Some(wgpu::TextureViewDimension::D2Array),
                            aspect: wgpu::TextureAspect::All,
                            base_mip_level: 0,
                            mip_level_count: None,
                            base_array_layer: 0,
                            array_layer_count: Some(PYRAMID_LEVELS),
                            usage: Some(TextureUsages::TEXTURE_BINDING),
                        },
                    )),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Sampler(&self.sampler),
                },
                wgpu::BindGroupEntry {
                    binding: 3,
                    resource: wgpu::BindingResource::Buffer(wgpu::BufferBinding {
                        buffer: &self.params_buffer,
                        offset: 0,
                        size: None,
                    }),
                },
            ],
        });
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("crafty glass composite"),
        });
        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("crafty glass composite pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: target,
                    depth_slice: None,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Load,
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&self.composite_pipeline);
            pass.set_bind_group(0, &bind_group, &[]);
            pass.set_vertex_buffer(0, self.quad_buffer.slice(..));
            pass.draw(0..6, first_instance..(first_instance + instance_count));
        }
        queue.submit([encoder.finish()]);
        Ok(())
    }

    // The surface records are packed by `glass_params` (crate level —
    // pure data, exercised by the native test target); the wasm32-only
    // GPU module only consumes the packed records.
}

/// Everything the module owns on the GPU line. Drop order matters: the
/// surface must die before the device it is configured on (fields drop in
/// declaration order). The DEVICE is not here: the device/queue/renderer
/// live in the module-level singleton (SHARED_GPU) so the module creates
/// exactly one wgpu device and runs the requestAdapter/requestDevice
/// promise chain exactly once per module instance.
pub struct PresentState {
    surface: Surface<'static>,
    surface_format: TextureFormat,
    alpha_mode: CompositeAlphaMode,
    configured_size: Option<(u32, u32)>,
    offscreen: Option<Offscreen>,
    /// The overlay render target on glass frames. Vello's render fills
    /// its whole target with the base color, so the overlay (grid and
    /// guides) can never render into the scene offscreen without
    /// wiping it — it renders here over a transparent base and is
    /// blitted over the offscreen. Lazily created like the glass pass;
    /// absent forever on non-glass frames.
    overlay: Option<Offscreen>,
    present: PresentPipeline,
    /// Built lazily on the first glass frame; absent forever on
    /// non-glass frames (no pyramid, no composite — zero glass cost).
    glass: Option<GlassPass>,
}

/// The module's one GPU stack. The first `init` creates it; later inits
/// (editor remounts re-acquiring the runtime) reuse it and only create a
/// new surface for their canvas.
///
/// WHY a singleton: two concurrent `requestAdapter`/`requestDevice`
/// chains (two `init` calls racing — the app re-acquires the runtime per
/// mount) make the browser CANCEL the in-flight adapter request. The
/// cancelled promise's reactions were already freed at settlement by
/// js-sys's `finish` (it drops both JsFuture once-closures), and the
/// cancellation then fires the freed reject closure — wasm-bindgen's
/// "closure invoked recursively or after being dropped", observed in the
/// browser on every page load with two init sequences per load. One
/// chain, settled once, cannot double-fire.
///
/// Device-loss recovery is the only legitimate second device: it resets
/// this singleton (reset_shared_gpu) and re-runs the chain sequentially,
/// after the original settled — no concurrent request, no cancellation.
///
/// Thread-local, not a `static`: wgpu's wasm backend is Rc-based (not
/// Send/Sync), and on wasm there is exactly one thread, so a thread-local
/// is the same thing with the right bounds.
#[derive(Clone)]
#[cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]
struct SharedGpu {
    instance: Arc<Instance>,
    adapter: Arc<Adapter>,
    device: Arc<Device>,
    queue: Arc<Queue>,
}

#[cfg(target_arch = "wasm32")]
thread_local! {
    static SHARED_GPU: RefCell<Option<SharedGpu>> = const { RefCell::new(None) };
    static SHARED_RENDERER: RefCell<Option<vello::Renderer>> = const { RefCell::new(None) };
}

/// Restores the shared renderer to its thread-local slot on drop — every
/// exit path, including errors, so a failed frame leaves the renderer
/// reusable by the next one.
#[cfg(target_arch = "wasm32")]
struct RendererSlot(Option<vello::Renderer>);

#[cfg(target_arch = "wasm32")]
impl Drop for RendererSlot {
    fn drop(&mut self) {
        SHARED_RENDERER.with(|slot| *slot.borrow_mut() = self.0.take());
    }
}

/// Serializes the shared-stack build. The first caller builds; concurrent
/// callers wait by yielding to the event loop (a blocking mutex would
/// deadlock single-threaded wasm — the holder is suspended in an await).
/// The wait is bounded: the holder's continuation runs on the very next
/// microtask, so the loop terminates as soon as the build settles.
#[cfg(target_arch = "wasm32")]
static INIT_LOCK: AtomicBool = AtomicBool::new(false);

#[cfg(target_arch = "wasm32")]
struct InitGuard;

#[cfg(target_arch = "wasm32")]
impl Drop for InitGuard {
    fn drop(&mut self) {
        INIT_LOCK.store(false, Ordering::SeqCst);
    }
}

#[cfg(target_arch = "wasm32")]
async fn acquire_init_lock() -> InitGuard {
    loop {
        if !INIT_LOCK.swap(true, Ordering::SeqCst) {
            return InitGuard;
        }
        let _ = wasm_bindgen_futures::JsFuture::from(js_sys::Promise::resolve(&JsValue::UNDEFINED))
            .await;
    }
}

#[cfg(target_arch = "wasm32")]
fn register_error_surfaces(device: &Device, error_callback: js_sys::Function) {
    let loss_reporter = error_callback.clone();
    device.set_device_lost_callback(Box::new(move |reason, message| {
        let _ = loss_reporter.call1(
            &JsValue::NULL,
            &JsValue::from_str(&format!("WEBGPU_DEVICE_LOST:{reason:?}: {message}")),
        );
    }));
    let error_reporter = error_callback;
    device.on_uncaptured_error(Arc::new(move |error| {
        let _ = error_reporter.call1(
            &JsValue::NULL,
            &JsValue::from_str(&format!("VELLO_RENDER_FAILED:uncaptured:{error}")),
        );
    }));
}

/// Drops the shared GPU stack. Only the device-loss recovery path calls
/// this: after a real loss the shared device is dead, and the next init
/// must build a fresh one. The old device's registered closures are
/// leak-forgotten (wgpu) — late events find live state and report into
/// the captured (possibly dead) relay, which is benign.
#[cfg(target_arch = "wasm32")]
pub fn reset_shared_gpu() {
    SHARED_GPU.with(|slot| *slot.borrow_mut() = None);
    SHARED_RENDERER.with(|slot| *slot.borrow_mut() = None);
}

#[cfg(all(target_arch = "wasm32", feature = "pixel-oracle"))]
pub fn adapter_info_json() -> Result<String, String> {
    let shared = SHARED_GPU
        .with(|slot| slot.borrow().clone())
        .ok_or_else(|| render_error("device-not-initialized", None))?;
    let info = shared.adapter.get_info();
    Ok(format!(
        "{{\"name\":{},\"vendor\":{},\"device\":{},\"deviceType\":\"{:?}\",\"driver\":{},\"driverInfo\":{},\"backend\":\"{:?}\"}}",
        serde_json::to_string(&info.name).map_err(|error| error.to_string())?,
        info.vendor,
        info.device,
        info.device_type,
        serde_json::to_string(&info.driver).map_err(|error| error.to_string())?,
        serde_json::to_string(&info.driver_info).map_err(|error| error.to_string())?,
        info.backend,
    ))
}

impl PresentState {
    /// Encodes, renders and presents one packet-driven frame. `encoding`
    /// is the scene the encoder just built; `overlay_encoding` is Some
    /// only on glass frames — the single encoding is split so the
    /// composite can draw between them (glass must never blur the
    /// selection chrome, grid or guides, which composite above it). The
    /// offscreen and the surface are (re)created only when the packet's
    /// device size changed.
    ///
    /// Presenting is the commit point: if any step fails, nothing is
    /// presented and the surface keeps showing the last valid frame —
    /// "a render failure preserves the last valid image" holds by
    /// construction, without retaining frames.
    #[cfg(target_arch = "wasm32")]
    pub fn render_and_present(
        &mut self,
        encoding: vello_encoding::Encoding,
        overlay_encoding: Option<vello_encoding::Encoding>,
        glass: &[crate::GlassSurface],
        chrome: &[crate::ChromeGlassSurface],
        viewport: &crate::Viewport,
        size: (u32, u32),
    ) -> Result<(), String> {
        let shared = SHARED_GPU
            .with(|slot| slot.borrow().clone())
            .ok_or_else(|| render_error("device-not-initialized", None))?;
        // The thread-local borrow cannot escape the `with` closure
        // (borrowck), so the renderer is taken out for the render and
        // restored on every exit path — including errors — by the guard's
        // Drop.
        let mut renderer_slot = RendererSlot(Some(
            SHARED_RENDERER
                .with(|slot| slot.borrow_mut().take())
                .ok_or_else(|| render_error("device-not-initialized", None))?,
        ));
        let renderer = renderer_slot
            .0
            .as_mut()
            .expect("renderer was just taken out of the slot");
        self.render_frame(
            &shared,
            renderer,
            encoding,
            overlay_encoding,
            glass,
            chrome,
            viewport,
            size,
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn render_frame(
        &mut self,
        shared: &SharedGpu,
        renderer: &mut vello::Renderer,
        encoding: vello_encoding::Encoding,
        overlay_encoding: Option<vello_encoding::Encoding>,
        glass: &[crate::GlassSurface],
        chrome: &[crate::ChromeGlassSurface],
        viewport: &crate::Viewport,
        size: (u32, u32),
    ) -> Result<(), String> {
        if self.configured_size != Some(size) {
            // Reconfigure only on size change: wgpu waits for the GPU to
            // go idle on every configure() call, which would add a sync
            // point to every frame if the size matched. The frame from the
            // previous present has been dropped by now, so configure is
            // safe to call.
            self.surface.configure(
                &shared.device,
                &SurfaceConfiguration {
                    usage: TextureUsages::RENDER_ATTACHMENT,
                    format: self.surface_format,
                    width: size.0,
                    height: size.1,
                    // Fifo is the only present mode guaranteed by the
                    // WebGPU spec (and the browser default the retired
                    // host never overrode).
                    present_mode: PresentMode::Fifo,
                    alpha_mode: self.alpha_mode,
                    view_formats: vec![],
                    // The browser fixes this at 2 on WebGPU; wgpu's own
                    // default config uses 2.
                    desired_maximum_frame_latency: 2,
                },
            );
            self.configured_size = Some(size);
        }
        if self.offscreen.as_ref().map(|target| target.size) != Some(size) {
            self.offscreen = Some(Offscreen::new(
                &shared.device,
                size,
                &self.present.layout,
                &self.present.sampler,
            ));
        }
        if self.overlay.as_ref().map(|target| target.size) != Some(size) {
            self.overlay = Some(Offscreen::new(
                &shared.device,
                size,
                &self.present.layout,
                &self.present.sampler,
            ));
        }
        let offscreen = self
            .offscreen
            .as_ref()
            .expect("offscreen was just created for the current size");
        let params = vello::RenderParams {
            // The retired host cleared the surface with this colour; the
            // base color is what the offscreen is cleared to, so the
            // background stays pixel-identical (task 6.4 parity).
            base_color: vello::peniko::Color::new([0.045, 0.045, 0.05, 1.0]),
            width: size.0,
            height: size.1,
            // Area is the only AA config compiled (AaSupport::area_only at
            // init), so this must stay Area.
            antialiasing_method: vello::AaConfig::Area,
        };
        let render_into = |renderer: &mut vello::Renderer, scene: &vello::Scene| {
            renderer
                .render_to_texture(
                    &shared.device,
                    &shared.queue,
                    scene,
                    &offscreen.view,
                    &params,
                )
                .map_err(|error| render_error("render", Some(&error.to_string())))
        };
        match overlay_encoding {
            Some(overlay) => {
                // Glass frame: scene → pyramid → composite → overlays →
                // present. The composite samples the finished scene (the
                // pyramid is built from the offscreen as it stands), so
                // glass surfaces composite above everything the scene
                // drew, and the overlay lands above the glass.
                //
                // VELLO FILLS ITS WHOLE TARGET with the base color on
                // every render, so the overlay can never render into the
                // scene offscreen — the second fill would wipe the scene
                // (the black-canvas bug: the glass split path was never
                // exercised in a browser before chrome glass made it the
                // every-frame path). The overlay renders into its own
                // target over a TRANSPARENT base, then is blitted over
                // the composited offscreen with straight-alpha source-over.
                render_into(renderer, &vello::Scene::from(encoding))?;
                let glass_pass = self
                    .glass
                    .get_or_insert_with(|| GlassPass::new(&shared.device));
                glass_pass.generate_pyramid(
                    &shared.device,
                    &shared.queue,
                    &offscreen.texture,
                    &offscreen.view,
                    size,
                )?;
                let (authored_count, chrome_count) =
                    glass_pass.prepare_composite(&shared.queue, glass, chrome, viewport)?;
                // Stage 1: authored glass composites between the scene
                // and the overlays (overlays never blur through it).
                if authored_count > 0 {
                    glass_pass.draw_composite(
                        &shared.device,
                        &shared.queue,
                        &offscreen.view,
                        0,
                        authored_count,
                    )?;
                }
                let overlay_target = self
                    .overlay
                    .as_ref()
                    .expect("overlay target was just created for the current size");
                // Clear the persistent overlay target to transparent —
                // Vello's fill is transparent too, but the clear makes
                // the pre-render state deterministic across frames.
                {
                    let mut encoder =
                        shared
                            .device
                            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                                label: Some("crafty overlay clear"),
                            });
                    {
                        let _pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                            label: Some("crafty overlay clear pass"),
                            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                                view: &overlay_target.view,
                                depth_slice: None,
                                resolve_target: None,
                                ops: wgpu::Operations {
                                    load: wgpu::LoadOp::Clear(wgpu::Color::TRANSPARENT),
                                    store: wgpu::StoreOp::Store,
                                },
                            })],
                            depth_stencil_attachment: None,
                            timestamp_writes: None,
                            occlusion_query_set: None,
                            multiview_mask: None,
                        });
                    }
                    shared.queue.submit([encoder.finish()]);
                }
                let overlay_params = vello::RenderParams {
                    base_color: vello::peniko::Color::TRANSPARENT,
                    ..params
                };
                renderer
                    .render_to_texture(
                        &shared.device,
                        &shared.queue,
                        &vello::Scene::from(overlay),
                        &overlay_target.view,
                        &overlay_params,
                    )
                    .map_err(|error| render_error("render", Some(&error.to_string())))?;
                // Blit the overlay over the scene+glass offscreen.
                {
                    let mut encoder =
                        shared
                            .device
                            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                                label: Some("crafty overlay blit"),
                            });
                    {
                        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                            label: Some("crafty overlay blit pass"),
                            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                                view: &offscreen.view,
                                depth_slice: None,
                                resolve_target: None,
                                ops: wgpu::Operations {
                                    load: wgpu::LoadOp::Load,
                                    store: wgpu::StoreOp::Store,
                                },
                            })],
                            depth_stencil_attachment: None,
                            timestamp_writes: None,
                            occlusion_query_set: None,
                            multiview_mask: None,
                        });
                        pass.set_pipeline(&self.present.blend_pipeline);
                        pass.set_bind_group(0, &overlay_target.bind_group, &[]);
                        pass.draw(0..3, 0..1);
                    }
                    shared.queue.submit([encoder.finish()]);
                }
                // Stage 2: chrome composites after the overlay blit, above
                // everything, sampling the scene-only pyramid — grid and
                // selection stay sharp through chrome v1 (the recorded
                // fidelity gap; the second-pyramid fix is the triggered
                // follow-up).
                if chrome_count > 0 {
                    glass_pass.draw_composite(
                        &shared.device,
                        &shared.queue,
                        &offscreen.view,
                        authored_count,
                        chrome_count,
                    )?;
                }
            }
            None => {
                // Non-glass frame: the single encoding, exactly as before
                // the split — no pyramid, no composite, no second render.
                render_into(renderer, &vello::Scene::from(encoding))?;
            }
        }
        let frame = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(frame)
            | wgpu::CurrentSurfaceTexture::Suboptimal(frame) => frame,
            wgpu::CurrentSurfaceTexture::Timeout => {
                return Err(render_error("present", Some("timeout")))
            }
            wgpu::CurrentSurfaceTexture::Occluded => {
                return Err(render_error("present", Some("occluded")))
            }
            wgpu::CurrentSurfaceTexture::Outdated => {
                return Err(render_error("present", Some("outdated")))
            }
            wgpu::CurrentSurfaceTexture::Lost => {
                return Err(render_error("present", Some("surface-lost")))
            }
            wgpu::CurrentSurfaceTexture::Validation => {
                return Err(render_error("present", Some("validation")))
            }
        };
        let view = frame.texture.create_view(&Default::default());
        let mut encoder = shared
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("crafty present"),
            });
        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("crafty present pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    depth_slice: None,
                    resolve_target: None,
                    // The fullscreen triangle covers every pixel; the load
                    // op is never visible.
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color::BLACK),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&self.present.pipeline);
            pass.set_bind_group(0, &offscreen.bind_group, &[]);
            pass.draw(0..3, 0..1);
        }
        shared.queue.submit([encoder.finish()]);
        // present() consumes the texture; dropping it after presentation
        // does not discard (SurfaceTexture::Drop skips texture_discard for
        // presented frames).
        frame.present();
        Ok(())
    }
}

/// Native Apple ownership for the same Vello/present path used by WASM. Unlike
/// the browser runtime, the iOS host has one renderer per retained layer, so it
/// owns its GPU stack directly instead of using the wasm-only remount singleton.
#[cfg(target_vendor = "apple")]
pub struct NativePresentState {
    present: PresentState,
    shared: SharedGpu,
    renderer: vello::Renderer,
}

#[cfg(target_vendor = "apple")]
impl NativePresentState {
    pub fn render_and_present(
        &mut self,
        encoding: vello_encoding::Encoding,
        overlay_encoding: Option<vello_encoding::Encoding>,
        glass: &[crate::GlassSurface],
        chrome: &[crate::ChromeGlassSurface],
        viewport: &crate::Viewport,
        size: (u32, u32),
    ) -> Result<(), String> {
        self.present.render_frame(
            &self.shared,
            &mut self.renderer,
            encoding,
            overlay_encoding,
            glass,
            chrome,
            viewport,
            size,
        )
    }
}

/// Creates a Metal-only instance without touching the Core Animation pointer.
/// The unsafe layer-to-surface conversion remains isolated in `native-ffi`.
#[cfg(target_vendor = "apple")]
pub fn native_metal_instance() -> Arc<Instance> {
    Arc::new(Instance::new(InstanceDescriptor {
        backends: Backends::METAL,
        flags: wgpu::InstanceFlags::default(),
        memory_budget_thresholds: Default::default(),
        backend_options: Default::default(),
        display: None,
    }))
}

/// Initializes one native GPU stack for an already-retained Core Animation
/// surface. Adapter selection is constrained to that surface, so a successful
/// return proves the device can present to the supplied layer.
#[cfg(target_vendor = "apple")]
pub async fn init_native(
    instance: Arc<Instance>,
    surface: Surface<'static>,
) -> Result<NativePresentState, String> {
    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            force_fallback_adapter: false,
            compatible_surface: Some(&surface),
        })
        .await
        .map_err(|error| render_error("init", Some(&format!("adapter:{error}"))))?;
    let (device, queue) = adapter
        .request_device(&DeviceDescriptor {
            // CoreSimulator exposes 15 inter-stage variables (below WebGPU's
            // default 16), while Vello needs 5 compute storage buffers (above
            // the downlevel baseline of 4). The adapter-reported Metal limits
            // satisfy both and are the authoritative native capability set.
            required_limits: adapter.limits(),
            ..Default::default()
        })
        .await
        .map_err(|error| render_error("init", Some(&format!("device:{error}"))))?;
    let renderer = vello::Renderer::new(
        &device,
        vello::RendererOptions {
            use_cpu: false,
            antialiasing_support: vello::AaSupport::area_only(),
            // Vello defaults to one initialization thread on macOS because
            // parallel pipeline creation is not reliable on Metal. iOS shares
            // that backend but misses Vello's target_os = "macos" default.
            num_init_threads: std::num::NonZeroUsize::new(1),
            ..Default::default()
        },
    )
    .map_err(|error| render_error("init", Some(&format!("renderer:{error}"))))?;
    let capabilities = surface.get_capabilities(&adapter);
    let surface_format = pick_surface_format(&capabilities.formats)
        .ok_or_else(|| render_error("init", Some("format")))?;
    let alpha_mode = pick_alpha_mode(&capabilities.alpha_modes);
    let present = PresentPipeline::new(&device, surface_format);
    let shared = SharedGpu {
        instance,
        adapter: Arc::new(adapter),
        device: Arc::new(device),
        queue: Arc::new(queue),
    };

    Ok(NativePresentState {
        present: PresentState {
            surface,
            surface_format,
            alpha_mode,
            configured_size: None,
            offscreen: None,
            overlay: None,
            present,
            glass: None,
        },
        shared,
        renderer,
    })
}

/// Creates the surface for this canvas and returns the per-canvas state.
/// The device/queue/renderer come from the module singleton — created on
/// the first call, reused afterwards (see `SharedGpu` for why). The host
/// callback is re-registered on every call so this runtime's relay owns
/// the device's error surfaces (`on_uncaptured_error` replaces the
/// handler; `set_device_lost_callback` adds a reaction — older
/// registrations stay alive and are benign).
#[cfg(target_arch = "wasm32")]
pub async fn init(
    canvas: HtmlCanvasElement,
    error_callback: js_sys::Function,
) -> Result<PresentState, String> {
    let _lock = acquire_init_lock().await;
    let shared: SharedGpu = match SHARED_GPU.with(|slot| slot.borrow().clone()) {
        Some(shared) => shared,
        None => {
            let instance = Arc::new(Instance::new(InstanceDescriptor {
                // BROWSER_WEBGPU only: on a browser without navigator.gpu this
                // makes adapter request fail loudly instead of silently falling
                // back to a WebGL2 downlevel floor (the react-vello lesson; the
                // "no fallback backend" invariant I32 holds).
                backends: Backends::BROWSER_WEBGPU,
                flags: wgpu::InstanceFlags::default(),
                memory_budget_thresholds: Default::default(),
                backend_options: Default::default(),
                display: None,
            }));
            let adapter: Adapter = instance
                .request_adapter(&wgpu::RequestAdapterOptions {
                    power_preference: wgpu::PowerPreference::HighPerformance,
                    force_fallback_adapter: false,
                    compatible_surface: None,
                })
                .await
                .map_err(|error| render_error("init", Some(&format!("adapter:{error}"))))?;
            // No required features or limits, matching the alpha's
            // supported runtime (renderer-build.md): Crafty runs within
            // default limits on any conforming adapter.
            let (device, queue) = adapter
                .request_device(&DeviceDescriptor::default())
                .await
                .map_err(|error| render_error("init", Some(&format!("device:{error}"))))?;
            // AaSupport::area_only: the default compiles the Area, MSAA8
            // and MSAA16 shader permutations at startup, and only Area is
            // ever requested — the research finding (react-vello report
            // §2) that two thirds of the startup shader compilation is
            // otherwise paid for and never used.
            let renderer = vello::Renderer::new(
                &device,
                vello::RendererOptions {
                    use_cpu: false,
                    antialiasing_support: vello::AaSupport::area_only(),
                    ..Default::default()
                },
            )
            .map_err(|error| render_error("init", Some(&format!("renderer:{error}"))))?;
            SHARED_RENDERER.with(|slot| *slot.borrow_mut() = Some(renderer));
            let shared = SharedGpu {
                instance,
                adapter: Arc::new(adapter),
                device: Arc::new(device),
                queue: Arc::new(queue),
            };
            SHARED_GPU.with(|slot| *slot.borrow_mut() = Some(shared.clone()));
            shared
        }
    };
    register_error_surfaces(&shared.device, error_callback);
    let surface = shared
        .instance
        .create_surface(SurfaceTarget::Canvas(canvas))
        .map_err(|error| render_error("init", Some(&format!("surface:{error}"))))?;
    let capabilities = surface.get_capabilities(&shared.adapter);
    let surface_format = pick_surface_format(&capabilities.formats)
        .ok_or_else(|| render_error("init", Some("format")))?;
    let alpha_mode = pick_alpha_mode(&capabilities.alpha_modes);
    let present = PresentPipeline::new(&shared.device, surface_format);
    Ok(PresentState {
        surface,
        surface_format,
        alpha_mode,
        configured_size: None,
        offscreen: None,
        overlay: None,
        present,
        glass: None,
    })
}
