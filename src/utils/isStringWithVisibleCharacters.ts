// TODO leverage from package once we convert our libraries to local packages.

const isStringWithVisibleCharacters = (input: unknown): input is string => {
  if (input === null) return false;
  if (input === undefined) return false;
  if (typeof input !== 'string') return false;
  if (!input || input.trim().length === 0) return false;

  return true;
};

export default isStringWithVisibleCharacters;
