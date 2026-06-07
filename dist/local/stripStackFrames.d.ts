/**
 * Cleans an Error.stack string by dropping node_modules + Node.js internal
 * frames and keeping at most `maxUserFrames` of the caller's own code.
 */
export declare const stripStackFrames: (stack: string | undefined, maxUserFrames?: number) => string;
