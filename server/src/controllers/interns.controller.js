import { notImplemented } from '../utils/notImplemented.js';

/**
 * INTERN RECORDS + ONBOARDING MODULE
 * Models: src/models/Intern.js, src/models/User.js
 */

// POST /api/interns/from-application/:applicationId  (admin)
// TODO: create a User with role 'intern', create the linked Intern record,
// seed onboardingChecklist from the default template, mark the application 'accepted'.
export const convertApplicant = notImplemented('INTERN-CONVERT');

// GET /api/interns  (admin, mentor)
// TODO: list with cohort/status/mentor filters, populate user + mentor names.
export const listInterns = notImplemented('INTERN-LIST');

// GET /api/interns/:id  (admin, mentor, or the intern themselves)
// TODO: return the profile; block interns from reading other interns' records.
export const getIntern = notImplemented('INTERN-DETAIL');

// PATCH /api/interns/:id  (admin)
// TODO: update cohort, mentor, dates, status.
export const updateIntern = notImplemented('INTERN-UPDATE');

// PATCH /api/interns/:id/checklist/:itemId  (admin, mentor)
// TODO: toggle a checklist item and stamp completedAt.
export const toggleChecklistItem = notImplemented('INTERN-CHECKLIST');
