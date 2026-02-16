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
      enum: [
        'info',
        'success',
        'warning',
        'error',
        'project_assigned',
        'project_reassigned',
        'comment_added',
        'comment_mention',
        'status_changed',
        'stage_changed',
        'task_created',
        'task_assigned',
        'due_date_approaching',
        'project_completed',
        'project-assignment',
        'comment',
        'mention',
        'stage-change',
        'due-date-approaching',
        'task-assignment',
        'project-blocked',
        'review-ready',
        'mograph-needed'
      ],
      index: true
    },
    read: { type: Boolean, default: false, index: true },
    relatedEntityType: {
      type: String,
      enum: ['project', 'user', 'channel', 'task']
    },
    relatedEntityId: { type: String },
    metadata: { type: Schema.Types.Mixed }, // Additional context data

    // WhatsApp delivery tracking fields
    whatsappMessageId: { type: String },
    whatsappStatus: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      index: true
    },
    whatsappSentAt: { type: Date },
    whatsappDeliveredAt: { type: Date },
    whatsappReadAt: { type: Date },
    whatsappError: { type: String }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// WhatsApp-specific indexes
NotificationSchema.index({ whatsappStatus: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, whatsappStatus: 1 });
NotificationSchema.index({ whatsappMessageId: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
