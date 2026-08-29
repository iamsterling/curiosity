Pod::Spec.new do |s|
  s.name           = 'CuriosityCanvas'
  s.version        = '0.1.0'
  s.summary        = 'Metal-backed creative canvas for Curiosity'
  s.description    = 'Hosts the native Curiosity scene renderer in an Expo view.'
  s.author         = 'Curiosity'
  s.homepage       = 'https://localhost/curiosity'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://localhost/curiosity' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreFoundation', 'Foundation', 'Metal', 'MetalKit', 'QuartzCore'
  s.libraries = 'iconv', 'objc'

  s.public_header_files = 'CraftyRendererNativeBridge.h'

  s.script_phase = {
    :name => 'Build Crafty renderer for iOS',
    :script => <<-SCRIPT,
set -euo pipefail

case "${PLATFORM_NAME}" in
  iphoneos)
    RUST_TARGET="aarch64-apple-ios"
    ;;
  iphonesimulator)
    if [[ " ${ARCHS} " != *" arm64 "* ]]; then
      echo "Crafty renderer supports the arm64 iOS simulator during the native spike." >&2
      exit 65
    fi
    RUST_TARGET="aarch64-apple-ios-sim"
    ;;
  *)
    echo "Unsupported Apple platform for Crafty renderer: ${PLATFORM_NAME}" >&2
    exit 65
    ;;
esac

CRAFTY_ROOT="${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty"
CRAFTY_RENDERER_LIBRARY="${PODS_CONFIGURATION_BUILD_DIR}/libcrafty_renderer_native_ffi.a"
"${CRAFTY_ROOT}/scripts/build-scene-renderer-ios.sh" \
  "${RUST_TARGET}" \
  "${CRAFTY_RENDERER_LIBRARY}"
    SCRIPT
    :execution_position => :before_compile,
    :input_files => [
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/scripts/build-scene-renderer-ios.sh',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/Cargo.lock',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/Cargo.toml',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/rust-toolchain.toml',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/native-ffi/Cargo.toml',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/native-ffi/include/crafty_renderer.h',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/native-ffi/src/lib.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/fonts/Inter-Regular.ttf',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/glass-blur.wgsl',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/glass-composite.wgsl',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/layout.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/lib.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/present.wgsl',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/text.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/text_pixel_oracle.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/vello_encoder.rs',
      '${PODS_TARGET_SRCROOT}/../../../../../vendor/crafty/packages/scene-renderer/rust/src/wgpu_present.rs',
    ],
    :output_files => ['${PODS_CONFIGURATION_BUILD_DIR}/libcrafty_renderer_native_ffi.a'],
  }

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_TARGET_SRCROOT)/../../../../../vendor/crafty/packages/scene-renderer/rust/native-ffi/include"',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.user_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'OTHER_LDFLAGS' => '$(inherited) -force_load "$(BUILT_PRODUCTS_DIR)/libcrafty_renderer_native_ffi.a"',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
