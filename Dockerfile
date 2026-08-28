# Crafty on Dokploy: one shared build, one image per zone.
#
# A single builder stage compiles the full artifact — the Rust toolchain, the
# wasm encoder, the marketing static, and all three zone standalones — once.
# Each zone is a runner target that copies only its own standalone out of the
# builder and knows nothing about the other zones. On one daemon the first
# zone build pays the toolchain + bundle; the other two reuse the cached
# builder layers and are pure copies.
#
#   docker build --target base   -t crafty-base   .   (public: /, /docs, rewrites)
#   docker build --target editor -t crafty-editor .   (internal: /editor, /api)
#   docker build --target admin  -t crafty-admin  .   (internal: /admin)
#   docker build --target dev    -t crafty-dev    .   (dev supervisor, no bundle)
#
# The wasm encoder is built from source, so the builder needs the pinned
# Rust toolchain (packages/scene-renderer/rust/rust-toolchain.toml) plus
# wasm-bindgen-cli at the version locked in Cargo.lock — the same recipe CI
# uses (.github/workflows/renderer.yml). Expect a slow first build; the
# runner images are small by comparison.

FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

COPY . .

# The Rust toolchain for the wasm encoder. rust-toolchain.toml pins the
# channel and installs the wasm32 target — one source of truth, same as CI.
# The toolchain is installed eagerly and made the default: a lazy install
# from an unrelated cwd would skip the declared targets (E0463: no core for
# wasm32-unknown-unknown). build-base provides the C toolchain (cc,
# musl-dev) that cargo's build scripts need on alpine; openssl is what the
# dev supervisor's certificate script shells out to.
RUN apk add --no-cache git python3 curl rustup build-base openssl \
  && rustup-init -y --no-modify-path >/dev/null \
  && export PATH="/root/.cargo/bin:$PATH" \
  && rustup toolchain install 1.97.1 --profile minimal --target wasm32-unknown-unknown \
  && rustup default 1.97.1
ENV PATH="/root/.cargo/bin:$PATH"

RUN bun install --frozen-lockfile

# wasm-bindgen CLI at the version locked in Cargo.lock (see CI for the recipe).
RUN VERSION=$(cargo metadata --format-version 1 --manifest-path packages/scene-renderer/rust/Cargo.toml \
      | python3 -c "import json,sys;print(next(p['version'] for p in json.load(sys.stdin)['packages'] if p['name']=='wasm-bindgen'))") \
  && cargo install wasm-bindgen-cli --version "$VERSION" --locked

# The full production artifact. The toolchain layers stay zone-agnostic: the
# zone URLs below are the only per-image inputs, and they must reach the
# bundle (the base zone's rewrites are evaluated into the routes manifest at
# build time, not at container boot). Only the base image needs them
# (internal Docker-network hostnames of the editor/admin services); the other
# images build with the loopback fallbacks baked in, which they never ship.
FROM deps AS bundle
ARG ZONE_EDITOR_URL=
ARG ZONE_ADMIN_URL=
ENV ZONE_EDITOR_URL=$ZONE_EDITOR_URL ZONE_ADMIN_URL=$ZONE_ADMIN_URL

RUN bun run bundle

# The zone targets build from `builder`; it is the bundle stage by another
# name, kept so the public targets above stay stable.
FROM bundle AS builder

# Dev: the same toolchain and dependencies as the bundle, minus the bundle
# itself. The dev supervisor (`bun run dev`, see scripts/dev-next.mjs) builds
# the shared packages and the wasm encoder on boot; the dev face bind-mounts
# the repo over this image — so source changes hot-reload and the image only
# needs rebuilding when the toolchain or dependencies change.
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 4173 4175 4176 4177
CMD ["sh", "-c", "cd /app && exec bun run dev"]

# Runners: each zone image is the shared runner base plus one zone's
# standalone copied out of the builder. The standalone expects its own
# directory as the working directory (public/, node_modules and the traced
# tree all resolve from there) and runs on the image's own Bun (the builder
# ran the same oven/bun base image, so the runtime matches what produced the
# bundle).
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CRAFTY_DATA_DIR=/data
EXPOSE 3000
CMD ["sh", "-c", "cd /app/zone/apps/web/* && exec bun server.js"]

FROM runner AS base
COPY --from=builder /app/dist/base ./zone
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:3000/api/health" >/dev/null || exit 1

FROM runner AS editor
COPY --from=builder /app/dist/web ./zone
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:3000/editor" >/dev/null || exit 1

FROM runner AS admin
COPY --from=builder /app/dist/admin ./zone
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:3000/" >/dev/null || exit 1
