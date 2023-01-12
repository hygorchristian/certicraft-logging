import convertPropertyValuesToStrings from '../utils/convertPropertyValuesToStrings';
import isInternalError, { RCInternalError } from '../utils/isInternalError';
import isStringWithVisibleCharacters from '../utils/isStringWithVisibleCharacters';

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

export default (
  fsa: RCInternalResult<UnknownCommandFSA>
): LoggableCommandFSA => {
  if (fsa === null || fsa === undefined)
    return { type: 'Unknown', meta: {}, payload: {}, error: '' };

  if (isInternalError(fsa))
    return {
      type: 'ERROR',
      meta: {},
      payload: {},
      error: JSON.stringify(
        fsa.toJSON({
          useUnformattedProperties: false,
          includeStack: true,
          includeContext: true
        })
      )
    };

  return {
    type: isStringWithVisibleCharacters(fsa.type) ? fsa.type : 'Unknown',
    meta: convertPropertyValuesToStrings(fsa.meta as Object),
    payload: convertPropertyValuesToStrings(fsa.payload as Object),
    error: fsa.error && fsa.error === true ? 'true' : 'false'
  };
};
