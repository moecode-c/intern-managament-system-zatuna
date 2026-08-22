import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Place after express-validator chains to turn failures into 400s.
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, errors.array().map((e) => e.msg).join(', ')));
  }
  next();
}
