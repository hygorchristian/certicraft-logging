# Local Logging — Filtering & Format Reference

How `@certicraft/logging` renders logs when running locally (firebase
emulator or `LOG_LOCAL=true`), and the env knobs to filter noise.

Production behaviour is **unchanged** by anything in this document — the
local code path is gated behind `FUNCTIONS_EMULATOR` / `FIRESTORE_EMULATOR_HOST`
/ `FIREBASE_EMULATOR_HUB` / `LOG_LOCAL=true`. In any other environment,
records ship to Google Cloud Logging exactly as before via `gcpLogOptions`.
That gate is asserted by `src/__tests__/productionInvariants.unit.test.ts`.

---

## 1. Quick start

In your consumer project (e.g. `s2sWebApi`), add to `.env.local`:

```bash
# Drop record floods you don't care about (regex; comma-separated).
LOG_SILENCE_PATTERNS=^Request completed in,not found in the cache

# Mute entire log "categories" by their `source` or `label` field.
LOG_MUTE_SOURCES=redis-client-error-handler

# Bump verbosity when you actually need it (default is info).
# LOG_LEVEL=debug

# Force pretty mode even outside the firebase emulator
# (e.g. when running `node lib/index.js` directly).
# LOG_LOCAL=true
```

Restart the emulator. That's it.

---

## 2. What you get

A typical render looks like:

```
[15:26:59.052]: INFO "createGovernmentReportModelCaches - START"
[15:26:59.052]: INFO GET /api/v1/getViewModel "Request received"
[15:26:59.052]: INFO GET /api/v1/getViewModel [HTTP_CLIENT] "Calling upstream tenant config"  req=out-1
[15:26:59.052]: ERROR GET /api/v1/getViewModel "Falling back to default tenant config"
  ✖ tenant config not found (NOT_FOUND)
[15:26:59.052]: INFO GET /api/v1/getViewModel "Request completed in 1176.20ms"
[15:26:59.281]: ERROR [redis-client-error-handler] "Redis client error"
  ✖ connect ECONNREFUSED (ECONNREFUSED)
    aggregated: ECONNREFUSED, ECONNREFUSED
         ↳ repeated ×46 more in 2.0s
```

Each part of the header line:

| Slot | Source | Notes |
|---|---|---|
| `[15:26:59.052]:` | pino `time` field | HH:MM:SS.mmm UTC |
| `INFO` / `ERROR` / `DEBUG` / `WARN` | pino `level` numeric → name | colourised when TTY |
| `GET /api/v1/getViewModel` | `httpRequest.requestMethod` + `requestPath` injected by PineLogger's local mixin from `setHttpLabels()` | only appears inside a request scope |
| `[HTTP_CLIENT]` | `source` or `label` field in your payload | optional category |
| `"…"` | the `msg` argument (or `description` or `message` from payload) | quoted for clear boundary |
| `req=…` | `requestId` field | only shown when explicitly set in payload |

Below the header (indented):
- A red `✖` line for the error block (`err.message (err.code)`)
- A cleaned stack trace with `node_modules/` and `node:internal/` frames stripped
- Any other payload fields rendered as a dim JSON tail
- A `↳ repeated ×N more in Xs` tail when an identical line was deduped

`companyId` and `userId` are *not* rendered on the header line — they'd repeat
on every line and pollute the view. They remain silent context (still
propagated in production, still hidden from extras locally).

---

## 3. Environment variables

| Var | Default | What it does |
|---|---|---|
| `LOG_LOCAL` | unset | `true` → force pretty mode on. `false` → force off. Otherwise auto-detect via emulator env vars. |
| `LOG_LEVEL` | `info` (when local) | Pino level: `trace` / `debug` / `info` / `warn` / `error` / `fatal` / `silent`. Records below this level are dropped before reaching the destination. |
| `LOG_MUTE_SOURCES` | empty | Comma-separated. Records whose top-level `source` **or** `label` equals one of these are dropped entirely. |
| `LOG_SILENCE_PATTERNS` | empty | Comma-separated regex patterns. Records whose `msg` matches **any** pattern are dropped entirely. Patterns are JS regex (escape `.`, `(`, etc.). |
| `GRPC_VERBOSITY` | set to `NONE` locally if unset | Silences gRPC's own stdout chatter (Firestore uses gRPC heavily). |
| `FIRESTORE_LOG_LEVEL` | set to `error` locally if unset | Silences firebase-admin's Firestore logger. |

All three of the suppression vars (`GRPC_VERBOSITY`, `GRPC_TRACE`, `FIRESTORE_LOG_LEVEL`) are only set by the lib if they aren't already defined — so a `GRPC_VERBOSITY=DEBUG` you set yourself wins.

---

## 4. Recipes

### Silence "Request completed in Xms" floods

These vary by milliseconds, so strict dedupe won't collapse them. Drop them entirely:

```bash
LOG_SILENCE_PATTERNS=^Request completed in
```

Combine multiple noise classes with commas:

```bash
LOG_SILENCE_PATTERNS=^Request completed in,not found in the cache,^ensureContainerDocumentsExist
```

### Mute all Redis-related chatter

The Redis client emits a flood of `Redis client error` / `Redis client reconnecting` lines during a connection storm. Mute the category:

```bash
LOG_MUTE_SOURCES=redis-client-error-handler
```

> **Note**: `LOG_MUTE_SOURCES` checks the `source` field OR the `label` field of the log payload. Most s2sWebApi code uses `label: 'HTTP_CLIENT'` etc. — both fields work as filters.

### Turn debug logging on temporarily

```bash
LOG_LEVEL=debug npm run start:serve
```

### Use pretty mode without the firebase emulator

```bash
LOG_LOCAL=true node lib/scripts/myScript.js
```

### Disable pretty mode even inside the emulator

```bash
LOG_LOCAL=false npm run start:serve
```

The library falls back to pino-pretty in a worker thread (the v1.1.10 default).

---

## 5. Silencing the **emulator's own** noise

The annoying lines that look like this come from the **firebase emulator
process itself**, not from this library:

```
i  functions: Loaded environment variables from .env, .env.rubikon-cbn-develop, .env.local.
⬢  functions: Unable to access secret environment variables from Google Cloud Secret Manager.
FirebaseError: Request to https://secretmanager.googleapis.com/v1/projects/... 403
⚠  Google API requested!
- URL: "https://oauth2.googleapis.com/token"
⚠  External network resource requested!
- URL: "http://169.254.169.254/computeMetadata/v1/instance/zone"
```

They can't be filtered with `LOG_*` env vars. Three levers:

### a) Stop the secret-manager 403 spam

Provide local fallbacks for the secrets in `s2sWebApi/.secret.local`:

```bash
REDIS_URL=redis://localhost:6379
MAILER_API_KEY=local-dummy
MEDICAL_SALES_PATIENT_CONSENT_HASH_SECRET=local-dummy
MESSAGE_QUEUE_WEBHOOKS_SECRET=local-dummy
```

The emulator only complains because the lookup fails — give it dummies, the loop stops.

### b) Keep `--log-verbosity QUIET` on the firebase CLI

Mutes emulator INFO/DEBUG output.

### c) Filter the residual warnings via shell pipe

For the `Google API requested!` and `External network resource requested!` warnings — these are wired into the emulator and don't have a flag. Pipe stderr through `grep`:

```json
// s2sWebApi/package.json
"scripts": {
  "start:serve": "cross-env NODE_OPTIONS='--max-old-space-size=1024' firebase emulators:start --only functions --log-verbosity QUIET 2>&1 | grep -vE '⚠  Google API requested!|⚠  External network resource requested!|- URL: \"https?://(oauth2\\.googleapis|169\\.254\\.169\\.254)|- Be careful, this may be a production service|Loaded environment variables from'"
}
```

If you ever need to debug an actual outbound call to a production service, drop the grep temporarily.

---

## 6. Format anatomy in detail

### How the header `msg` is chosen

Priority order:

1. Explicit 2nd argument to the log call: `CloudLogger.info({ ... }, 'this wins')`
2. `description` field in the payload (the most human-readable summary in the s2sWebApi codebase)
3. `message` field in the payload (often mirrors `error.message` — technical, not summary)
4. Empty string

Why this order? The `EventStoreService.ts` pattern is:

```typescript
CloudLogger.error({
  error,                                  // { message: 'boom', code: 'X' }
  message: error?.message,                // 'boom'
  stack: error?.stack,
  description: `Handler for ${type} failed`,  // human summary
});
```

`description` is the operator-facing message; `message` is the technical detail. Putting `description` first gives a more useful header.

### How the error block is built

The renderer treats these payload shapes as errors:

- `{ err: { message, stack, code, errors } }` — pino-standard
- `{ error: { message, stack, code } }` — common s2sWebApi shape
- `{ error: { message, code }, stack: '...' }` — EventStoreService shape (stack as sibling)
- `{ error: 'string', stack: 'string' }` — fully scattered

For all of them, you get:

```
  ✖ <error.message> (<error.code>)
    <user-code stack frame 1>
    <user-code stack frame 2>
    … N internal/node_modules frames omitted
    aggregated: ECONNREFUSED, ECONNREFUSED          ← if err.errors[] present
```

### Request route tag

When `setHttpLabels()` has been called (your per-request middleware), every subsequent log gets `METHOD path` inserted in the header automatically via PineLogger's local mixin. No callsite changes needed.

Long paths (`>40` chars) are truncated with an ellipsis to keep the header scannable.

### Dedupe behaviour

A record is considered a duplicate if its `level` + (`source` or `label`) + `METHOD path` + `msg` exactly matches a record seen in the last 2000ms. Subsequent duplicates are silently counted; when the window closes, a single trailing line summarises:

```
         ↳ repeated ×46 more in 2.0s
```

Including the route in the key means two requests on different paths both logging "Request received" stay as separate lines — they're semantically different events.

### Field truncation

Large payloads are clipped to keep lines scannable:

| Limit | Default | Behaviour past the limit |
|---|---|---|
| `maxDepth` | 3 | Nested objects become `[Object]`, arrays become `[Array(N)]` |
| `maxStringLength` | 500 | String becomes `value… [+N chars]` |
| `maxArrayLength` | 5 | Array adds a `… +N more` sentinel |
| `maxObjectKeys` | 8 | Object adds a `"…": "+N more keys"` sentinel |

These aren't env-tunable yet; if you need a knob, `PrettyDestination` accepts them as constructor options.

### Extras rendering

After header + error block, any remaining non-reserved fields are dumped as a dim JSON tail:
- Inline (single line) if the compact JSON is ≤ 120 chars
- Multi-line pretty-print otherwise

Empty arrays and empty objects are dropped from extras to reduce visual noise (e.g. `innerErrors: []` is hidden).

---

## 7. Troubleshooting

**Nothing renders locally even though logs are happening.**
Did you call `CloudLogger.setEnabled(true)` somewhere at startup? Without it, every `info/error/warn/debug` short-circuits before reaching the destination.

**Pretty mode isn't activating, I see raw JSON.**
Check that one of these is true:
- `process.env.FUNCTIONS_EMULATOR` is set (firebase emulator does this automatically)
- `LOG_LOCAL=true` is set in your env
- `NODE_ENV` is **not** `production`

**My silence pattern isn't matching.**
Patterns are regex, not literal strings. `^Request completed in` works. `Request completed in 1192ms` works too (it's a substring match — regex without anchors). But `(broken)` would error — escape parens: `\\(broken\\)`.

**I want to debug what the destination actually sees.**
Disable the destination temporarily with `LOG_LOCAL=false` — you'll get pino-pretty's worker-thread output and can inspect the record shape pino-pretty would receive.

**Stack traces still huge.**
The stack stripper only drops `/node_modules/` and `node:internal/` frames. If your own monorepo has noisy intermediate layers, the `NOISY_FRAME_PATTERNS` array in `src/local/stripStackFrames.ts` is the place to add patterns.
