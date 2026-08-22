import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'submitted', 'approved', 'rejected'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    submissionUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
