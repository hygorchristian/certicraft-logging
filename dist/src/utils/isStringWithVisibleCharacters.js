"use strict";
// TODO leverage from package once we convert our libraries to local packages.
Object.defineProperty(exports, "__esModule", { value: true });
const isStringWithVisibleCharacters = (input) => {
    if (input === null)
        return false;
    if (input === undefined)
        return false;
    if (typeof input !== 'string')
        return false;
    if (!input || input.trim().length === 0)
        return false;
    return true;
};
exports.default = isStringWithVisibleCharacters;
