import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const allowed = ['companyName', 'contactName', 'contactEmail', 'contactPhone', 'status', 'source', 'service', 'budget', 'requirements', 'notes', 'assignedTo', 'tags'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const client = await Client.findOneAndUpdate({ id }, updates, { new: true }).lean();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (err) {
    console.error('[clients PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const result = await Client.findOneAndDelete({ id });
    if (!result) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[clients DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
