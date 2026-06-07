"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrettyDestination = void 0;
const stream_1 = require("stream");
const stripStackFrames_1 = require("./stripStackFrames");
const truncate_1 = require("./truncate");
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';
const MAGENTA = '\x1b[35m';
const LEVEL_INFO = {
    60: { name: 'FATAL', color: MAGENTA + BOLD },
    50: { name: 'ERROR', color: RED + BOLD },
    40: { name: 'WARN ', color: YELLOW },
    30: { name: 'INFO ', color: GREEN },
    20: { name: 'DEBUG', color: GRAY },
    10: { name: 'TRACE', color: DIM + GRAY }
};
// Pino's reserved fields — never shown as "extras"
const PINO_RESERVED = new Set(['level', 'time', 'pid', 'hostname', 'v', 'msg']);
// Fields we render explicitly in the header or err block
const HANDLED_ELSEWHERE = new Set([
    'err',
    'error',
    'message',
    'description',
    'source',
    'label',
    'labels',
    'companyId',
    'userId',
    'requestId',
    'stack',
    'httpRequest', // injected by PineLogger localMixin from setHttpLabels
    'loggerName' // injected by PineLogger localMixin from setLoggerName
]);
/**
 * Pino-targeted in-process destination. Consumes pino's newline-delimited
 * JSON, drops/dedupes noisy records, and prints a colorised single-line-
 * with-details format. State (dedupe map) lives in-process — that's only
 * possible because this isn't a pino transport worker thread.
 */
class PrettyDestination extends stream_1.Writable {
    constructor(options = {}) {
        super();
        this.dedupeMap = new Map();
        this.buffer = '';
        this.muteSources = new Set(options.muteSources ?? []);
        this.silencePatterns = (options.silencePatterns ?? []).map(p => new RegExp(p));
        this.dedupeWindowMs = options.dedupeWindowMs ?? 2000;
        this.useColor = options.color ?? Boolean(process.stdout.isTTY);
        this.truncOpts = {
            maxDepth: options.maxDepth,
            maxStringLength: options.maxStringLength,
            maxArrayLength: options.maxArrayLength,
            maxObjectKeys: options.maxObjectKeys
        };
        this.out = options.out ?? process.stdout;
    }
    c(code, text) {
        return this.useColor ? `${code}${text}${RESET}` : text;
    }
    _write(chunk, _enc, cb) {
        this.buffer += chunk.toString();
        let idx;
        while ((idx = this.buffer.indexOf('\n')) !== -1) {
            const line = this.buffer.slice(0, idx);
            this.buffer = this.buffer.slice(idx + 1);
            if (!line.trim())
                continue;
            try {
                this.handleRecord(JSON.parse(line));
            }
            catch {
                // Not JSON — likely a stray console write. Pass through.
                this.out.write(line + '\n');
            }
        }
        cb();
    }
    _final(cb) {
        for (const key of Array.from(this.dedupeMap.keys())) {
            this.flushDedupe(key);
        }
        cb();
    }
    handleRecord(rec) {
        const source = this.pickSource(rec);
        if (source && this.muteSources.has(source))
            return;
        // Header text priority: explicit msg arg > human-readable description >
        // the (often technical) message field. Matches the EventStoreService
        // pattern where description is the summary and message mirrors error.message.
        const msg = rec.msg || rec.description || rec.message || '';
        if (this.silencePatterns.some(p => p.test(msg)))
            return;
        // Include the request route in the dedupe key — two requests on
        // different routes both logging "Request received" are different events
        // and shouldn't collapse together.
        const routeKey = rec.httpRequest && typeof rec.httpRequest === 'object'
            ? `${rec.httpRequest.requestMethod ?? ''}|${rec.httpRequest.requestPath ?? rec.httpRequest.requestUrl ?? ''}`
            : '';
        const key = `${rec.level}|${source ?? ''}|${routeKey}|${msg}`;
        const existing = this.dedupeMap.get(key);
        if (existing) {
            existing.count += 1;
            return;
        }
        this.out.write(this.formatRecord(rec, source, msg));
        const timer = setTimeout(() => this.flushDedupe(key), this.dedupeWindowMs);
        timer.unref();
        this.dedupeMap.set(key, { count: 1, firstSeen: Date.now(), timer });
    }
    flushDedupe(key) {
        const entry = this.dedupeMap.get(key);
        if (!entry)
            return;
        this.dedupeMap.delete(key);
        clearTimeout(entry.timer);
        if (entry.count > 1) {
            const elapsed = ((Date.now() - entry.firstSeen) / 1000).toFixed(1);
            const more = entry.count - 1;
            this.out.write(this.c(GRAY, `         ↳ repeated ×${more} more in ${elapsed}s`) + '\n');
        }
    }
    pickSource(rec) {
        if (typeof rec.source === 'string')
            return rec.source;
        if (typeof rec.label === 'string')
            return rec.label;
        return undefined;
    }
    /**
     * Builds the inbound-request context tag (e.g. `GET /api/v1/getViewModel`)
     * from `httpRequest` labels injected by PineLogger.localMixin. Returns ''
     * when not in a request scope. Long paths are truncated to keep the header
     * scannable.
     */
    pickRequestTag(rec) {
        const h = rec.httpRequest;
        if (!h || typeof h !== 'object')
            return '';
        const method = typeof h.requestMethod === 'string' ? h.requestMethod : undefined;
        const path = typeof h.requestPath === 'string'
            ? h.requestPath
            : typeof h.requestUrl === 'string'
                ? h.requestUrl
                : undefined;
        if (!method && !path)
            return '';
        const shortPath = path && path.length > 40 ? path.slice(0, 37) + '…' : path ?? '';
        const text = [method, shortPath].filter(Boolean).join(' ');
        return this.c(MAGENTA, text);
    }
    pickIdentityChip(rec) {
        // companyId / userId are intentionally NOT rendered here — they're set
        // per-request by middleware and would repeat on every line, polluting
        // the local view. They remain in HANDLED_ELSEWHERE so they don't
        // double-render as extras either; they're silent context.
        const requestId = typeof rec.requestId === 'string' ? rec.requestId : undefined;
        if (!requestId)
            return '';
        return this.c(GRAY, `req=${this.shortenId(requestId)}`);
    }
    shortenId(id) {
        if (id.length <= 24)
            return id;
        return id.slice(0, 10) + '…' + id.slice(-6);
    }
    formatRecord(rec, source, msg) {
        const t = typeof rec.time === 'number' ? new Date(rec.time) : new Date();
        const time = t.toISOString().slice(11, 23);
        const info = LEVEL_INFO[rec.level] ?? {
            name: String(rec.level),
            color: ''
        };
        const sourceTag = source ? this.c(CYAN, `[${source}]`) + ' ' : '';
        const requestTag = this.pickRequestTag(rec);
        const requestPrefix = requestTag ? requestTag + ' ' : '';
        const chip = this.pickIdentityChip(rec);
        const chipSuffix = chip ? '  ' + chip : '';
        // Quote the message so the boundary between metadata (time/level/source)
        // and content is visually unambiguous. Skip quotes when msg is empty —
        // happens on error-only payloads with no human label.
        const quotedMsg = msg ? `"${msg}"` : '';
        const header = this.c(GRAY, `[${time}]:`) +
            ' ' +
            this.c(info.color, info.name.trim()) +
            ' ' +
            requestPrefix +
            sourceTag +
            quotedMsg +
            chipSuffix;
        const body = this.formatBody(rec, msg);
        return header + body + '\n';
    }
    formatBody(rec, msg) {
        const lines = [];
        const errBlock = this.extractErrShape(rec);
        if (errBlock) {
            const code = errBlock.code ? ` (${errBlock.code})` : '';
            const errMsg = errBlock.message && errBlock.message !== msg ? errBlock.message : '';
            const head = errMsg
                ? `  ✖ ${errMsg}${code}`
                : code
                    ? `  ✖${code}`
                    : '';
            if (head)
                lines.push(this.c(RED, head));
            if (typeof errBlock.stack === 'string') {
                const cleaned = (0, stripStackFrames_1.stripStackFrames)(errBlock.stack);
                for (const sLine of cleaned.split('\n').slice(1)) {
                    lines.push(this.c(GRAY, '    ' + sLine.trim()));
                }
            }
            if (Array.isArray(errBlock.errors) && errBlock.errors.length > 0) {
                const codes = errBlock.errors
                    .map(e => e?.code)
                    .filter((x) => Boolean(x));
                if (codes.length > 0) {
                    lines.push(this.c(GRAY, `    aggregated: ${codes.join(', ')}`));
                }
            }
        }
        const extras = {};
        for (const [k, v] of Object.entries(rec)) {
            if (PINO_RESERVED.has(k) || HANDLED_ELSEWHERE.has(k))
                continue;
            if (v === undefined || v === null)
                continue;
            if (Array.isArray(v) && v.length === 0)
                continue;
            if (typeof v === 'object' &&
                !Array.isArray(v) &&
                Object.keys(v).length === 0) {
                continue;
            }
            extras[k] = (0, truncate_1.truncate)(v, this.truncOpts);
        }
        // Surface labels.* beyond companyId/userId (e.g. http labels from setHttpLabels)
        if (rec.labels && typeof rec.labels === 'object') {
            const remainingLabels = {};
            for (const [k, v] of Object.entries(rec.labels)) {
                if (k === 'companyId' || k === 'userId')
                    continue;
                remainingLabels[k] = v;
            }
            if (Object.keys(remainingLabels).length > 0) {
                extras.labels = (0, truncate_1.truncate)(remainingLabels, this.truncOpts);
            }
        }
        if (Object.keys(extras).length > 0) {
            const compact = JSON.stringify(extras);
            if (compact.length <= 120) {
                lines.push(this.c(DIM, '  ' + compact));
            }
            else {
                const pretty = JSON.stringify(extras, null, 2).split('\n');
                for (const pl of pretty)
                    lines.push(this.c(DIM, '  ' + pl));
            }
        }
        return lines.length ? '\n' + lines.join('\n') : '';
    }
    /**
     * Normalises the variety of error shapes the s2sWebApi codebase logs:
     *   - pino-standard:    { err: { message, stack, code, errors } }
     *   - top-level object: { error: { message, stack, ... }, ... }
     *   - top-level scalars (EventStoreService): { error, stack, message }
     */
    extractErrShape(rec) {
        if (rec.err && typeof rec.err === 'object') {
            const e = rec.err;
            if (!e.stack && typeof rec.stack === 'string') {
                return { ...e, stack: rec.stack };
            }
            return e;
        }
        if (rec.error && typeof rec.error === 'object') {
            const e = rec.error;
            // EventStoreService pattern: { error: { message, code }, stack: '...' }
            // — the stack is a sibling of error, not nested. Splice it in so we
            // render a single coherent error block.
            if (!e.stack && typeof rec.stack === 'string') {
                return { ...e, stack: rec.stack };
            }
            return e;
        }
        if (typeof rec.error === 'string' || typeof rec.stack === 'string') {
            return {
                message: typeof rec.error === 'string'
                    ? rec.error
                    : typeof rec.message === 'string'
                        ? rec.message
                        : undefined,
                stack: typeof rec.stack === 'string' ? rec.stack : undefined
            };
        }
        return undefined;
    }
}
exports.PrettyDestination = PrettyDestination;
