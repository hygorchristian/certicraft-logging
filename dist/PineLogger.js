"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const pino_cloud_logging_1 = require("pino-cloud-logging");
const StopwatchManager_1 = __importDefault(require("./StopwatchManager"));
const TimerManager_1 = __importDefault(require("./TimerManager"));
const toPlainJson_1 = __importDefault(require("./utils/toPlainJson"));
class PinoCloudLogger {
    constructor(config) {
        this.level = () => {
            if (!this.enabled)
                return 'silent';
            if (this.config.isTestEnvironment())
                return 'silent';
            if (this.config.isEmulator())
                return 'debug';
            if (this.config.isTTY())
                return 'info';
            return 'info';
        };
        this.transporters = () => {
            if (this.isProduction)
                return {};
            if (this.config.isTestEnvironment())
                return {};
            return {
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: true,
                        ignore: 'pid,hostname'
                    }
                }
            };
        };
        this.getContext = () => {
            if (this.isProduction)
                return {
                    mixin: this.mixin.bind(this)
                };
            return {};
        };
        this.updateLogger = () => {
            const options = (0, pino_cloud_logging_1.gcpLogOptions)({ level: this.level(), ...this.transporters() }, this.getContext());
            this.logger = (0, pino_1.default)(options);
        };
        this.config = config;
        this.labels = {};
        this.context = {};
        this.httpRequest = {};
        this.enabled = false;
        this.loggerName = '';
        this.isProduction = process?.env?.NODE_ENV === 'production';
        this.updateLogger();
        this.logger = (0, pino_1.default)();
        this.timerManager = new TimerManager_1.default();
        this.stopwatchManager = new StopwatchManager_1.default();
    }
    info(obj, msg, ...args) {
        if (!this.enabled)
            return;
        this.logger.info(this.serializeMessage(obj), msg, ...this.serializeMessage(args));
    }
    error(obj, msg, ...args) {
        if (!this.enabled)
            return;
        this.logger.error(this.serializeMessage(obj), msg, ...this.serializeMessage(args));
    }
    warn(obj, msg, ...args) {
        if (!this.enabled)
            return;
        this.logger.warn(this.serializeMessage(obj), msg, ...this.serializeMessage(args));
    }
    debug(obj, msg, ...args) {
        if (!this.enabled)
            return;
        this.logger.debug(this.serializeMessage(obj), msg, ...this.serializeMessage(args));
    }
    time(label) {
        this.timerManager.time(label);
    }
    timeLog(label, ...args) {
        this.timerManager.timeLog(label, ...args);
    }
    timeEnd(label) {
        const { labels, timeLog } = this.timerManager.timeEnd(label);
        this.logger.info({ timeLog }, `time_log::${label}`, labels);
    }
    stopwatchStart(label) {
        this.stopwatchManager.start(label);
    }
    stopwatchStop(label) {
        this.stopwatchManager.stop(label);
    }
    stopwatchGetInfo(label) {
        const result = this.stopwatchManager.getInfo(label);
        this.logger.info({ stopwatch: result }, `stopwatch::${label}`);
    }
    flush() {
        const timer = this.timerManager.flush();
        const stopwatch = this.stopwatchManager.flush();
        this.info({
            message: 'flushing all timer messages',
            timer,
            stopwatch
        }, 'flushing_all_timer_messages');
    }
    setLabels(labels) {
        this.labels = labels;
        this.updateLogger();
    }
    setContext(context) {
        this.context = context;
        this.updateLogger();
    }
    setHttpLabels(httpLabels) {
        this.httpRequest = httpLabels;
        this.updateLogger();
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    setLoggerName(name) {
        this.loggerName = name;
        this.updateLogger();
    }
    // Private
    serializeMessage(message) {
        return (0, toPlainJson_1.default)(message);
    }
    mixin() {
        return {
            ...(Object.keys(this.labels).length
                ? { 'logging.googleapis.com/labels': this.labels }
                : {}),
            ...(Object.keys(this.context).length ? this.context : {}),
            ...(Object.keys(this.httpRequest).length
                ? { httpRequest: this.httpRequest }
                : {}),
            ...(this.loggerName ? { loggerName: this.loggerName } : {})
        };
    }
}
exports.default = PinoCloudLogger;
