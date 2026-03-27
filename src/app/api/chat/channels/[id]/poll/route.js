import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id: channelId } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    const query = { channelId, isDeleted: false };
    if (since) query.createdAt = { $gt: new Date(since) };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return NextResponse.json({ messages, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[chat/poll GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
