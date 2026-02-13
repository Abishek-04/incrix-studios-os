import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['info', 'success', 'warning', 'error']
    },
    read: { type: Boolean, default: false, index: true },
    relatedEntityType: {
      type: String,
      enum: ['project', 'user', 'channel', 'task']
    },
    relatedEntityId: { type: String }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
