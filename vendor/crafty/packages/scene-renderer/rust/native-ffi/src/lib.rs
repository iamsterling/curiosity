use std::panic::{catch_unwind, AssertUnwindSafe};
use std::slice;
use std::str;

#[cfg(target_vendor = "apple")]
use std::ffi::c_void;

pub const NATIVE_ABI_VERSION: u32 = 1;

#[repr(i32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CraftyRendererStatus {
    Ok = 0,
    NullInput = 1,
    InvalidUtf8 = 2,
    EncodeFailed = 3,
    Panic = 4,
    NullResult = 5,
    NullRenderer = 6,
    NullLayer = 7,
    NullOutput = 8,
    InitFailed = 9,
    RenderFailed = 10,
}

#[cfg(target_vendor = "apple")]
pub struct CraftyRendererNative {
    renderer: crafty_renderer_core::NativeRenderer,
}

pub struct CraftyRendererResult {
    status: CraftyRendererStatus,
    bytes: Box<[u8]>,
}

impl CraftyRendererResult {
    fn new(status: CraftyRendererStatus, bytes: impl Into<Vec<u8>>) -> Self {
        Self {
            status,
            bytes: bytes.into().into_boxed_slice(),
        }
    }
}

fn panic_result(payload: Box<dyn std::any::Any + Send>) -> CraftyRendererResult {
    let detail = payload
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| payload.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("unknown");
    CraftyRendererResult::new(
        CraftyRendererStatus::Panic,
        format!("RENDERER_NATIVE_PANIC:{detail}").into_bytes(),
    )
}

#[no_mangle]
pub extern "C" fn crafty_renderer_native_abi_version() -> u32 {
    NATIVE_ABI_VERSION
}

/// Encodes one complete renderer packet and returns owned evidence or a stable
/// failure. This is the only unsafe data crossing in the native proof; the safe
/// encoder crate continues to forbid unsafe code.
///
/// # Safety
///
/// `frame_json` must point to `frame_json_length` readable bytes for the duration
/// of this call. The returned result must be destroyed exactly once with
/// [`crafty_renderer_result_destroy`].
#[no_mangle]
pub unsafe extern "C" fn crafty_renderer_encode_frame_json(
    frame_json: *const u8,
    frame_json_length: usize,
) -> *mut CraftyRendererResult {
    if frame_json.is_null() {
        return result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::NullInput,
            b"RENDERER_NATIVE_NULL_INPUT".to_vec(),
        ));
    }

    let outcome = catch_unwind(AssertUnwindSafe(|| {
        // SAFETY: The caller contract above requires a readable region of this
        // exact length, and the slice does not escape the call.
        let bytes = unsafe { slice::from_raw_parts(frame_json, frame_json_length) };
        let frame = match str::from_utf8(bytes) {
            Ok(frame) => frame,
            Err(_) => {
                return CraftyRendererResult::new(
                    CraftyRendererStatus::InvalidUtf8,
                    b"RENDERER_NATIVE_INVALID_UTF8".to_vec(),
                );
            }
        };

        match crafty_renderer_core::encode_frame_evidence_json(frame) {
            Ok(evidence) => {
                CraftyRendererResult::new(CraftyRendererStatus::Ok, evidence.into_bytes())
            }
            Err(error) => {
                CraftyRendererResult::new(CraftyRendererStatus::EncodeFailed, error.into_bytes())
            }
        }
    }));

    let result = outcome.unwrap_or_else(panic_result);
    result_pointer(result)
}

/// Creates one Rust/wgpu/Vello renderer over a Core Animation layer.
///
/// # Safety
///
/// `core_animation_layer` must be a valid `CAMetalLayer` object. `renderer_out`
/// must point to writable storage and the returned renderer must be destroyed
/// exactly once with [`crafty_renderer_native_destroy`]. The caller must keep
/// the layer alive until that destruction; wgpu's Metal backend also retains it.
#[cfg(target_vendor = "apple")]
#[no_mangle]
pub unsafe extern "C" fn crafty_renderer_native_create_metal(
    core_animation_layer: *mut c_void,
    renderer_out: *mut *mut CraftyRendererNative,
) -> *mut CraftyRendererResult {
    if core_animation_layer.is_null() {
        return result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::NullLayer,
            b"RENDERER_NATIVE_NULL_LAYER".to_vec(),
        ));
    }
    if renderer_out.is_null() {
        return result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::NullOutput,
            b"RENDERER_NATIVE_NULL_OUTPUT".to_vec(),
        ));
    }

    // SAFETY: The caller provided writable storage. Nulling it before any work
    // makes every failure path deterministic and prevents stale ownership.
    unsafe { *renderer_out = std::ptr::null_mut() };
    let outcome = catch_unwind(AssertUnwindSafe(|| {
        let instance = crafty_renderer_core::native_metal_instance();
        // SAFETY: The foreign-edge contract requires a live CAMetalLayer. No
        // raw layer pointer enters the unsafe-free encoder crate; only wgpu's
        // owned surface handle crosses that boundary.
        let surface: wgpu::Surface<'static> = unsafe {
            instance.create_surface_unsafe(wgpu::SurfaceTargetUnsafe::CoreAnimationLayer(
                core_animation_layer,
            ))
        }
        .map_err(|error| format!("VELLO_RENDER_FAILED:init:surface:{error}"))?;
        let renderer =
            pollster::block_on(crafty_renderer_core::NativeRenderer::new(instance, surface))?;
        Ok::<CraftyRendererNative, String>(CraftyRendererNative { renderer })
    }));

    match outcome {
        Ok(Ok(renderer)) => {
            // SAFETY: The output storage was validated above and now receives
            // the one owned allocation transferred to the caller.
            unsafe { *renderer_out = Box::into_raw(Box::new(renderer)) };
            result_pointer(CraftyRendererResult::new(
                CraftyRendererStatus::Ok,
                b"RENDERER_NATIVE_READY".to_vec(),
            ))
        }
        Ok(Err(error)) => result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::InitFailed,
            error.into_bytes(),
        )),
        Err(payload) => result_pointer(panic_result(payload)),
    }
}

/// Presents one complete renderer packet through an initialized native host.
///
/// # Safety
///
/// `renderer` must be a live pointer returned by
/// [`crafty_renderer_native_create_metal`]. `frame_json` must point to
/// `frame_json_length` readable bytes for the duration of this call.
#[cfg(target_vendor = "apple")]
#[no_mangle]
pub unsafe extern "C" fn crafty_renderer_native_render_frame_json(
    renderer: *mut CraftyRendererNative,
    frame_json: *const u8,
    frame_json_length: usize,
) -> *mut CraftyRendererResult {
    if renderer.is_null() {
        return result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::NullRenderer,
            b"RENDERER_NATIVE_NULL_RENDERER".to_vec(),
        ));
    }
    if frame_json.is_null() {
        return result_pointer(CraftyRendererResult::new(
            CraftyRendererStatus::NullInput,
            b"RENDERER_NATIVE_NULL_INPUT".to_vec(),
        ));
    }

    let outcome = catch_unwind(AssertUnwindSafe(|| {
        // SAFETY: Both pointers satisfy the function contract and neither
        // borrowed value escapes this call.
        let renderer = unsafe { &mut *renderer };
        let bytes = unsafe { slice::from_raw_parts(frame_json, frame_json_length) };
        let frame = match str::from_utf8(bytes) {
            Ok(frame) => frame,
            Err(_) => {
                return CraftyRendererResult::new(
                    CraftyRendererStatus::InvalidUtf8,
                    b"RENDERER_NATIVE_INVALID_UTF8".to_vec(),
                );
            }
        };

        match renderer.renderer.render_frame_json(frame) {
            Ok(()) => CraftyRendererResult::new(
                CraftyRendererStatus::Ok,
                b"RENDERER_NATIVE_PRESENTED".to_vec(),
            ),
            Err(error) => {
                CraftyRendererResult::new(CraftyRendererStatus::RenderFailed, error.into_bytes())
            }
        }
    }));

    result_pointer(outcome.unwrap_or_else(panic_result))
}

/// Releases one native renderer. A null renderer is a no-op.
///
/// # Safety
///
/// A non-null pointer must have been returned by
/// [`crafty_renderer_native_create_metal`] and not previously destroyed.
#[cfg(target_vendor = "apple")]
#[no_mangle]
pub unsafe extern "C" fn crafty_renderer_native_destroy(renderer: *mut CraftyRendererNative) {
    if renderer.is_null() {
        return;
    }
    // SAFETY: The API transfers exactly one Box allocation to the caller.
    drop(unsafe { Box::from_raw(renderer) });
}

#[no_mangle]
/// Returns the status stored in an owned result, or `NullResult` for null.
///
/// # Safety
///
/// A non-null `result` must be a live pointer returned by
/// [`crafty_renderer_encode_frame_json`].
pub unsafe extern "C" fn crafty_renderer_result_status(
    result: *const CraftyRendererResult,
) -> CraftyRendererStatus {
    // SAFETY: A non-null result originates from `result_pointer` and remains
    // valid until the caller destroys it.
    unsafe { result.as_ref() }.map_or(CraftyRendererStatus::NullResult, |result| result.status)
}

#[no_mangle]
/// Borrows the result payload bytes, or returns null for a null result.
///
/// # Safety
///
/// A non-null `result` must be a live pointer returned by
/// [`crafty_renderer_encode_frame_json`]. The returned bytes remain valid only
/// until that result is destroyed.
pub unsafe extern "C" fn crafty_renderer_result_bytes(
    result: *const CraftyRendererResult,
) -> *const u8 {
    // SAFETY: Same result lifetime contract as `crafty_renderer_result_status`.
    unsafe { result.as_ref() }.map_or(std::ptr::null(), |result| result.bytes.as_ptr())
}

#[no_mangle]
/// Returns the result payload length, or zero for a null result.
///
/// # Safety
///
/// A non-null `result` must be a live pointer returned by
/// [`crafty_renderer_encode_frame_json`].
pub unsafe extern "C" fn crafty_renderer_result_length(
    result: *const CraftyRendererResult,
) -> usize {
    // SAFETY: Same result lifetime contract as `crafty_renderer_result_status`.
    unsafe { result.as_ref() }.map_or(0, |result| result.bytes.len())
}

#[no_mangle]
/// Releases one result allocation. A null result is a no-op.
///
/// # Safety
///
/// A non-null `result` must be a live pointer returned by
/// [`crafty_renderer_encode_frame_json`] and must not have been destroyed
/// previously.
pub unsafe extern "C" fn crafty_renderer_result_destroy(result: *mut CraftyRendererResult) {
    if result.is_null() {
        return;
    }
    // SAFETY: The API transfers exactly one Box allocation to the caller, which
    // must return it here exactly once.
    drop(unsafe { Box::from_raw(result) });
}

fn result_pointer(result: CraftyRendererResult) -> *mut CraftyRendererResult {
    Box::into_raw(Box::new(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    const RECTANGLE_FRAME: &str = r#"{
      "protocolVersion": 5,
      "frameId": "native-ffi-rectangle",
      "viewport": {"panX": 0, "panY": 0, "zoom": 1, "width": 128, "height": 128, "pixelRatio": 2},
      "commands": [{
        "geometry": "rect",
        "nodeId": "rectangle-1",
        "bounds": {"x": 16, "y": 24, "width": 64, "height": 48},
        "transform": {"a": 1, "b": 0, "c": 0, "d": 1, "e": 0, "f": 0},
        "fill": [0.03, 0.49, 0.66, 1],
        "opacity": 1,
        "zIndex": 0,
        "order": 0,
        "cornerRadius": 8
      }],
      "documentRevision": 1,
      "packetRevision": 1,
      "packetKind": "full"
    }"#;

    #[test]
    fn abi_version_matches_the_public_header() {
        assert_eq!(crafty_renderer_native_abi_version(), 1);
    }

    #[test]
    fn whole_frame_encode_returns_deterministic_evidence() {
        let first = encode(RECTANGLE_FRAME.as_bytes());
        let second = encode(RECTANGLE_FRAME.as_bytes());
        assert_eq!(first.0, CraftyRendererStatus::Ok);
        assert_eq!(first, second);
        assert!(first.1.contains("\"fingerprint\":"));
        assert!(first.1.contains("\"paths\":1"));
    }

    #[test]
    fn malformed_utf8_fails_closed() {
        let result = encode(&[0xff]);
        assert_eq!(result.0, CraftyRendererStatus::InvalidUtf8);
        assert_eq!(result.1, "RENDERER_NATIVE_INVALID_UTF8");
    }

    #[test]
    fn malformed_packet_fails_closed() {
        let result = encode(b"{}");
        assert_eq!(result.0, CraftyRendererStatus::EncodeFailed);
        assert!(result.1.starts_with("Frame decode failed:"));
    }

    #[test]
    fn null_input_and_null_result_access_are_defined() {
        // SAFETY: Null input is an explicitly supported failure case.
        let result = unsafe { crafty_renderer_encode_frame_json(std::ptr::null(), 0) };
        // SAFETY: `result` is owned by this test until its one destroy call.
        assert_eq!(
            unsafe { crafty_renderer_result_status(result) },
            CraftyRendererStatus::NullInput
        );
        unsafe { crafty_renderer_result_destroy(result) };

        // SAFETY: Null access is explicitly defined by the ABI.
        assert_eq!(
            unsafe { crafty_renderer_result_status(std::ptr::null()) },
            CraftyRendererStatus::NullResult
        );
        assert!(unsafe { crafty_renderer_result_bytes(std::ptr::null()) }.is_null());
        assert_eq!(
            unsafe { crafty_renderer_result_length(std::ptr::null()) },
            0
        );
        unsafe { crafty_renderer_result_destroy(std::ptr::null_mut()) };
    }

    #[cfg(target_vendor = "apple")]
    #[test]
    fn native_host_rejects_null_handles_without_gpu_work() {
        let mut renderer = std::ptr::null_mut();
        // SAFETY: Null is an explicitly supported failure input.
        let create =
            unsafe { crafty_renderer_native_create_metal(std::ptr::null_mut(), &mut renderer) };
        assert_eq!(
            unsafe { crafty_renderer_result_status(create) },
            CraftyRendererStatus::NullLayer
        );
        assert!(renderer.is_null());
        unsafe { crafty_renderer_result_destroy(create) };

        // SAFETY: Null renderer is an explicitly supported failure input.
        let render = unsafe {
            crafty_renderer_native_render_frame_json(
                std::ptr::null_mut(),
                RECTANGLE_FRAME.as_ptr(),
                RECTANGLE_FRAME.len(),
            )
        };
        assert_eq!(
            unsafe { crafty_renderer_result_status(render) },
            CraftyRendererStatus::NullRenderer
        );
        unsafe { crafty_renderer_result_destroy(render) };
        unsafe { crafty_renderer_native_destroy(std::ptr::null_mut()) };
    }

    fn encode(bytes: &[u8]) -> (CraftyRendererStatus, String) {
        // SAFETY: `bytes` remains alive and readable through the call.
        let result = unsafe { crafty_renderer_encode_frame_json(bytes.as_ptr(), bytes.len()) };
        // SAFETY: The result is owned by this function until destruction.
        let status = unsafe { crafty_renderer_result_status(result) };
        let result_bytes = unsafe {
            slice::from_raw_parts(
                crafty_renderer_result_bytes(result),
                crafty_renderer_result_length(result),
            )
        };
        let message = str::from_utf8(result_bytes)
            .expect("result bytes are UTF-8")
            .to_owned();
        unsafe { crafty_renderer_result_destroy(result) };
        (status, message)
    }
}
