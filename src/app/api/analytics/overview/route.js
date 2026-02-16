import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import BaseProject from '@/models/BaseProject';
import DailyTask from '@/models/DailyTask';
import AutomationRule from '@/models/AutomationRule';
import AutomationLog from '@/models/AutomationLog';
import Channel from '@/models/Channel';
import { hasPermission, PERMISSIONS } from '@/config/permissions';

/**
 * GET /api/analytics/overview
 * Get comprehensive platform analytics (Super Admin only)
 */
export async function GET(request) {
  try {
    await connectDB();

    // Get current user from query params
    const { searchParams } = new URL(request.url);
    const currentUserRole = searchParams.get('role');

    // Permission check - Super Admin only
    if (!hasPermission(currentUserRole, PERMISSIONS.VIEW_ANALYTICS)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const timeRange = searchParams.get('range') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // === USER STATISTICS ===
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    const usersWithWhatsApp = await User.countDocuments({
      'notificationPreferences.whatsapp.enabled': true
    });

    // === PROJECT STATISTICS ===
    const totalProjects = await BaseProject.countDocuments({ archived: { $ne: true } });
    const projectsByType = await BaseProject.aggregate([
      { $match: { archived: { $ne: true } } },
      {
        $group: {
          _id: '$projectType',
          count: { $sum: 1 }
        }
      }
    ]);

    const projectsByStatus = await BaseProject.aggregate([
      { $match: { archived: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentProjects = await BaseProject.countDocuments({
      createdAt: { $gte: startDate },
      archived: { $ne: true }
    });

    const completedProjects = await BaseProject.countDocuments({
      stage: { $in: ['Done', 'Completed', 'Delivered', 'Deployed'] },
      updatedAt: { $gte: startDate }
    });

    // === TASK STATISTICS ===
    const totalTasks = await DailyTask.countDocuments();
    const completedTasks = await DailyTask.countDocuments({ done: true });
    const pendingTasks = totalTasks - completedTasks;

    const tasksCompletedInRange = await DailyTask.countDocuments({
      done: true,
      updatedAt: { $gte: startDate }
    });

    const tasksCreatedInRange = await DailyTask.countDocuments({
      createdAt: { $gte: startDate }
    });

    // === INSTAGRAM AUTOMATION STATISTICS ===
    const totalChannels = await Channel.countDocuments({ platform: 'instagram' });
    const activeAutomations = await AutomationRule.countDocuments({ status: 'active' });
    const totalAutomations = await AutomationRule.countDocuments();

    const automationStats = await AutomationLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$dmStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDMsSent = await AutomationLog.countDocuments({
      dmStatus: 'sent',
      createdAt: { $gte: startDate }
    });

    // === ACTIVITY TIMELINE (Last 30 days) ===
    const activityTimeline = await BaseProject.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          projects: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const taskTimeline = await DailyTask.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          tasks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // === USER ACTIVITY BREAKDOWN ===
    const userActivity = await User.aggregate([
      {
        $lookup: {
          from: 'baseprojects',
          let: { userName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$creator', '$$userName'] },
                    { $eq: ['$editor', '$$userName'] },
                    { $eq: ['$assignedTo', '$$userName'] }
                  ]
                },
                archived: { $ne: true }
              }
            }
          ],
          as: 'projects'
        }
      },
      {
        $lookup: {
          from: 'dailytasks',
          localField: 'id',
          foreignField: 'userId',
          as: 'tasks'
        }
      },
      {
        $project: {
          id: 1,
          name: 1,
          email: 1,
          role: 1,
          isActive: 1,
          avatarColor: 1,
          projectCount: { $size: '$projects' },
          taskCount: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 'task',
                cond: { $eq: ['$$task.done', true] }
              }
            }
          },
          whatsappEnabled: '$notificationPreferences.whatsapp.enabled',
          lastActive: '$updatedAt'
        }
      },
      { $sort: { projectCount: -1 } }
    ]);

    // === PLATFORM HEALTH ===
    const overdueProjects = await BaseProject.countDocuments({
      dueDate: { $lt: new Date() },
      stage: { $nin: ['Done', 'Completed', 'Delivered', 'Deployed'] },
      archived: { $ne: true }
    });

    const blockedProjects = await BaseProject.countDocuments({
      status: 'Blocked',
      archived: { $ne: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        // User metrics
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: usersByRole,
          withWhatsApp: usersWithWhatsApp
        },

        // Project metrics
        projects: {
          total: totalProjects,
          byType: projectsByType,
          byStatus: projectsByStatus,
          recent: recentProjects,
          completed: completedProjects,
          overdue: overdueProjects,
          blocked: blockedProjects
        },

        // Task metrics
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          completedInRange: tasksCompletedInRange,
          createdInRange: tasksCreatedInRange,
          completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
        },

        // Instagram automation metrics
        instagram: {
          totalChannels,
          totalAutomations,
          activeAutomations,
          dmsSent: totalDMsSent,
          dmStats: automationStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },

        // Activity timelines
        timelines: {
          projects: activityTimeline,
          tasks: taskTimeline
        },

        // User activity breakdown
        userActivity,

        // Metadata
        timeRange: parseInt(timeRange),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('[API] Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
