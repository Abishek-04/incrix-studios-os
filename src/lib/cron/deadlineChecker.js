import connectDB from '../mongodb.js';
import BaseProject from '../../models/BaseProject.js';
import Project from '../../models/Project.js';
import DailyTask from '../../models/DailyTask.js';
import Notification from '../../models/Notification.js';
import { NotificationEngine } from '../services/notificationEngine.js';

/**
 * Deadline Checker - Runs periodically to notify users of approaching deadlines
 * Should be called by a cron job or Bull repeatable job every hour
 */

/**
 * Check for projects with deadlines in the next 24 hours
 */
export async function checkProjectDeadlines() {
  try {
    await connectDB();

    const now = Date.now();
    const twentyFourHoursFromNow = now + (24 * 60 * 60 * 1000);

    // Find projects with deadlines in next 24h that aren't completed
    const upcomingProjects = await BaseProject.find({
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow,
      },
      stage: { $nin: ['Done', 'Completed', 'Delivered', 'Deployed'] }, // Exclude completed stages
      archived: { $ne: true },
    });

    // Also check old Project model for backward compatibility
    const upcomingLegacyProjects = await Project.find({
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow,
      },
      stage: { $nin: ['Done', 'Completed', 'Delivered', 'Deployed'] },
      archived: { $ne: true },
    });

    const allUpcomingProjects = [...upcomingProjects, ...upcomingLegacyProjects];

    console.log(`[DeadlineChecker] Found ${allUpcomingProjects.length} projects with approaching deadlines`);

    for (const project of allUpcomingProjects) {
      // Check if we've already sent a deadline notification for this project
      const existingNotification = await Notification.findOne({
        relatedEntityId: project.id,
        type: 'due-date-approaching',
        createdAt: { $gte: new Date(now - (24 * 60 * 60 * 1000)) }, // Within last 24h
      });

      if (!existingNotification && project.assignedTo) {
        await NotificationEngine.onDeadlineApproaching(project);
        console.log(`[DeadlineChecker] Notified user for project: ${project.title}`);
      }
    }

    return {
      success: true,
      projectsChecked: allUpcomingProjects.length,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[DeadlineChecker] Error checking project deadlines:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check for overdue daily tasks
 */
export async function checkOverdueTasks() {
  try {
    await connectDB();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = new Date().getHours();
    const currentTimeSlot = currentHour < 12 ? 'AM' : 'PM';

    // Find tasks that are overdue (past date or past timeSlot today) and not done
    const overdueTasks = await DailyTask.find({
      done: false,
      $or: [
        // Tasks from previous dates
        { date: { $lt: today } },
        // Tasks from today but in the past time slot
        {
          date: today,
          timeSlot: currentTimeSlot === 'PM' ? 'AM' : '$invalid', // If PM now, AM tasks are overdue
        },
      ],
    });

    console.log(`[DeadlineChecker] Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      // Check if we've already sent an overdue notification for this task
      const existingNotification = await Notification.findOne({
        relatedEntityId: task.id,
        type: 'task-assignment',
        message: { $regex: /Overdue/i },
        createdAt: { $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) }, // Within last 24h
      });

      if (!existingNotification && task.userId) {
        await NotificationEngine.onTaskOverdue(task);
        console.log(`[DeadlineChecker] Notified user for overdue task: ${task.task}`);
      }
    }

    return {
      success: true,
      tasksChecked: overdueTasks.length,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[DeadlineChecker] Error checking overdue tasks:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function - runs both checks
 */
export async function runDeadlineChecks() {
  console.log('[DeadlineChecker] Starting deadline and overdue checks...');

  const [projectResults, taskResults] = await Promise.all([
    checkProjectDeadlines(),
    checkOverdueTasks(),
  ]);

  console.log('[DeadlineChecker] Checks complete:', {
    projects: projectResults,
    tasks: taskResults,
  });

  return { projects: projectResults, tasks: taskResults };
}

export default runDeadlineChecks;
