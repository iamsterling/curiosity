#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: build-journal-ios.sh <aarch64-apple-ios|aarch64-apple-ios-sim> <output-library>" >&2
  exit 64
fi

rust_target="$1"
output_library="$2"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
runtime_root="$(cd "${script_dir}/.." && pwd)"
rust_root="${runtime_root}/native"
cargo="${CARGO:-$(command -v cargo || true)}"

case "${rust_target}" in
  aarch64-apple-ios) apple_sdk="iphoneos" ;;
  aarch64-apple-ios-sim) apple_sdk="iphonesimulator" ;;
  *)
    echo "unsupported Rust target: ${rust_target}" >&2
    exit 65
    ;;
esac

if [[ -z "${cargo}" || ! -x "${cargo}" ]]; then
  cargo="${HOME:-}/.cargo/bin/cargo"
fi
if [[ ! -x "${cargo}" ]]; then
  echo "cargo executable not found" >&2
  exit 69
fi

export SDKROOT="$(xcrun --sdk "${apple_sdk}" --show-sdk-path)"
export IPHONEOS_DEPLOYMENT_TARGET="${IPHONEOS_DEPLOYMENT_TARGET:-16.4}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-${rust_root}/target}"

cd "${rust_root}"
"${cargo}" build \
  --locked \
  --manifest-path "${rust_root}/Cargo.toml" \
  --target "${rust_target}" \
  --release

built_library="${CARGO_TARGET_DIR}/${rust_target}/release/libcuriosity_journal_native.a"
if [[ ! -f "${built_library}" ]]; then
  echo "journal static library was not produced: ${built_library}" >&2
  exit 66
fi

mkdir -p "$(dirname "${output_library}")"
cp "${built_library}" "${output_library}"
