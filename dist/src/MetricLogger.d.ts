import { Logger } from '.';
type LogLevel = keyof Logger;
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
declare class MetricLogger {
  private labels;
  constructor();
  updateLabels(update: Record<string, string>): MetricLogger;
  updateLabels(update: any): MetricLogger;
  clearLabels: () => MetricLogger;
  runOperationAndLogDurationInMillis: <T>(
    level: LogLevel,
    metricName: string,
    op: () => T,
    allowLoggingWithoutLabelsBeingPresent?: boolean
  ) => T;
  logMetric: (
    level: LogLevel,
    metric: Record<string, string>,
    allowLoggingWithoutLabelsBeingPresent?: boolean
  ) => void;
}
declare const _default: MetricLogger;
export default _default;
