"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const convertPropertyValuesToStrings_1 = __importDefault(require("./convertPropertyValuesToStrings"));
exports.default = (request) => ({
    requestHeaders: (0, convertPropertyValuesToStrings_1.default)(request?.headers, [
        'authorization'
    ]),
    requestPath: request?.path || 'Unknown',
    requestQuery: (0, convertPropertyValuesToStrings_1.default)(request?.query)
});
