"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFSAToLogEntryField = exports.getRequestAsLogEntryFields = exports.MetricLogger = exports.CloudLogger = exports.isLogLevel = exports.Log = void 0;
const logging_bunyan_1 = require("@google-cloud/logging-bunyan");
const bunyan_1 = __importDefault(require("bunyan"));
const bunyan_format_1 = __importDefault(require("bunyan-format"));
const Log_1 = __importStar(require("./Log"));
exports.Log = Log_1.default;
Object.defineProperty(exports, "isLogLevel", { enumerable: true, get: function () { return Log_1.isLogLevel; } });
const MetricLogger_1 = __importDefault(require("./MetricLogger"));
exports.MetricLogger = MetricLogger_1.default;
const convertFSAToLogEntryField_1 = __importDefault(require("./utils/convertFSAToLogEntryField"));
exports.convertFSAToLogEntryField = convertFSAToLogEntryField_1.default;
const getRequestAsLogEntryFields_1 = __importDefault(require("./utils/getRequestAsLogEntryFields"));
exports.getRequestAsLogEntryFields = getRequestAsLogEntryFields_1.default;
let loggerInstance;
/**
 * TODO: `createLogger` should be the main entry
 * point for all future log messages. It should be preferred over
 * console.log or console.debug
 *
 * Example use:
 *
 *   import createLogger from 'libraries_v2/logging';
 *
 *   createLogger().info('Here is some information');
 *   createLogger().warn({ labels: { companyId: 'FOO' }}, 'Here is a warning');
 *
 */
const buildCloudLogger = () => new logging_bunyan_1.LoggingBunyan({
    resource: {
        type: 'cloud_function',
        labels: {
            function_name: process.env.FUNCTION_NAME || 'Unknown'
        }
    }
});
const CloudLogger = () => {
    if (loggerInstance !== undefined)
        return loggerInstance;
    const streams = [];
    // TODO: [hack][refactor] JEST_WORKER_ID is a hack, we should use proper
    // configuration and configure the test .env to not log to the cloud
    if (process.env.JEST_WORKER_ID === undefined) {
        if (process.env.FUNCTIONS_EMULATOR) {
            // Pretty format the logging when running locally
            streams.push({
                stream: (0, bunyan_format_1.default)({ outputMode: 'short' }),
                level: 'debug'
            });
        }
        else {
            // Push to the cloud for all other cases
            streams.push(buildCloudLogger().stream('info'));
        }
    }
    else if (process.stdout.isTTY) {
        // Pretty format logging when testing locally
        // streams.push({
        //   stream: bunyanFormat({ outputMode: 'short' }),
        //   level: 'debug'
        // });
    }
    else {
        // Never log anything when testing online
        // streams.push({ stream: process.stdout, level: 'error' });
    }
    return (loggerInstance = bunyan_1.default.createLogger({
        // The JSON payload of the log as it appears in Cloud Logging
        // will contain "name": "s2sWebApi"
        name: 's2sWebApi',
        streams
    }));
};
exports.CloudLogger = CloudLogger;
