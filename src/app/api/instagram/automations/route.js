import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { InstaAutomationService } from '@/services/instagramAutomationService';

/**
 * GET /api/instagram/automations?accountId=xxx
 * List automation rules for an Instagram account
 */
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automations = await InstaAutomationService.getAutomations(accountId);
    return NextResponse.json({ success: true, automations });
  } catch (error) {
    console.error('[automations] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch automations' }, { status: 500 });
  }
}

/**
 * POST /api/instagram/automations
 * Create a new automation rule
 */
export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, ...payload } = body;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automation = await InstaAutomationService.createAutomation(accountId, user.id, payload);
    return NextResponse.json({ success: true, automation }, { status: 201 });
  } catch (error) {
    if (error.code === 'AUTOMATION_EXISTS') {
      return NextResponse.json({ success: false, error: error.message, automation: error.automation }, { status: 409 });
    }
    console.error('[automations] POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create automation' }, { status: 400 });
  }
}
