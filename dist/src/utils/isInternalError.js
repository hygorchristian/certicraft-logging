"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isInternalError = (input) => input instanceof Error &&
    input.hasOwnProperty('toJSON') &&
    typeof input.toJSON === 'function';
exports.default = isInternalError;
