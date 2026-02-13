import mongoose, { Schema, Document } from 'mongoose';

  id: string;
  date: string; // ISO date YYYY-MM-DD
  timeSlot: 'AM' | 'PM';
  userId: mongoose.Types.ObjectId;
  task: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;

const DailyTaskSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    timeSlot: { type: String, required: true, enum: ['AM', 'PM'] },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    task: { type: String, required: true },
    done: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
DailyTaskSchema.index({ date: 1, userId: 1 });
DailyTaskSchema.index({ userId: 1, done: 1 });
DailyTaskSchema.index({ date: 1, timeSlot: 1 });

export default mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);
