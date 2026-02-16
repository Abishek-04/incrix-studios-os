import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AutomationLog from '@/models/AutomationLog';

/**
 * GET /api/instagram/automations/:id/logs?page=1&limit=50&status=sent
 * Get paginated logs for an automation rule
 */
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');

    const query = { automationRuleId: id };
    if (status) query.dmStatus = status;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AutomationLog.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
      AutomationLog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Automation Logs API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
