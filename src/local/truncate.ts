import { stripStackFrames } from './stripStackFrames';

export type TruncateOptions = {
  maxDepth: number;
  maxStringLength: number;
  maxArrayLength: number;
  maxObjectKeys: number;
};

const DEFAULTS: TruncateOptions = {
  maxDepth: 3,
  maxStringLength: 500,
  maxArrayLength: 5,
  maxObjectKeys: 8
};

/**
 * Recursively shrinks values for human display: long strings get clipped,
 * arrays/objects past a depth budget collapse to a placeholder, and any
 * `.stack` string is run through stripStackFrames first.
 */
export const truncate = (
  value: unknown,
  opts: Partial<TruncateOptions> = {},
  depth = 0
): unknown => {
  const o: TruncateOptions = {
    maxDepth: opts.maxDepth ?? DEFAULTS.maxDepth,
    maxStringLength: opts.maxStringLength ?? DEFAULTS.maxStringLength,
    maxArrayLength: opts.maxArrayLength ?? DEFAULTS.maxArrayLength,
    maxObjectKeys: opts.maxObjectKeys ?? DEFAULTS.maxObjectKeys
  };
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length > o.maxStringLength) {
      const overflow = value.length - o.maxStringLength;
      return `${value.slice(0, o.maxStringLength)}… [+${overflow} chars]`;
    }
    return value;
  }
  if (typeof value !== 'object') return value;
  if (depth >= o.maxDepth) {
    if (Array.isArray(value)) return `[Array(${value.length})]`;
    return '[Object]';
  }
  if (Array.isArray(value)) {
    const sliced = value
      .slice(0, o.maxArrayLength)
      .map(v => truncate(v, opts, depth + 1));
    if (value.length > o.maxArrayLength) {
      sliced.push(`… +${value.length - o.maxArrayLength} more`);
    }
    return sliced;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const out: Record<string, unknown> = {};
  const visibleEntries = entries.slice(0, o.maxObjectKeys);
  for (const [k, v] of visibleEntries) {
    if (k === 'stack' && typeof v === 'string') {
      out[k] = stripStackFrames(v);
    } else {
      out[k] = truncate(v, opts, depth + 1);
    }
  }
  if (entries.length > o.maxObjectKeys) {
    out['…'] = `+${entries.length - o.maxObjectKeys} more keys`;
  }
  return out;
};
