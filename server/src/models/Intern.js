import mongoose from 'mongoose';

const internSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    cohort: { type: String, required: true, trim: true },
    track: { type: String, required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['onboarding', 'active', 'completed', 'dropped'],
      default: 'onboarding',
    },
    onboardingChecklist: [
      {
        label: { type: String, required: true },
        done: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Intern', internSchema);
