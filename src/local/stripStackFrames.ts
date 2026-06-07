const NOISY_FRAME_PATTERNS = [
  /\/node_modules\//,
  /\(node:internal\//,
  / at node:internal\//,
  /\(internal\/process\//
];

/**
 * Cleans an Error.stack string by dropping node_modules + Node.js internal
 * frames and keeping at most `maxUserFrames` of the caller's own code.
 */
export const stripStackFrames = (
  stack: string | undefined,
  maxUserFrames = 6
): string => {
  if (!stack) return '';
  const lines = stack.split('\n');
  const header = lines[0];
  const frames = lines.slice(1);
  const userFrames: string[] = [];
  let dropped = 0;
  for (const frame of frames) {
    if (NOISY_FRAME_PATTERNS.some(p => p.test(frame))) {
      dropped += 1;
      continue;
    }
    userFrames.push(frame);
    if (userFrames.length >= maxUserFrames) break;
  }
  const out = [header, ...userFrames];
  if (dropped > 0) {
    out.push(`    … ${dropped} internal/node_modules frames omitted`);
  }
  return out.join('\n');
};
