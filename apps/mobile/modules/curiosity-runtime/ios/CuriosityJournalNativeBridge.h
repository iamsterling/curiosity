#ifndef CURIOSITY_JOURNAL_NATIVE_BRIDGE_H
#define CURIOSITY_JOURNAL_NATIVE_BRIDGE_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

uint32_t curiosity_journal_abi_version(void);

// Returns the UTF-8 response length, or a stable negative error code. Input and
// output memory remain caller-owned and are never retained by Rust.
int64_t curiosity_journal_call(
    const uint8_t *request,
    size_t request_length,
    uint8_t *response,
    size_t response_capacity);

#ifdef __cplusplus
}
#endif

#endif
