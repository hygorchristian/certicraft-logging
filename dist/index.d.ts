import CloudLoggerCtor from './CloudLogger';
import DeprecatedLog, { isLogLevel } from './Log';
import PineLogger from './PineLogger';
import convertFSAToLogEntryField from './utils/convertFSAToLogEntryField';
import getRequestAsLogEntryFields from './utils/getRequestAsLogEntryFields';
declare const DeprecatedCloudLogger: CloudLoggerCtor;
declare const CloudLogger: PineLogger;
declare const Log: PineLogger;
export { Log, // <-- using Pine logger
DeprecatedLog, // <-- custom implementation, not used
isLogLevel, CloudLogger, // <-- using Pine logger
DeprecatedCloudLogger, // <-- this is very hard to maintain
getRequestAsLogEntryFields, convertFSAToLogEntryField };
