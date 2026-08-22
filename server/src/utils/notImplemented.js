import ApiError from './ApiError.js';

// Placeholder for endpoints an intern squad still has to build.
// Replace the whole handler - do not call this from finished code.
export const notImplemented = (ticket) => (_req, _res, next) =>
  next(new ApiError(501, `Not implemented yet - see Jira ${ticket}`));
