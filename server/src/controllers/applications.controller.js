import mongoose from 'mongoose';
import Application, { APPLICATION_STAGES } from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
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
export const getApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid application id format.');
  }

  const application = await Application.findById(id).populate(
    'reviews.reviewer',
    'name email'
  );

  if (!application) {
    throw new ApiError(404, 'Application not found.');
  }

  res.json({ success: true, data: application });
});

// PATCH /api/applications/:id/stage  (admin, mentor)
export const updateStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid application id format.');
  }

  if (!APPLICATION_STAGES.includes(stage)) {
    throw new ApiError(
      400,
      `Invalid stage. Allowed values: ${APPLICATION_STAGES.join(', ')}.`
    );
  }

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(404, 'Application not found.');
  }

  application.stage = stage;
  await application.save();

  res.json({ success: true, data: application });
});

// POST /api/applications/:id/reviews  (admin, mentor)
// TODO: push a review subdoc; one review per reviewer - update instead of duplicating.
export const addReview = notImplemented('ATS-REVIEW');
