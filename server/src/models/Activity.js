import mongoose from 'mongoose';

export const ACTIVITY_TYPES = ['check_in', 'daily_log', 'note'];

const activitySchema = new mongoose.Schema(
  {
    intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, default: 'daily_log' },
    date: { type: Date, required: true, default: () => new Date() },
    hours: { type: Number, min: 0, max: 24, default: 0 },
    summary: { type: String, required: true },
    blockers: { type: String, default: '' },
  },
  { timestamps: true }
);

activitySchema.index({ intern: 1, date: -1 });

export default mongoose.model('Activity', activitySchema);
