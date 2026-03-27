import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatChannel from '@/models/ChatChannel';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/chat/channels/[id]/read — mark channel as read by current user
export async function POST(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id: channelId } = await params;

    await ChatChannel.updateOne(
      { id: channelId },
      { $set: { [`lastReadBy.${user.id}`]: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat/read POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
