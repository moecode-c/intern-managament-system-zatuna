import Intern from "../models/Intern.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import { notImplemented } from "../utils/notImplemented.js";
import mongoose from "mongoose";

/**
 * INTERN RECORDS + ONBOARDING MODULE
 * Models: src/models/Intern.js, src/models/User.js
 */

// POST /api/interns/from-application/:applicationId  (admin)
// TODO: create a User with role 'intern', create the linked Intern record,
// seed onboardingChecklist from the default template, mark the application 'accepted'.
export const convertApplicant = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;

  const application = await Application.findById(applicationId);

  if (!application) throw new ApiError(404, "Application not found");
  if (application.stage !== "accepted")
    throw new ApiError(400, "User is not accepted to be an intern");
  if (await Intern.findOne({ application: applicationId }))
    throw new ApiError(409, "Applicant already converted");

  const fullName = application.fullName;
  const email = application.email;
  const tempPassword = crypto.randomBytes(6).toString("hex");

  if ((await User.find({ email: email })).length > 0)
    throw new ApiError(409, "Email already registered");

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    const newUser = await User.create(
      {
        name: fullName,
        email: email,
        password: tempPassword,
        role: "intern",
      },
      { session },
    );

    const userId = newUser._id;
    const cohort = "Summer 2026";
    const track = application.track;
    const status = "onboarding";
    const onboardingChecklist = [
      {
        label: "Sign the internship agreement",
        done: false,
      },
      {
        label: "Submit ID document",
        done: false,
      },
      {
        label: "Set up development environment",
        done: false,
      },
      {
        label: "Get repository access",
        done: false,
      },
      {
        label: "Meet your mentor",
        done: false,
      },
      {
        label: "Complete the codebase walkthrough",
        done: false,
      },
    ];
    const startDate = new Date();

    await Intern.create(
      {
        user: userId,
        application: applicationId,
        cohort: cohort,
        track: track,
        startDate: startDate,
        status: status,
        onboardingChecklist: onboardingChecklist,
      },
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }

  return res.json({
    success: true,
    data: {
      password: tempPassword,
      warning: "This temporary password will only be shown once. Store it securely"
    }
  });
});

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