import convertPropertyValuesToStrings from './convertPropertyValuesToStrings';

type RequestLogEntryFields = {
  // Unfortunately these must all be optional
  // because sometimes the request is not available
  // and these properties are always spread inside
  // the log entry fields
  requestHeaders?: Record<string, string>;
  requestPath?: string;
  requestQuery?: Record<string, string>;
};

export default (request: any): RequestLogEntryFields => ({
  requestHeaders: convertPropertyValuesToStrings(request?.headers, [
    'authorization'
  ]),
  requestPath: request?.path || 'Unknown',
  requestQuery: convertPropertyValuesToStrings(request?.query)
});
