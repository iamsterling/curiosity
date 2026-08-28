# Multi-zone platform

## Purpose

Defines the serving topology and auth boundary above the editor: a blank
base app owning the domain's path table, peer zones (marketing, docs, admin,
editor) each owning a disjoint path set with an `assetPrefix`, an auth layer
(better-auth, shared configuration in `packages/auth`, conditional on
deployment mode) whose session is valid across all zones on the domain, and
a deployment contract that ships the whole product as one self-contained
artifact on Dokploy. The editor kernel, document schema, renderer protocol
and React-boundary conventions are out of scope and must not change.

## ADDED Requirements

### Requirement: The domain is owned by a blank base app with a rewrite table

An `apps/base` app SHALL exist as the entry point of the domain. It SHALL
own no product logic: no scene-store reads, no editor wiring, no auth
handlers. Its `next.config` SHALL declare `beforeFiles` rewrites routing
every zone path set to the zone's URL, where each destination SHALL be taken
from an environment variable (`ZONE_MARKETING_URL`, `ZONE_DOCS_URL` if
separate, `ZONE_ADMIN_URL`, `ZONE_EDITOR_URL`) with loopback defaults.
Unmatched paths SHALL 404. The base app SHALL expose exactly one route of
its own: `GET /api/health`.

#### Scenario: The base app routes by the zone table

- **GIVEN** `ZONE_EDITOR_URL=http://127.0.0.1:4175` and
  `ZONE_ADMIN_URL=http://127.0.0.1:4174`
- **WHEN** a request arrives for `/files/demo`
- **THEN** it is rewritten to `http://127.0.0.1:4175/files/demo`
- **AND** a request for `/admin` is rewritten to `http://127.0.0.1:4174/admin`
- **AND** a request for `/unknown-path` returns 404

#### Scenario: The health endpoint reports the serving status

- **WHEN** `GET /api/health` is requested on the base app
- **THEN** the response is 200 with a machine-readable status body

### Requirement: Each zone owns a disjoint path set and prefixed assets

Every zone SHALL own a path set disjoint from every other zone's: marketing
owns `/` and `/docs/*`, admin owns `/admin/*`, the editor zone owns
`/files/*` and `/api/*`. Every zone other than the default owner of `/`
SHALL set `assetPrefix` to a zone-unique prefix. Cross-zone links SHALL be
plain anchors; no zone SHALL use `next/link` across a zone boundary. The
editor zone SHALL move its file browser from `/` to `/files`; the old `/`
route SHALL be removed from it.

#### Scenario: The editor zone owns the whole editor flow

- **WHEN** a user navigates from the file browser to an editor page
- **THEN** both pages are served by the editor zone (`/files` and
  `/files/<slug>`), so the navigation is a soft navigation within the zone
- **AND** the scene API (`/api/files/<slug>/document`) is served by the same
  zone

### Requirement: Auth is provided by better-auth under a shared configuration

A `packages/auth` package SHALL exist exporting a better-auth configuration
factory: the database adapter, the secret, session options and the mode
gate. The mode gate SHALL read `CRAFTY_AUTH_MODE`; when the mode is not
`on`, no database connection SHALL be opened, the auth API SHALL respond
404, and session guards SHALL pass — the local faces' behavior is
unchanged. When the mode is `on`, sessions SHALL be required for the admin
zone and the editor zone, and SHALL NOT be required for marketing paths.

#### Scenario: Deployed mode requires a session for protected zones

- **GIVEN** `CRAFTY_AUTH_MODE=on`, a valid database and secret
- **WHEN** an unauthenticated request reaches `/admin` or
  `/files/<slug>`
- **THEN** the request is redirected to the editor zone's sign-in
- **AND** an authenticated request passes, with the session validated
  against the database on the server

#### Scenario: Local mode behaves exactly as today

- **GIVEN** `CRAFTY_AUTH_MODE` unset
- **WHEN** any request reaches `/files/<slug>` or `/admin`
- **THEN** no authentication is performed and no database is contacted

### Requirement: The editor zone hosts the domain's only auth API

The editor zone SHALL mount the better-auth handler at `/api/auth/*` with
the `nextCookies` plugin; no other zone SHALL mount auth routes. Zones
needing session validation SHALL use `auth.api.getSession` against the
shared configuration. The admin zone SHALL additionally mount the
better-auth admin plugin for user and session management, and SHALL guard
its routes by session check in the layout.

#### Scenario: A session issued by the editor zone is valid in the admin zone

- **WHEN** a user signs in on the editor zone
- **THEN** the session cookie is set for the domain
- **AND** the admin zone's layout validates the same cookie against the
  shared database and admits the user

### Requirement: The distribution ships all zones behind one launcher

The bundle SHALL produce a `dist/` containing the base, admin and editor
standalone servers, the static marketing output, the CLI, the workspace
packages and the bundled bun runtime. The launcher SHALL support a
supervisor mode that spawns each zone on its env-configured loopback port,
waits for readiness, and shuts all zones down on signal — the existing
single-server launch pattern generalised. The launcher SHALL support an
HTTP mode (`--http`) that binds `0.0.0.0` without the TLS terminator, for
running behind a reverse proxy.

#### Scenario: The serve face serves every zone from one artifact

- **WHEN** `./dist/crafty serve --http` runs outside the repository
- **THEN** `/` and `/docs/*` are served by the base app's static content,
  `/files/<slug>` and the scene API by the editor zone, and `/admin` by the
  admin zone

### Requirement: The Dokploy stack deploys the whole product as one unit

The repository SHALL contain a `deploy/` directory with the Dockerfile,
environment contract and README for Dokploy: a multi-stage image that builds
the bundle in-image (including the Rust toolchain and wasm-bindgen at the
locked version) and runs the launcher in HTTP mode; a managed PostgreSQL
service for the auth tables; a persistent volume for the scene data
directory; auth SQL applied at container start before the launcher spawns
zones; and a healthcheck against the base app's `/api/health`.

#### Scenario: The deployed stack persists scenes and sessions

- **WHEN** the Dokploy application restarts
- **THEN** scene files and revisions survive via the data volume
- **AND** the auth database survives via the managed PostgreSQL service
- **AND** the application comes up healthy behind the domain with TLS
