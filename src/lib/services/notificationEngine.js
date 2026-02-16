import { v4 as uuidv4 } from 'uuid';
import connectDB from '../mongodb.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';
import { queueWhatsAppNotification } from '../queue.js';

/**
 * Notification Engine - Central service for all app notifications
 * Handles both in-app notifications and WhatsApp delivery based on user preferences
 */

/**
 * Helper: Check if user should receive WhatsApp notification for event type
 */
async function shouldSendWhatsApp(userId, eventType) {
  try {
    const user = await User.findOne({ id: userId }).select('whatsappNumber notificationPreferences');

    if (!user || !user.whatsappNumber) {
      return { send: false, user: null };
    }

    // Check if WhatsApp notifications are enabled globally
    if (!user.notificationPreferences?.whatsapp?.enabled) {
      return { send: false, user };
    }

    // Check event-specific preference
    const preferenceKey = getPreferenceKey(eventType);
    if (preferenceKey && user.notificationPreferences?.whatsapp?.[preferenceKey] === false) {
      return { send: false, user };
    }

    return { send: true, user };
  } catch (error) {
    console.error('[NotificationEngine] Error checking WhatsApp preference:', error);
    return { send: false, user: null };
  }
}

/**
 * Map event type to user preference key
 */
function getPreferenceKey(eventType) {
  const mapping = {
    'project-assigned': 'projectAssigned',
    'project-stage-changed': 'projectStageChanged',
    'task-assigned': 'taskAssigned',
    'task-overdue': 'taskOverdue',
    'deadline-approaching': 'deadlineApproaching',
    'project-at-risk': 'projectAtRisk',
    'new-comment': 'newComment',
    'quota-milestone': 'quotaMilestone',
  };
  return mapping[eventType];
}

/**
 * Format WhatsApp message for each event type
 */
function formatMessage(eventType, data) {
  const { projectName, projectType, stage, oldStage, newStage, taskTitle, taskSlot, dueDate, quotaType, current, target } = data;

  const messages = {
    'project-assigned': `🎬 New project assigned: ${projectName} (${projectType}). Stage: ${stage}. Check it out in Incrix OS.`,
    'project-stage-changed': `📊 ${projectName} moved from ${oldStage} → ${newStage}.`,
    'task-assigned': `✅ New task: ${taskTitle} – assigned to you for ${taskSlot} slot.`,
    'task-overdue': `⚠️ Overdue task: ${taskTitle} was due ${dueDate}. Please update.`,
    'deadline-approaching': `⏰ ${projectName} deadline is in 24 hours (${dueDate}).`,
    'project-at-risk': `🚨 ${projectName} is marked AT RISK. Needs attention.`,
    'new-comment': `💬 New comment on ${projectName}. Check the project for details.`,
    'quota-milestone': `🎯 You've reached ${current}/${target} ${quotaType}! Great progress!`,
  };

  return messages[eventType] || `📢 Update on ${projectName || 'your project'}`;
}

/**
 * Core notification creation function
 */
async function createAndSendNotification({ userId, type, title, message, relatedEntityType, relatedEntityId, metadata, eventType }) {
  try {
    await connectDB();

    // Create in-app notification
    const notificationId = uuidv4();
    const notification = await Notification.create({
      id: notificationId,
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      metadata,
      read: false,
    });

    // Check WhatsApp preferences and send if enabled
    const { send, user } = await shouldSendWhatsApp(userId, eventType);
    if (send && user) {
      const whatsappMessage = formatMessage(eventType, metadata || {});

      await queueWhatsAppNotification({
        userId: user.id,
        phoneNumber: user.whatsappNumber,
        message: whatsappMessage,
        notificationId,
      });

      console.log(`[NotificationEngine] Queued WhatsApp for ${user.id} (${eventType})`);
    }

    return notification;
  } catch (error) {
    console.error('[NotificationEngine] Error creating notification:', error);
    // Don't throw - notifications should never break the main flow
    return null;
  }
}

/**
 * Notification Engine - Public API
 */
export const NotificationEngine = {
  /**
   * Project assigned to user
   */
  async onProjectAssigned(project, assignedUserId) {
    return createAndSendNotification({
      userId: assignedUserId,
      type: 'project-assignment',
      title: 'Project Assigned',
      message: `You've been assigned to: ${project.title}`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      metadata: {
        projectName: project.title,
        projectType: project.projectType || 'content',
        stage: project.stage,
      },
      eventType: 'project-assigned',
    });
  },

  /**
   * Project stage changed
   */
  async onProjectStageChanged(project, oldStage, newStage) {
    return createAndSendNotification({
      userId: project.assignedTo,
      type: 'stage-change',
      title: 'Stage Updated',
      message: `${project.title} moved to ${newStage}`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      metadata: {
        projectName: project.title,
        oldStage,
        newStage,
      },
      eventType: 'project-stage-changed',
    });
  },

  /**
   * Task assigned to user
   */
  async onTaskAssigned(task, assignedUserId) {
    return createAndSendNotification({
      userId: assignedUserId,
      type: 'task-assignment',
      title: 'Task Assigned',
      message: `New task for ${task.date} (${task.timeSlot})`,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      metadata: {
        taskTitle: task.task,
        taskSlot: `${task.date} ${task.timeSlot}`,
      },
      eventType: 'task-assigned',
    });
  },

  /**
   * Task is overdue
   */
  async onTaskOverdue(task) {
    return createAndSendNotification({
      userId: task.userId,
      type: 'task-assignment',
      title: 'Task Overdue',
      message: `Overdue: ${task.task}`,
      relatedEntityType: 'task',
      relatedEntityId: task.id,
      metadata: {
        taskTitle: task.task,
        dueDate: task.date,
      },
      eventType: 'task-overdue',
    });
  },

  /**
   * Project deadline approaching (24h)
   */
  async onDeadlineApproaching(project) {
    return createAndSendNotification({
      userId: project.assignedTo,
      type: 'due-date-approaching',
      title: 'Deadline Approaching',
      message: `${project.title} is due soon`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      metadata: {
        projectName: project.title,
        dueDate: new Date(project.dueDate).toLocaleDateString(),
      },
      eventType: 'deadline-approaching',
    });
  },

  /**
   * Project marked as at risk
   */
  async onProjectAtRisk(project) {
    return createAndSendNotification({
      userId: project.assignedTo,
      type: 'project-blocked',
      title: 'Project At Risk',
      message: `${project.title} needs attention`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      metadata: {
        projectName: project.title,
      },
      eventType: 'project-at-risk',
    });
  },

  /**
   * New comment on project
   */
  async onNewComment(project, comment, mentionedUserIds = []) {
    // Notify project owner
    const ownerNotification = createAndSendNotification({
      userId: project.assignedTo,
      type: 'comment',
      title: 'New Comment',
      message: `${comment.authorName} commented on ${project.title}`,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      metadata: {
        projectName: project.title,
        commenterName: comment.authorName,
      },
      eventType: 'new-comment',
    });

    // Notify mentioned users
    const mentionNotifications = mentionedUserIds
      .filter(uid => uid !== project.assignedTo) // Don't duplicate
      .map(uid =>
        createAndSendNotification({
          userId: uid,
          type: 'mention',
          title: 'You were mentioned',
          message: `${comment.authorName} mentioned you in ${project.title}`,
          relatedEntityType: 'project',
          relatedEntityId: project.id,
          metadata: {
            projectName: project.title,
            commenterName: comment.authorName,
          },
          eventType: 'new-comment',
        })
      );

    return Promise.all([ownerNotification, ...mentionNotifications]);
  },

  /**
   * Quota milestone reached
   */
  async onQuotaMilestone(userId, quotaType, current, target) {
    return createAndSendNotification({
      userId,
      type: 'info',
      title: 'Quota Milestone',
      message: `You've reached ${current}/${target} ${quotaType}!`,
      relatedEntityType: 'user',
      relatedEntityId: userId,
      metadata: {
        quotaType,
        current,
        target,
      },
      eventType: 'quota-milestone',
    });
  },
};

export default NotificationEngine;
