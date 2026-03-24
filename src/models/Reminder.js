import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReminderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    scheduledAt: { type: Date, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String },
    createdBy: { type: String, required: true, index: true },
    createdByName: { type: String },
    notified: { type: Boolean, default: false, index: true },
    notifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index for finding due reminders efficiently
ReminderSchema.index({ scheduledAt: 1, notified: 1 });

export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema);
