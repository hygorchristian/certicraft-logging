"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.silenceNoisyLibraries = void 0;
/**
 * Sets env vars that quiet down gRPC and Firestore's own stdout chatter when
 * running locally. Only sets each var when not already defined, so a developer
 * who wants the firehose can `GRPC_VERBOSITY=DEBUG npm start`.
 *
 * Must run before `@grpc/grpc-js`, `firebase-admin`, or `@google-cloud/firestore`
 * are imported, since they read these at module-init.
 */
const silenceNoisyLibraries = () => {
    if (process.env.GRPC_VERBOSITY === undefined) {
        process.env.GRPC_VERBOSITY = 'NONE';
    }
    if (process.env.GRPC_TRACE === undefined) {
        process.env.GRPC_TRACE = '';
    }
    if (process.env.FIRESTORE_LOG_LEVEL === undefined) {
        process.env.FIRESTORE_LOG_LEVEL = 'error';
    }
};
exports.silenceNoisyLibraries = silenceNoisyLibraries;
