#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT uint32_t CuriosityCraftyRendererNativeABIVersion(void);

@interface CuriosityCraftyRendererNativeHost : NSObject

- (nullable instancetype)initWithLayer:(CALayer *)layer
                                  error:(NSError * _Nullable * _Nullable)error;

- (BOOL)renderFrameJSON:(NSData *)frameJSON
                   error:(NSError * _Nullable * _Nullable)error;

@end

NS_ASSUME_NONNULL_END
