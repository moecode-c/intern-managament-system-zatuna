import Task, { TASK_STATUSES } from '../models/Task.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * TASK ASSIGNMENT MODULE
 * Model: src/models/Task.js
 */

// POST /api/tasks  (admin, mentor)
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, dueDate, status } = req.body;

  if (status && !TASK_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid task status');
  }

  if (status && !['todo', 'in_progress'].includes(status)) {
    throw new ApiError(400, 'Tasks must start as todo or in_progress');
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee || assignee.role !== 'intern') {
    throw new ApiError(400, 'Tasks may only be assigned to interns');
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    dueDate,
    status,
  });

  res.status(201).json({ success: true, data: task });
});

// GET /api/tasks  (any role)
export const listTasks = asyncHandler(async (req, res) => {
  const { assignedTo, status, overdue, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (req.user.role === 'intern') {
    filter.assignedTo = req.user._id;
  } else if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (status) {
    if (!TASK_STATUSES.includes(status))
      throw new ApiError(400, 'Invalid task status');
    filter.status = status;
  }

  const now = new Date();
  if (overdue === 'true') {
    filter.dueDate = { $lt: now };
  } else if (overdue === 'false') {
    filter.$or = [{ dueDate: { $gte: now } }, { dueDate: { $exists: false } }];
  }

  const numericPage = Number(page);
  const numericLimit = Number(limit);

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email role avatarUrl')
      .populate('assignedBy', 'name email role avatarUrl')
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit),
    Task.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page: numericPage } });
});

// PATCH /api/tasks/:id/submit  (intern)
export const submitTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  if (!task.assignedTo.equals(req.user._id)) {
    throw new ApiError(403, 'Only the assignee may submit this task');
  }

  if (task.status === 'approved') {
    throw new ApiError(400, 'Approved tasks cannot be submitted');
  }

  if (!['todo', 'in_progress', 'rejected'].includes(task.status)) {
    throw new ApiError(400, 'Only pending or rejected tasks may be submitted');
  }

  task.status = 'submitted';
  task.submittedAt = new Date();
  task.submissionUrl = req.body.submissionUrl;
  await task.save();

  res.json({ success: true, data: task });
});

// PATCH /api/tasks/:id/review  (admin, mentor)
export const reviewTask = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body;

  if (
    !['approved', 'rejected'].includes(status) ||
    !TASK_STATUSES.includes(status)
  ) {
    throw new ApiError(400, 'Review status must be approved or rejected');
  }

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  if (task.status !== 'submitted') {
    throw new ApiError(400, 'Only submitted tasks may be reviewed');
  }

  task.status = status;
  task.reviewNotes = reviewNotes;
  await task.save();

  res.json({ success: true, data: task });
});
