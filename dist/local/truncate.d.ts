export type TruncateOptions = {
    maxDepth: number;
    maxStringLength: number;
    maxArrayLength: number;
    maxObjectKeys: number;
};
/**
 * Recursively shrinks values for human display: long strings get clipped,
 * arrays/objects past a depth budget collapse to a placeholder, and any
 * `.stack` string is run through stripStackFrames first.
 */
export declare const truncate: (value: unknown, opts?: Partial<TruncateOptions>, depth?: number) => unknown;
