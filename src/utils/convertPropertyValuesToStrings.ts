const isString = (v: unknown): v is string =>
  typeof v === 'string' || v instanceof String;

export default (
  input: Object,
  skipPropertyNames: string[] = [],
  rawPropertyNames: string[] = []
): Record<string, string> =>
  Object.entries(input || {}).reduce((acc, [k, v]) => {
    if (skipPropertyNames.includes(k)) return acc;
    acc[k] =
      isString(v) || rawPropertyNames.includes(k) ? v : JSON.stringify(v);
    return acc;
  }, {} as Record<string, string>);
