import mongoose from 'mongoose';
import Task, { TASK_STATUSES } from '../models/Task.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const STAFF_ROLES = new Set(['admin', 'mentor']);
const SUBMITTABLE_STATUSES = new Set(['todo', 'in_progress', 'rejected']);
const REVIEW_STATUSES = new Set(['approved', 'rejected']);
const POPULATE_USERS = [
  { path: 'assignedTo', select: 'name email role avatarUrl' },
  { path: 'assignedBy', select: 'name email role avatarUrl' },
];

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

function parseDate(value, label) {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return date;
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function populatedTask(task) {
  await task.populate(POPULATE_USERS);
  return task;
}

// POST /api/tasks  (admin, mentor)
export const createTask = asyncHandler(async (req, res) => {
  const title = requiredText(req.body.title, 'Title');
  const description = optionalText(req.body.description, 'Description') ?? '';
  const { assignedTo } = req.body;
  requireObjectId(assignedTo, 'assignee');

  const assignee = await User.findOne({ _id: assignedTo, role: 'intern', isActive: true });
  if (!assignee) throw new ApiError(404, 'Active intern not found');

  const task = await Task.create({
    title,
    description,
    assignedTo: assignee._id,
    assignedBy: req.user._id,
    dueDate: parseDate(req.body.dueDate, 'due date'),
  });

  res.status(201).json({ success: true, data: await populatedTask(task) });
});

// GET /api/tasks  (any role)
export const listTasks = asyncHandler(async (req, res) => {
  const { status, assignedTo, assignedBy, q, from, to } = req.query;
  const page = positiveInteger(req.query.page, 1);
  const limit = positiveInteger(req.query.limit, 100, 200);
  const filter = {};

  if (req.user.role === 'intern') {
    filter.assignedTo = req.user._id;
  } else if (STAFF_ROLES.has(req.user.role)) {
    if (assignedTo) {
      requireObjectId(assignedTo, 'assignee');
      filter.assignedTo = assignedTo;
    }
    if (assignedBy) {
      requireObjectId(assignedBy, 'assigner');
      filter.assignedBy = assignedBy;
    }
  }

  if (status) {
    if (!TASK_STATUSES.includes(status)) throw new ApiError(400, 'Invalid task status');
    filter.status = status;
  }
  if (q) {
    if (typeof q !== 'string') throw new ApiError(400, 'Search query must be a string');
    const search = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const dueFrom = parseDate(from, 'start date');
  const dueTo = parseDate(to, 'end date');
  if (dueFrom || dueTo) {
    filter.dueDate = {};
    if (dueFrom) filter.dueDate.$gte = dueFrom;
    if (dueTo) {
      dueTo.setUTCHours(23, 59, 59, 999);
      filter.dueDate.$lte = dueTo;
    }
    if (dueFrom && dueTo && dueFrom > dueTo) {
      throw new ApiError(400, 'Start date must be on or before end date');
    }
  }

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate(POPULATE_USERS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page, limit } });
});

// PATCH /api/tasks/:id/submit  (intern)
export const submitTask = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, 'task id');
  const submissionUrl = requiredText(req.body.submissionUrl, 'Submission URL');
  if (!isWebUrl(submissionUrl)) {
    throw new ApiError(400, 'Submission URL must use http or https');
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  if (String(task.assignedTo) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the assigned intern may submit this task');
  }
  if (!SUBMITTABLE_STATUSES.has(task.status)) {
    throw new ApiError(409, `A task with status '${task.status}' cannot be submitted`);
  }

  task.status = 'submitted';
  task.submissionUrl = submissionUrl;
  task.submittedAt = new Date();
  task.reviewNotes = '';
  await task.save();

  res.json({ success: true, data: await populatedTask(task) });
});

// PATCH /api/tasks/:id/review  (admin, mentor)
export const reviewTask = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, 'task id');
  const { status } = req.body;
  if (!REVIEW_STATUSES.has(status)) {
    throw new ApiError(400, "Review status must be 'approved' or 'rejected'");
  }
  const reviewNotes = optionalText(req.body.reviewNotes, 'Review notes') ?? '';

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.status !== 'submitted') {
    throw new ApiError(409, 'Only submitted tasks can be reviewed');
  }

  task.status = status;
  task.reviewNotes = reviewNotes;
  await task.save();

  res.json({ success: true, data: await populatedTask(task) });
});
