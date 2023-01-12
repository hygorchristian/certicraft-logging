import bunyan from 'bunyan';
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
declare const CloudLogger: () => Logger;
export {
  Log,
  isLogLevel,
  CloudLogger,
  MetricLogger,
  getRequestAsLogEntryFields,
  convertFSAToLogEntryField
};
