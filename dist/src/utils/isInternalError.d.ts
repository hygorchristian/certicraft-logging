export type RCInternalError = Error & {
  toJSON: (any: any) => void;
};
declare const isInternalError: (input: any) => input is RCInternalError;
export default isInternalError;
