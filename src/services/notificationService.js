import { v4 as uuidv4 } from 'uuid';
import connectDB from '../lib/mongodb.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { queueWhatsAppNotification } from '../lib/queue.js';
import { formatWhatsAppMessage } from './whatsappService.js';

const getNotificationTitle = (type) => {
  const titles = {
    project_assigned: 'Project Assigned',
    project_reassigned: 'Project Reassigned',
    comment_added: 'New Comment',
    comment_mention: 'You were mentioned',
    status_changed: 'Status Updated',
    stage_changed: 'Stage Updated',
    task_created: 'New Task',
    task_assigned: 'Task Assigned',
    due_date_approaching: 'Deadline Approaching',
    project_completed: 'Project Completed',
    'project-assignment': 'Project Assigned',
    'comment': 'New Comment',
    'mention': 'You were mentioned',
    'stage-change': 'Stage Updated',
    'due-date-approaching': 'Deadline Approaching',
    'task-assignment': 'Task Assigned',
    'project-blocked': 'Project Blocked',
    'review-ready': 'Review Needed',
    'mograph-needed': 'Motion Graphics Needed'
  };
  return titles[type] || 'Notification';
};

/**
 * Create notification and optionally send via WhatsApp
 * @param {Object} notification
 * @returns {Promise<Object>}
 */
async function createNotification(notification) {
  try {
    await connectDB();

    const notificationId = uuidv4();
    const notificationData = {
      id: notificationId,
      title: getNotificationTitle(notification.type),
      ...notification,
      createdAt: new Date(),
      read: false,
    };

    // Save to database (in-app notification)
    const savedNotification = await Notification.create(notificationData);

    // Check if user wants WhatsApp notifications
    const user = await User.findOne({ id: notification.userId });
    if (user && user.notifyViaWhatsapp && user.phoneNumber) {
      // Format message
      const message = formatWhatsAppMessage(notification.type, {
        projectTitle: notification.metadata?.projectTitle || notificationData.title,
        projectId: notification.relatedEntityId,
        ...notification.metadata,
      });

      // Queue WhatsApp job
      await queueWhatsAppNotification({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        message,
        notificationId,
      });

      console.log(`[NotificationService] Queued WhatsApp for user ${user.id}`);
    }

    return savedNotification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    // Return a notification object even if save fails (for backward compatibility)
    return {
      id: uuidv4(),
      title: getNotificationTitle(notification.type),
      ...notification,
      timestamp: Date.now(),
      read: false,
    };
  }
}

export const NotificationService = {
  /**
   * Create notification when user is assigned to a project
   */
  notifyProjectAssignment: async (assigneeId, projectId, projectTitle) => {
    return createNotification({
      userId: assigneeId,
      type: 'project-assignment',
      message: `You've been assigned to: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle },
    });
  },

  /**
   * Create notification when user is reassigned
   */
  notifyProjectReassignment: async (newAssigneeId, oldAssigneeName, projectId, projectTitle) => {
    return createNotification({
      userId: newAssigneeId,
      type: 'project_reassigned',
      message: `You've been reassigned from ${oldAssigneeName} on: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, oldAssigneeName },
    });
  },

  /**
   * Create notification when someone comments on a project
   */
  notifyComment: async (recipientId, commenterName, projectId, projectTitle) => {
    return createNotification({
      userId: recipientId,
      type: 'comment',
      message: `${commenterName} commented on: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, commenterName },
    });
  },

  /**
   * Create notification when user is @mentioned in a comment
   */
  notifyMention: async (mentionedUserId, commenterName, projectId, projectTitle) => {
    return createNotification({
      userId: mentionedUserId,
      type: 'mention',
      message: `${commenterName} mentioned you in: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, commenterName },
    });
  },

  /**
   * Create notification when project status changes
   */
  notifyStatusChange: async (recipientId, projectId, projectTitle, oldStatus, newStatus) => {
    return createNotification({
      userId: recipientId,
      type: 'status_changed',
      message: `${projectTitle} status changed from ${oldStatus} to ${newStatus}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, oldStatus, newStatus },
    });
  },

  /**
   * Create notification when project stage changes
   */
  notifyStageChange: async (recipientId, projectId, projectTitle, newStage) => {
    return createNotification({
      userId: recipientId,
      type: 'stage-change',
      message: `${projectTitle} moved to ${newStage} stage`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, newStage },
    });
  },

  /**
   * Create notification when task is assigned
   */
  notifyTaskAssignment: async (assigneeId, taskId, date, timeSlot) => {
    return createNotification({
      userId: assigneeId,
      type: 'task-assignment',
      message: `New task assigned for ${date} (${timeSlot})`,
      relatedEntityType: 'task',
      relatedEntityId: taskId,
      metadata: { taskId, date, timeSlot },
    });
  },

  /**
   * Create notification when due date is approaching
   */
  notifyDueDateApproaching: async (recipientId, projectId, projectTitle, daysRemaining) => {
    return createNotification({
      userId: recipientId,
      type: 'due-date-approaching',
      message: `${projectTitle} is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle, daysRemaining },
    });
  },

  /**
   * Create notification when project is completed
   */
  notifyProjectCompletion: async (recipientId, projectId, projectTitle) => {
    return createNotification({
      userId: recipientId,
      type: 'project_completed',
      message: `${projectTitle} has been completed! 🎉`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle },
    });
  },

  /**
   * Create notification when project is blocked
   */
  notifyProjectBlocked: async (recipientId, projectId, projectTitle) => {
    return createNotification({
      userId: recipientId,
      type: 'project-blocked',
      message: `${projectTitle} has been blocked`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle },
    });
  },

  /**
   * Create notification when review is ready
   */
  notifyReviewReady: async (recipientId, projectId, projectTitle) => {
    return createNotification({
      userId: recipientId,
      type: 'review-ready',
      message: `${projectTitle} is ready for review`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle },
    });
  },

  /**
   * Create notification when motion graphics is needed
   */
  notifyMographNeeded: async (mographUserId, projectId, projectTitle) => {
    return createNotification({
      userId: mographUserId,
      type: 'mograph-needed',
      message: `${projectTitle} requires motion graphics work`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      metadata: { projectId, projectTitle },
    });
  },

  /**
   * Extract @mentions from comment text
   * Returns array of mentioned usernames
   */
  extractMentions: (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }
};

export default NotificationService;
