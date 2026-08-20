#include <stdint.h>
#include <stddef.h>
#include <sys/mman.h>
#include <unistd.h>

typedef void *napi_env;
typedef void *napi_value;
typedef void *napi_callback_info;
typedef int32_t napi_status;
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
typedef void (*napi_finalize)(napi_env, void *, void *);

enum { napi_ok = 0, napi_uint8_array = 1, napi_enumerable = 2 };

typedef struct {
  const char *utf8name;
  napi_value name;
  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;
  int32_t attributes;
  void *data;
} napi_property_descriptor;

extern napi_status napi_get_cb_info(napi_env, napi_callback_info, size_t *,
                                    napi_value *, napi_value *, void **);
extern napi_status napi_get_value_uint32(napi_env, napi_value, uint32_t *);
extern napi_status napi_create_external_arraybuffer(napi_env, void *, size_t,
                                                    napi_finalize, void *,
                                                    napi_value *);
extern napi_status napi_create_typedarray(napi_env, int32_t, size_t, napi_value,
                                          size_t, napi_value *);
extern napi_status napi_define_properties(napi_env, napi_value, size_t,
                                          const napi_property_descriptor *);

static const size_t OVER_LIMIT_LENGTH = 1048577;

static void release_guarded_pages(napi_env env, void *data, void *hint) {
  (void)env;
  munmap(data, (size_t)hint);
}

static napi_value create_guarded_over_limit_view(napi_env env,
                                                 napi_callback_info info) {
  size_t argc = 1;
  napi_value argument = NULL;
  uint32_t page_offset = 0;
  if (napi_get_cb_info(env, info, &argc, &argument, NULL, NULL) != napi_ok ||
      argc != 1 ||
      napi_get_value_uint32(env, argument, &page_offset) != napi_ok ||
      page_offset == 0 || page_offset > 2) {
    return NULL;
  }
  const size_t page_size = (size_t)getpagesize();
  const size_t byte_offset = page_size * page_offset;
  const size_t required = byte_offset + OVER_LIMIT_LENGTH;
  const size_t mapping_size =
      ((required + page_size - 1) / page_size) * page_size;
  void *mapping = mmap(NULL, mapping_size, PROT_NONE, MAP_PRIVATE | MAP_ANON, -1,
                       0);
  if (mapping == MAP_FAILED) {
    return NULL;
  }
  napi_value arraybuffer = NULL;
  if (napi_create_external_arraybuffer(env, mapping, mapping_size,
                                       release_guarded_pages,
                                       (void *)mapping_size,
                                       &arraybuffer) != napi_ok) {
    munmap(mapping, mapping_size);
    return NULL;
  }
  napi_value view = NULL;
  if (napi_create_typedarray(env, napi_uint8_array, OVER_LIMIT_LENGTH,
                             arraybuffer, byte_offset, &view) != napi_ok) {
    return NULL;
  }
  return view;
}

__attribute__((visibility("default"))) napi_value
napi_register_module_v1(napi_env env, napi_value exports) {
  const napi_property_descriptor property = {
      .utf8name = "createGuardedOverLimitView",
      .name = NULL,
      .method = create_guarded_over_limit_view,
      .getter = NULL,
      .setter = NULL,
      .value = NULL,
      .attributes = napi_enumerable,
      .data = NULL,
  };
  if (napi_define_properties(env, exports, 1, &property) != napi_ok) {
    return exports;
  }
  return exports;
}
