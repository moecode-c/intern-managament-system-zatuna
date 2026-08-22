import mongoose from 'mongoose';

export const APPLICATION_STAGES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
];

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 1, max: 5 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const applicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    university: { type: String, trim: true },
    major: { type: String, trim: true },
    graduationYear: { type: Number },
    track: {
      type: String,
      enum: ['frontend', 'backend', 'fullstack', 'mobile', 'design', 'qa', 'data'],
      required: true,
    },
    portfolioUrl: { type: String, trim: true },
    cvPath: { type: String, default: '' },
    coverLetter: { type: String, default: '' },
    stage: { type: String, enum: APPLICATION_STAGES, default: 'applied' },
    reviews: [reviewSchema],
    publicToken: { type: String, index: true },
  },
  { timestamps: true }
);

applicationSchema.index({ email: 1, track: 1 });

export default mongoose.model('Application', applicationSchema);
