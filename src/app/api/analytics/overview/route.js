import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import BaseProject from '@/models/BaseProject';
import DailyTask from '@/models/DailyTask';
import InstaAutomation from '@/models/InstaAutomation';
// AutomationLog removed — stats now aggregated from InstaAutomation documents
import Channel from '@/models/Channel';
import { hasPermission, PERMISSIONS } from '@/config/permissions';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/analytics/overview
 * Get comprehensive platform analytics (Super Admin only)
 */
export async function GET(request) {
  try {
    await connectDB();

    // Authenticate via JWT — no fallback
    const decoded = await authenticate(request);
    const authUser = await User.findOne({ id: decoded.userId }).select('role').lean();
    const currentUserRole = authUser?.role;

    // Permission check - Super Admin only
    if (!hasPermission(currentUserRole, PERMISSIONS.VIEW_ANALYTICS)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
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
    const activeAutomations = await InstaAutomation.countDocuments({ active: true });
    const totalAutomations = await InstaAutomation.countDocuments();

    // Aggregate stats from InstaAutomation documents (engine tracks per-rule)
    const automationAgg = await InstaAutomation.aggregate([
      { $group: { _id: null, totalCommentReplies: { $sum: '$commentReplies' }, totalDMReplies: { $sum: '$dmReplies' } } }
    ]);
    const automationStats = automationAgg[0] || { totalCommentReplies: 0, totalDMReplies: 0 };
    const totalDMsSent = automationStats.totalDMReplies || 0;

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
          commentReplies: automationStats.totalCommentReplies || 0,
          dmReplies: automationStats.totalDMReplies || 0
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
