import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/scripts/[id] - Get script with all sections
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const script = await prisma.script.findUnique({
      where: { id: params.id },
      include: {
        channel: true,
        sections: {
          orderBy: { sectionNumber: 'asc' },
        },
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(script);
  } catch (error: any) {
    console.error('Error fetching script:', error);
    return NextResponse.json(
      { error: 'Failed to fetch script' },
      { status: 500 }
    );
  }
}

// DELETE /api/scripts/[id] - Delete script
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.script.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting script:', error);
    return NextResponse.json(
      { error: 'Failed to delete script' },
      { status: 500 }
    );
  }
}
