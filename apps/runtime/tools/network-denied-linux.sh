#!/bin/sh
set -eu

if [ "$(uname -s)" != "Linux" ]; then
  printf '%s\n' 'RUNTIME_NETWORK_DENIED_LINUX_REQUIRED' >&2
  exit 1
fi

EXPECTED_RUST=1.97.1
command -v rustc >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_RUSTC_REQUIRED' >&2; exit 1; }
command -v cargo >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_CARGO_REQUIRED' >&2; exit 1; }
rustc_version=$(rustc --version | awk '{print $2}')
cargo_version=$(cargo --version | awk '{print $2}')
if [ "$rustc_version" != "$EXPECTED_RUST" ] || [ "$cargo_version" != "$EXPECTED_RUST" ]; then
  printf 'RUNTIME_RUST_PIN_MISMATCH:rustc=%s:cargo=%s:expected=%s\n' "$rustc_version" "$cargo_version" "$EXPECTED_RUST" >&2
  exit 1
fi

command -v sudo >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_SUDO_REQUIRED' >&2; exit 1; }
command -v unshare >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_UNSHARE_REQUIRED' >&2; exit 1; }
command -v ip >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_IP_REQUIRED' >&2; exit 1; }
sudo -n true >/dev/null 2>&1 || { printf '%s\n' 'RUNTIME_NETWORK_DENIED_SUDO_PREFLIGHT_FAILED' >&2; exit 1; }

runtime_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)
bun_path=$(command -v bun)
bun_directory=$(dirname -- "$bun_path")
profile_runner="$runtime_root/tools/run-test-profile.mjs"
network_home="${TMPDIR:-/tmp}/curiosity-network-denied-home-$$"
mkdir -m 700 "$network_home"
trap 'rm -rf "$network_home"' EXIT HUP INT TERM

(cd "$runtime_root" && cargo build --manifest-path native/Cargo.toml --locked)

if ! sudo -n unshare -n -- /bin/sh -eu -c '
  ip link set lo up
  cd "$1"
  exec env -i HOME="$2" LANG=C LC_ALL=C PATH="$5:/usr/bin:/bin" CURIOSITY_RUNTIME_NATIVE_PROFILE=development "$3" "$4" network-denied
' curiosity-network-denied "$runtime_root" "$network_home" "$bun_path" "$profile_runner" "$bun_directory"; then
  printf '%s\n' 'RUNTIME_NETWORK_DENIED_NAMESPACE_FAILED' >&2
  exit 1
fi

printf '%s\n' 'runtime Linux network-denied profile passed (namespace established; zero skipped)'
