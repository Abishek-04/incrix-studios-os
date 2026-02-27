/**
 * Activity Logging Utility
 * Tracks all user actions for analytics and audit trails
 */

// Activity log storage (in-memory, can be replaced with database)
let activityLogs = [];

export const ACTIVITY_TYPES = {
  // Project actions
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_ARCHIVED: 'project_archived',
  PROJECT_STAGE_CHANGED: 'project_stage_changed',
  PROJECT_ASSIGNED: 'project_assigned',

  // Task actions
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_DELETED: 'task_deleted',
  TASK_ASSIGNED: 'task_assigned',

  // User actions
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',

  // Page actions
  PAGE_CREATED: 'page_created',
  PAGE_UPDATED: 'page_updated',
  PAGE_DELETED: 'page_deleted',

  // Comment actions
  COMMENT_ADDED: 'comment_added',
  COMMENT_DELETED: 'comment_deleted',

  // System actions
  SETTINGS_CHANGED: 'settings_changed',
  CHANNEL_CREATED: 'channel_created',
  CHANNEL_UPDATED: 'channel_updated'
};

/**
 * Log an activity
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User who performed the action
 * @param {string} params.userName - User's display name
 * @param {string} params.userRole - User's role
 * @param {string} params.type - Activity type from ACTIVITY_TYPES
 * @param {string} params.action - Human-readable action (created, updated, etc.)
 * @param {string} params.entityType - Type of entity (project, task, user, etc.)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.entityTitle - Title/name of the entity
 * @param {Object} params.metadata - Additional data
 * @returns {Object} The created activity log entry
 */
export const logActivity = ({
  userId,
  userName,
  userRole,
  type,
  action,
  entityType,
  entityId,
  entityTitle,
  metadata = {}
}) => {
  const log = {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    userRole,
    type,
    action,
    entityType,
    entityId,
    entityTitle,
    metadata,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };

  activityLogs.unshift(log); // Add to beginning

  // Keep only last 1000 logs in memory
  if (activityLogs.length > 1000) {
    activityLogs = activityLogs.slice(0, 1000);
  }

  // In production, save to database here
  console.log('[Activity Log]', log);

  return log;
};

/**
 * Get all activity logs
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered activity logs
 */
export const getActivityLogs = (filters = {}) => {
  let logs = [...activityLogs];

  // Filter by user
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }

  // Filter by type
  if (filters.type) {
    logs = logs.filter(log => log.type === filters.type);
  }

  // Filter by entity type
  if (filters.entityType) {
    logs = logs.filter(log => log.entityType === filters.entityType);
  }

  // Filter by date range
  if (filters.startDate) {
    logs = logs.filter(log => log.timestamp >= new Date(filters.startDate).getTime());
  }

  if (filters.endDate) {
    logs = logs.filter(log => log.timestamp <= new Date(filters.endDate).getTime());
  }

  // Limit results
  if (filters.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
};

/**
 * Get activity logs for a specific entity
 */
export const getEntityActivityLogs = (entityType, entityId, limit = 50) => {
  return activityLogs
    .filter(log => log.entityType === entityType && log.entityId === entityId)
    .slice(0, limit);
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = (userId, timeRange = 'week') => {
  const now = Date.now();
  const startDate = new Date();

  if (timeRange === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeRange === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (timeRange === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const userLogs = activityLogs.filter(
    log => log.userId === userId && log.timestamp >= startDate.getTime()
  );

  return {
    totalActivities: userLogs.length,
    byType: userLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {}),
    recentActivities: userLogs.slice(0, 10)
  };
};

/**
 * Clear old activity logs (for cleanup)
 */
export const clearOldLogs = (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffTimestamp = cutoffDate.getTime();

  activityLogs = activityLogs.filter(log => log.timestamp >= cutoffTimestamp);
  return activityLogs.length;
};

/**
 * Export activity logs to JSON
 */
export const exportActivityLogs = (filters = {}) => {
  const logs = getActivityLogs(filters);
  return JSON.stringify(logs, null, 2);
};

// Convenience functions for common actions
export const logProjectAction = (action, project, user) => {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    type: ACTIVITY_TYPES[`PROJECT_${action.toUpperCase()}`],
    action: action,
    entityType: 'project',
    entityId: project.id,
    entityTitle: project.title,
    metadata: {
      stage: project.stage,
      status: project.status,
      creator: project.creator,
      editor: project.editor,
      editors: Array.isArray(project.editors) ? project.editors : []
    }
  });
};

export const logTaskAction = (action, task, user) => {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    type: ACTIVITY_TYPES[`TASK_${action.toUpperCase()}`],
    action: action,
    entityType: 'task',
    entityId: task.id,
    entityTitle: task.title || task.task,
    metadata: {
      status: task.status,
      assignee: task.assigneeId,
      dueDate: task.dueDate
    }
  });
};

export const logUserAction = (action, targetUser, performedByUser) => {
  return logActivity({
    userId: performedByUser.id,
    userName: performedByUser.name,
    userRole: performedByUser.role,
    type: ACTIVITY_TYPES[`USER_${action.toUpperCase()}`],
    action: action,
    entityType: 'user',
    entityId: targetUser.id,
    entityTitle: targetUser.name,
    metadata: {
      role: targetUser.role,
      email: targetUser.email
    }
  });
};

export const logPageAction = (action, page, user) => {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    type: ACTIVITY_TYPES[`PAGE_${action.toUpperCase()}`],
    action: action,
    entityType: 'page',
    entityId: page.id,
    entityTitle: page.title,
    metadata: {
      type: page.type,
      blocks: page.blocks?.length || 0
    }
  });
};

export default {
  logActivity,
  getActivityLogs,
  getEntityActivityLogs,
  getUserActivitySummary,
  clearOldLogs,
  exportActivityLogs,
  logProjectAction,
  logTaskAction,
  logUserAction,
  logPageAction,
  ACTIVITY_TYPES
};
