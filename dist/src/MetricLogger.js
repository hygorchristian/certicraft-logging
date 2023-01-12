"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const convertPropertyValuesToStrings_1 = __importDefault(require("./utils/convertPropertyValuesToStrings"));
// These are required by the CloudLogger API
const defaultLogEntryLabels = {
    companyId: 'Unknown',
    userId: 'Unknown'
};
/**
 * The MetricLogger is a singleton entity that facilitates
 * pushing metrics as log messages from anywhere in the code
 * while keeping some state in terms of labels to be able to
 * segment or aggregate the metrics at a later time.
 *
 *
 * ---WARNING---
 * This class is not thread-safe. Once a concurrent request
 * comes in while an older request is still being processed,
 * labels can be overwritten causing a metric to be
 * incorrectly attributed (segmented) to the wrong bucket.
 */
class MetricLogger {
    constructor() {
        // Start with a fresh set of labels
        this.clearLabels = () => {
            this.labels = {};
            return this;
        };
        // Log duration of `op()` as `metricName` in ms
        this.runOperationAndLogDurationInMillis = (level, metricName, op, allowLoggingWithoutLabelsBeingPresent = false) => {
            const start = process.hrtime();
            const result = op();
            const duration = process.hrtime(start);
            // duration is a tuple of [seconds,nanoseconds]
            const durationMillis = duration[0] * 1000 + Math.round(duration[1] / 1000000);
            this.logMetric(level, {
                [metricName]: `${durationMillis}`
            }, allowLoggingWithoutLabelsBeingPresent);
            return result;
        };
        // Log metrics specified by `metric`, sometimes labels have not been defined (yet)
        // which will drop the measurement because without labels, it will not be possible
        // to attribute this measurement to a segment (or bucket) Once can set `force` to
        // true to force logging the metric even if no labels have been defined.
        this.logMetric = (level, metric, allowLoggingWithoutLabelsBeingPresent = false) => {
            if (allowLoggingWithoutLabelsBeingPresent ||
                JSON.stringify(this.labels) !== '{}')
                (0, _1.CloudLogger)()[level]({
                    labels: {
                        ...defaultLogEntryLabels,
                        ...(0, convertPropertyValuesToStrings_1.default)(this.labels),
                        ...metric
                    }
                }, `Metrics: ${JSON.stringify(metric)}`);
        };
        this.labels = {};
    }
    updateLabels(update) {
        if (update !== null && typeof update === 'object')
            this.labels = { ...this.labels, ...update };
        else
            this.labels[String(new Date().getTime())] = JSON.stringify(update);
        return this;
    }
}
exports.default = new MetricLogger();
