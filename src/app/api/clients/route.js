import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = status ? { status } : {};
    const clients = await Client.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ clients });
  } catch (err) {
    console.error('[clients GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const { companyName, contactName, contactEmail, contactPhone, status, source, service, budget, requirements, notes } = body;
    if (!companyName?.trim()) return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    const client = await Client.create({
      id: `CLT-${Date.now()}`,
      companyName: companyName.trim(),
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      status: status || 'lead',
      source: source || 'direct',
      service: service || 'other',
      budget: budget || '',
      requirements: requirements || '',
      notes: notes || '',
      createdBy: user.id
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error('[clients POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
