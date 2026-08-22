import { notImplemented } from '../utils/notImplemented.js';

/**
 * DASHBOARD + REPORTING MODULE
 * Read-only aggregations across the other models. Use MongoDB aggregation
 * pipelines here rather than pulling everything into Node and counting.
 */

// GET /api/dashboard/admin  (admin)
// TODO: application funnel per stage, intern counts per cohort/status,
// active tasks, activity logs in the last 7 days.
export const adminDashboard = notImplemented('DASH-ADMIN');

// GET /api/dashboard/mentor  (mentor)
// TODO: my interns, their open tasks, who has not logged activity this week.
export const mentorDashboard = notImplemented('DASH-MENTOR');

// GET /api/dashboard/intern  (intern)
// TODO: my open tasks, my logged hours this week, my onboarding progress.
export const internDashboard = notImplemented('DASH-INTERN');
