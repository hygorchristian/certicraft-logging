// TODO leverage from package once we convert our libraries to local packages.
export type RCInternalError = Error & {
  toJSON: (any) => void;
};

const isInternalError = (input: any): input is RCInternalError =>
  input instanceof Error &&
  input.hasOwnProperty('toJSON') &&
  typeof (input as RCInternalError).toJSON === 'function';

export default isInternalError;
