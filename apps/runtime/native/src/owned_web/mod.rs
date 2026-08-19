mod admission;
mod database;
mod extraction;
mod root;
mod sha256;

use std::panic::{AssertUnwindSafe, catch_unwind};
use std::slice;
use std::str;

use admission::admit_fixture;
use database::QualificationStore;
use root::SecuredRoot;

const MAX_ABI_PATH_BYTES: u64 = 4_096;

#[unsafe(no_mangle)]
/// Runs the fixture-only owned-web qualification path.
///
/// This symbol exists only with `owned-web-qualification`; it is not part of the
/// release profile or the stable runtime ABI.
///
/// # Safety
/// Both pointers must reference readable UTF-8 buffers of their paired lengths.
pub unsafe extern "C" fn curiosity_runtime_owned_web_qualification_v1(
    root_pointer: *const u8,
    root_length: u64,
    fixture_pointer: *const u8,
    fixture_length: u64,
    proof_pointer: *const u8,
    proof_length: u64,
) -> i32 {
    catch_unwind(AssertUnwindSafe(|| {
        let result = (|| -> Result<(), &'static str> {
            let root = unsafe { abi_utf8(root_pointer, root_length)? };
            let fixture = unsafe { abi_utf8(fixture_pointer, fixture_length)? };
            let proof = unsafe { abi_utf8(proof_pointer, proof_length)? };
            let fixture =
                admit_fixture(std::path::Path::new(fixture), std::path::Path::new(proof))?;
            let root = SecuredRoot::open(root)?;
            let mut store = QualificationStore::open(root)?;
            match store.qualify_fixture(&fixture) {
                Ok(()) => {
                    store.commit_invocation();
                    Ok(())
                }
                Err(error) => {
                    store.abort_invocation()?;
                    Err(error)
                }
            }
        })();
        if result.is_ok() { 0 } else { 1 }
    }))
    .unwrap_or(2)
}

unsafe fn abi_utf8<'a>(pointer: *const u8, length: u64) -> Result<&'a str, &'static str> {
    if pointer.is_null() || length == 0 || length > MAX_ABI_PATH_BYTES {
        return Err("CONTROL_PATH_INVALID");
    }
    let length = usize::try_from(length).map_err(|_| "CONTROL_PATH_INVALID")?;
    // SAFETY: upheld by the qualification-only C ABI caller.
    let bytes = unsafe { slice::from_raw_parts(pointer, length) };
    str::from_utf8(bytes).map_err(|_| "CONTROL_PATH_INVALID")
}

#[cfg(test)]
mod tests;
