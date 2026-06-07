# `@certicraft/logging`

The standardised logger used across CertiCraft's backend services. Same shape, same format, same env knobs — whether you're running `s2sWebApi`, the message queue, or anything else that lands in our infra.

> **Why this package exists.** Logging started as `s2sWebApi/src/libraries_v2/logging` inside the [`s2sBackend`](https://github.com/CertiCraft/s2sBackend/tree/integration/s2sWebApi/src/libraries_v2/logging) monorepo. When the message queue was carved out into its own service, copy-pasting the lib would have meant two logging shapes drifting apart over time. Instead it became this package — one source of truth for how logs look in production (GCP Cloud Logging) and how they read locally during development.

---

## Install

```bash
npm install @certicraft/logging
```

## Quick start

```typescript
import { CloudLogger } from '@certicraft/logging';

// Once, at process startup:
CloudLogger.setEnabled(true);

// Inside your HTTP middleware (per request):
CloudLogger.setLoggerName(process.env.FUNCTION_NAME ?? 'unknown');
CloudLogger.setLabels({ companyId, userId });
CloudLogger.setHttpLabels({
  requestMethod: req.method,
  requestPath:   req.path,
  requestUrl:    req.url,
  remoteIp:      req.ip,
  requestHeaders: req.headers,
});

// Anywhere in the request flow:
CloudLogger.info({ requestId }, 'Request received');
CloudLogger.error({ error, description: 'Lookup failed' });
```

That's the whole surface for the common case. The logger is a process-singleton — no `new`, no per-request instances. Context set via `setLabels`/`setHttpLabels` is injected into every subsequent log call until the next set.

## API surface

### Logging

| Call | Use |
|---|---|
| `CloudLogger.info(payload, msg?)` | Routine event |
| `CloudLogger.warn(payload, msg?)` | Notable but non-failure |
| `CloudLogger.error(payload, msg?)` | Failure |
| `CloudLogger.debug(payload, msg?)` | Verbose, only emitted at `debug` level |

`payload` is a plain object — `companyId`, `userId`, `requestId`, `error`, `err`, `description`, `message`, plus anything domain-specific. `msg` is the optional human-readable header string.

You can also pass a bare string (`CloudLogger.info('something happened')`) — it becomes the message with no payload.

### Setup / context

| Call | Use |
|---|---|
| `CloudLogger.setEnabled(true)` | Required once at startup. Until called, the logger is silent. |
| `CloudLogger.setLoggerName(name)` | GCP logName / function name. Usually `FUNCTION_NAME`. |
| `CloudLogger.setLabels({...})` | Top-level labels merged into every record (e.g. `companyId`, `userId`). |
| `CloudLogger.setHttpLabels({...})` | HTTP request context (method, path, url, ip, headers, latency). |
| `CloudLogger.setContext({...})` | GCP `serviceContext` for error reporting. |

### Timing / instrumentation

A lightweight time-series API for ad-hoc performance checks. **Treat this as a stopgap** — when we standardise on OpenTelemetry the right move will be `@opentelemetry/api` spans, not these calls.

| Call | Use |
|---|---|
| `CloudLogger.time(label)` | Start a labelled timer |
| `CloudLogger.timeLog(label, ...args)` | Mark an intermediate point with optional args |
| `CloudLogger.timeEnd(label)` | Stop, log the duration and all the marked points |
| `CloudLogger.stopwatchStart(label)` / `stopwatchStop(label)` | Cumulative stopwatch — start/stop pairs accumulate across calls |
| `CloudLogger.stopwatchGetInfo(label)` | Log the running total + call count + average |
| `CloudLogger.flush()` | Emit a summary of all active timers + stopwatches |

### Serialisation helpers

| Call | Use |
|---|---|
| `getRequestAsLogEntryFields(req)` | Turns an Express `Request` into `{requestHeaders, requestPath, requestQuery}` with `authorization` redacted |
| `convertFSAToLogEntryField(fsa)` | Safely serialises a Flux Standard Action (CQRS command) for logging |

## Production vs local behaviour

The same code emits two completely different formats depending on where it runs.

### Production (`NODE_ENV=production`)

Records ship to Google Cloud Logging via `gcpLogOptions` (`pino-cloud-logging`). Output looks like:

```json
{"severity":"INFO","time":1780861800095,"logging.googleapis.com/labels":{"companyId":"X"},"httpRequest":{"requestMethod":"GET","requestPath":"/"},"message":"hello"}
```

### Local (firebase emulator or `LOG_LOCAL=true`)

Records render through a custom in-process destination — colourised single line per record, automatic dedupe for storms, automatic request-route tag pulled from `setHttpLabels`:

```
[19:50:00.105]: INFO GET /api/v1/getViewModel "Request received"
[19:50:00.106]: INFO GET /api/v1/getViewModel [HTTP_CLIENT] "Calling upstream"  req=out-1
[19:50:00.107]: ERROR GET /api/v1/getViewModel "Falling back to default tenant config"
  ✖ tenant config not found (NOT_FOUND)
```

For local-mode env knobs (`LOG_LEVEL`, `LOG_MUTE_SOURCES`, `LOG_SILENCE_PATTERNS`, recipes for muting emulator chatter, etc.) see **[local-logging.md](./local-logging.md)**.

## Versioning & changes

See **[CHANGELOG.md](./CHANGELOG.md)** for the version history. Outstanding work is tracked in **[tasks.md](./tasks.md)**.

## Safety guarantees

The local-rendering code is fully gated — it is structurally impossible for it to execute when `NODE_ENV=production`. This is asserted by `src/__tests__/productionInvariants.unit.test.ts`, which fails CI if anyone accidentally lets local code leak into the production path.
