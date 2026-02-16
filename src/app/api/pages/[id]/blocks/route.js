import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Page from '@/models/Page';

// GET /api/pages/[id]/blocks - Get all blocks for a page
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const page = await Page.findOne({ id, deleted: false }).select('blocks blockOrder');

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      blocks: page.blocks || [],
      blockOrder: page.blockOrder || []
    });

  } catch (error) {
    console.error('Get blocks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
}

// POST /api/pages/[id]/blocks - Create new block
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    const { id } = params;

    const newBlock = {
      id: body.id || `block-${Date.now()}`,
      type: body.type || 'paragraph',
      content: body.content || '',
      properties: body.properties || {},
      children: body.children || [],
      order: body.order || 0,
      createdBy: body.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const page = await Page.findOneAndUpdate(
      { id, deleted: false },
      {
        $push: { blocks: newBlock, blockOrder: newBlock.id },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      block: newBlock
    });

  } catch (error) {
    console.error('Create block error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create block' },
      { status: 500 }
    );
  }
}

// PATCH /api/pages/[id]/blocks - Update block content
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    const { id } = params;
    const { blockId, content, properties } = body;

    const page = await Page.findOne({ id, deleted: false });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Find and update the block
    const blockIndex = page.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Block not found' },
        { status: 404 }
      );
    }

    page.blocks[blockIndex].content = content !== undefined ? content : page.blocks[blockIndex].content;
    page.blocks[blockIndex].properties = properties !== undefined ? properties : page.blocks[blockIndex].properties;
    page.blocks[blockIndex].updatedBy = body.updatedBy;
    page.blocks[blockIndex].updatedAt = Date.now();
    page.updatedAt = Date.now();

    await page.save();

    return NextResponse.json({
      success: true,
      block: page.blocks[blockIndex]
    });

  } catch (error) {
    console.error('Update block error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update block' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id]/blocks - Delete block
export async function DELETE(request, { params }) {
  try {
    const body = await request.json();
    await connectDB();
    const { id } = params;
    const { blockId } = body;

    const page = await Page.findOneAndUpdate(
      { id, deleted: false },
      {
        $pull: {
          blocks: { id: blockId },
          blockOrder: blockId
        },
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Block deleted successfully'
    });

  } catch (error) {
    console.error('Delete block error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete block' },
      { status: 500 }
    );
  }
}
