import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import Application from './models/Application.js';
import User from './models/User.js';

// Creates the first admin plus a few sample applications so the board is not empty.
async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: env.seedAdminEmail });
  if (existing) {
    console.log(`Admin ${env.seedAdminEmail} already exists - skipping user seed.`);
  } else {
    await User.create({
      name: 'El Zatuna Admin',
      email: env.seedAdminEmail,
      password: env.seedAdminPassword,
      role: 'admin',
    });
    console.log(`Created admin: ${env.seedAdminEmail}`);
  }

  if ((await Application.countDocuments()) === 0) {
    await Application.insertMany([
      {
        fullName: 'Sample Applicant One',
        email: 'sample1@example.com',
        university: 'Cairo University',
        major: 'Computer Science',
        graduationYear: 2027,
        track: 'frontend',
        stage: 'applied',
      },
      {
        fullName: 'Sample Applicant Two',
        email: 'sample2@example.com',
        university: 'Ain Shams University',
        major: 'Software Engineering',
        graduationYear: 2026,
        track: 'backend',
        stage: 'screening',
      },
    ]);
    console.log('Inserted 2 sample applications.');
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
