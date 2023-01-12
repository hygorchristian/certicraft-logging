type RequestLogEntryFields = {
  requestHeaders?: Record<string, string>;
  requestPath?: string;
  requestQuery?: Record<string, string>;
};
declare const _default: (request: any) => RequestLogEntryFields;
export default _default;
