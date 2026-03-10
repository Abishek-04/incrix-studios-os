import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';
import { buildCurrentUserContext, canManageAllProjects } from '@/lib/projectAccess';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const currentUser = buildCurrentUserContext(body.currentUser || {});

    if (!canManageAllProjects(currentUser)) {
      return NextResponse.json({ success: false, error: 'Only managers can create channels' }, { status: 403 });
    }

    const channel = body.channel;
    if (!channel || !channel.id || !channel.platform || !channel.name || !channel.link) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const created = await Channel.create({
      id: channel.id,
      platform: channel.platform,
      name: channel.name,
      link: channel.link,
      email: channel.email || '',
      credentials: channel.credentials || '',
      memberId: channel.memberId || undefined,
      avatarUrl: channel.avatarUrl || undefined
    });

    return NextResponse.json({ success: true, channel: created });
  } catch (error) {
    console.error('[Channels] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create channel' }, { status: 500 });
  }
}
