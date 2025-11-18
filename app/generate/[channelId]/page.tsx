'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Play, Download, Youtube, Loader2, Brain, FileText } from 'lucide-react';
import Link from 'next/link';
import { Channel, Script, ScriptSection } from '@/types/database';
import ReactMarkdown from 'react-markdown';

export default function GeneratePage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scriptId, setScriptId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    transcript: '',
    model: 'claude-sonnet-4-5',
    maxTokens: 4096,
    temperature: 1.0,
    extendedThinking: false,
    webSearch: false,
    usePromptCaching: true,
    thinkingBudget: undefined as number | undefined,
    maxSections: 5,
  });

  const [sections, setSections] = useState<Array<{
    sectionNumber: number;
    content: string;
    status: 'pending' | 'generating' | 'completed';
  }>>([]);

  const [currentSection, setCurrentSection] = useState(1);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannel();
  }, [channelId]);

  const fetchChannel = async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}`);
      if (response.ok) {
        const data = await response.json();
        setChannel(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title) {
      alert('Please enter a title');
      return;
    }

    setGenerating(true);
    setSections([]);
    setCurrentSection(1);
    setWaitingMessage(null);
    setRateLimitError(null);
    setRateLimitInfo(null);

    // Initialize sections
    const initialSections = Array.from({ length: formData.maxSections }, (_, i) => ({
      sectionNumber: i + 1,
      content: '',
      status: 'pending' as const,
    }));
    setSections(initialSections);

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          title: formData.title,
          topic: formData.topic,
          transcript: formData.transcript,
          maxSections: formData.maxSections,
          settings: {
            model: formData.model,
            maxTokens: formData.maxTokens,
            temperature: formData.temperature,
            extendedThinking: formData.extendedThinking,
            webSearch: formData.webSearch,
            usePromptCaching: formData.usePromptCaching,
            thinkingBudget: formData.thinkingBudget,
          },
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by double newline to get complete SSE events
        const events = buffer.split('\n\n');

        // Keep the last incomplete event in buffer
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.trim()) continue;

          const lines = event.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData += line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);

            if (eventType === 'rate_limit_info') {
              setRateLimitInfo(data);
            } else if (eventType === 'section_start') {
              setCurrentSection(data.sectionNumber);
              setWaitingMessage(null);
              setSections(prev =>
                prev.map(s =>
                  s.sectionNumber === data.sectionNumber
                    ? { ...s, status: 'generating' }
                    : s
                )
              );
              if (!scriptId && data.scriptId) {
                setScriptId(data.scriptId);
              }
            } else if (eventType === 'content') {
              setSections(prev =>
                prev.map(s =>
                  s.sectionNumber === data.sectionNumber
                    ? { ...s, content: data.content }
                    : s
                )
              );
            } else if (eventType === 'section_complete') {
              setSections(prev =>
                prev.map(s =>
                  s.sectionNumber === data.sectionNumber
                    ? { ...s, status: 'completed' }
                    : s
                )
              );
            } else if (eventType === 'waiting') {
              setWaitingMessage(data.message);
            } else if (eventType === 'generation_complete') {
              if (data.scriptId) {
                setScriptId(data.scriptId);
              }
              setWaitingMessage(null);
            } else if (eventType === 'rate_limit_error') {
              setRateLimitError(data.error);
              alert(`Rate Limit Error: ${data.error}\n\nDetails: ${data.details}`);
            } else if (eventType === 'error') {
              const errorMsg = data.error || 'Unknown error';
              if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
                setRateLimitError('Rate limit exceeded. Please wait and try again.');
              }
              alert(`Error: ${errorMsg}`);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE event:', parseError, 'Data:', eventData);
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!scriptId) return;
    window.open(`/api/scripts/${scriptId}/download`, '_blank');
  };

  const handleDownloadSection = (sectionNumber: number, content: string) => {
    if (!channel) return;

    const sectionContent = `# ${channel.name} - Section ${sectionNumber}\n\n${content}`;

    const blob = new Blob([sectionContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${channel.name.replace(/\s+/g, '-')}-section-${sectionNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  const allSectionsCompleted = sections.length > 0 && sections.every(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Youtube className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none">{channel.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Generate Script</p>
            </div>
          </div>
          {scriptId && allSectionsCompleted && (
            <Button onClick={handleDownload} size="sm" className="h-8">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download All
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Configuration</CardTitle>
                <CardDescription className="text-xs">Script generation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs font-medium" htmlFor="title">Script Title *</Label>
                  <Input className="h-9 text-sm" className="h-9 text-sm"
                    id="title"
                    placeholder="Enter script title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={generating}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium" htmlFor="topic">Topic (Optional)</Label>
                  <Input className="h-9 text-sm" className="h-9 text-sm"
                    id="topic"
                    placeholder="Specific topic or theme..."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    disabled={generating}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium" htmlFor="transcript">Video Transcript (Optional)</Label>
                  <Textarea
                    id="transcript"
                    placeholder="Paste video transcript here... (will be included with first section for factual accuracy)"
                    value={formData.transcript}
                    onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                    disabled={generating}
                    rows={4}
                    className="resize-y text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Transcript will be included with the first section
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium" htmlFor="model">Model</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData({ ...formData, model: value as any })}
                    disabled={generating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-3-7">Sonnet 3.7</SelectItem>
                      <SelectItem value="claude-sonnet-4-5">Sonnet 4.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium" htmlFor="maxSections">Max Sections: {formData.maxSections}</Label>
                  <input
                    type="range"
                    id="maxSections"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.maxSections}
                    onChange={(e) => setFormData({ ...formData, maxSections: parseInt(e.target.value) })}
                    disabled={generating}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium" htmlFor="extendedThinking">Extended Thinking</Label>
                  <Switch
                    id="extendedThinking"
                    checked={formData.extendedThinking}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, extendedThinking: checked })
                    }
                    disabled={generating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium" htmlFor="webSearch">Web Search</Label>
                  <Switch
                    id="webSearch"
                    checked={formData.webSearch}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, webSearch: checked })
                    }
                    disabled={generating}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !formData.title}
                  className="w-full h-9 text-sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Section {currentSection}/{formData.maxSections}...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Generate Script
                    </>
                  )}
                </Button>

                {/* Rate Limit Info */}
                {rateLimitInfo && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p className="font-semibold">Rate Limits ({rateLimitInfo.model}):</p>
                    <p>• {rateLimitInfo.limits.requestsPerMinute} requests/min</p>
                    <p>• {rateLimitInfo.limits.tokensPerMinute.toLocaleString()} tokens/min</p>
                    <p>• {rateLimitInfo.delayBetweenSections}s delay between sections</p>
                  </div>
                )}

                {/* Waiting Message */}
                {waitingMessage && (
                  <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    {waitingMessage}
                  </div>
                )}

                {/* Rate Limit Error */}
                {rateLimitError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900">
                    {rateLimitError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Script Output */}
          <div className="lg:col-span-2">
            {sections.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                  <p className="text-muted-foreground">
                    Configure settings and click Generate Script to start
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <Card
                    key={section.sectionNumber}
                    className={section.status === 'generating' ? 'border-primary' : ''}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-medium">
                        <span>Section {section.sectionNumber}</span>
                        {section.status === 'generating' && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {section.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 font-normal">✓ Complete</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadSection(section.sectionNumber, section.content)}
                              className="h-7 text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {section.content && (
                      <CardContent className="pt-4">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {section.content}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}

                {allSectionsCompleted && (
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <CardContent className="py-6 text-center">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                        Script Generation Complete!
                      </h3>
                      <p className="text-green-700 dark:text-green-300 mb-4">
                        All {sections.length} sections have been generated successfully
                      </p>
                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download as Markdown
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
