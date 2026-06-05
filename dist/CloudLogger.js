"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logging_bunyan_1 = require("@google-cloud/logging-bunyan");
const bunyan_1 = __importDefault(require("bunyan"));
const bunyan_format_1 = __importDefault(require("bunyan-format"));
const StopwatchManager_1 = __importDefault(require("./StopwatchManager"));
const TimerManager_1 = __importDefault(require("./TimerManager"));
class CloudLogger {
    constructor(config) {
        this.loggerName = 'default';
        this.labels = {};
        this.enabled = true;
        this.config = config;
        this.timerManager = new TimerManager_1.default();
        this.stopwatchManager = new StopwatchManager_1.default();
        this.context = {};
    }
    // ---------------------------------------------------------------------------
    // Setup Methods
    // ---------------------------------------------------------------------------
    setLoggerName(name) {
        this.loggerName = name;
    }
    setLabels(labels) {
        this.labels = { ...this.labels, ...labels };
    }
    setHttpLabels(httpRequest) {
        this.labels = { ...this.labels, httpRequest };
    }
    setContext(context) {
        this.context = context;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    // ---------------------------------------------------------------------------
    // Logger Methods
    // ---------------------------------------------------------------------------
    info(msg) {
        this.getLogger().info(msg);
    }
    error(msg) {
        this.getLogger().error(msg);
    }
    warn(msg) {
        this.getLogger().warn(msg);
    }
    debug(msg) {
        this.getLogger().debug(msg);
    }
    time(label) {
        this.timerManager.time(label);
    }
    timeLog(label, ...args) {
        this.timerManager.timeLog(label, ...args);
    }
    timeEnd(label) {
        const { labels, timeLog } = this.timerManager.timeEnd(label);
        this.getLogger(labels).info({ timeLog });
    }
    stopwatchStart(label) {
        this.stopwatchManager.start(label);
    }
    stopwatchStop(label) {
        this.stopwatchManager.stop(label);
    }
    stopwatchGetInfo(label) {
        const result = this.stopwatchManager.getInfo(label);
        this.getLogger({ stopwatch: label }).info({ stopwatch: result });
    }
    flush() {
        const timer = this.timerManager.flush();
        const stopwatch = this.stopwatchManager.flush();
        this.getLogger({ messages_flushed: 1 }).info({
            message: 'flushing all timer messages',
            timer,
            stopwatch
        });
    }
    // ---------------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------------
    getLogger(labels = {}) {
        return bunyan_1.default.createLogger({
            name: this.loggerName,
            streams: this.getStreams(labels)
        });
    }
    getStreams(labels = {}) {
        const streams = [];
        if (!this.enabled)
            return streams;
        if (!this.config.isTestEnvironment()) {
            if (this.config.isEmulator()) {
                // The 'false' condition seems redundant, remove if not needed
                streams.push(this.getStreamForLocalTesting());
            }
            else {
                streams.push(this.getStreamForCloudLogging(labels));
            }
        }
        else if (this.config.isTTY()) {
            streams.push(this.getStreamForLocalTesting());
        }
        else {
            streams.push(this.getStdoutStream());
        }
        return streams;
    }
    getStdoutStream() {
        return { stream: process.stdout, level: 'info' };
    }
    getStreamForLocalTesting() {
        return {
            stream: (0, bunyan_format_1.default)({ outputMode: 'short' }),
            level: 'debug'
        };
    }
    getStreamForCloudLogging(labels) {
        return new logging_bunyan_1.LoggingBunyan({
            serviceContext: this.context,
            logName: this.loggerName,
            resource: {
                type: 'cloud_function',
                labels: { ...this.labels, ...labels }
            }
        }).stream('info');
    }
}
exports.default = CloudLogger;
