import { Writable } from 'stream';
import { TruncateOptions } from './truncate';
export type PrettyDestinationOptions = {
    /** Drops records whose `source` OR `label` field matches one of these. */
    muteSources?: string[];
    /** Regex strings; records whose msg matches any pattern are dropped entirely. */
    silencePatterns?: string[];
    /** Window in ms during which identical {level,source/label,msg} records collapse. */
    dedupeWindowMs?: number;
    color?: boolean;
    out?: NodeJS.WritableStream;
} & Partial<TruncateOptions>;
/**
 * Pino-targeted in-process destination. Consumes pino's newline-delimited
 * JSON, drops/dedupes noisy records, and prints a colorised single-line-
 * with-details format. State (dedupe map) lives in-process — that's only
 * possible because this isn't a pino transport worker thread.
 */
export declare class PrettyDestination extends Writable {
    private muteSources;
    private silencePatterns;
    private dedupeWindowMs;
    private dedupeMap;
    private useColor;
    private truncOpts;
    private out;
    private buffer;
    constructor(options?: PrettyDestinationOptions);
    private c;
    _write(chunk: Buffer | string, _enc: string, cb: (err?: Error | null) => void): void;
    _final(cb: (err?: Error | null) => void): void;
    private handleRecord;
    private flushDedupe;
    private pickSource;
    /**
     * Builds the inbound-request context tag (e.g. `GET /api/v1/getViewModel`)
     * from `httpRequest` labels injected by PineLogger.localMixin. Returns ''
     * when not in a request scope. Long paths are truncated to keep the header
     * scannable.
     */
    private pickRequestTag;
    private pickIdentityChip;
    private shortenId;
    private formatRecord;
    private formatBody;
    /**
     * Normalises the variety of error shapes the s2sWebApi codebase logs:
     *   - pino-standard:    { err: { message, stack, code, errors } }
     *   - top-level object: { error: { message, stack, ... }, ... }
     *   - top-level scalars (EventStoreService): { error, stack, message }
     */
    private extractErrShape;
}
