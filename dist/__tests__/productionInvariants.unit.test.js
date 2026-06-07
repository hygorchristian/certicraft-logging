"use strict";
/**
 * These tests are the CONTRACT between v1.1.11 local-logging changes and
 * production behaviour. They should fail loudly if any local-mode code path
 * leaks into the production execution path.
 *
 * Any test failing here means production logging behaviour has diverged from
 * the v1.1.10 baseline — do NOT publish until the regression is resolved.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
/**
 * Both real production and our prod-simulating tests need to bypass the
 * VITEST_WORKER_ID that vitest sets automatically, otherwise Config's
 * isTestEnvironment() short-circuits everything to silent.
 */
const PROD_CONFIG_ENV = {
    JEST_WORKER_ID: undefined,
    VITEST_WORKER_ID: undefined,
    FUNCTIONS_EMULATOR: undefined
};
const LOCAL_CONFIG_ENV = {
    JEST_WORKER_ID: undefined,
    VITEST_WORKER_ID: undefined,
    FUNCTIONS_EMULATOR: '1'
};
(0, vitest_1.describe)('Production invariants — local code must never execute in prod', () => {
    (0, vitest_1.beforeEach)(() => {
        process.env.NODE_ENV = 'production';
        delete process.env.LOG_LOCAL;
        delete process.env.FIRESTORE_EMULATOR_HOST;
        delete process.env.FIREBASE_EMULATOR_HUB;
        vitest_1.vi.resetModules();
    });
    (0, vitest_1.afterEach)(() => {
        process.env.NODE_ENV = ORIGINAL_NODE_ENV;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('isLocalEnvironment() returns false when no emulator/override env vars are set', async () => {
        const { isLocalEnvironment } = await Promise.resolve().then(() => __importStar(require('../local/isLocalEnvironment')));
        (0, vitest_1.expect)(isLocalEnvironment()).toBe(false);
    });
    (0, vitest_1.it)('localDestination stays undefined after a full call sequence in production', async () => {
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
        logger.setEnabled(true);
        logger.setLabels({ companyId: 'X', userId: 'Y' });
        logger.setHttpLabels({ requestMethod: 'GET', requestPath: '/' });
        logger.info({}, 'hello');
        (0, vitest_1.expect)(logger.localDestination).toBeUndefined();
    });
    (0, vitest_1.it)('PrettyDestination is NEVER constructed in production', async () => {
        const PrettyDestModule = await Promise.resolve().then(() => __importStar(require('../local/PrettyDestination')));
        const spy = vitest_1.vi.spyOn(PrettyDestModule, 'PrettyDestination');
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
        logger.setEnabled(true);
        logger.setLabels({ companyId: 'X' });
        logger.setHttpLabels({ requestMethod: 'POST', requestPath: '/foo' });
        logger.info({}, 'production log');
        logger.error({ err: new Error('boom') }, 'oops');
        (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('gcpLogOptions IS invoked in production (the cloud path is taken)', async () => {
        const pinoCloud = await Promise.resolve().then(() => __importStar(require('pino-cloud-logging')));
        const spy = vitest_1.vi.spyOn(pinoCloud, 'gcpLogOptions');
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
        logger.setEnabled(true);
        (0, vitest_1.expect)(spy).toHaveBeenCalled();
    });
    (0, vitest_1.it)('silenceNoisyLibraries side effects do NOT pollute production env vars', async () => {
        delete process.env.GRPC_VERBOSITY;
        delete process.env.FIRESTORE_LOG_LEVEL;
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        new PineLogger(new Config(PROD_CONFIG_ENV));
        (0, vitest_1.expect)(process.env.GRPC_VERBOSITY).toBeUndefined();
        (0, vitest_1.expect)(process.env.FIRESTORE_LOG_LEVEL).toBeUndefined();
    });
});
(0, vitest_1.describe)('Local mode IS activated when expected', () => {
    const ORIGINAL_FUNCTIONS_EMULATOR = process.env.FUNCTIONS_EMULATOR;
    (0, vitest_1.beforeEach)(() => {
        process.env.NODE_ENV = 'development';
        // isLocalEnvironment() reads process.env directly, not Config's override.
        process.env.FUNCTIONS_EMULATOR = 'true';
        vitest_1.vi.resetModules();
    });
    (0, vitest_1.afterEach)(() => {
        process.env.NODE_ENV = ORIGINAL_NODE_ENV;
        if (ORIGINAL_FUNCTIONS_EMULATOR === undefined) {
            delete process.env.FUNCTIONS_EMULATOR;
        }
        else {
            process.env.FUNCTIONS_EMULATOR = ORIGINAL_FUNCTIONS_EMULATOR;
        }
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('PrettyDestination IS constructed when FUNCTIONS_EMULATOR is set', async () => {
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        const logger = new PineLogger(new Config(LOCAL_CONFIG_ENV));
        logger.setEnabled(true);
        (0, vitest_1.expect)(logger.localDestination).toBeDefined();
    });
    (0, vitest_1.it)('gcpLogOptions is NOT invoked locally (we skip the cloud formatter)', async () => {
        const pinoCloud = await Promise.resolve().then(() => __importStar(require('pino-cloud-logging')));
        const spy = vitest_1.vi.spyOn(pinoCloud, 'gcpLogOptions');
        const { default: PineLogger } = await Promise.resolve().then(() => __importStar(require('../PineLogger')));
        const { default: Config } = await Promise.resolve().then(() => __importStar(require('../Config')));
        const logger = new PineLogger(new Config(LOCAL_CONFIG_ENV));
        logger.setEnabled(true);
        logger.info({}, 'local log');
        (0, vitest_1.expect)(spy).not.toHaveBeenCalled();
    });
});
