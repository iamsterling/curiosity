#![deny(unsafe_op_in_unsafe_fn)]

use std::ffi::{c_char, c_void};
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::ptr::{self, null_mut};

use napi_sys::{
    PropertyAttributes, Status, TypedarrayType, napi_async_work, napi_callback_info,
    napi_create_arraybuffer, napi_create_async_work, napi_create_error, napi_create_promise,
    napi_create_string_utf8, napi_create_typedarray, napi_deferred, napi_define_properties,
    napi_delete_async_work, napi_env, napi_get_cb_info, napi_get_typedarray_info, napi_get_version,
    napi_is_typedarray, napi_property_descriptor, napi_queue_async_work, napi_reject_deferred,
    napi_resolve_deferred, napi_status, napi_value,
};

#[path = "../../native/src/legacy_memory/mod.rs"]
mod legacy_memory;

const INPUT_LIMIT: usize = 1_048_576;
const TOO_LARGE: &[u8] = b"{\"protocolVersion\":1,\"requestId\":null,\"status\":\"error\",\"diagnostic\":{\"code\":\"PARITY_INPUT_TOO_LARGE\",\"path\":null}}\n";
const TRANSPORT_FAILED: &[u8] = b"SDK_TRANSPORT_FAILED";
const INPUT_TYPE_INVALID: &[u8] = b"SDK_INPUT_TYPE_INVALID";
const ASYNC_RESOURCE_NAME: &[u8] = b"curiosity-node-api-qualification";
const QUALIFICATION_INFO_NAME: &[u8] = b"qualificationInfo\0";
const EXECUTE_NAME: &[u8] = b"execute\0";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum TransportFailure {
    NodeApi,
    InvalidInput,
    Allocation,
    Queue,
    Panic,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum RejectionCode {
    InputTypeInvalid,
    TransportFailed,
}

impl RejectionCode {
    fn bytes(self) -> &'static [u8] {
        match self {
            Self::InputTypeInvalid => INPUT_TYPE_INVALID,
            Self::TransportFailed => TRANSPORT_FAILED,
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
enum WorkResult {
    Pending,
    Bytes(Vec<u8>),
    Failure(TransportFailure),
}

struct RequestState {
    request: Vec<u8>,
    result: WorkResult,
    deferred: napi_deferred,
    work: napi_async_work,
}

fn contained<T>(
    operation: impl FnOnce() -> Result<T, TransportFailure>,
) -> Result<T, TransportFailure> {
    catch_unwind(AssertUnwindSafe(operation)).map_err(|_| TransportFailure::Panic)?
}

fn ok(status: napi_status) -> Result<(), TransportFailure> {
    if status == Status::napi_ok {
        Ok(())
    } else {
        Err(TransportFailure::NodeApi)
    }
}

fn execute_owned(request: Vec<u8>) -> Vec<u8> {
    let panic_id = panic_request_id(&request);
    contained(|| {
        if panic_id.is_some() {
            inject_panic_probe();
        }
        Ok(legacy_memory::protocol::dispatch_bytes(&request).bytes)
    })
    .unwrap_or_else(|_| internal_failure_bytes(panic_id))
}

#[cfg(sdk_probe = "panic")]
#[derive(Debug)]
struct PanicProbe;

#[cfg(sdk_probe = "panic")]
fn inject_panic_probe() -> ! {
    std::panic::resume_unwind(Box::new(PanicProbe))
}

#[cfg(not(sdk_probe = "panic"))]
fn inject_panic_probe() -> ! {
    unreachable!("panic probe is absent from this profile")
}

fn internal_failure_bytes(request_id: Option<&str>) -> Vec<u8> {
    format!(
        "{{\"protocolVersion\":1,\"requestId\":{},\"status\":\"error\",\"diagnostic\":{{\"code\":\"PARITY_INTERNAL_FAILURE\",\"path\":null}}}}\n",
        request_id
            .map(|value| format!("\"{value}\""))
            .unwrap_or_else(|| "null".into())
    )
    .into_bytes()
}

#[cfg(sdk_probe = "panic")]
fn panic_request_id(request: &[u8]) -> Option<&'static str> {
    (request == b"{\"protocolVersion\":1,\"requestId\":\"sdk-panic\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n")
        .then_some("sdk-panic")
}
#[cfg(not(sdk_probe = "panic"))]
fn panic_request_id(_: &[u8]) -> Option<&'static str> {
    None
}

#[cfg(sdk_probe = "allocation_failure")]
fn allocation_fails(request: &[u8]) -> bool {
    request == b"{\"protocolVersion\":1,\"requestId\":\"sdk-allocation-failure\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n"
}
#[cfg(not(sdk_probe = "allocation_failure"))]
fn allocation_fails(_: &[u8]) -> bool {
    false
}

#[cfg(sdk_probe = "queue_failure")]
fn queue_fails(request: &[u8]) -> bool {
    request == b"{\"protocolVersion\":1,\"requestId\":\"sdk-queue-failure\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n"
}
#[cfg(not(sdk_probe = "queue_failure"))]
fn queue_fails(_: &[u8]) -> bool {
    false
}

fn create_bytes(env: napi_env, bytes: &[u8]) -> Result<napi_value, TransportFailure> {
    contained(|| {
        let mut arraybuffer = null_mut();
        let mut destination = null_mut();
        // SAFETY: Node-API writes one arraybuffer handle and a writable region of `bytes.len()`.
        ok(unsafe {
            napi_create_arraybuffer(env, bytes.len(), &mut destination, &mut arraybuffer)
        })?;
        if !bytes.is_empty() {
            if destination.is_null() {
                return Err(TransportFailure::NodeApi);
            }
            // SAFETY: The host returned a writable allocation of exactly the requested size.
            unsafe {
                ptr::copy_nonoverlapping(bytes.as_ptr(), destination.cast::<u8>(), bytes.len())
            };
        }
        let mut typedarray = null_mut();
        // SAFETY: `arraybuffer` was created above and the complete range is in bounds.
        ok(unsafe {
            napi_create_typedarray(
                env,
                TypedarrayType::uint8_array,
                bytes.len(),
                arraybuffer,
                0,
                &mut typedarray,
            )
        })?;
        Ok(typedarray)
    })
}

fn create_error(env: napi_env, rejection: RejectionCode) -> Result<napi_value, TransportFailure> {
    contained(|| {
        let bytes = rejection.bytes();
        let mut code = null_mut();
        let mut message = null_mut();
        // SAFETY: Both constants are valid UTF-8 for the supplied lengths.
        ok(unsafe {
            napi_create_string_utf8(
                env,
                bytes.as_ptr().cast::<c_char>(),
                bytes.len() as isize,
                &mut code,
            )
        })?;
        // SAFETY: Same bounded constant and live output pointer.
        ok(unsafe {
            napi_create_string_utf8(
                env,
                bytes.as_ptr().cast::<c_char>(),
                bytes.len() as isize,
                &mut message,
            )
        })?;
        let mut error = null_mut();
        // SAFETY: `code` and `message` are live values in this callback scope.
        ok(unsafe { napi_create_error(env, code, message, &mut error) })?;
        Ok(error)
    })
}

fn reject(
    env: napi_env,
    deferred: napi_deferred,
    rejection: RejectionCode,
) -> Result<(), TransportFailure> {
    let error = create_error(env, rejection)?;
    reject_value(env, deferred, error)
}

fn reject_value(
    env: napi_env,
    deferred: napi_deferred,
    error: napi_value,
) -> Result<(), TransportFailure> {
    // SAFETY: `deferred` belongs to the current execute request and `error` is local.
    ok(unsafe { napi_reject_deferred(env, deferred, error) })
}

fn resolve_bytes(
    env: napi_env,
    deferred: napi_deferred,
    bytes: &[u8],
) -> Result<(), TransportFailure> {
    let value = create_bytes(env, bytes)?;
    // SAFETY: `deferred` is unsettled and `value` is a live local value.
    ok(unsafe { napi_resolve_deferred(env, deferred, value) })
}

fn qualification_info_inner(env: napi_env) -> Result<napi_value, TransportFailure> {
    let mut host_maximum = 0_u32;
    // SAFETY: `env` is supplied by Node-API and the output pointer is live.
    ok(unsafe { napi_get_version(env, &mut host_maximum) })?;
    if host_maximum < 4 {
        return Err(TransportFailure::NodeApi);
    }
    create_bytes(
        env,
        format!(
            "{{\"schemaVersion\":1,\"protocol\":\"legacy-memory-parity-v1\",\"protocolVersion\":1,\"transport\":\"node-api-bytes-v1\",\"target\":\"aarch64-apple-darwin\",\"napiMinimum\":4,\"napiHostMaximum\":{host_maximum},\"napiSys\":\"3.3.0\",\"ryuJs\":\"1.0.3\"}}\n"
        )
        .as_bytes(),
    )
}

unsafe extern "C" fn qualification_info(env: napi_env, _: napi_callback_info) -> napi_value {
    contained(|| qualification_info_inner(env)).unwrap_or(null_mut())
}

struct InputMetadata {
    data: *const u8,
    length: usize,
}

fn input_metadata(
    env: napi_env,
    info: napi_callback_info,
) -> Result<InputMetadata, TransportFailure> {
    contained(|| {
        let mut argc = 2_usize;
        let mut arguments = [null_mut(); 2];
        // SAFETY: Node-API writes at most the declared two argument slots.
        ok(unsafe {
            napi_get_cb_info(
                env,
                info,
                &mut argc,
                arguments.as_mut_ptr(),
                null_mut(),
                null_mut(),
            )
        })?;
        if argc != 1 {
            return Err(TransportFailure::InvalidInput);
        }
        let mut is_typedarray = false;
        // SAFETY: `arguments[0]` is a local callback argument handle.
        ok(unsafe { napi_is_typedarray(env, arguments[0], &mut is_typedarray) })?;
        if !is_typedarray {
            return Err(TransportFailure::InvalidInput);
        }
        let mut kind = -1;
        let mut length = 0_usize;
        let mut data = null_mut();
        let mut arraybuffer = null_mut();
        let mut byte_offset = 0_usize;
        // SAFETY: All outputs are local metadata slots. No payload byte is read here.
        ok(unsafe {
            napi_get_typedarray_info(
                env,
                arguments[0],
                &mut kind,
                &mut length,
                &mut data,
                &mut arraybuffer,
                &mut byte_offset,
            )
        })?;
        if kind != TypedarrayType::uint8_array || (length != 0 && data.is_null()) {
            return Err(TransportFailure::InvalidInput);
        }
        Ok(InputMetadata {
            data: data.cast_const().cast::<u8>(),
            length,
        })
    })
}

fn borrowed_input(metadata: &InputMetadata) -> Result<&[u8], TransportFailure> {
    contained(|| {
        if metadata.length == 0 {
            return Ok(&[] as &[u8]);
        }
        if metadata.data.is_null() {
            return Err(TransportFailure::InvalidInput);
        }
        // SAFETY: Metadata came from the current Uint8Array and is read only before callback return.
        Ok(unsafe { std::slice::from_raw_parts(metadata.data, metadata.length) })
    })
}

fn owned_input(input: &[u8]) -> Result<Vec<u8>, TransportFailure> {
    contained(|| {
        let mut owned = Vec::new();
        owned
            .try_reserve_exact(input.len())
            .map_err(|_| TransportFailure::Allocation)?;
        owned.extend_from_slice(input);
        Ok(owned)
    })
}

#[cfg(sdk_probe = "allocation_failure")]
fn inject_owned_input_allocation_failure() -> TransportFailure {
    TransportFailure::Allocation
}

#[cfg(not(sdk_probe = "allocation_failure"))]
fn inject_owned_input_allocation_failure() -> TransportFailure {
    unreachable!("allocation-failure injection is absent from this profile")
}

fn settle_allocation_failure_probe(
    env: napi_env,
    deferred: napi_deferred,
) -> Result<(), TransportFailure> {
    let rejection = create_error(env, RejectionCode::TransportFailed)?;
    let failure = inject_owned_input_allocation_failure();
    debug_assert_eq!(failure, TransportFailure::Allocation);
    let _settlement_status = reject_value(env, deferred, rejection);
    Ok(())
}

fn create_promise(env: napi_env) -> Result<(napi_deferred, napi_value), TransportFailure> {
    contained(|| {
        let mut deferred = null_mut();
        let mut promise = null_mut();
        // SAFETY: Both output pointers are live for this call.
        ok(unsafe { napi_create_promise(env, &mut deferred, &mut promise) })?;
        Ok((deferred, promise))
    })
}

fn create_async_work(env: napi_env, state: &mut RequestState) -> Result<(), TransportFailure> {
    let mut resource_name = null_mut();
    // SAFETY: The resource name constant is valid UTF-8 and the output is local.
    ok(unsafe {
        napi_create_string_utf8(
            env,
            ASYNC_RESOURCE_NAME.as_ptr().cast::<c_char>(),
            ASYNC_RESOURCE_NAME.len() as isize,
            &mut resource_name,
        )
    })?;
    // SAFETY: `state` remains boxed and stable through work creation/queue transfer.
    ok(unsafe {
        napi_create_async_work(
            env,
            null_mut(),
            resource_name,
            Some(execute_work),
            Some(complete_work),
            (state as *mut RequestState).cast::<c_void>(),
            &mut state.work,
        )
    })
}

fn admit_execute(
    env: napi_env,
    info: napi_callback_info,
    deferred: napi_deferred,
) -> Result<(), TransportFailure> {
    let metadata = input_metadata(env, info)?;
    if metadata.length > INPUT_LIMIT {
        resolve_bytes(env, deferred, TOO_LARGE)?;
        return Ok(());
    }
    let input = borrowed_input(&metadata)?;
    if allocation_fails(input) {
        return settle_allocation_failure_probe(env, deferred);
    }
    let request = owned_input(input)?;
    let mut state = Box::new(RequestState {
        request,
        result: WorkResult::Pending,
        deferred,
        work: null_mut(),
    });
    create_async_work(env, &mut state)?;
    if queue_fails(&state.request) {
        // SAFETY: Work was created but never queued and remains owned locally.
        let _ = unsafe { napi_delete_async_work(env, state.work) };
        return Err(TransportFailure::Queue);
    }
    let state_pointer = Box::into_raw(state);
    // SAFETY: The host owns the stable data pointer after successful queueing.
    if unsafe { napi_queue_async_work(env, (*state_pointer).work) } != Status::napi_ok {
        // SAFETY: Queueing failed, so callbacks cannot observe the pointer; reclaim exactly once.
        let state = unsafe { Box::from_raw(state_pointer) };
        // SAFETY: The unqueued work remains deletable on this thread.
        let _ = unsafe { napi_delete_async_work(env, state.work) };
        return Err(TransportFailure::Queue);
    }
    Ok(())
}

fn execute_inner(env: napi_env, info: napi_callback_info) -> Result<napi_value, TransportFailure> {
    let (deferred, promise) = create_promise(env)?;
    if let Err(failure) = contained(|| admit_execute(env, info, deferred)) {
        let rejection = if failure == TransportFailure::InvalidInput {
            RejectionCode::InputTypeInvalid
        } else {
            RejectionCode::TransportFailed
        };
        let _ = reject(env, deferred, rejection);
    }
    Ok(promise)
}

unsafe extern "C" fn execute(env: napi_env, info: napi_callback_info) -> napi_value {
    contained(|| execute_inner(env, info)).unwrap_or(null_mut())
}

unsafe extern "C" fn execute_work(_: napi_env, data: *mut c_void) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        if data.is_null() {
            return;
        }
        // SAFETY: The host passes back the unique boxed RequestState pointer.
        let state = unsafe { &mut *data.cast::<RequestState>() };
        let request = std::mem::take(&mut state.request);
        state.result = WorkResult::Bytes(execute_owned(request));
    }));
    if !data.is_null() {
        // SAFETY: Same host-owned state; write only a closed failure after a caught panic.
        let state = unsafe { &mut *data.cast::<RequestState>() };
        if matches!(state.result, WorkResult::Pending) {
            state.result = WorkResult::Failure(TransportFailure::Panic);
        }
    }
}

unsafe extern "C" fn complete_work(env: napi_env, status: napi_status, data: *mut c_void) {
    let _ = catch_unwind(AssertUnwindSafe(|| {
        if data.is_null() {
            return;
        }
        // SAFETY: Completion is the unique terminal owner of this boxed state.
        let mut state = unsafe { Box::from_raw(data.cast::<RequestState>()) };
        // SAFETY: Completion owns the work handle and deletes it exactly once.
        if unsafe { napi_delete_async_work(env, state.work) } != Status::napi_ok {
            state.result = WorkResult::Failure(TransportFailure::NodeApi);
        }
        if status != Status::napi_ok {
            state.result = WorkResult::Failure(TransportFailure::Queue);
        }
        let _settlement_status = settle_once(env, state.deferred, &state.result);
    }));
}

fn settle_once(
    env: napi_env,
    deferred: napi_deferred,
    result: &WorkResult,
) -> Result<(), TransportFailure> {
    match result {
        WorkResult::Bytes(bytes) => resolve_bytes(env, deferred, bytes),
        WorkResult::Pending | WorkResult::Failure(_) => {
            reject(env, deferred, RejectionCode::TransportFailed)
        }
    }
}

fn register(env: napi_env, exports: napi_value) -> Result<napi_value, TransportFailure> {
    contained(|| {
        let properties = [
            napi_property_descriptor {
                utf8name: QUALIFICATION_INFO_NAME.as_ptr().cast::<c_char>(),
                name: null_mut(),
                method: Some(qualification_info),
                getter: None,
                setter: None,
                value: null_mut(),
                attributes: PropertyAttributes::enumerable,
                data: null_mut(),
            },
            napi_property_descriptor {
                utf8name: EXECUTE_NAME.as_ptr().cast::<c_char>(),
                name: null_mut(),
                method: Some(execute),
                getter: None,
                setter: None,
                value: null_mut(),
                attributes: PropertyAttributes::enumerable,
                data: null_mut(),
            },
        ];
        // SAFETY: Descriptors and callback pointers are immutable and live for this call.
        ok(unsafe { napi_define_properties(env, exports, properties.len(), properties.as_ptr()) })?;
        Ok(exports)
    })
}

#[unsafe(no_mangle)]
/// Registers the two closed qualification exports on the host-provided object.
///
/// # Safety
///
/// Node-API must call this entry with a live N-API 4 environment and exports
/// object. Both handles are used only for this registration call and are never
/// retained.
pub unsafe extern "C" fn napi_register_module_v1(env: napi_env, exports: napi_value) -> napi_value {
    register(env, exports).unwrap_or(exports)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pure_dispatch_preserves_exact_protocol_bytes() {
        let request = b"{\"protocolVersion\":1,\"requestId\":\"sdk-pure\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n";
        assert_eq!(execute_owned(request.to_vec()), b"{\"protocolVersion\":1,\"requestId\":\"sdk-pure\",\"status\":\"ok\",\"result\":{\"bytesBase64\":\"bnVsbA==\",\"byteLength\":4}}\n");
    }

    #[test]
    fn transport_limit_and_probe_triggers_are_closed() {
        assert_eq!(TOO_LARGE.len(), 115);
        let panic = b"{\"protocolVersion\":1,\"requestId\":\"sdk-panic\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n";
        let allocation = b"{\"protocolVersion\":1,\"requestId\":\"sdk-allocation-failure\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n";
        let queue = b"{\"protocolVersion\":1,\"requestId\":\"sdk-queue-failure\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"json\",\"value\":null}}}\n";
        assert_eq!(panic_request_id(panic).is_some(), cfg!(sdk_probe = "panic"));
        assert_eq!(
            allocation_fails(allocation),
            cfg!(sdk_probe = "allocation_failure")
        );
        assert_eq!(queue_fails(queue), cfg!(sdk_probe = "queue_failure"));
        assert!(!allocation_fails(queue));
        assert!(!queue_fails(panic));
    }

    #[test]
    fn accepted_input_is_copied_once_into_independent_ownership() {
        let mut input = b"request".to_vec();
        let owned = owned_input(&input).unwrap();
        input[0] = b'X';
        assert_eq!(owned, b"request");
    }

    #[test]
    fn panic_mapping_is_stable_and_redacted() {
        let mapped = internal_failure_bytes(Some("sdk-panic"));
        assert_eq!(mapped, b"{\"protocolVersion\":1,\"requestId\":\"sdk-panic\",\"status\":\"error\",\"diagnostic\":{\"code\":\"PARITY_INTERNAL_FAILURE\",\"path\":null}}\n");
        assert!(
            !String::from_utf8(mapped)
                .unwrap()
                .contains("qualification panic")
        );
    }

    #[cfg(sdk_probe = "panic")]
    #[test]
    fn panic_probe_uses_a_bounded_hook_bypassing_payload() {
        let payload = catch_unwind(AssertUnwindSafe(inject_panic_probe)).unwrap_err();
        assert!(payload.downcast_ref::<PanicProbe>().is_some());
        assert_eq!(std::mem::size_of::<PanicProbe>(), 0);
    }

    #[test]
    fn rejection_codes_are_closed_and_distinct() {
        assert_eq!(
            RejectionCode::InputTypeInvalid.bytes(),
            b"SDK_INPUT_TYPE_INVALID"
        );
        assert_eq!(
            RejectionCode::TransportFailed.bytes(),
            b"SDK_TRANSPORT_FAILED"
        );
        assert_ne!(
            RejectionCode::InputTypeInvalid.bytes(),
            RejectionCode::TransportFailed.bytes()
        );
    }

    #[test]
    fn allocation_probe_precreates_stable_rejection_before_injection() {
        let source = include_str!("lib.rs");
        let production = &source[..source.find("#[cfg(test)]").expect("test module boundary")];
        let helper = ["fn settle_allocation_", "failure_probe"].concat();
        let start = production
            .find(&helper)
            .expect("closed allocation probe helper");
        let source = &production[start..];
        let create = source
            .find("create_error(env, RejectionCode::TransportFailed)")
            .expect("stable rejection creation");
        let inject = source
            .find("inject_owned_input_allocation_failure()")
            .expect("allocation failure injection");
        let settle = source
            .find("reject_value(env, deferred, rejection)")
            .expect("single deferred settlement");
        assert!(create < inject && inject < settle);
    }

    #[test]
    fn raw_bridge_manifest_and_source_capabilities_are_closed() {
        let manifest = include_str!("../Cargo.toml");
        let source = include_str!("lib.rs");
        assert!(manifest.contains("publish = false"));
        assert!(manifest.contains(
            "napi-sys = { version = \"=3.3.0\", default-features = false, features = [\"napi4\"] }"
        ));
        assert!(manifest.contains("ryu-js = \"=1.0.3\""));
        for forbidden in [
            "napi = ",
            "napi-derive",
            "napi-build",
            "[build-dependencies]",
        ] {
            assert!(!manifest.contains(forbidden));
        }
        for (left, right) in [
            ("get_", "global"),
            ("call_", "function"),
            ("create_", "reference"),
            ("create_threadsafe_", "function"),
            ("add_env_cleanup_", "hook"),
            ("create_external_", "arraybuffer"),
        ] {
            assert!(!source.contains(&format!("napi_{left}{right}")));
        }
        assert!(source.contains("pub unsafe extern \"C\" fn napi_register_module_v1"));
        assert!(source.contains("std::panic::resume_unwind(Box::new(PanicProbe))"));
        assert!(!source.contains(&["set", "_hook"].concat()));
        assert!(!source.contains(&["take", "_hook"].concat()));
    }
}
