import { beforeAll, describe, expect, it } from 'vitest';
import CloudLogger from '../CloudLogger';
import Config from '../Config';

const httpRequest = {
  status: 200,
  requestUrl: 'http://localhost:3000/api/v1/test',
  requestMethod: 'GET',
  remoteIp: '123.123.123.123'
};

describe('CloudLogger', () => {
  let logger: CloudLogger;

  beforeAll(() => {
    logger = new CloudLogger(
      new Config({
        JEST_WORKER_ID: undefined,
        VITEST_WORKER_ID: undefined,
        FUNCTIONS_EMULATOR: '1234'
      })
    );
    logger.setLabels({
      companyId: 'testCompanyID',
      userId: 'dummyUserId',
      label: 'test-label'
    });
  });

  it('info logger should work while testing', () => {
    expect(() => {
      logger.setLabels({
        companyId: 'testCompanyID',
        userId: 'dummyUserId'
      });
      logger.setHttpLabels(httpRequest);
      logger.info('This is a test message');
    }).not.toThrow();
  });

  it('time logs should work while testing', () => {
    expect(() => {
      const label = 'timer-label';
      logger.time(label);
      logger.timeLog(label, 'test-message 1');
      logger.timeLog(label, 'test-message 2');
      logger.timeLog(label, 'test-message 2');
      logger.timeLog(label, 'test-message 2');
      logger.timeEnd(label);
    }).not.toThrow();
  });

  it('stop watch should work while testing', () => {
    expect(() => {
      const label = 'stopwatch-label';
      logger.stopwatchStart(label);
      logger.stopwatchStop(label);
      logger.stopwatchStart(label);
      logger.stopwatchStop(label);
      logger.stopwatchGetInfo(label);
    }).not.toThrow();
  });

  it('flush all logs should work while testing', () => {
    expect(() => {
      const stopWatchLabel = 'stopwatch-label';
      const timerLabel = 'timer-label';
      logger.stopwatchStart(stopWatchLabel);
      logger.stopwatchStop(stopWatchLabel);
      logger.stopwatchStart(stopWatchLabel);
      logger.stopwatchStop(stopWatchLabel);
      logger.time(timerLabel);
      logger.timeLog(timerLabel, 'test-message 1');
      logger.timeLog(timerLabel, 'test-message 2');
      logger.flush();
    }).not.toThrow();
  });
});
