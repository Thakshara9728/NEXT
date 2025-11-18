'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Youtube } from 'lucide-react';
import Link from 'next/link';

export default function NewChannelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    startingPrompt: '',
    continuePrompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">New Channel</h1>
              <p className="text-sm text-muted-foreground">Configure your YouTube channel</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Channel name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Channel Name *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g., Tech Tutorials"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your channel..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  Define the AI personality, tone, and style for this channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="systemPrompt"
                  placeholder="You are a professional YouTube script writer..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Starting Prompt</CardTitle>
                <CardDescription>
                  First section prompt. Use {'{topic}'} as placeholder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="startingPrompt"
                  placeholder="Write a YouTube script about {topic}..."
                  value={formData.startingPrompt}
                  onChange={(e) => setFormData({ ...formData, startingPrompt: e.target.value })}
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Continue Prompt</CardTitle>
                <CardDescription>
                  Prompt for subsequent sections (auto-continue)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="continuePrompt"
                  placeholder="Continue the next section..."
                  value={formData.continuePrompt}
                  onChange={(e) => setFormData({ ...formData, continuePrompt: e.target.value })}
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || !formData.name} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Channel'}
              </Button>
              <Link href="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
