"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CloudLogger_1 = __importDefault(require("../CloudLogger"));
const Config_1 = __importDefault(require("../Config"));
const httpRequest = {
    status: 200,
    requestUrl: 'http://localhost:3000/api/v1/test',
    requestMethod: 'GET',
    remoteIp: '123.123.123.123'
};
(0, vitest_1.describe)('CloudLogger', () => {
    let logger;
    (0, vitest_1.beforeAll)(() => {
        logger = new CloudLogger_1.default(new Config_1.default({
            JEST_WORKER_ID: undefined,
            VITEST_WORKER_ID: undefined,
            FUNCTIONS_EMULATOR: '1234'
        }));
        logger.setLabels({
            companyId: 'testCompanyID',
            userId: 'dummyUserId',
            label: 'test-label'
        });
    });
    (0, vitest_1.it)('info logger should work while testing', () => {
        (0, vitest_1.expect)(() => {
            logger.setLabels({
                companyId: 'testCompanyID',
                userId: 'dummyUserId'
            });
            logger.setHttpLabels(httpRequest);
            logger.info('This is a test message');
        }).not.toThrow();
    });
    (0, vitest_1.it)('time logs should work while testing', () => {
        (0, vitest_1.expect)(() => {
            const label = 'timer-label';
            logger.time(label);
            logger.timeLog(label, 'test-message 1');
            logger.timeLog(label, 'test-message 2');
            logger.timeLog(label, 'test-message 2');
            logger.timeLog(label, 'test-message 2');
            logger.timeEnd(label);
        }).not.toThrow();
    });
    (0, vitest_1.it)('stop watch should work while testing', () => {
        (0, vitest_1.expect)(() => {
            const label = 'stopwatch-label';
            logger.stopwatchStart(label);
            logger.stopwatchStop(label);
            logger.stopwatchStart(label);
            logger.stopwatchStop(label);
            logger.stopwatchGetInfo(label);
        }).not.toThrow();
    });
    (0, vitest_1.it)('flush all logs should work while testing', () => {
        (0, vitest_1.expect)(() => {
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
