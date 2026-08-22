import Application from '../models/Application.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notImplemented } from '../utils/notImplemented.js';

/**
 * INTAKE + ATS MODULE
 * Model: src/models/Application.js (already defined - extend it if a task needs to)
 * Every handler below is a stub. Replace the body, keep the route signature.
 */

// POST /api/applications  (public - no auth)
// TODO: validate body, save the application, store req.file.path on cvPath,
// generate a publicToken so the applicant can check their status later.
export const createApplication = notImplemented('APPLY-FORM');

// GET /api/applications/status/:token  (public)
// TODO: look up by publicToken, return stage only - never leak reviewer notes.
export const getPublicStatus = notImplemented('APPLY-STATUS');

// GET /api/applications  (admin, mentor)
// Reference implementation so the squad has a working example to copy.
export const listApplications = asyncHandler(async (req, res) => {
  const { stage, track, q, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (stage) filter.stage = stage;
  if (track) filter.track = track;
  if (q) filter.fullName = { $regex: q, $options: 'i' };

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page: Number(page) } });
});

// GET /api/applications/:id  (admin, mentor)
// TODO: return one application with reviews populated.
export const getApplication = notImplemented('ATS-DETAIL');

// PATCH /api/applications/:id/stage  (admin, mentor)
// TODO: validate the target stage against APPLICATION_STAGES, move it, record who moved it.
export const updateStage = notImplemented('ATS-STAGE');

// POST /api/applications/:id/reviews  (admin, mentor)
// TODO: push a review subdoc; one review per reviewer - update instead of duplicating.
export const addReview = notImplemented('ATS-REVIEW');
