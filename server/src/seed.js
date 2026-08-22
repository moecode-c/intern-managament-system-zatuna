import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import Activity from './models/Activity.js';
import Application from './models/Application.js';
import Intern from './models/Intern.js';
import Task from './models/Task.js';
import User from './models/User.js';

/**
 * Seeds a full local dataset so every screen has something to render.
 *
 *   npm run seed          - seeds only if the database looks empty
 *   npm run seed -- fresh - wipes the collections first, then seeds
 *
 * Every seeded account shares the same password (env.seedAdminPassword) so you
 * can log in as each role while developing. This is local dev data only.
 */

const FRESH = process.argv.includes('fresh');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
};

const CHECKLIST = [
  'Sign the internship agreement',
  'Submit ID document',
  'Set up development environment',
  'Get repository access',
  'Meet your mentor',
  'Complete the codebase walkthrough',
];

export async function runSeed() {
  if (FRESH) {
    await Promise.all([
      User.deleteMany({}),
      Application.deleteMany({}),
      Intern.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('Wiped all collections (fresh run).');
  } else if (await User.countDocuments()) {
    console.log('Database already has users - nothing to do.');
    console.log('Run `npm run seed -- fresh` to wipe and reseed.');
    return;
  }

  const password = env.seedAdminPassword;

  // --- users -------------------------------------------------------------
  // create() runs the pre-save hook so passwords get hashed. insertMany does not.
  const admin = await User.create({
    name: 'El Zatuna Admin',
    email: env.seedAdminEmail,
    password,
    role: 'admin',
  });

  const mentorSara = await User.create({
    name: 'Sara Mentor',
    email: 'sara.mentor@elzatuna.local',
    password,
    role: 'mentor',
  });
  const mentorKarim = await User.create({
    name: 'Karim Mentor',
    email: 'karim.mentor@elzatuna.local',
    password,
    role: 'mentor',
  });

  const internUsers = [];
  for (const [name, email] of [
    ['Nour Hassan', 'nour@elzatuna.local'],
    ['Yousef Adel', 'yousef@elzatuna.local'],
    ['Salma Tarek', 'salma@elzatuna.local'],
    ['Hana Magdy', 'hana@elzatuna.local'],
  ]) {
    internUsers.push(await User.create({ name, email, password, role: 'intern' }));
  }

  // --- applications, one per stage ---------------------------------------
  const applications = await Application.insertMany([
    { fullName: 'Layla Mostafa', email: 'layla@example.com', university: 'Cairo University', major: 'Computer Science', graduationYear: 2027, track: 'frontend', stage: 'applied', publicToken: 'demo-token-layla' },
    { fullName: 'Kareem Fathy', email: 'kareem@example.com', university: 'Ain Shams University', major: 'Software Engineering', graduationYear: 2026, track: 'backend', stage: 'applied', publicToken: 'demo-token-kareem' },
    { fullName: 'Nada Sherif', email: 'nada@example.com', university: 'Alexandria University', major: 'Information Systems', graduationYear: 2027, track: 'fullstack', stage: 'screening', publicToken: 'demo-token-nada' },
    { fullName: 'Tarek Wael', email: 'tarek@example.com', university: 'Helwan University', major: 'Computer Engineering', graduationYear: 2026, track: 'qa', stage: 'interview', publicToken: 'demo-token-tarek' },
    { fullName: 'Farida Gamal', email: 'farida@example.com', university: 'Cairo University', major: 'Data Science', graduationYear: 2025, track: 'data', stage: 'offer', publicToken: 'demo-token-farida' },
    { fullName: 'Omar Reda', email: 'omar.reda@example.com', university: 'MIU', major: 'Computer Science', graduationYear: 2027, track: 'mobile', stage: 'rejected', publicToken: 'demo-token-omar' },
  ]);

  // Reviews, so the ATS detail view is not empty.
  const interviewed = applications.find((a) => a.stage === 'interview');
  interviewed.reviews.push(
    { reviewer: mentorSara._id, score: 4, notes: 'Strong fundamentals, a little shaky on async.' },
    { reviewer: mentorKarim._id, score: 5, notes: 'Great communication. Would take on the team.' }
  );
  await interviewed.save();

  // --- interns across two cohorts ----------------------------------------
  const cohorts = ['Summer 2026', 'Summer 2026', 'Autumn 2026', 'Autumn 2026'];
  const tracks = ['frontend', 'backend', 'fullstack', 'data'];
  const mentors = [mentorSara, mentorKarim, mentorSara, mentorKarim];
  const statuses = ['active', 'active', 'onboarding', 'active'];

  const interns = [];
  for (let i = 0; i < internUsers.length; i++) {
    interns.push(
      await Intern.create({
        user: internUsers[i]._id,
        application: applications[i]._id,
        cohort: cohorts[i],
        track: tracks[i],
        mentor: mentors[i]._id,
        startDate: daysAgo(30 - i * 5),
        status: statuses[i],
        // Earlier interns have more of the checklist done.
        onboardingChecklist: CHECKLIST.map((label, idx) => ({
          label,
          done: idx < 4 - i,
          completedAt: idx < 4 - i ? daysAgo(28 - idx) : undefined,
        })),
      })
    );
  }

  // --- tasks, one per status --------------------------------------------
  await Task.insertMany([
    { title: 'Build the login screen', description: 'Follow the design in Figma.', assignedTo: internUsers[0]._id, assignedBy: mentorSara._id, dueDate: daysAgo(-3), status: 'in_progress' },
    { title: 'Write the applications table', description: 'Use the existing list endpoint.', assignedTo: internUsers[0]._id, assignedBy: mentorSara._id, dueDate: daysAgo(2), status: 'submitted', submissionUrl: 'https://github.com/example/pr/1', submittedAt: daysAgo(1) },
    { title: 'Set up the Mongoose models', assignedTo: internUsers[1]._id, assignedBy: mentorKarim._id, dueDate: daysAgo(5), status: 'approved', submissionUrl: 'https://github.com/example/pr/2', submittedAt: daysAgo(6), reviewNotes: 'Clean work.' },
    { title: 'Add pagination to the intern list', assignedTo: internUsers[1]._id, assignedBy: mentorKarim._id, dueDate: daysAgo(-7), status: 'todo' },
    { title: 'Read the codebase walkthrough', assignedTo: internUsers[2]._id, assignedBy: mentorSara._id, dueDate: daysAgo(-2), status: 'todo' },
    { title: 'Fix the date filter bug', assignedTo: internUsers[3]._id, assignedBy: mentorKarim._id, dueDate: daysAgo(4), status: 'rejected', submissionUrl: 'https://github.com/example/pr/3', submittedAt: daysAgo(3), reviewNotes: 'Off-by-one on the end date - please retry.' },
    // Deliberately overdue, so overdue highlighting has something to show.
    { title: 'Document the API endpoints', assignedTo: internUsers[0]._id, assignedBy: mentorSara._id, dueDate: daysAgo(9), status: 'todo' },
  ]);

  // --- activity logs over the last two weeks -----------------------------
  const activities = [];
  internUsers.forEach((user, userIdx) => {
    for (let day = 1; day <= 14; day++) {
      const date = daysAgo(day);
      const weekday = date.getDay();
      if (weekday === 5 || weekday === 6) continue; // skip Fri/Sat weekend
      // The last intern has logged nothing this week, so the
      // "who has not checked in" view is not empty.
      if (userIdx === 3 && day <= 7) continue;

      activities.push({
        intern: user._id,
        type: day % 5 === 0 ? 'check_in' : 'daily_log',
        date,
        hours: 4 + ((day + userIdx) % 5),
        summary: `Worked on module tasks (day ${day}).`,
        blockers: day % 6 === 0 ? 'Waiting on API review.' : '',
      });
    }
  });
  await Activity.insertMany(activities);

  // --- report ------------------------------------------------------------
  const counts = {
    users: await User.countDocuments(),
    applications: await Application.countDocuments(),
    interns: await Intern.countDocuments(),
    tasks: await Task.countDocuments(),
    activities: await Activity.countDocuments(),
  };

  console.log('\nSeed complete:');
  console.table(counts);
  console.log(`All seeded accounts use the password: ${password}\n`);
  console.log(`  admin   ${admin.email}`);
  console.log(`  mentor  ${mentorSara.email}`);
  console.log(`  mentor  ${mentorKarim.email}`);
  internUsers.forEach((u) => console.log(`  intern  ${u.email}`));
  console.log(`\nCohorts: ${[...new Set(interns.map((i) => i.cohort))].join(', ')}`);

  return counts;
}

// Only connect and disconnect when run directly, so tests can import runSeed.
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');

if (isDirectRun) {
  connectDB()
    .then(runSeed)
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error('Seed failed:', err.message);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}
