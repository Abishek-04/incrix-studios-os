import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'login',
      'logout',
      'login_failed',
      'password_changed',
      'password_reset_requested',
      'password_reset_completed',

      // User Management
      'user_created',
      'user_updated',
      'user_deleted',
      'user_activated',
      'user_deactivated',
      'role_changed',
      'profile_updated',

      // Project Actions
      'project_created',
      'project_updated',
      'project_deleted',
      'project_archived',
      'project_unarchived',
      'project_assigned',
      'project_stage_changed',
      'project_status_changed',

      // Task Actions
      'task_created',
      'task_updated',
      'task_deleted',
      'task_completed',
      'task_uncompleted',
      'task_assigned',

      // Page Actions
      'page_created',
      'page_updated',
      'page_deleted',
      'page_published',

      // Channel Actions
      'channel_created',
      'channel_updated',
      'channel_deleted',

      // Instagram Actions
      'instagram_connected',
      'instagram_disconnected',
      'instagram_media_synced',
      'automation_created',
      'automation_updated',
      'automation_deleted',
      'automation_activated',
      'automation_paused',

      // Settings
      'settings_updated',
      'notification_settings_updated',
      'whatsapp_enabled',
      'whatsapp_disabled',

      // System
      'export_data',
      'import_data',
      'backup_created'
    ],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['auth', 'user', 'project', 'task', 'page', 'channel', 'instagram', 'settings', 'system'],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ category: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
