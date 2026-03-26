import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // "2026-03"
    const query = month ? { month } : {};
    const entries = await Revenue.find(query).sort({ month: -1, createdAt: -1 }).lean();

    // Group by stream for summary
    const summary = {};
    entries.forEach(e => {
      if (!summary[e.stream]) summary[e.stream] = 0;
      summary[e.stream] += e.amount;
    });

    return NextResponse.json({ entries, summary });
  } catch (err) {
    console.error('[revenue GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
    if (!userRoles.some(r => ['superadmin', 'manager'].includes(r))) {
      return NextResponse.json({ error: 'Only managers can add revenue entries' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { stream, amount, month, description } = body;

    if (!stream || !amount || !month) {
      return NextResponse.json({ error: 'stream, amount, and month are required' }, { status: 400 });
    }

    const entry = await Revenue.create({
      id: `REV-${Date.now()}`,
      stream,
      amount: Number(amount),
      month,
      description: description || '',
      createdBy: user.id
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error('[revenue POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
