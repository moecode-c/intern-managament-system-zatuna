import mongoose from 'mongoose';
import Activity, { ACTIVITY_TYPES } from '../models/Activity.js';
import Intern from '../models/Intern.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const POPULATE_INTERN = { path: 'intern', select: 'name email role avatarUrl' };

function requireObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
}

function requiredText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${label} is required`);
  }
  return value.trim();
}

function optionalText(value, label) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new ApiError(400, `${label} must be a string`);
  return value.trim();
}

function parseDate(value, label, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return date;
}

function startOfUtcDay(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function nextUtcDay(date) {
  const next = startOfUtcDay(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

async function populatedActivity(activity) {
  await activity.populate(POPULATE_INTERN);
  return activity;
}

async function mentorInternIds(mentorId) {
  const records = await Intern.find({ mentor: mentorId }).select('user').lean();
  return records.map((record) => record.user);
}

// POST /api/activities  (intern)
export const createActivity = asyncHandler(async (req, res) => {
  const type = req.body.type ?? 'daily_log';
  if (!ACTIVITY_TYPES.includes(type)) throw new ApiError(400, 'Invalid activity type');

  const summary = requiredText(req.body.summary, 'Summary');
  const blockers = optionalText(req.body.blockers, 'Blockers') ?? '';
  const date = parseDate(req.body.date, 'activity date', new Date());
  const hours = req.body.hours === undefined || req.body.hours === '' ? 0 : Number(req.body.hours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
    throw new ApiError(400, 'Hours must be a number between 0 and 24');
  }

  if (type === 'check_in') {
    const duplicate = await Activity.exists({
      intern: req.user._id,
      type: 'check_in',
      date: { $gte: startOfUtcDay(date), $lt: nextUtcDay(date) },
    });
    if (duplicate) throw new ApiError(409, 'A check-in already exists for this date');
  }

  const activity = await Activity.create({
    intern: req.user._id,
    type,
    date,
    hours,
    summary,
    blockers,
  });

  res.status(201).json({ success: true, data: await populatedActivity(activity) });
});

// GET /api/activities  (any role)
export const listActivities = asyncHandler(async (req, res) => {
  const { intern, type, from, to } = req.query;
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 100, 200);
  const filter = {};

  if (req.user.role === 'intern') {
    filter.intern = req.user._id;
  } else if (req.user.role === 'mentor') {
    const allowedIds = await mentorInternIds(req.user._id);
    if (intern) {
      requireObjectId(intern, 'intern id');
      if (!allowedIds.some((id) => String(id) === String(intern))) {
        throw new ApiError(403, 'This intern is not assigned to you');
      }
      filter.intern = intern;
    } else {
      filter.intern = { $in: allowedIds };
    }
  } else if (intern) {
    requireObjectId(intern, 'intern id');
    filter.intern = intern;
  }

  if (type) {
    if (!ACTIVITY_TYPES.includes(type)) throw new ApiError(400, 'Invalid activity type');
    filter.type = type;
  }

  const fromDate = parseDate(from, 'start date');
  const toDate = parseDate(to, 'end date');
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = startOfUtcDay(fromDate);
    if (toDate) filter.date.$lt = nextUtcDay(toDate);
    if (fromDate && toDate && startOfUtcDay(fromDate) > startOfUtcDay(toDate)) {
      throw new ApiError(400, 'Start date must be on or before end date');
    }
  }

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .populate(POPULATE_INTERN)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Activity.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page, limit } });
});

// GET /api/activities/summary/:internId  (admin, mentor)
export const activitySummary = asyncHandler(async (req, res) => {
  const { internId } = req.params;
  requireObjectId(internId, 'intern id');

  const profileFilter = { user: internId };
  if (req.user.role === 'mentor') profileFilter.mentor = req.user._id;
  const profile = await Intern.findOne(profileFilter);
  if (!profile) {
    throw new ApiError(req.user.role === 'mentor' ? 403 : 404, 'Intern not found or not accessible');
  }

  const user = await User.findOne({ _id: internId, role: 'intern', isActive: true })
    .select('name email role avatarUrl');
  if (!user) throw new ApiError(404, 'Active intern not found');

  const rows = await Activity.aggregate([
    { $match: { intern: new mongoose.Types.ObjectId(internId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } },
        count: { $sum: 1 },
        hours: { $sum: '$hours' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const days = rows.map(({ _id, count, hours }) => ({ date: _id, count, hours }));
  const totalHours = days.reduce((total, day) => total + day.hours, 0);
  const totalEntries = days.reduce((total, day) => total + day.count, 0);

  res.json({
    success: true,
    data: { intern: user, totalHours, totalEntries, days },
  });
});
