import CloudLoggerCtor from './CloudLogger';
import Config from './Config';
import DeprecatedLog, { isLogLevel } from './Log';
import PineLogger from './PineLogger';
import convertFSAToLogEntryField from './utils/convertFSAToLogEntryField';
import getRequestAsLogEntryFields from './utils/getRequestAsLogEntryFields';

const config = new Config();

const DeprecatedCloudLogger: CloudLoggerCtor = new CloudLoggerCtor(config);
const CloudLogger: PineLogger = new PineLogger(config);
const Log: PineLogger = CloudLogger;

export {
  Log, // <-- using Pine logger
  DeprecatedLog, // <-- custom implementation, not used
  isLogLevel,
  CloudLogger, // <-- using Pine logger
  DeprecatedCloudLogger, // <-- this is very hard to maintain
  getRequestAsLogEntryFields,
  convertFSAToLogEntryField
};
