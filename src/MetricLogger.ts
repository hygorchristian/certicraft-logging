import { CloudLogger, Logger } from '.';
import convertPropertyValuesToStrings from './utils/convertPropertyValuesToStrings';

type LogLevel = keyof Logger;

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
  private labels: Record<string, string>;

  constructor() {
    this.labels = {};
  }

  public updateLabels(update: Record<string, string>): MetricLogger;

  public updateLabels(update: any): MetricLogger;

  public updateLabels(update: unknown): MetricLogger {
    if (update !== null && typeof update === 'object')
      this.labels = { ...this.labels, ...update };
    else this.labels[String(new Date().getTime())] = JSON.stringify(update);
    return this;
  }

  // Start with a fresh set of labels
  public clearLabels = (): MetricLogger => {
    this.labels = {};
    return this;
  };

  // Log duration of `op()` as `metricName` in ms
  public runOperationAndLogDurationInMillis = <T>(
    level: LogLevel,
    metricName: string,
    op: () => T,
    allowLoggingWithoutLabelsBeingPresent = false
  ): T => {
    const start = process.hrtime();

    const result = op();

    const duration = process.hrtime(start);
    // duration is a tuple of [seconds,nanoseconds]
    const durationMillis =
      duration[0] * 1000 + Math.round(duration[1] / 1000000);

    this.logMetric(
      level,
      {
        [metricName]: `${durationMillis}`
      },
      allowLoggingWithoutLabelsBeingPresent
    );

    return result;
  };

  // Log metrics specified by `metric`, sometimes labels have not been defined (yet)
  // which will drop the measurement because without labels, it will not be possible
  // to attribute this measurement to a segment (or bucket) Once can set `force` to
  // true to force logging the metric even if no labels have been defined.
  public logMetric = (
    level: LogLevel,
    metric: Record<string, string>,
    allowLoggingWithoutLabelsBeingPresent = false
  ) => {
    if (
      allowLoggingWithoutLabelsBeingPresent ||
      JSON.stringify(this.labels) !== '{}'
    )
      CloudLogger()[level](
        {
          labels: {
            ...defaultLogEntryLabels,
            ...convertPropertyValuesToStrings(this.labels),
            ...metric
          }
        },
        `Metrics: ${JSON.stringify(metric)}`
      );
  };
}

export default new MetricLogger();
