# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-06-07

### Added
- Local pretty-printing destination (`PrettyDestination`) that runs in-process
  whenever `FUNCTIONS_EMULATOR` / `FIRESTORE_EMULATOR_HOST` /
  `FIREBASE_EMULATOR_HUB` is set, or `LOG_LOCAL=true` is set explicitly.
  Replaces `pino-pretty`'s worker-thread transport in local mode so dedupe
  state can live across records.
- Identity-aware header that auto-shows the inbound HTTP route
  (`METHOD path`) by reading `httpRequest` injected from `setHttpLabels`.
  No callsite changes needed in consumers.
- Strict per-route message dedupe — identical `{level, source, route, msg}`
  records inside a 2s window collapse to a single line plus a
  `↳ repeated ×N more in Xs` summary.
- Environment knobs for shaping local output:
  - `LOG_LOCAL=true|false` — force pretty mode on/off
  - `LOG_LEVEL=info|debug|…` — pino level for the local stream (default `info`)
  - `LOG_MUTE_SOURCES=a,b,c` — drop records whose `source` or `label` matches
  - `LOG_SILENCE_PATTERNS=re1,re2` — drop records whose `msg` matches any regex
- Idempotent suppression of gRPC + Firestore stdout chatter via
  `GRPC_VERBOSITY=NONE`, `GRPC_TRACE=''`, `FIRESTORE_LOG_LEVEL=error` —
  only set when not already defined, and only when running locally.
- Stack-frame cleaning that drops `node_modules/` and `node:internal/`
  frames from error stacks, with a `… N frames omitted` summary.
- Depth / length / key-count truncation for huge payloads
  (e.g. `requestHeaders` from `getRequestAsLogEntryFields`).
- Production invariant tests in
  `src/__tests__/productionInvariants.unit.test.ts` — fail loudly if any
  local-mode code path ever leaks into the production execution path.
- Operator-facing reference doc: `local-logging.md`.
- Top-level `README.md` with quick-start, API surface, and the
  production/local format split documented.

### Changed
- `PineLogger` constructor no longer overwrites the gcpLogOptions-configured
  logger with a default `pino()` instance. Effect in production: startup
  logs emitted between the constructor and the first `set*` call are now
  properly GCP-formatted instead of bare pino JSON.
- `PineLogger.setEnabled()` now rebuilds the underlying pino logger so the
  level (`silent` ↔ `info`/`debug`) actually changes when the flag flips.
  Previously the underlying pino kept the level it was constructed with.
- `tsconfig.json`: added `skipLibCheck: true` to insulate the build from
  unrelated type drift in dev-dep declarations.

### Fixed
- Production startup logs were emitted as bare pino JSON without
  `severity`, `message`, or label injection — Cloud Logging would render
  them with degraded structure. They now flow through `gcpLogOptions` from
  process start, as originally intended.

## [1.1.10] - prior

Last version published from the lost machine. Recovered from the published
npm `dist/` (commit `da48978`) — source-level annotations and code comments
that existed before publication were lost in the recovery and have not yet
been restored. See `tasks.md`.

## [1.1.4] and earlier

Historical baselines tracked in git. The git repository was out of sync with
the npm registry between `1.1.4` and `1.1.10` due to data loss on the machine
where `1.1.5`–`1.1.10` were published.

[Unreleased]: https://github.com/CertiCraft/logging/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/CertiCraft/logging/releases/tag/v1.2.0
