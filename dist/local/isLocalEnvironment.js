"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalEnvironment = void 0;
/**
 * Returns true when PineLogger should render via the local PrettyDestination
 * instead of pino-pretty or the gcp formatter.
 *
 * Precedence:
 *   1. LOG_LOCAL=true|false — explicit override
 *   2. Firebase / Functions / Firestore emulator env vars set by `firebase emulators:start`
 *
 * Production safety: with no override and no emulator env vars set, this
 * returns false, so the existing cloud-logging path is taken unchanged.
 */
const isLocalEnvironment = () => {
    if (process.env.LOG_LOCAL === 'true')
        return true;
    if (process.env.LOG_LOCAL === 'false')
        return false;
    return Boolean(process.env.FUNCTIONS_EMULATOR ||
        process.env.FIRESTORE_EMULATOR_HOST ||
        process.env.FIREBASE_EMULATOR_HUB);
};
exports.isLocalEnvironment = isLocalEnvironment;
