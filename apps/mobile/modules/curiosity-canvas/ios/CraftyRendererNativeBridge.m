#import "CraftyRendererNativeBridge.h"
#import "crafty_renderer.h"

static NSString *const CuriosityCraftyRendererErrorDomain =
    @"CuriosityCraftyRendererError";

@interface CuriosityCraftyRendererNativeHost ()

@property(nonatomic, strong) CALayer *retainedLayer;
@property(nonatomic, assign) CraftyRendererNative *renderer;

@end


static BOOL CuriosityConsumeRendererResult(
    CraftyRendererResult *result,
    NSError * _Nullable * _Nullable error) {
  CraftyRendererStatus status = crafty_renderer_result_status(result);
  const uint8_t *bytes = crafty_renderer_result_bytes(result);
  size_t length = crafty_renderer_result_length(result);
  NSString *message = @"RENDERER_NATIVE_UNKNOWN";
  if (bytes != NULL && length > 0) {
    message = [[NSString alloc] initWithBytes:bytes
                                      length:length
                                    encoding:NSUTF8StringEncoding]
        ?: message;
  }
  crafty_renderer_result_destroy(result);

  if (status == CRAFTY_RENDERER_STATUS_OK) {
    return YES;
  }
  if (error != NULL) {
    *error = [NSError errorWithDomain:CuriosityCraftyRendererErrorDomain
                                 code:status
                             userInfo:@{NSLocalizedDescriptionKey : message}];
  }
  return NO;
}

uint32_t CuriosityCraftyRendererNativeABIVersion(void) {
  return crafty_renderer_native_abi_version();
}

@implementation CuriosityCraftyRendererNativeHost

- (nullable instancetype)initWithLayer:(CALayer *)layer
                                  error:(NSError * _Nullable * _Nullable)error {
  self = [super init];
  if (self == nil) {
    return nil;
  }

  _retainedLayer = layer;
  _renderer = NULL;
  CraftyRendererResult *result = crafty_renderer_native_create_metal(
      (__bridge void *)layer,
      &_renderer);
  if (!CuriosityConsumeRendererResult(result, error)) {
    return nil;
  }
  return self;
}

- (BOOL)renderFrameJSON:(NSData *)frameJSON
                   error:(NSError * _Nullable * _Nullable)error {
  CraftyRendererResult *result = crafty_renderer_native_render_frame_json(
      _renderer,
      frameJSON.bytes,
      frameJSON.length);
  return CuriosityConsumeRendererResult(result, error);
}

- (void)dealloc {
  crafty_renderer_native_destroy(_renderer);
  _renderer = NULL;
}

@end
