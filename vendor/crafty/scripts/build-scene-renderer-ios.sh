#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: build-scene-renderer-ios.sh <aarch64-apple-ios|aarch64-apple-ios-sim> [output-library]" >&2
  exit 64
fi

rust_target="$1"
output_library="${2:-}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
crafty_root="$(cd "${script_dir}/.." && pwd)"
rust_root="${crafty_root}/packages/scene-renderer/rust"
cargo="${CARGO:-}"

if [[ -z "${cargo}" ]]; then
  cargo="$(command -v cargo || true)"
fi
if [[ -z "${cargo}" && -n "${HOME:-}" && -x "${HOME}/.cargo/bin/cargo" ]]; then
  cargo="${HOME}/.cargo/bin/cargo"
fi

case "${rust_target}" in
  aarch64-apple-ios)
    apple_sdk="iphoneos"
    ;;
  aarch64-apple-ios-sim)
    apple_sdk="iphonesimulator"
    ;;
  *)
    echo "unsupported Rust target: ${rust_target}" >&2
    exit 65
    ;;
esac

if [[ -z "${cargo}" || ! -x "${cargo}" ]]; then
  echo "cargo executable not found; set CARGO or install it on PATH" >&2
  exit 69
fi

export SDKROOT="$(xcrun --sdk "${apple_sdk}" --show-sdk-path)"
export IPHONEOS_DEPLOYMENT_TARGET="${IPHONEOS_DEPLOYMENT_TARGET:-16.4}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-${rust_root}/target}"

cd "${rust_root}"
"${cargo}" build \
  --locked \
  --manifest-path Cargo.toml \
  --package crafty-renderer-native-ffi \
  --target "${rust_target}" \
  --release

built_library="${CARGO_TARGET_DIR}/${rust_target}/release/libcrafty_renderer_native_ffi.a"
if [[ ! -f "${built_library}" ]]; then
  echo "renderer static library was not produced: ${built_library}" >&2
  exit 66
fi

if [[ -n "${output_library}" ]]; then
  mkdir -p "$(dirname "${output_library}")"
  cp "${built_library}" "${output_library}"
  built_library="${output_library}"
fi

echo "CRAFTY_RENDERER_IOS_LIBRARY=${built_library}"
