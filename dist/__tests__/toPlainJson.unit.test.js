"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const toPlainJson_1 = __importDefault(require("../utils/toPlainJson"));
(0, vitest_1.describe)('toPlainJson', () => {
    (0, vitest_1.it)('should return primitives as is', () => {
        (0, vitest_1.expect)((0, toPlainJson_1.default)(42)).toBe(42);
        (0, vitest_1.expect)((0, toPlainJson_1.default)('hello')).toBe('hello');
        (0, vitest_1.expect)((0, toPlainJson_1.default)(true)).toBe(true);
        (0, vitest_1.expect)((0, toPlainJson_1.default)(null)).toBeNull();
        (0, vitest_1.expect)((0, toPlainJson_1.default)(undefined)).toBeUndefined();
    });
    (0, vitest_1.it)('should handle arrays', () => {
        const input = [1, 'two', true, null];
        const output = (0, toPlainJson_1.default)(input);
        (0, vitest_1.expect)(output).toEqual([1, 'two', true, null]);
    });
    (0, vitest_1.it)('should handle nested arrays', () => {
        const input = [1, [2, [3, [4]]]];
        const output = (0, toPlainJson_1.default)(input);
        (0, vitest_1.expect)(output).toEqual([1, [2, [3, [4]]]]);
    });
    (0, vitest_1.it)('should handle plain objects', () => {
        const input = { a: 1, b: 'two', c: true };
        const output = (0, toPlainJson_1.default)(input);
        (0, vitest_1.expect)(output).toEqual({ a: 1, b: 'two', c: true });
    });
    (0, vitest_1.it)('should handle nested objects', () => {
        const input = { a: { b: { c: { d: 4 } } } };
        const output = (0, toPlainJson_1.default)(input);
        (0, vitest_1.expect)(output).toEqual({ a: { b: { c: { d: 4 } } } });
    });
    (0, vitest_1.it)('should handle circular references', () => {
        const circularObj = {};
        circularObj.self = circularObj;
        const output = (0, toPlainJson_1.default)(circularObj);
        (0, vitest_1.expect)(output).toEqual({ self: '[Circular]' });
    });
    (0, vitest_1.it)('should handle objects with multiple circular references', () => {
        const obj = { name: 'test' };
        obj.self = obj;
        obj.child = { parent: obj };
        obj.array = [obj, obj];
        const output = (0, toPlainJson_1.default)(obj);
        (0, vitest_1.expect)(output).toEqual({
            name: 'test',
            self: '[Circular]',
            child: { parent: '[Circular]' },
            array: ['[Circular]', '[Circular]']
        });
    });
    (0, vitest_1.it)('should handle Error objects', () => {
        const error = new Error('Test error');
        error.code = 500;
        const output = (0, toPlainJson_1.default)(error);
        (0, vitest_1.expect)(output).toHaveProperty('message', 'Test error');
        (0, vitest_1.expect)(output).toHaveProperty('stack');
        (0, vitest_1.expect)(output).toHaveProperty('code', 500);
    });
    (0, vitest_1.it)('should handle nested Errors', () => {
        const error = new Error('Outer error');
        error.inner = new Error('Inner error');
        const output = (0, toPlainJson_1.default)(error);
        (0, vitest_1.expect)(output).toMatchObject({
            message: 'Outer error',
            inner: {
                message: 'Inner error',
                stack: vitest_1.expect.any(String)
            },
            stack: vitest_1.expect.any(String)
        });
    });
    (0, vitest_1.it)('should handle arrays with circular references', () => {
        const arr = [];
        arr.push(arr);
        const output = (0, toPlainJson_1.default)(arr);
        (0, vitest_1.expect)(output).toEqual(['[Circular]']);
    });
    (0, vitest_1.it)('should handle objects with Date and RegExp', () => {
        const input = {
            date: new Date('2021-01-01T00:00:00Z'),
            regex: /test/gi
        };
        const output = (0, toPlainJson_1.default)(input);
        (0, vitest_1.expect)(output).toEqual({
            date: '2021-01-01T00:00:00.000Z',
            regex: '/test/gi'
        });
    });
    (0, vitest_1.it)('should handle custom class instances', () => {
        class CustomClass {
            constructor(value) {
                this.value = value;
            }
        }
        const instance = new CustomClass('test');
        const output = (0, toPlainJson_1.default)(instance);
        (0, vitest_1.expect)(output).toEqual({ value: 'test' });
    });
    (0, vitest_1.it)('should handle functions (should return as is)', () => {
        const fn = function testFunction() { };
        const output = (0, toPlainJson_1.default)(fn);
        (0, vitest_1.expect)(output).toBe(fn);
    });
    (0, vitest_1.it)('should handle symbols (should return as is)', () => {
        const sym = Symbol('test');
        const output = (0, toPlainJson_1.default)(sym);
        (0, vitest_1.expect)(output).toBe(sym);
    });
    (0, vitest_1.it)('should handle bigint (since JSON.stringify cannot handle it)', () => {
        const bigIntValue = BigInt(9007199254740991);
        const output = (0, toPlainJson_1.default)(bigIntValue);
        (0, vitest_1.expect)(output).toBe(bigIntValue);
    });
});
