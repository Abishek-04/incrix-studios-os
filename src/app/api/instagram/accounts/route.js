import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstaAccount from '@/models/InstaAccount';
import InstaAutomation from '@/models/InstaAutomation';
import { getAuthUser } from '@/lib/auth';

/**
 * GET /api/instagram/accounts
 * List connected Instagram accounts
 * - Manager/superadmin: sees ALL accounts
 * - Normal user: sees only their own accounts
 */
export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    const isManager = userRoles.some(r => ['manager', 'superadmin'].includes(r));

    let accounts;
    if (isManager) {
      // Managers see ALL connected accounts across the org
      accounts = await InstaAccount.find({}).select('-accessToken').lean();
    } else {
      // Everyone else sees only accounts they connected themselves
      accounts = await InstaAccount.find({ connectedBy: user.id }).select('-accessToken').lean();
    }

    // Add id field
    accounts = accounts.map(a => ({ ...a, id: a._id.toString() }));

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error('[instagram-accounts] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

/**
 * DELETE /api/instagram/accounts?accountId=xxx
 * Disconnect an Instagram account
 */
export async function DELETE(request) {
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

    await connectDB();

    const isManager = user.role === 'manager' || user.role === 'superadmin' ||
      (Array.isArray(user.roles) && (user.roles.includes('manager') || user.roles.includes('superadmin')));

    // Only allow deletion of own accounts, unless manager
    const query = { _id: accountId };
    if (!isManager) {
      query.connectedBy = user.id;
    }

    const account = await InstaAccount.findOneAndDelete(query);
    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Clean up all automations linked to this account
    const deleted = await InstaAutomation.deleteMany({ accountId: accountId });
    console.log(`[instagram-accounts] Deleted ${deleted.deletedCount} automations for account ${accountId}`);

    return NextResponse.json({ success: true, message: `Disconnected @${account.username}` });
  } catch (error) {
    console.error('[instagram-accounts] Delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to disconnect account' }, { status: 500 });
  }
}
