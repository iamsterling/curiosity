Pod::Spec.new do |s|
  s.name           = 'CuriosityRuntime'
  s.version        = '0.1.0'
  s.summary        = 'Native Curiosity authority primitives for iPadOS'
  s.description    = 'Provides the bounded Foundation Models route and native journal bridge.'
  s.author         = 'Curiosity'
  s.homepage       = 'https://localhost/curiosity'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: 'https://localhost/curiosity' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Foundation', 'FoundationModels'
  s.public_header_files = 'CuriosityJournalNativeBridge.h'

  s.script_phase = {
    :name => 'Build Curiosity journal for iOS',
    :script => <<-SCRIPT,
set -euo pipefail

case "${PLATFORM_NAME}" in
  iphoneos)
    RUST_TARGET="aarch64-apple-ios"
    ;;
  iphonesimulator)
    if [[ " ${ARCHS} " != *" arm64 "* ]]; then
      echo "Curiosity journal supports the arm64 iOS simulator." >&2
      exit 65
    fi
    RUST_TARGET="aarch64-apple-ios-sim"
    ;;
  *)
    echo "Unsupported Apple platform for Curiosity journal: ${PLATFORM_NAME}" >&2
    exit 65
    ;;
esac

JOURNAL_ROOT="${PODS_TARGET_SRCROOT}/.."
JOURNAL_LIBRARY="${PODS_CONFIGURATION_BUILD_DIR}/libcuriosity_journal_native.a"
"${JOURNAL_ROOT}/scripts/build-journal-ios.sh" \
  "${RUST_TARGET}" \
  "${JOURNAL_LIBRARY}"
    SCRIPT
    :execution_position => :before_compile,
    :input_files => [
      '${PODS_TARGET_SRCROOT}/../scripts/build-journal-ios.sh',
      '${PODS_TARGET_SRCROOT}/../native/Cargo.lock',
      '${PODS_TARGET_SRCROOT}/../native/Cargo.toml',
      '${PODS_TARGET_SRCROOT}/../native/rust-toolchain.toml',
      '${PODS_TARGET_SRCROOT}/../native/src/agent_journal.rs',
      '${PODS_TARGET_SRCROOT}/../native/src/attempt_journal.rs',
      '${PODS_TARGET_SRCROOT}/../native/src/lib.rs',
      '${PODS_TARGET_SRCROOT}/../native/src/schema-v15.sql',
    ],
    :output_files => ['${PODS_CONFIGURATION_BUILD_DIR}/libcuriosity_journal_native.a'],
  }

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.user_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64',
    'LIBRARY_SEARCH_PATHS' => '$(inherited) "$(BUILT_PRODUCTS_DIR)"',
    'OTHER_LDFLAGS' => '$(inherited) -lcuriosity_journal_native',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
