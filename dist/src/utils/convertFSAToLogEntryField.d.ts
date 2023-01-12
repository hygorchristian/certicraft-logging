import { RCInternalError } from '../utils/isInternalError';
type LoggableCommandFSA = {
  type: string;
  meta: Record<string, string>;
  payload: Record<string, string>;
  error: string;
};
type RCInternalResult<TPayload> = RCInternalError | TPayload;
type UnknownCommandFSA = {
  [k in keyof LoggableCommandFSA]?: unknown;
};
declare const _default: (
  fsa: RCInternalResult<UnknownCommandFSA>
) => LoggableCommandFSA;
export default _default;
