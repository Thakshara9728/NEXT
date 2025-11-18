// Database model types matching Prisma schema

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  startingPrompt: string;
  continuePrompt: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    scripts: number;
  };
}

export interface Script {
  id: string;
  channelId: string;
  title: string;
  topic: string | null;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  channel?: Channel;
  sections?: ScriptSection[];
}

export interface ScriptSection {
  id: string;
  scriptId: string;
  sectionNumber: number;
  content: string;
  thinking: string | null;
  createdAt: Date;
}
