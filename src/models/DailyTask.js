import mongoose from 'mongoose';

const { Schema } = mongoose;

const DailyTaskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true, enum: ['AM', 'PM'] },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    task: { type: String, required: true },
    done: { type: Boolean, default: false, index: true },
    // Project linking fields (optional)
    sourceProjectId: { type: String, index: true },
    projectType: { type: String, enum: ['content', 'design', 'dev'] }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
DailyTaskSchema.index({ date: 1, userId: 1 });
DailyTaskSchema.index({ userId: 1, done: 1 });
DailyTaskSchema.index({ date: 1, timeSlot: 1 });

export default mongoose.models.DailyTask || mongoose.model('DailyTask', DailyTaskSchema);
