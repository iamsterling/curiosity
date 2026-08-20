use std::panic::{AssertUnwindSafe, catch_unwind};
use std::slice;
use std::str;
use std::sync::atomic::{AtomicUsize, Ordering};

mod corpus;
pub use corpus::*;
#[cfg(feature = "admin")]
mod jobs;
#[cfg(feature = "legacy-memory-parity")]
#[allow(dead_code)]
mod legacy_memory;
#[cfg(any(
    feature = "owned-lexical-reader-qualification",
    feature = "owned-lexical-builder-qualification"
))]
#[allow(dead_code)]
mod owned_lexical;
#[cfg(feature = "owned-web-qualification")]
mod owned_web;
#[cfg(feature = "admin")]
pub use jobs::*;

const API_VERSION: &str = "curiosity.runtime/v0";
const OPERATION: &str = "web_search";
const MAX_CONCURRENCY: usize = 8;
const MAX_REQUEST_ID_BYTES: u64 = 64;
const MAX_QUERY_UTF8_BYTES: u64 = 2_000;
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;
static ACTIVE_REQUESTS: AtomicUsize = AtomicUsize::new(0);

#[repr(i32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Status {
    CorpusAbsent = 0,
    InvalidRequest = 1,
    UnsupportedVersion = 2,
    UnsupportedOperation = 3,
    DeadlineExpired = 4,
    LimitExceeded = 5,
    RuntimeBusy = 6,
    RuntimeFailure = 7,
}

struct Admission<'a> {
    active: &'a AtomicUsize,
}

impl Admission<'_> {
    fn acquire(active: &AtomicUsize) -> Option<Admission<'_>> {
        let admitted = active
            .fetch_update(Ordering::AcqRel, Ordering::Acquire, |current| {
                if current < MAX_CONCURRENCY {
                    Some(current + 1)
                } else {
                    None
                }
            })
            .is_ok();
        if admitted {
            Some(Admission { active })
        } else {
            None
        }
    }
}

impl Drop for Admission<'_> {
    fn drop(&mut self) {
        self.active.fetch_sub(1, Ordering::Release);
    }
}

pub struct Request<'a> {
    pub api_version: &'a str,
    pub operation: &'a str,
    pub request_id: &'a str,
    pub query: &'a str,
    pub max_results: i32,
    pub deadline_unix_ms: i64,
}

pub fn evaluate(request: &Request<'_>, now_unix_ms: i64) -> Status {
    evaluate_with_admission(request, now_unix_ms, &ACTIVE_REQUESTS)
}

fn evaluate_with_admission(
    request: &Request<'_>,
    now_unix_ms: i64,
    active_requests: &AtomicUsize,
) -> Status {
    if request.api_version != API_VERSION {
        return Status::UnsupportedVersion;
    }
    if request.operation != OPERATION {
        return Status::UnsupportedOperation;
    }
    if !valid_request_id(request.request_id) {
        return Status::InvalidRequest;
    }
    if request.query.len() > MAX_QUERY_UTF8_BYTES as usize
        || request.query.encode_utf16().count() > 500
    {
        return Status::LimitExceeded;
    }
    if request.query.chars().all(is_ecmascript_trim_whitespace) {
        return Status::InvalidRequest;
    }
    if !(1..=10).contains(&request.max_results) {
        return Status::LimitExceeded;
    }
    if request.deadline_unix_ms.unsigned_abs() > MAX_SAFE_INTEGER as u64
        || now_unix_ms.unsigned_abs() > MAX_SAFE_INTEGER as u64
    {
        return Status::InvalidRequest;
    }
    if request.deadline_unix_ms <= now_unix_ms {
        return Status::DeadlineExpired;
    }
    if request.deadline_unix_ms - now_unix_ms > 15_000 {
        return Status::LimitExceeded;
    }
    let Some(_admission) = Admission::acquire(active_requests) else {
        return Status::RuntimeBusy;
    };
    Status::CorpusAbsent
}

fn is_ecmascript_trim_whitespace(character: char) -> bool {
    matches!(
        character,
        '\u{0009}'..='\u{000d}'
            | '\u{0020}'
            | '\u{00a0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200a}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202f}'
            | '\u{205f}'
            | '\u{3000}'
            | '\u{feff}'
    )
}

fn valid_request_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._:-".contains(&byte))
}

unsafe fn utf8<'a>(pointer: *const u8, length: u64) -> Result<&'a str, Status> {
    if pointer.is_null() {
        return Err(Status::InvalidRequest);
    }
    let length = usize::try_from(length).map_err(|_| Status::InvalidRequest)?;
    // SAFETY: The C ABI requires each caller to provide a readable region of exactly `length` bytes.
    let bytes = unsafe { slice::from_raw_parts(pointer, length) };
    str::from_utf8(bytes).map_err(|_| Status::InvalidRequest)
}

unsafe fn bounded_utf8<'a>(
    pointer: *const u8,
    length: u64,
    maximum: u64,
    oversized: Status,
) -> Result<&'a str, Status> {
    if length > maximum {
        return Err(oversized);
    }
    // SAFETY: This function checked the semantic length bound. The caller must
    // still satisfy `utf8`'s C ABI pointer-validity requirement.
    unsafe { utf8(pointer, length) }
}

#[unsafe(no_mangle)]
/// Evaluates one bounded M1 request and returns a fixed [`Status`] integer.
///
/// # Safety
///
/// Every non-null pointer must identify a readable allocation of its paired
/// length for the duration of this call. Rust cannot validate arbitrary C
/// pointers. `catch_unwind` contains Rust panics only; it does not catch memory
/// faults or make an invalid pointer safe to read.
pub unsafe extern "C" fn curiosity_runtime_v0_web_search(
    api_version_pointer: *const u8,
    api_version_length: u64,
    operation_pointer: *const u8,
    operation_length: u64,
    request_id_pointer: *const u8,
    request_id_length: u64,
    query_pointer: *const u8,
    query_length: u64,
    max_results: i32,
    deadline_unix_ms: i64,
    now_unix_ms: i64,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        // Each length is rejected before constructing its slice. Pointer
        // validity for every in-bound field remains the caller's obligation.
        let api_version = match unsafe {
            bounded_utf8(
                api_version_pointer,
                api_version_length,
                API_VERSION.len() as u64,
                Status::UnsupportedVersion,
            )
        } {
            Ok(value) => value,
            Err(status) => return status as i32,
        };
        if api_version != API_VERSION {
            return Status::UnsupportedVersion as i32;
        }
        let operation = match unsafe {
            bounded_utf8(
                operation_pointer,
                operation_length,
                OPERATION.len() as u64,
                Status::UnsupportedOperation,
            )
        } {
            Ok(value) => value,
            Err(status) => return status as i32,
        };
        if operation != OPERATION {
            return Status::UnsupportedOperation as i32;
        }
        let request_id = match unsafe {
            bounded_utf8(
                request_id_pointer,
                request_id_length,
                MAX_REQUEST_ID_BYTES,
                Status::InvalidRequest,
            )
        } {
            Ok(value) => value,
            Err(status) => return status as i32,
        };
        let query = match unsafe {
            bounded_utf8(
                query_pointer,
                query_length,
                MAX_QUERY_UTF8_BYTES,
                Status::LimitExceeded,
            )
        } {
            Ok(value) => value,
            Err(status) => return status as i32,
        };
        evaluate(
            &Request {
                api_version,
                operation,
                request_id,
                query,
                max_results,
                deadline_unix_ms,
            },
            now_unix_ms,
        ) as i32
    }))
    .unwrap_or(Status::RuntimeFailure as i32)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid<'a>() -> Request<'a> {
        Request {
            api_version: API_VERSION,
            operation: OPERATION,
            request_id: "request-1",
            query: "query",
            max_results: 5,
            deadline_unix_ms: 2_000,
        }
    }

    fn evaluate_locally(request: &Request<'_>, now_unix_ms: i64) -> Status {
        evaluate_with_admission(request, now_unix_ms, &AtomicUsize::new(0))
    }

    #[test]
    fn validates_in_fixed_semantic_order() {
        let mut request = valid();
        request.api_version = "v1";
        request.operation = "fetch";
        assert_eq!(
            evaluate_locally(&request, 1_000),
            Status::UnsupportedVersion
        );
        request.api_version = API_VERSION;
        assert_eq!(
            evaluate_locally(&request, 1_000),
            Status::UnsupportedOperation
        );
        request.operation = OPERATION;
        request.request_id = "bad id";
        assert_eq!(evaluate_locally(&request, 1_000), Status::InvalidRequest);
        request.request_id = "ok";
        request.query = " ";
        assert_eq!(evaluate_locally(&request, 1_000), Status::InvalidRequest);
        request.query = "x";
        request.max_results = 11;
        assert_eq!(evaluate_locally(&request, 1_000), Status::LimitExceeded);
        request.max_results = 5;
        request.deadline_unix_ms = 1_000;
        assert_eq!(evaluate_locally(&request, 1_000), Status::DeadlineExpired);
    }

    #[test]
    fn enforces_query_and_deadline_limits() {
        let mut request = valid();
        let oversized = "😀".repeat(251);
        request.query = &oversized;
        assert_eq!(evaluate_locally(&request, 1_000), Status::LimitExceeded);
        request.query = "ok";
        request.deadline_unix_ms = 16_001;
        assert_eq!(evaluate_locally(&request, 1_000), Status::LimitExceeded);
        request.deadline_unix_ms = 2_000;
        assert_eq!(evaluate_locally(&request, 1_000), Status::CorpusAbsent);
    }

    #[test]
    fn rejects_malformed_utf8_at_abi_boundary() {
        let malformed = [0xff];
        let valid = b"curiosity.runtime/v0";
        let operation = b"web_search";
        let id = b"id";
        assert_eq!(
            // SAFETY: Every pointer references a live test array with its exact length.
            unsafe {
                curiosity_runtime_v0_web_search(
                    valid.as_ptr(),
                    valid.len() as u64,
                    operation.as_ptr(),
                    operation.len() as u64,
                    id.as_ptr(),
                    id.len() as u64,
                    malformed.as_ptr(),
                    malformed.len() as u64,
                    5,
                    2_000,
                    1_000,
                )
            },
            Status::InvalidRequest as i32
        );
    }

    #[test]
    fn rejects_oversized_abi_fields_without_reading_their_pointers() {
        let dangling = std::ptr::NonNull::<u8>::dangling().as_ptr() as *const u8;
        let valid = b"curiosity.runtime/v0";
        let operation = b"web_search";
        let id = b"id";
        let query = b"query";
        let cases = [
            (
                dangling,
                21,
                operation.as_ptr(),
                operation.len() as u64,
                id.as_ptr(),
                id.len() as u64,
                query.as_ptr(),
                query.len() as u64,
                Status::UnsupportedVersion,
            ),
            (
                valid.as_ptr(),
                valid.len() as u64,
                dangling,
                11,
                id.as_ptr(),
                id.len() as u64,
                query.as_ptr(),
                query.len() as u64,
                Status::UnsupportedOperation,
            ),
            (
                valid.as_ptr(),
                valid.len() as u64,
                operation.as_ptr(),
                operation.len() as u64,
                dangling,
                65,
                query.as_ptr(),
                query.len() as u64,
                Status::InvalidRequest,
            ),
            (
                valid.as_ptr(),
                valid.len() as u64,
                operation.as_ptr(),
                operation.len() as u64,
                id.as_ptr(),
                id.len() as u64,
                dangling,
                2_001,
                Status::LimitExceeded,
            ),
        ];

        for (api_ptr, api_len, op_ptr, op_len, id_ptr, id_len, query_ptr, query_len, expected) in
            cases
        {
            assert_eq!(
                // SAFETY: The deliberately dangling pointer is paired with an oversized
                // length and must be rejected before it is read. Other pointers are live.
                unsafe {
                    curiosity_runtime_v0_web_search(
                        api_ptr, api_len, op_ptr, op_len, id_ptr, id_len, query_ptr, query_len, 5,
                        2_000, 1_000,
                    )
                },
                expected as i32
            );
        }
    }

    #[test]
    fn uses_ecmascript_trim_whitespace_for_queries() {
        for query in ["\u{feff}", "\u{2003}", "\u{2028}"] {
            let mut request = valid();
            request.query = query;
            assert_eq!(evaluate_locally(&request, 1_000), Status::InvalidRequest);
        }

        let mut request = valid();
        request.query = "\u{200b}";
        assert_eq!(evaluate_locally(&request, 1_000), Status::CorpusAbsent);

        let oversized_whitespace = "\u{feff}".repeat(501);
        request.query = &oversized_whitespace;
        assert_eq!(evaluate_locally(&request, 1_000), Status::LimitExceeded);
    }

    #[test]
    fn process_admission_is_bounded_and_released() {
        assert_eq!(ACTIVE_REQUESTS.load(Ordering::Acquire), 0);
        let mut admissions: Vec<_> = (0..MAX_CONCURRENCY)
            .map(|_| Admission::acquire(&ACTIVE_REQUESTS).expect("slot"))
            .collect();
        assert_eq!(evaluate(&valid(), 1_000), Status::RuntimeBusy);
        drop(admissions.pop());
        assert_eq!(evaluate(&valid(), 1_000), Status::CorpusAbsent);
        drop(admissions);
        assert_eq!(ACTIVE_REQUESTS.load(Ordering::Acquire), 0);
    }

    #[test]
    fn abi_status_integers_are_stable() {
        assert_eq!(Status::CorpusAbsent as i32, 0);
        assert_eq!(Status::InvalidRequest as i32, 1);
        assert_eq!(Status::UnsupportedVersion as i32, 2);
        assert_eq!(Status::UnsupportedOperation as i32, 3);
        assert_eq!(Status::DeadlineExpired as i32, 4);
        assert_eq!(Status::LimitExceeded as i32, 5);
        assert_eq!(Status::RuntimeBusy as i32, 6);
        assert_eq!(Status::RuntimeFailure as i32, 7);
    }
}
