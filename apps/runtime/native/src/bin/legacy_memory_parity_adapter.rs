use std::io::{Read, Write};
#[path = "../legacy_memory/mod.rs"]
mod legacy_memory;

const INPUT_LIMIT: usize = 1_048_576;

fn main() {
    let mut bytes = Vec::new();
    let read = std::io::stdin()
        .take((INPUT_LIMIT + 2) as u64)
        .read_to_end(&mut bytes);
    let outcome = if read.is_ok() {
        legacy_memory::protocol::dispatch_bytes(&bytes)
    } else {
        legacy_memory::protocol::internal_failure_bytes()
    };
    let _ = std::io::stdout().write_all(&outcome.bytes);
    if outcome.internal_failure {
        std::process::exit(1)
    }
}
