import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { hasPermission, PERMISSIONS } from '@/config/permissions';

/**
 * GET /api/analytics/activity
 * Get activity logs with filters (Super Admin only)
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

    // Parse query parameters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Fetch logs
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ActivityLog.countDocuments(query);

    // Get summary statistics
    const [byCategory, byAction, timeline] = await Promise.all([
      // Activities by category
      ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Top actions
      ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Activity timeline (last 7 days)
      ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 7 }
      ])
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        summary: {
          byCategory,
          byAction,
          timeline
        },
        pagination: {
          limit,
          skip,
          hasMore: total > skip + limit
        }
      }
    });
  } catch (error) {
    console.error('[API] Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
