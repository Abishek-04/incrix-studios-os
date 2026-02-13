
  | 'project_assigned'
  | 'project_reassigned'
  | 'comment_added'
  | 'comment_mention'
  | 'status_changed'
  | 'stage_changed'
  | 'task_created'
  | 'task_assigned'
  | 'due_date_approaching'
  | 'project_completed';

  userId: string;
  projectId?: string;
  projectTitle?: string;
  message: string;
  relatedEntityType?: 'project' | 'user' | 'channel' | 'task';
  relatedEntityId?: string;

const getNotificationTitle = (type: NotificationType): string => {
  const titles: Record<NotificationType, string> = {
    project_assigned: 'Project Assigned',
    project_reassigned: 'Project Reassigned',
    comment_added: 'New Comment',
    comment_mention: 'You were mentioned',
    status_changed: 'Status Updated',
    stage_changed: 'Stage Updated',
    task_created: 'New Task',
    task_assigned: 'Task Assigned',
    due_date_approaching: 'Deadline Approaching',
    project_completed: 'Project Completed'
  };
  return titles[type];
};

export const NotificationService = {
  /**
   * Create a notification object
   */
  createNotification: (
    type: NotificationType,
    data: NotificationData
  ): Notification => ({
    id: `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: getNotificationTitle(type),
    message: data.message,
    type: 'info',
    timestamp: Date.now(),
    read: false,
    relatedEntityType: data.relatedEntityType || 'project',
    relatedEntityId: data.relatedEntityId || data.projectId
  }),

  /**
   * Create notification when user is assigned to a project
   */
  notifyProjectAssignment: (
    assigneeId: string,
    projectId: string,
    projectTitle: string
  ): Notification => {
    return NotificationService.createNotification('project_assigned', {
      userId: assigneeId,
      projectId,
      projectTitle,
      message: `You've been assigned to: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when user is reassigned
   */
  notifyProjectReassignment: (
    newAssigneeId: string,
    oldAssigneeName: string,
    projectId: string,
    projectTitle: string
  ): Notification => {
    return NotificationService.createNotification('project_reassigned', {
      userId: newAssigneeId,
      projectId,
      projectTitle,
      message: `You've been reassigned from ${oldAssigneeName} on: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when someone comments on a project
   */
  notifyComment: (
    recipientId: string,
    commenterName: string,
    projectId: string,
    projectTitle: string
  ): Notification => {
    return NotificationService.createNotification('comment_added', {
      userId: recipientId,
      projectId,
      projectTitle,
      message: `${commenterName} commented on: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when user is @mentioned in a comment
   */
  notifyMention: (
    mentionedUserId: string,
    commenterName: string,
    projectId: string,
    projectTitle: string
  ): Notification => {
    return NotificationService.createNotification('comment_mention', {
      userId: mentionedUserId,
      projectId,
      projectTitle,
      message: `${commenterName} mentioned you in: ${projectTitle}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when project status changes
   */
  notifyStatusChange: (
    recipientId: string,
    projectId: string,
    projectTitle: string,
    oldStatus: string,
    newStatus: string
  ): Notification => {
    return NotificationService.createNotification('status_changed', {
      userId: recipientId,
      projectId,
      projectTitle,
      message: `${projectTitle} status changed from ${oldStatus} to ${newStatus}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when project stage changes
   */
  notifyStageChange: (
    recipientId: string,
    projectId: string,
    projectTitle: string,
    newStage: string
  ): Notification => {
    return NotificationService.createNotification('stage_changed', {
      userId: recipientId,
      projectId,
      projectTitle,
      message: `${projectTitle} moved to ${newStage} stage`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when task is assigned
   */
  notifyTaskAssignment: (
    assigneeId: string,
    taskId: string,
    taskDescription: string
  ): Notification => {
    return NotificationService.createNotification('task_assigned', {
      userId: assigneeId,
      message: `New task assigned: ${taskDescription}`,
      relatedEntityType: 'task',
      relatedEntityId: taskId
    });
  },

  /**
   * Create notification when due date is approaching
   */
  notifyDueDateApproaching: (
    recipientId: string,
    projectId: string,
    projectTitle: string,
    daysRemaining: number
  ): Notification => {
    return NotificationService.createNotification('due_date_approaching', {
      userId: recipientId,
      projectId,
      projectTitle,
      message: `${projectTitle} is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Create notification when project is completed
   */
  notifyProjectCompletion: (
    recipientId: string,
    projectId: string,
    projectTitle: string
  ): Notification => {
    return NotificationService.createNotification('project_completed', {
      userId: recipientId,
      projectId,
      projectTitle,
      message: `${projectTitle} has been completed! 🎉`,
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  },

  /**
   * Extract @mentions from comment text
   * Returns array of mentioned usernames
   */
  extractMentions: (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }
};

export default NotificationService;
