/**
 * Sets env vars that quiet down gRPC and Firestore's own stdout chatter when
 * running locally. Only sets each var when not already defined, so a developer
 * who wants the firehose can `GRPC_VERBOSITY=DEBUG npm start`.
 *
 * Must run before `@grpc/grpc-js`, `firebase-admin`, or `@google-cloud/firestore`
 * are imported, since they read these at module-init.
 */
export declare const silenceNoisyLibraries: () => void;
