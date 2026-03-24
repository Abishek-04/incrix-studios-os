import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { InstaAutomationService } from '@/services/instagramAutomationService';

/**
 * PATCH /api/instagram/automations/:id/toggle
 * Toggle automation on/off
 */
export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId required' }, { status: 400 });
    }

    const automation = await InstaAutomationService.toggleAutomation(accountId, id);
    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, automation });
  } catch (error) {
    console.error('[automations] Toggle error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle automation' }, { status: 500 });
  }
}
