import { notImplemented } from '../utils/notImplemented.js';

/**
 * TASK ASSIGNMENT MODULE
 * Model: src/models/Task.js
 */

// POST /api/tasks  (admin, mentor)
// TODO: create a task, set assignedBy from req.user._id.
export const createTask = notImplemented('TASK-CREATE');

// GET /api/tasks  (any role)
// TODO: admins/mentors see all with filters; interns see only their own.
export const listTasks = notImplemented('TASK-LIST');

// PATCH /api/tasks/:id/submit  (intern)
// TODO: only the assignee may submit; set status 'submitted' + submittedAt + submissionUrl.
export const submitTask = notImplemented('TASK-SUBMIT');

// PATCH /api/tasks/:id/review  (admin, mentor)
// TODO: approve or reject a submitted task with reviewNotes.
export const reviewTask = notImplemented('TASK-REVIEW');
