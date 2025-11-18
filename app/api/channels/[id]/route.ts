import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/channels/[id] - Get single channel
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: params.id },
      include: {
        scripts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(channel);
  } catch (error: any) {
    console.error('Error fetching channel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}

// PUT /api/channels/[id] - Update channel
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, description, systemPrompt, startingPrompt, continuePrompt } = body;

    const channel = await prisma.channel.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(startingPrompt !== undefined && { startingPrompt }),
        ...(continuePrompt !== undefined && { continuePrompt }),
      },
    });

    return NextResponse.json(channel);
  } catch (error: any) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

// DELETE /api/channels/[id] - Delete channel
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.channel.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting channel:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
