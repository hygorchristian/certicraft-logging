"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const convertPropertyValuesToStrings_1 = __importDefault(require("../utils/convertPropertyValuesToStrings"));
const isInternalError_1 = __importDefault(require("../utils/isInternalError"));
const isStringWithVisibleCharacters_1 = __importDefault(require("../utils/isStringWithVisibleCharacters"));
exports.default = (fsa) => {
    if (fsa === null || fsa === undefined)
        return { type: 'Unknown', meta: {}, payload: {}, error: '' };
    if ((0, isInternalError_1.default)(fsa))
        return {
            type: 'ERROR',
            meta: {},
            payload: {},
            error: JSON.stringify(fsa.toJSON({
                useUnformattedProperties: false,
                includeStack: true,
                includeContext: true
            }))
        };
    return {
        type: (0, isStringWithVisibleCharacters_1.default)(fsa.type) ? fsa.type : 'Unknown',
        meta: (0, convertPropertyValuesToStrings_1.default)(fsa.meta),
        payload: (0, convertPropertyValuesToStrings_1.default)(fsa.payload),
        error: fsa.error && fsa.error === true ? 'true' : 'false'
    };
};
