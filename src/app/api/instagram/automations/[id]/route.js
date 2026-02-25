import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import AutomationRule from '@/models/AutomationRule';
import AutomationLog from '@/models/AutomationLog';
import DeletedItem from '@/models/DeletedItem';

/**
 * GET /api/instagram/automations/:id
 * Get automation rule with stats
 */
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const rule = await AutomationRule.findOne({ id }).lean();

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error('[Automations API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/instagram/automations/:id
 * Update automation rule
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    const { name, status, trigger, response, deduplication, dailyLimit } = body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (status !== undefined) updates.status = status;
    if (trigger !== undefined) updates.trigger = trigger;
    if (response !== undefined) updates.response = response;
    if (deduplication !== undefined) updates.deduplication = deduplication;
    if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;

    const rule = await AutomationRule.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    );

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rule: rule.toObject(),
    });
  } catch (error) {
    console.error('[Automations API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instagram/automations/:id
 * Delete automation rule and associated logs
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    // Delete rule
    const rule = await AutomationRule.findOneAndDelete({ id });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Automation rule not found' },
        { status: 404 }
      );
    }

    await DeletedItem.create({
      id: uuidv4(),
      entityType: 'automation_rule',
      entityId: rule.id,
      source: 'instagram_automation_api',
      deletedBy: 'system',
      data: rule.toObject(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    });

    // Delete associated logs
    await AutomationLog.deleteMany({ automationRuleId: id });

    return NextResponse.json({
      success: true,
      message: 'Automation rule and logs deleted',
    });
  } catch (error) {
    console.error('[Automations API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}
