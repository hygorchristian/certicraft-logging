import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import bunyan, { Stream } from 'bunyan';
import bunyanFormat from 'bunyan-format';
import Log, { isLogLevel } from './Log';
import MetricLogger from './MetricLogger';
import { PropertyTypes } from './typeGuards/PropertyTypes';
import convertFSAToLogEntryField from './utils/convertFSAToLogEntryField';
import getRequestAsLogEntryFields from './utils/getRequestAsLogEntryFields';

type BunyanLogger = Pick<bunyan, 'error' | 'info' | 'debug' | 'warn'>;

type LoggerMethod = Pick<bunyan, 'error' | 'info'>;

type LogEntryLabels = {
  companyId: string;
  userId: string;
  [k: string]: string;
};

type LogEntryFields = ReturnType<typeof getRequestAsLogEntryFields> & {
  labels: LogEntryLabels;
  err?: Error;
  [k: string]: any;
};

export type Logger = Omit<BunyanLogger, 'error' | 'info'> & {
  error: (
    fields: LogEntryFields,
    message: string
  ) => ReturnType<PropertyTypes<LoggerMethod>>;
  info: (
    fields: LogEntryFields,
    message: string
  ) => ReturnType<PropertyTypes<LoggerMethod>>;
};

let loggerInstance: Logger;

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
const buildCloudLogger = () =>
  new LoggingBunyan({
    resource: {
      type: 'cloud_function',
      labels: {
        function_name: process.env.FUNCTION_NAME || 'Unknown'
      }
    }
  });

const CloudLogger = (): Logger => {
  if (loggerInstance !== undefined) return loggerInstance;

  const streams: Stream[] = [];

  // TODO: [hack][refactor] JEST_WORKER_ID is a hack, we should use proper
  // configuration and configure the test .env to not log to the cloud

  if (process.env.JEST_WORKER_ID === undefined) {
    if (process.env.FUNCTIONS_EMULATOR) {
      // Pretty format the logging when running locally
      streams.push({
        stream: bunyanFormat({ outputMode: 'short' }),
        level: 'debug'
      });
    } else {
      // Push to the cloud for all other cases
      streams.push(buildCloudLogger().stream('info'));
    }
  } else if (process.stdout.isTTY) {
    // Pretty format logging when testing locally
    // streams.push({
    //   stream: bunyanFormat({ outputMode: 'short' }),
    //   level: 'debug'
    // });
  } else {
    // Never log anything when testing online
    // streams.push({ stream: process.stdout, level: 'error' });
  }

  return (loggerInstance = bunyan.createLogger({
    // The JSON payload of the log as it appears in Cloud Logging
    // will contain "name": "s2sWebApi"
    name: 's2sWebApi',
    streams
  }));
};

export {
  Log,
  isLogLevel,
  CloudLogger,
  MetricLogger,
  getRequestAsLogEntryFields,
  convertFSAToLogEntryField
};
