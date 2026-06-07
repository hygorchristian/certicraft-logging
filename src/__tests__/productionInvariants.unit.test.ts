/**
 * These tests are the CONTRACT between v1.1.11 local-logging changes and
 * production behaviour. They should fail loudly if any local-mode code path
 * leaks into the production execution path.
 *
 * Any test failing here means production logging behaviour has diverged from
 * the v1.1.10 baseline — do NOT publish until the regression is resolved.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('Production invariants — local code must never execute in prod', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LOCAL;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_EMULATOR_HUB;
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    vi.restoreAllMocks();
  });

  it('isLocalEnvironment() returns false when no emulator/override env vars are set', async () => {
    const { isLocalEnvironment } = await import('../local/isLocalEnvironment');
    expect(isLocalEnvironment()).toBe(false);
  });

  it('localDestination stays undefined after a full call sequence in production', async () => {
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
    logger.setEnabled(true);
    logger.setLabels({ companyId: 'X', userId: 'Y' });
    logger.setHttpLabels({ requestMethod: 'GET', requestPath: '/' });
    logger.info({}, 'hello');
    expect((logger as any).localDestination).toBeUndefined();
  });

  it('PrettyDestination is NEVER constructed in production', async () => {
    const PrettyDestModule = await import('../local/PrettyDestination');
    const spy = vi.spyOn(PrettyDestModule, 'PrettyDestination');
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
    logger.setEnabled(true);
    logger.setLabels({ companyId: 'X' });
    logger.setHttpLabels({ requestMethod: 'POST', requestPath: '/foo' });
    logger.info({}, 'production log');
    logger.error({ err: new Error('boom') }, 'oops');
    expect(spy).not.toHaveBeenCalled();
  });

  it('gcpLogOptions IS invoked in production (the cloud path is taken)', async () => {
    const pinoCloud = await import('pino-cloud-logging');
    const spy = vi.spyOn(pinoCloud, 'gcpLogOptions');
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    const logger = new PineLogger(new Config(PROD_CONFIG_ENV));
    logger.setEnabled(true);
    expect(spy).toHaveBeenCalled();
  });

  it('silenceNoisyLibraries side effects do NOT pollute production env vars', async () => {
    delete process.env.GRPC_VERBOSITY;
    delete process.env.FIRESTORE_LOG_LEVEL;
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    new PineLogger(new Config(PROD_CONFIG_ENV));
    expect(process.env.GRPC_VERBOSITY).toBeUndefined();
    expect(process.env.FIRESTORE_LOG_LEVEL).toBeUndefined();
  });
});

describe('Local mode IS activated when expected', () => {
  const ORIGINAL_FUNCTIONS_EMULATOR = process.env.FUNCTIONS_EMULATOR;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    // isLocalEnvironment() reads process.env directly, not Config's override.
    process.env.FUNCTIONS_EMULATOR = 'true';
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    if (ORIGINAL_FUNCTIONS_EMULATOR === undefined) {
      delete process.env.FUNCTIONS_EMULATOR;
    } else {
      process.env.FUNCTIONS_EMULATOR = ORIGINAL_FUNCTIONS_EMULATOR;
    }
    vi.restoreAllMocks();
  });

  it('PrettyDestination IS constructed when FUNCTIONS_EMULATOR is set', async () => {
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    const logger = new PineLogger(new Config(LOCAL_CONFIG_ENV));
    logger.setEnabled(true);
    expect((logger as any).localDestination).toBeDefined();
  });

  it('gcpLogOptions is NOT invoked locally (we skip the cloud formatter)', async () => {
    const pinoCloud = await import('pino-cloud-logging');
    const spy = vi.spyOn(pinoCloud, 'gcpLogOptions');
    const { default: PineLogger } = await import('../PineLogger');
    const { default: Config } = await import('../Config');
    const logger = new PineLogger(new Config(LOCAL_CONFIG_ENV));
    logger.setEnabled(true);
    logger.info({}, 'local log');
    expect(spy).not.toHaveBeenCalled();
  });
});
