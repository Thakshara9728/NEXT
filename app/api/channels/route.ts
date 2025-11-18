import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/channels - List all channels
export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { scripts: true },
        },
      },
    });

    return NextResponse.json(channels);
  } catch (error: any) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/channels - Create new channel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, systemPrompt, startingPrompt, continuePrompt } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description: description || '',
        systemPrompt: systemPrompt || '',
        startingPrompt: startingPrompt || '',
        continuePrompt: continuePrompt || '',
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error: any) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
