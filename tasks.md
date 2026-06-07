# TODOs

Outstanding work for `@certicraft/logging`. Tick items off here as they land.

## Codebase hygiene

- [ ] **Restore source-level code comments and doc annotations** that were lost
  when v1.1.10 was reverse-engineered from the published npm JS after the
  machine-data loss. The compiled JS preserved behaviour but stripped every
  comment — re-add module/class/method docstrings, especially around the less
  obvious bits of `PineLogger`, `Config`, `TimerManager`, `StopwatchManager`,
  and the deprecated bunyan-based `CloudLogger`.

## Test coverage

- [ ] **Increase unit-test coverage across the package.** Current suite is
  thin (26 tests, most concentrated in `productionInvariants` and `toPlainJson`).
  Untested or under-tested:
  - `TimerManager.timeEnd` / `flush` formatting paths
  - `StopwatchManager` start / stop / getInfo / flush across edge cases
  - `convertFSAToLogEntryField` against malformed FSAs and RC internal errors
  - `getRequestAsLogEntryFields` against requests with missing fields
  - `PrettyDestination` dedupe-window edge cases, mute / silence pattern
    behaviour, error-shape extraction, stack-frame stripping
  - `PineLogger.localMixin` output shape under all combinations of
    `setLabels` / `setHttpLabels` / `setLoggerName`

- [ ] **Stress-test `PrettyDestination`** under heavy logging volume:
  - Storm of identical records (verify dedupe summary is emitted)
  - High-cardinality records (no leak in the dedupe map)
  - Records arriving across the `_final` boundary at process exit
  - Concurrent loggers writing to the same destination

## Future direction

- [ ] **Replace the custom Timer / Stopwatch managers with OpenTelemetry-based
  instrumentation** when we standardise on OTEL across the platform. The
  current API (`time` / `timeLog` / `timeEnd` / `stopwatchStart` / `stopwatchStop`)
  is a stopgap — proper spans give us distributed tracing, sampling, and
  vendor portability for free.
