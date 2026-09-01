import crypto from 'node:crypto';
import Application from '../models/Application.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notImplemented } from '../utils/notImplemented.js';

/**
 * INTAKE + ATS MODULE
 * Model: src/models/Application.js (already defined - extend it if a task needs to)
 */

const VALID_TRACKS = ['frontend', 'backend', 'fullstack', 'mobile', 'design', 'qa', 'data'];

// POST /api/applications  (public - no auth)
// Accepts multipart/form-data with a 'cv' file field.
export const createApplication = asyncHandler(async (req, res) => {
  const { fullName, email, phone, university, major, graduationYear, track, portfolioUrl, coverLetter } = req.body;

  // --- validation ---
  if (!fullName || !fullName.trim()) {
    throw new ApiError(400, 'Full name is required');
  }
  if (!email || !email.trim()) {
    throw new ApiError(400, 'Email is required');
  }
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }
  if (!track) {
    throw new ApiError(400, 'Track is required');
  }
  if (!VALID_TRACKS.includes(track)) {
    throw new ApiError(400, `Track must be one of: ${VALID_TRACKS.join(', ')}`);
  }

  // CV is required
  if (!req.file) {
    throw new ApiError(400, 'CV file is required (PDF or Word, max 5 MB)');
  }

  // Check for duplicate application (same email + same track)
  const existing = await Application.findOne({ email: email.toLowerCase().trim(), track });
  if (existing) {
    throw new ApiError(409, 'You have already applied for this track. Use your status link to check progress.');
  }

  // Generate a unique public token for status checking
  const publicToken = crypto.randomBytes(16).toString('hex');

  const application = await Application.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || '',
    university: university?.trim() || '',
    major: major?.trim() || '',
    graduationYear: graduationYear ? Number(graduationYear) : undefined,
    track,
    portfolioUrl: portfolioUrl?.trim() || '',
    coverLetter: coverLetter?.trim() || '',
    cvPath: req.file.path,
    publicToken,
    stage: 'applied',
  });

  res.status(201).json({
    success: true,
    data: {
      id: application._id,
      publicToken: application.publicToken,
      fullName: application.fullName,
      email: application.email,
      track: application.track,
      stage: application.stage,
    },
  });
});

// GET /api/applications/status/:token  (public)
// Returns stage only — never leak reviewer notes.
export const getPublicStatus = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token || token.length < 10) {
    throw new ApiError(400, 'Invalid status token');
  }

  const application = await Application.findOne({ publicToken: token })
    .select('fullName email track stage createdAt');

  if (!application) {
    throw new ApiError(404, 'No application found for this token. Please check the link and try again.');
  }

  res.json({
    success: true,
    data: {
      fullName: application.fullName,
      email: application.email,
      track: application.track,
      stage: application.stage,
      appliedAt: application.createdAt,
    },
  });
});

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
