import { v4 as uuidv4 } from 'uuid';
import connectDB from '../mongodb.js';
import Notification from '../../models/Notification.js';

/**
 * Notification Engine - Central service for all app notifications
 * Creates in-app notifications and triggers browser push
 */

/**
 * Core notification creation function
 */
async function createAndSendNotification({ userId, type, title, message, relatedEntityType, relatedEntityId, metadata }) {
  try {
    await connectDB();

    const notification = await Notification.create({
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      metadata,
      read: false,
    });

    // Browser push (best-effort)
    try {
      const { sendPushToUser } = await import('../webPush.js');
      await sendPushToUser(userId, { title, body: message, data: { type, relatedEntityId } });
    } catch (_) {}

    return notification;
  } catch (error) {
    console.error('[NotificationEngine] Error creating notification:', error);
    return null;
  }
}

/**
 * Notify a user about a project event
 */
export async function notifyProjectEvent(userId, eventType, projectData) {
  const titles = {
    'project-assigned': 'New Project Assigned',
    'project-stage-changed': 'Project Stage Updated',
    'deadline-approaching': 'Deadline Approaching',
    'project-at-risk': 'Project At Risk',
  };
  const messages = {
    'project-assigned': `You've been assigned to "${projectData.projectName}"`,
    'project-stage-changed': `"${projectData.projectName}" moved to ${projectData.newStage}`,
    'deadline-approaching': `"${projectData.projectName}" is due soon`,
    'project-at-risk': `"${projectData.projectName}" needs attention`,
  };

  return createAndSendNotification({
    userId,
    type: eventType,
    title: titles[eventType] || 'Project Update',
    message: messages[eventType] || `Update on "${projectData.projectName}"`,
    relatedEntityType: 'project',
    relatedEntityId: projectData.projectId,
    metadata: projectData,
  });
}

/**
 * Notify a user about a task event
 */
export async function notifyTaskEvent(userId, eventType, taskData) {
  return createAndSendNotification({
    userId,
    type: eventType,
    title: eventType === 'task-assigned' ? 'New Task Assigned' : 'Task Update',
    message: `Task: ${taskData.taskTitle}`,
    relatedEntityType: 'task',
    relatedEntityId: taskData.taskId,
    metadata: taskData,
  });
}

export default { createAndSendNotification, notifyProjectEvent, notifyTaskEvent };
