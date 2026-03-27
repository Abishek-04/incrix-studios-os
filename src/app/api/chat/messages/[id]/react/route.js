import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id: messageId } = await params;
    const { emoji } = await request.json();

    if (!emoji) return NextResponse.json({ error: 'Emoji required' }, { status: 400 });

    const message = await ChatMessage.findOne({ id: messageId });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const reactions = message.reactions || [];
    const idx = reactions.findIndex(r => r.emoji === emoji);

    if (idx >= 0) {
      const userIds = reactions[idx].userIds || [];
      const userNames = reactions[idx].userNames || [];
      const userIdx = userIds.indexOf(user.id);
      if (userIdx >= 0) {
        // Remove reaction
        userIds.splice(userIdx, 1);
        userNames.splice(userIdx, 1);
        if (userIds.length === 0) {
          reactions.splice(idx, 1);
        } else {
          reactions[idx] = { emoji, userIds, userNames };
        }
      } else {
        // Add reaction
        reactions[idx] = { emoji, userIds: [...userIds, user.id], userNames: [...userNames, user.name] };
      }
    } else {
      reactions.push({ emoji, userIds: [user.id], userNames: [user.name] });
    }

    message.reactions = reactions;
    await message.save();

    // Broadcast reaction update via Pusher
    try {
      const { getPusher } = await import('@/lib/pusher');
      const pusher = getPusher();
      await pusher.trigger(`chat-${message.channelId}`, 'reaction-update', {
        messageId, emoji, userId: user.id, userName: user.name, reactions
      });
    } catch (_) {}

    return NextResponse.json({ reactions });
  } catch (err) {
    console.error('[chat/react POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
