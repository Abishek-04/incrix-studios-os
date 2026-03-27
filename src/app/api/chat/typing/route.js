import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getPusher } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// POST /api/chat/typing — broadcast typing indicator via Pusher
export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId, typing } = await request.json();
    if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 });

    const pusher = getPusher();
    await pusher.trigger(`chat-${channelId}`, 'typing', {
      userId: user.id,
      userName: user.name,
      typing: !!typing,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat/typing POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
