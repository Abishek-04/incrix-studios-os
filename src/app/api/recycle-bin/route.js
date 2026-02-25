import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import DeletedItem from '@/models/DeletedItem';
import Project from '@/models/Project';
import Channel from '@/models/Channel';
import DailyTask from '@/models/DailyTask';
import User from '@/models/User';
import AutomationRule from '@/models/AutomationRule';

const RESTORE_HANDLERS = {
  project: async (item) => {
    const data = { ...item.data };
    delete data._id;
    delete data.__v;
    await Project.updateOne({ id: item.entityId }, { $set: data }, { upsert: true });
  },
  channel: async (item) => {
    const data = { ...item.data };
    delete data._id;
    delete data.__v;
    await Channel.updateOne({ id: item.entityId }, { $set: data }, { upsert: true });
  },
  daily_task: async (item) => {
    const data = { ...item.data };
    delete data._id;
    delete data.__v;
    await DailyTask.updateOne({ id: item.entityId }, { $set: data }, { upsert: true });
  },
  user: async (item) => {
    const data = { ...item.data };
    delete data._id;
    delete data.__v;
    await User.updateOne({ id: item.entityId }, { $set: data }, { upsert: true });
  },
  automation_rule: async (item) => {
    const data = { ...item.data };
    delete data._id;
    delete data.__v;
    await AutomationRule.updateOne({ id: item.entityId }, { $set: data }, { upsert: true });
  }
};

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const query = {};
    if (type && type !== 'all') query.entityType = type;

    const items = await DeletedItem.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('[RecycleBin] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recycle bin items' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const { deletedItemId, deletedItemIds } = body;
    const ids = deletedItemIds || (deletedItemId ? [deletedItemId] : []);

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: 'deletedItemId or deletedItemIds is required' },
        { status: 400 }
      );
    }

    const items = await DeletedItem.find({ id: { $in: ids } });
    const restored = [];
    const failed = [];

    for (const item of items) {
      const handler = RESTORE_HANDLERS[item.entityType];
      if (!handler) {
        failed.push({ id: item.id, reason: `Unsupported entity type: ${item.entityType}` });
        continue;
      }

      try {
        await handler(item);
        restored.push(item.id);
      } catch (err) {
        failed.push({ id: item.id, reason: err.message });
      }
    }

    if (restored.length) {
      await DeletedItem.deleteMany({ id: { $in: restored } });
    }

    return NextResponse.json({
      success: true,
      restored,
      failed
    });
  } catch (error) {
    console.error('[RecycleBin] POST restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore items' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { id, ids } = body;

    if (id || (ids && ids.length)) {
      await DeletedItem.deleteMany({ id: { $in: id ? [id] : ids } });
      return NextResponse.json({ success: true, message: 'Items permanently deleted' });
    }

    // Purge expired records by default when no explicit ids passed
    const result = await DeletedItem.deleteMany({
      expiresAt: { $lte: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: 'Expired items purged',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('[RecycleBin] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to permanently delete items' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { entityType, entityId, data, deletedBy = 'system', source = 'api' } = body;

    if (!entityType || !entityId || !data) {
      return NextResponse.json(
        { success: false, error: 'entityType, entityId and data are required' },
        { status: 400 }
      );
    }

    const item = await DeletedItem.create({
      id: uuidv4(),
      entityType,
      entityId,
      source,
      deletedBy,
      data,
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('[RecycleBin] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to recycle bin' },
      { status: 500 }
    );
  }
}
