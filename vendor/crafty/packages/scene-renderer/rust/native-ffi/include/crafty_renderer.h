#ifndef CRAFTY_RENDERER_H
#define CRAFTY_RENDERER_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define CRAFTY_RENDERER_NATIVE_ABI_VERSION 1u

typedef struct CraftyRendererResult CraftyRendererResult;
typedef struct CraftyRendererNative CraftyRendererNative;

typedef enum CraftyRendererStatus {
  CRAFTY_RENDERER_STATUS_OK = 0,
  CRAFTY_RENDERER_STATUS_NULL_INPUT = 1,
  CRAFTY_RENDERER_STATUS_INVALID_UTF8 = 2,
  CRAFTY_RENDERER_STATUS_ENCODE_FAILED = 3,
  CRAFTY_RENDERER_STATUS_PANIC = 4,
  CRAFTY_RENDERER_STATUS_NULL_RESULT = 5,
  CRAFTY_RENDERER_STATUS_NULL_RENDERER = 6,
  CRAFTY_RENDERER_STATUS_NULL_LAYER = 7,
  CRAFTY_RENDERER_STATUS_NULL_OUTPUT = 8,
  CRAFTY_RENDERER_STATUS_INIT_FAILED = 9,
  CRAFTY_RENDERER_STATUS_RENDER_FAILED = 10,
} CraftyRendererStatus;

uint32_t crafty_renderer_native_abi_version(void);

CraftyRendererResult *crafty_renderer_encode_frame_json(
    const uint8_t *frame_json,
    size_t frame_json_length);

CraftyRendererResult *crafty_renderer_native_create_metal(
    void *core_animation_layer,
    CraftyRendererNative **renderer_out);

CraftyRendererResult *crafty_renderer_native_render_frame_json(
    CraftyRendererNative *renderer,
    const uint8_t *frame_json,
    size_t frame_json_length);

void crafty_renderer_native_destroy(CraftyRendererNative *renderer);

CraftyRendererStatus crafty_renderer_result_status(
    const CraftyRendererResult *result);

const uint8_t *crafty_renderer_result_bytes(
    const CraftyRendererResult *result);

size_t crafty_renderer_result_length(
    const CraftyRendererResult *result);

void crafty_renderer_result_destroy(CraftyRendererResult *result);

#ifdef __cplusplus
}
#endif

#endif
