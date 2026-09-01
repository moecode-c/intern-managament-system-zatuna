import crypto from 'crypto';

import Application from '../models/Application.js';

import { asyncHandler } from '../utils/asyncHandler.js';
import { notImplemented } from '../utils/notImplemented.js';
import ApiError from '../utils/ApiError.js';



export const createApplication = asyncHandler(async (req, res) => {
  const publicToken = crypto.randomBytes(32).toString('hex');

  const application = await Application.create({
    ...req.body,
    cvPath: req.file.path,
    publicToken,
  });

  res.status(201).json({
    success: true,
    data: {
      id: application._id,
      publicToken: application.publicToken,
    },
  });
});


export const getPublicStatus = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    publicToken: req.params.token,
  }).select('stage fullName');

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  res.json({
    success: true,
    data: {
      stage: application.stage,
      name: application.fullName,
    },
  });
});


export const listApplications = asyncHandler(async (req, res) => {
  const { stage, track, q, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (stage) filter.stage = stage;

  if (track) filter.track = track;

  if (q) {
    filter.fullName = {
      $regex: q,
      $options: 'i',
    };
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),

    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      page: Number(page),
    },
  });
});


export const getApplication = notImplemented('ATS-DETAIL');


export const updateStage = notImplemented('ATS-STAGE');


export const addReview = notImplemented('ATS-REVIEW');