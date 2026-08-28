#!/bin/sh
set -eu
exec env -i \
  PATH=/usr/local/bin:/usr/bin:/bin \
  HOME=/tmp/home \
  TMPDIR=/tmp \
  LANG=C.UTF-8 \
  HOSTNAME="${HOSTNAME:-capsule}" \
  CRAFTY_FONT_HARNESS_BOUNDARY_ATTESTATION=/capsule/attestation.json \
  /usr/local/bin/node /capsule/capsule-control.mjs "$@"
