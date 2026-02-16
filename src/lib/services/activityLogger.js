import { v4 as uuidv4 } from 'uuid';
import ActivityLog from '../../models/ActivityLog.js';
import connectDB from '../mongodb.js';

/**
 * Central Activity Logging Service
 * Tracks all user actions with timestamps and metadata
 */

// Action categories for organization
const CATEGORIES = {
  AUTH: 'auth',
  USER: 'user',
  PROJECT: 'project',
  TASK: 'task',
  PAGE: 'page',
  CHANNEL: 'channel',
  INSTAGRAM: 'instagram',
  SETTINGS: 'settings',
  SYSTEM: 'system'
};

/**
 * Log an activity
 */
export async function logActivity({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  category,
  description,
  metadata = {},
  ipAddress = null,
  userAgent = null
}) {
  try {
    await connectDB();

    const activity = await ActivityLog.create({
      id: uuidv4(),
      userId,
      userName,
      userEmail,
      userRole,
      action,
      category,
      description,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    console.log(`[ActivityLog] ${action}: ${description}`);
    return activity;
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
    // Don't throw - logging should never break the main flow
    return null;
  }
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs({
  userId = null,
  action = null,
  category = null,
  startDate = null,
  endDate = null,
  limit = 100,
  skip = 0
}) {
  try {
    await connectDB();

    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ActivityLog.countDocuments(query);

    return { logs, total };
  } catch (error) {
    console.error('[ActivityLog] Error fetching logs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get activity summary/statistics
 */
export async function getActivitySummary({ userId = null, startDate = null, endDate = null }) {
  try {
    await connectDB();

    const matchStage = {};
    if (userId) matchStage.userId = userId;
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const [byCategory, byAction, byUser] = await Promise.all([
      // Activities by category
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]),

      // Activities by action
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Activities by user (if not filtering by specific user)
      userId ? Promise.resolve([]) : ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$userId',
            userName: { $first: '$userName' },
            userRole: { $first: '$userRole' },
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      byCategory,
      byAction,
      byUser
    };
  } catch (error) {
    console.error('[ActivityLog] Error fetching summary:', error);
    return { byCategory: [], byAction: [], byUser: [] };
  }
}

/**
 * Get user's recent activity
 */
export async function getUserRecentActivity(userId, limit = 20) {
  try {
    await connectDB();

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return logs;
  } catch (error) {
    console.error('[ActivityLog] Error fetching user activity:', error);
    return [];
  }
}

/**
 * Authentication Activity Loggers
 */
export async function logLogin(user, ipAddress = null, userAgent = null) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'login',
    category: CATEGORIES.AUTH,
    description: `${user.name} logged in`,
    ipAddress,
    userAgent
  });
}

export async function logLogout(user) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'logout',
    category: CATEGORIES.AUTH,
    description: `${user.name} logged out`
  });
}

export async function logLoginFailed(email, ipAddress = null, userAgent = null) {
  return logActivity({
    userId: 'anonymous',
    userName: 'Unknown',
    userEmail: email || 'unknown',
    userRole: 'none',
    action: 'login_failed',
    category: CATEGORIES.AUTH,
    description: `Failed login attempt for ${email}`,
    metadata: { email },
    ipAddress,
    userAgent
  });
}

export async function logPasswordChange(user) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'password_changed',
    category: CATEGORIES.AUTH,
    description: `${user.name} changed their password`
  });
}

/**
 * User Management Activity Loggers
 */
export async function logUserCreated(newUser, currentUser) {
  return logActivity({
    userId: currentUser.id,
    userName: currentUser.name,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    action: 'user_created',
    category: CATEGORIES.USER,
    description: `${currentUser.name} created user: ${newUser.name}`,
    metadata: { createdUserId: newUser.id, createdUserRole: newUser.role }
  });
}

export async function logUserUpdated(updatedUser, currentUser, changes = {}) {
  return logActivity({
    userId: currentUser.id,
    userName: currentUser.name,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    action: 'user_updated',
    category: CATEGORIES.USER,
    description: `${currentUser.name} updated user: ${updatedUser.name}`,
    metadata: { updatedUserId: updatedUser.id, changes }
  });
}

export async function logProfileUpdated(user, changes = {}) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'profile_updated',
    category: CATEGORIES.USER,
    description: `${user.name} updated their profile`,
    metadata: { changes }
  });
}

/**
 * Settings Activity Loggers
 */
export async function logSettingsUpdated(user, settingType, changes = {}) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'settings_updated',
    category: CATEGORIES.SETTINGS,
    description: `${user.name} updated ${settingType} settings`,
    metadata: { settingType, changes }
  });
}

export async function logNotificationSettingsUpdated(user, changes = {}) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'notification_settings_updated',
    category: CATEGORIES.SETTINGS,
    description: `${user.name} updated notification settings`,
    metadata: { changes }
  });
}

export async function logWhatsAppEnabled(user, phoneNumber) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'whatsapp_enabled',
    category: CATEGORIES.SETTINGS,
    description: `${user.name} enabled WhatsApp notifications`,
    metadata: { phoneNumber }
  });
}

/**
 * Project Activity Loggers
 */
export async function logProjectCreated(project, user) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'project_created',
    category: CATEGORIES.PROJECT,
    description: `${user.name} created project: ${project.title}`,
    metadata: { projectId: project.id, projectType: project.projectType }
  });
}

export async function logProjectUpdated(project, user, changes = {}) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'project_updated',
    category: CATEGORIES.PROJECT,
    description: `${user.name} updated project: ${project.title}`,
    metadata: { projectId: project.id, changes }
  });
}

/**
 * Instagram Activity Loggers
 */
export async function logInstagramConnected(user, accountName) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'instagram_connected',
    category: CATEGORIES.INSTAGRAM,
    description: `${user.name} connected Instagram account: ${accountName}`,
    metadata: { accountName }
  });
}

export async function logAutomationCreated(user, automationName) {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action: 'automation_created',
    category: CATEGORIES.INSTAGRAM,
    description: `${user.name} created automation: ${automationName}`,
    metadata: { automationName }
  });
}

export default {
  logActivity,
  getActivityLogs,
  getActivitySummary,
  getUserRecentActivity,
  logLogin,
  logLogout,
  logLoginFailed,
  logPasswordChange,
  logUserCreated,
  logUserUpdated,
  logProfileUpdated,
  logSettingsUpdated,
  logNotificationSettingsUpdated,
  logWhatsAppEnabled,
  logProjectCreated,
  logProjectUpdated,
  logInstagramConnected,
  logAutomationCreated
};
