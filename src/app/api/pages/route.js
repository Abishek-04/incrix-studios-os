import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Page from '@/models/Page';

// GET /api/pages - List all pages with optional filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'page', 'database', 'project', 'task'
    const archived = searchParams.get('archived') === 'true';
    const parentId = searchParams.get('parentId');

    const filter = { deleted: false };
    if (type) filter.type = type;
    if (archived !== undefined) filter.archived = archived;
    if (parentId) filter.parentId = parentId;

    const pages = await Page.find(filter)
      .sort({ updatedAt: -1 })
      .limit(100); // Pagination limit

    return NextResponse.json({
      success: true,
      pages: pages || [],
      count: pages.length
    });

  } catch (error) {
    console.error('Get pages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create new page
export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();

    const newPage = await Page.create({
      id: body.id || `page-${Date.now()}`,
      title: body.title || 'Untitled',
      type: body.type || 'page',
      blocks: body.blocks || [],
      blockOrder: body.blockOrder || [],
      properties: body.properties || {},
      assignees: body.assignees || [],
      permissions: body.permissions || {
        owner: body.createdBy,
        editors: [],
        viewers: [],
        public: false
      },
      createdBy: body.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return NextResponse.json({
      success: true,
      page: newPage
    });

  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
