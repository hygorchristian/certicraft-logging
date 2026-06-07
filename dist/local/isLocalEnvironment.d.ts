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
export declare const isLocalEnvironment: () => boolean;
