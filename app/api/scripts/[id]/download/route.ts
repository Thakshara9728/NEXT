import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/scripts/[id]/download - Download script as markdown
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

    // Build markdown content
    let markdown = `# ${script.title}\n\n`;

    if (script.topic) {
      markdown += `**Topic:** ${script.topic}\n\n`;
    }

    markdown += `**Channel:** ${script.channel.name}\n`;
    markdown += `**Generated:** ${new Date(script.createdAt).toLocaleString()}\n`;
    markdown += `**Sections:** ${script.sections.length}\n\n`;
    markdown += `---\n\n`;

    // Add each section
    for (const section of script.sections) {
      markdown += `## Section ${section.sectionNumber}\n\n`;
      markdown += `${section.content}\n\n`;

      if (section.thinking) {
        markdown += `<details>\n<summary>Extended Thinking</summary>\n\n`;
        markdown += `${section.thinking}\n\n`;
        markdown += `</details>\n\n`;
      }

      markdown += `---\n\n`;
    }

    // Add footer
    markdown += `\n\n*Generated with Claude YouTube Script Generator*\n`;

    // Create filename
    const filename = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading script:', error);
    return NextResponse.json(
      { error: 'Failed to download script' },
      { status: 500 }
    );
  }
}
