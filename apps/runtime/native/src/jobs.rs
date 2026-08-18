use std::panic::{AssertUnwindSafe, catch_unwind};
use std::slice;
use std::{fs, path::Path};

use crate::{authorize, checked_absolute, sync_write};

const OPERATION: &str = "build_owned_crawl_snapshot";

fn transition_allowed(current: i32, next: i32) -> bool {
    matches!(
        (current, next),
        (-1, 0) | (0, 1) | (0, 5) | (1, 2) | (1, 3) | (1, 4) | (2, 5) | (1, 0)
    ) || (matches!(current, 3..=5) && current == next)
}

#[derive(Default)]
struct CanonicalJob {
    schema_version: Option<String>,
    id: Option<String>,
    operation: Option<String>,
    idempotency_key: Option<String>,
    digest: Option<String>,
    seed: Option<String>,
    state: Option<String>,
    attempt: Option<u64>,
    snapshot_id: Option<String>,
    diagnostic: Option<String>,
}

struct JsonCursor<'a> {
    bytes: &'a [u8],
    position: usize,
}

impl<'a> JsonCursor<'a> {
    fn whitespace(&mut self) {
        while self
            .bytes
            .get(self.position)
            .is_some_and(u8::is_ascii_whitespace)
        {
            self.position += 1;
        }
    }
    fn take(&mut self, byte: u8) -> bool {
        self.whitespace();
        if self.bytes.get(self.position) == Some(&byte) {
            self.position += 1;
            true
        } else {
            false
        }
    }
    fn string(&mut self) -> Option<String> {
        self.whitespace();
        if self.bytes.get(self.position) != Some(&b'"') {
            return None;
        }
        self.position += 1;
        let start = self.position;
        while let Some(byte) = self.bytes.get(self.position) {
            if *byte == b'"' {
                let value = std::str::from_utf8(&self.bytes[start..self.position])
                    .ok()?
                    .to_owned();
                self.position += 1;
                return Some(value);
            }
            if *byte == b'\\' || *byte < 0x20 {
                return None;
            }
            self.position += 1;
        }
        None
    }
    fn unsigned(&mut self) -> Option<u64> {
        self.whitespace();
        let start = self.position;
        while self
            .bytes
            .get(self.position)
            .is_some_and(u8::is_ascii_digit)
        {
            self.position += 1;
        }
        if start == self.position || (self.position - start > 1 && self.bytes[start] == b'0') {
            return None;
        }
        std::str::from_utf8(&self.bytes[start..self.position])
            .ok()?
            .parse()
            .ok()
    }
}

fn decode_canonical_job(source: &str) -> Option<CanonicalJob> {
    if source.len() > 16 * 1024 {
        return None;
    }
    let mut cursor = JsonCursor {
        bytes: source.as_bytes(),
        position: 0,
    };
    let mut job = CanonicalJob::default();
    let mut fields = std::collections::HashSet::new();
    if !cursor.take(b'{') {
        return None;
    }
    loop {
        cursor.whitespace();
        if cursor.take(b'}') {
            break;
        }
        let field = cursor.string()?;
        if !fields.insert(field.clone()) || !cursor.take(b':') {
            return None;
        }
        match field.as_str() {
            "schemaVersion" => job.schema_version = Some(cursor.string()?),
            "id" => job.id = Some(cursor.string()?),
            "operation" => job.operation = Some(cursor.string()?),
            "idempotencyKey" => job.idempotency_key = Some(cursor.string()?),
            "canonicalDigest" => job.digest = Some(cursor.string()?),
            "seed" => job.seed = Some(cursor.string()?),
            "state" => job.state = Some(cursor.string()?),
            "attempt" => job.attempt = Some(cursor.unsigned()?),
            "snapshotId" => job.snapshot_id = Some(cursor.string()?),
            "diagnostic" => job.diagnostic = Some(cursor.string()?),
            _ => return None,
        }
        cursor.whitespace();
        if cursor.take(b'}') {
            break;
        }
        if !cursor.take(b',') {
            return None;
        }
        cursor.whitespace();
        if cursor.bytes.get(cursor.position) == Some(&b'}') {
            return None;
        }
    }
    cursor.whitespace();
    if cursor.position != cursor.bytes.len() {
        return None;
    }
    let valid_text = |value: &str, maximum: usize| {
        !value.is_empty() && value.len() <= maximum && value.is_ascii()
    };
    let id = job.id.as_deref()?;
    let digest = job.digest.as_deref()?;
    let key = job.idempotency_key.as_deref()?;
    if job.schema_version.as_deref() != Some("1.0.0")
        || job.operation.as_deref() != Some(OPERATION)
        || job.seed.as_deref() != Some("https://docs.m6-owned.test/")
        || !id.strip_prefix("job-").is_some_and(|tail| {
            tail.len() == 24
                && tail
                    .bytes()
                    .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
        })
        || digest.len() != 64
        || !digest
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
        || key.is_empty()
        || key.len() > 128
        || !key
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._:-".contains(&byte))
        || !job
            .attempt
            .is_some_and(|attempt| attempt <= u32::MAX.into())
    {
        return None;
    }
    let state = job.state.as_deref()?;
    if !matches!(
        state,
        "queued" | "running" | "cancel_requested" | "succeeded" | "failed" | "cancelled"
    ) {
        return None;
    }
    if matches!(
        state,
        "running" | "cancel_requested" | "succeeded" | "failed"
    ) && job.attempt == Some(0)
    {
        return None;
    }
    if job
        .snapshot_id
        .as_deref()
        .is_some_and(|value| !valid_text(value, 128))
        || job
            .diagnostic
            .as_deref()
            .is_some_and(|value| !valid_text(value, 256))
    {
        return None;
    }
    Some(job)
}

fn state_code(state: &str) -> Option<i32> {
    [
        ("queued", 0),
        ("running", 1),
        ("cancel_requested", 2),
        ("succeeded", 3),
        ("failed", 4),
        ("cancelled", 5),
    ]
    .into_iter()
    .find_map(|(value, code)| (state == value).then_some(code))
}

unsafe fn bounded_text(pointer: *const u8, length: u64, maximum: usize) -> Option<String> {
    if pointer.is_null() || length == 0 || length > maximum as u64 {
        return None;
    }
    let length = usize::try_from(length).ok()?;
    // SAFETY: the bounded FFI contract requires a caller-owned readable region.
    let bytes = unsafe { slice::from_raw_parts(pointer, length) };
    std::str::from_utf8(bytes).ok().map(str::to_owned)
}

unsafe fn bounded_bytes(pointer: *const u8, length: u64, maximum: usize) -> Option<Vec<u8>> {
    if pointer.is_null() || length == 0 || length > maximum as u64 {
        return None;
    }
    let length = usize::try_from(length).ok()?;
    // SAFETY: the bounded FFI contract requires a caller-owned readable region.
    Some(unsafe { slice::from_raw_parts(pointer, length) }.to_vec())
}

fn allowed_path(value: &str) -> bool {
    let path = Path::new(value);
    if path.is_absolute() || value.contains(['\\', '\0']) || path.components().count() < 2 {
        return false;
    }
    let components: Vec<_> = path
        .components()
        .map(|part| part.as_os_str().to_string_lossy())
        .collect();
    matches!(
        components.first().map(|value| value.as_ref()),
        Some("jobs" | "job-events" | "idempotency" | "snapshots" | "projections" | "tombstones")
    ) && components.iter().all(|part| *part != ".." && *part != ".")
}

#[unsafe(no_mangle)]
/// Rust-authoritative canonical-file mutation. Action 0 replaces, 1 creates
/// immutably, and 2 deletes. The fixed relative-path allowlist is M4/M6 only.
/// # Safety
/// Every pointer identifies a caller-owned readable allocation for this call.
pub unsafe extern "C" fn curiosity_runtime_v2_owned_state_write(
    action: i32,
    root_pointer: *const u8,
    root_length: u64,
    capability_pointer: *const u8,
    capability_length: u64,
    relative_pointer: *const u8,
    relative_length: u64,
    body_pointer: *const u8,
    body_length: u64,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        let Some(root_text) = (unsafe { bounded_text(root_pointer, root_length, 4096) }) else {
            return 1;
        };
        let Some(capability) =
            (unsafe { bounded_bytes(capability_pointer, capability_length, 256) })
        else {
            return 1;
        };
        let Some(relative) = (unsafe { bounded_text(relative_pointer, relative_length, 4096) })
        else {
            return 1;
        };
        if !allowed_path(&relative) || body_length > 2 * 1024 * 1024 {
            return 1;
        }
        let root = match checked_absolute(&root_text) {
            Ok(value) => value,
            Err(_) => return 1,
        };
        if authorize(&root, "admin", &capability).is_err() {
            return 1;
        }
        let path = root.join(relative);
        if action == 2 {
            return if !path.exists() || fs::remove_file(path).is_ok() {
                0
            } else {
                1
            };
        }
        let body = if body_length == 0 {
            Vec::new()
        } else {
            if body_pointer.is_null() {
                return 1;
            }
            let Ok(length) = usize::try_from(body_length) else {
                return 1;
            };
            // SAFETY: bounded above; caller retains this readable region.
            unsafe { slice::from_raw_parts(body_pointer, length) }.to_vec()
        };
        if action == 1 && path.exists() {
            return 1;
        }
        if !matches!(action, 0 | 1) {
            return 1;
        }
        if sync_write(&root, &path, &body).is_ok() {
            0
        } else {
            1
        }
    }))
    .unwrap_or(1)
}

#[unsafe(no_mangle)]
/// Authoritative M4 state-machine gate. Inputs remain caller-owned and are not retained.
/// State codes: -1 absent, 0 queued, 1 running, 2 cancel_requested,
/// 3 succeeded, 4 failed, 5 cancelled.
/// # Safety
/// Pointers identify readable allocations of their paired bounded lengths for this call.
pub unsafe extern "C" fn curiosity_runtime_v2_owned_job_transition(
    operation_pointer: *const u8,
    operation_length: u64,
    current: i32,
    next: i32,
    digest_pointer: *const u8,
    digest_length: u64,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        let operation = match unsafe { bounded_text(operation_pointer, operation_length, 64) } {
            Some(value) => value,
            None => return 1,
        };
        let digest = match unsafe { bounded_text(digest_pointer, digest_length, 64) } {
            Some(value) => value,
            None => return 1,
        };
        if operation != OPERATION
            || digest.len() != 64
            || !digest
                .bytes()
                .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
            || !transition_allowed(current, next)
        {
            return 1;
        }
        0
    }))
    .unwrap_or(1)
}

#[unsafe(no_mangle)]
/// Checks a transition against the canonical job file while the caller holds
/// the repository writer lock. This prevents a stale language-runtime copy
/// from authorizing settlement over a durable cancellation request.
/// # Safety
/// Pointers identify readable allocations of their paired bounded lengths.
pub unsafe extern "C" fn curiosity_runtime_v2_owned_job_transition_canonical(
    root_pointer: *const u8,
    root_length: u64,
    capability_pointer: *const u8,
    capability_length: u64,
    relative_pointer: *const u8,
    relative_length: u64,
    current: i32,
    next: i32,
    digest_pointer: *const u8,
    digest_length: u64,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        let Some(root_text) = (unsafe { bounded_text(root_pointer, root_length, 4096) }) else {
            return 1;
        };
        let Some(capability) =
            (unsafe { bounded_bytes(capability_pointer, capability_length, 256) })
        else {
            return 1;
        };
        let Some(relative) = (unsafe { bounded_text(relative_pointer, relative_length, 4096) })
        else {
            return 1;
        };
        let Some(digest) = (unsafe { bounded_text(digest_pointer, digest_length, 64) }) else {
            return 1;
        };
        if digest.len() != 64
            || !digest
                .bytes()
                .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
        {
            return 1;
        }
        let Some(expected_id) = relative
            .strip_prefix("jobs/")
            .and_then(|value| value.strip_suffix(".json"))
        else {
            return 1;
        };
        if !expected_id.strip_prefix("job-").is_some_and(|tail| {
            tail.len() == 24
                && tail
                    .bytes()
                    .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
        }) || !allowed_path(&relative)
        {
            return 1;
        }
        let root = match checked_absolute(&root_text) {
            Ok(value) => value,
            Err(_) => return 1,
        };
        if authorize(&root, "admin", &capability).is_err() {
            return 1;
        }
        let canonical = root.join(&relative);
        let actual = if canonical.exists() {
            let source = match fs::read_to_string(canonical) {
                Ok(value) => value,
                Err(_) => return 1,
            };
            let Some(job) = decode_canonical_job(source.trim_end()) else {
                return 1;
            };
            if job.id.as_deref() != Some(expected_id) || job.digest.as_deref() != Some(&digest) {
                return 1;
            }
            match job.state.as_deref().and_then(state_code) {
                Some(value) => value,
                None => return 1,
            }
        } else {
            -1
        };
        if actual != current || !transition_allowed(actual, next) {
            return 1;
        }
        0
    }))
    .unwrap_or(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn terminal_states_are_immutable_and_recovery_is_explicit() {
        assert!(transition_allowed(-1, 0));
        assert!(transition_allowed(1, 0));
        assert!(transition_allowed(3, 3));
        assert!(!transition_allowed(3, 1));
        assert!(!transition_allowed(0, 3));
    }

    #[test]
    fn state_writer_paths_are_closed() {
        assert!(allowed_path("jobs/job-012345678901234567890123.json"));
        assert!(allowed_path("projections/m6/snapshot.json"));
        assert!(!allowed_path("../authority/admin.sha256"));
        assert!(!allowed_path("authority/admin.sha256"));
    }

    #[test]
    fn canonical_job_decoder_rejects_malformed_incomplete_and_duplicate_records() {
        let valid = r#"{"attempt":0,"canonicalDigest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id":"job-012345678901234567890123","idempotencyKey":"key","operation":"build_owned_crawl_snapshot","schemaVersion":"1.0.0","seed":"https://docs.m6-owned.test/","state":"queued"}"#;
        assert!(decode_canonical_job(valid).is_some());
        assert!(decode_canonical_job("{").is_none());
        assert!(decode_canonical_job(&valid.replace('}', ",}")).is_none());
        assert!(decode_canonical_job(&valid.replace("\"attempt\":0,", "")).is_none());
        assert!(
            decode_canonical_job(&valid.replace(
                "\"state\":\"queued\"",
                "\"state\":\"queued\",\"state\":\"running\""
            ))
            .is_none()
        );
        assert!(
            decode_canonical_job(&valid.replace(
                "\"operation\":\"build_owned_crawl_snapshot\"",
                "\"operation\":\"other\""
            ))
            .is_none()
        );
    }
}
