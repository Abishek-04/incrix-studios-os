import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { InstaAutomationService } from '@/services/instagramAutomationService';

/**
 * GET /api/instagram/automations/:id?accountId=xxx
 */
export async function GET(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const { id } = await params;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automation = await InstaAutomationService.getAutomationForMedia(accountId, id);
    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, automation });
  } catch (error) {
    console.error('[automations] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch automation' }, { status: 500 });
  }
}

/**
 * PATCH /api/instagram/automations/:id
 */
export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { accountId, ...payload } = body;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automation = await InstaAutomationService.updateAutomation(accountId, id, payload);
    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, automation });
  } catch (error) {
    console.error('[automations] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update automation' }, { status: 500 });
  }
}

/**
 * DELETE /api/instagram/automations/:id
 */
export async function DELETE(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automation = await InstaAutomationService.deleteAutomation(accountId, id);
    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, automation });
  } catch (error) {
    console.error('[automations] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete automation' }, { status: 500 });
  }
}
