import mongoose, { Schema, Document } from 'mongoose';

  id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  relatedEntityType?: 'project' | 'user' | 'channel' | 'task';
  relatedEntityId?: string;
  createdAt: Date;

const NotificationSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
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

export default mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
