import { notImplemented } from '../utils/notImplemented.js';

/**
 * ACTIVITY + ATTENDANCE MODULE
 * Model: src/models/Activity.js
 */

// POST /api/activities  (intern)
// TODO: create a log for req.user._id - reject a second check_in on the same date.
export const createActivity = notImplemented('ACT-LOG');

// GET /api/activities  (any role)
// TODO: interns see their own; mentors see their assigned interns; admins see all.
// Support ?from=&to=&intern= date-range filters.
export const listActivities = notImplemented('ACT-LIST');

// GET /api/activities/summary/:internId  (admin, mentor)
// TODO: aggregate total hours and per-day counts for the heatmap.
export const activitySummary = notImplemented('ACT-SUMMARY');
