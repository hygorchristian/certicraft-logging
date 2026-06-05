export default function toPlainJson(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): any {
  // Handle primitives and functions (which cannot be serialized)
  if (
    value === null ||
    typeof value !== 'object' ||
    typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    return value;
  }

  // Handle BigInt (since JSON.stringify cannot serialize BigInt)
  if (typeof value === 'bigint') {
    // @ts-expect-error
    return value.toString();
  }

  // Handle circular references
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  // Handle Error objects
  if (value instanceof Error) {
    // @ts-expect-error
    if (value.hasOwnProperty('toJSON') && typeof value.toJSON === 'function') {
      // @ts-expect-error
      return value.toJSON();
    }
    const error: Record<string, any> = {};
    Object.getOwnPropertyNames(value).forEach((key: string) => {
      const val = (value as any)[key];
      error[key] = toPlainJson(val, seen);
    });
    return error;
  }

  // Handle Dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return value.toString();
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(item => toPlainJson(item, seen));
  }

  // Handle plain Objects and custom class instances
  if (typeof value === 'object') {
    const obj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      obj[key] = toPlainJson(val, seen);
    }
    return obj;
  }

  // For any other cases, return the value as is
  return value;
}
