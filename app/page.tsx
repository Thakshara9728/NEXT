'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Youtube, Trash2, Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { Channel } from '@/types/database';

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel? All scripts will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/channels/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChannels(channels.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">YouTube Script Generator</h1>
              <p className="text-sm text-muted-foreground">
                Powered by Claude AI
              </p>
            </div>
          </div>
          <Link href="/channels/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Channel
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Channels</h2>
          <p className="text-muted-foreground">
            Manage your YouTube channels and generate scripts with custom prompts
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading channels...</p>
          </div>
        ) : channels.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Youtube className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No channels yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first channel to start generating YouTube scripts
              </p>
              <Link href="/channels/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Channel
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{channel.name}</span>
                    <Youtube className="w-5 h-5 text-primary flex-shrink-0" />
                  </CardTitle>
                  {channel.description && (
                    <CardDescription className="line-clamp-2">
                      {channel.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <FileText className="w-4 h-4" />
                    <span>{channel._count?.scripts || 0} scripts generated</span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/generate/${channel.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        Generate Script
                      </Button>
                    </Link>
                    <Link href={`/channels/${channel.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteChannel(channel.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
