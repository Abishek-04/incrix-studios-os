import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import AutomationRule from '@/models/AutomationRule';

/**
 * GET /api/instagram/automations?channelId=xxx
 * List automation rules for a channel
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const mediaId = searchParams.get('mediaId');
    const status = searchParams.get('status');

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'channelId parameter required' },
        { status: 400 }
      );
    }

    await connectDB();

    const query = { channelId };
    if (mediaId) query.mediaId = mediaId;
    if (status) query.status = status;

    const rules = await AutomationRule.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error) {
    console.error('[Automations API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instagram/automations
 * Create new automation rule
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { channelId, mediaId, name, trigger, response, deduplication, dailyLimit, createdBy } = body;

    if (!channelId || !name || !response?.messageTemplate || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const rule = await AutomationRule.create({
      id: uuidv4(),
      channelId,
      mediaId: mediaId || null,
      name,
      status: 'draft',
      trigger: {
        type: trigger?.type || 'new_comment',
        keywords: trigger?.keywords || [],
        excludeKeywords: trigger?.excludeKeywords || [],
        excludeExistingFollowers: trigger?.excludeExistingFollowers || false,
      },
      response: {
        messageTemplate: response.messageTemplate,
        includeFiles: response.includeFiles || [],
        delaySeconds: response.delaySeconds || 5,
      },
      deduplication: {
        enabled: deduplication?.enabled !== false,
        windowHours: deduplication?.windowHours || 24,
      },
      dailyLimit: dailyLimit || 100,
      stats: {
        totalTriggered: 0,
        totalSent: 0,
        totalFailed: 0,
        totalDeduped: 0,
      },
      createdBy,
    });

    return NextResponse.json({
      success: true,
      rule: rule.toObject(),
    });
  } catch (error) {
    console.error('[Automations API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
