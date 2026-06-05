import { describe, expect, it } from 'vitest';
import toPlainJson from '../utils/toPlainJson';

describe('toPlainJson', () => {
  it('should return primitives as is', () => {
    expect(toPlainJson(42)).toBe(42);
    expect(toPlainJson('hello')).toBe('hello');
    expect(toPlainJson(true)).toBe(true);
    expect(toPlainJson(null)).toBeNull();
    expect(toPlainJson(undefined)).toBeUndefined();
  });

  it('should handle arrays', () => {
    const input = [1, 'two', true, null];
    const output = toPlainJson(input);
    expect(output).toEqual([1, 'two', true, null]);
  });

  it('should handle nested arrays', () => {
    const input = [1, [2, [3, [4]]]];
    const output = toPlainJson(input);
    expect(output).toEqual([1, [2, [3, [4]]]]);
  });

  it('should handle plain objects', () => {
    const input = { a: 1, b: 'two', c: true };
    const output = toPlainJson(input);
    expect(output).toEqual({ a: 1, b: 'two', c: true });
  });

  it('should handle nested objects', () => {
    const input = { a: { b: { c: { d: 4 } } } };
    const output = toPlainJson(input);
    expect(output).toEqual({ a: { b: { c: { d: 4 } } } });
  });

  it('should handle circular references', () => {
    const circularObj: any = {};
    circularObj.self = circularObj;
    const output = toPlainJson(circularObj);
    expect(output).toEqual({ self: '[Circular]' });
  });

  it('should handle objects with multiple circular references', () => {
    const obj: any = { name: 'test' };
    obj.self = obj;
    obj.child = { parent: obj };
    obj.array = [obj, obj];
    const output = toPlainJson(obj);
    expect(output).toEqual({
      name: 'test',
      self: '[Circular]',
      child: { parent: '[Circular]' },
      array: ['[Circular]', '[Circular]']
    });
  });

  it('should handle Error objects', () => {
    const error: any = new Error('Test error');
    error.code = 500;
    const output = toPlainJson(error);
    expect(output).toHaveProperty('message', 'Test error');
    expect(output).toHaveProperty('stack');
    expect(output).toHaveProperty('code', 500);
  });

  it('should handle nested Errors', () => {
    const error: any = new Error('Outer error');
    error.inner = new Error('Inner error');
    const output = toPlainJson(error);
    expect(output).toMatchObject({
      message: 'Outer error',
      inner: {
        message: 'Inner error',
        stack: expect.any(String)
      },
      stack: expect.any(String)
    });
  });

  it('should handle arrays with circular references', () => {
    const arr: any[] = [];
    arr.push(arr);
    const output = toPlainJson(arr);
    expect(output).toEqual(['[Circular]']);
  });

  it('should handle objects with Date and RegExp', () => {
    const input = {
      date: new Date('2021-01-01T00:00:00Z'),
      regex: /test/gi
    };
    const output = toPlainJson(input);
    expect(output).toEqual({
      date: '2021-01-01T00:00:00.000Z',
      regex: '/test/gi'
    });
  });

  it('should handle custom class instances', () => {
    class CustomClass {
      constructor(public value: string) {}
    }
    const instance = new CustomClass('test');
    const output = toPlainJson(instance);
    expect(output).toEqual({ value: 'test' });
  });

  it('should handle functions (should return as is)', () => {
    const fn = function testFunction() {};
    const output = toPlainJson(fn);
    expect(output).toBe(fn);
  });

  it('should handle symbols (should return as is)', () => {
    const sym = Symbol('test');
    const output = toPlainJson(sym);
    expect(output).toBe(sym);
  });

  it('should handle bigint (since JSON.stringify cannot handle it)', () => {
    const bigIntValue = BigInt(9007199254740991);
    const output = toPlainJson(bigIntValue);
    expect(output).toBe(bigIntValue);
  });
});
