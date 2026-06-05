"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isString = (v) => typeof v === 'string' || v instanceof String;
exports.default = (input, skipPropertyNames = [], rawPropertyNames = []) => Object.entries(input || {}).reduce((acc, [k, v]) => {
    if (skipPropertyNames.includes(k))
        return acc;
    acc[k] =
        isString(v) || rawPropertyNames.includes(k) ? v : JSON.stringify(v);
    return acc;
}, {});
