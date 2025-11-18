'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/lib/store';
import { Settings, Sparkles, Globe, Database, Zap } from 'lucide-react';

export function SettingsPanel() {
  const { settings, updateSettings } = useChatStore();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Settings</CardTitle>
        </div>
        <CardDescription>
          Configure Claude API and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Model
          </Label>
          <Select
            value={settings.model}
            onValueChange={(value) =>
              updateSettings({ model: value as 'claude-sonnet-3-7' | 'claude-sonnet-4-5' })
            }
          >
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-sonnet-4-5">
                Claude Sonnet 4.5 (Latest)
              </SelectItem>
              <SelectItem value="claude-sonnet-3-7">
                Claude Sonnet 3.7
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings.model === 'claude-sonnet-4-5'
              ? 'Most capable model with enhanced reasoning'
              : 'Fast and efficient for most tasks'}
          </p>
        </div>

        {/* Extended Thinking */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="extended-thinking">Extended Thinking</Label>
              <p className="text-xs text-muted-foreground">
                Enable deeper reasoning and analysis
              </p>
            </div>
          </div>
          <Switch
            id="extended-thinking"
            checked={settings.extendedThinking}
            onCheckedChange={(checked) =>
              updateSettings({ extendedThinking: checked })
            }
          />
        </div>

        {/* Thinking Budget (only shown when extended thinking is enabled) */}
        {settings.extendedThinking && (
          <div className="space-y-2 pl-6 border-l-2 border-primary/20">
            <Label htmlFor="thinking-budget">
              Thinking Budget: {settings.thinkingBudget || 'Auto'} tokens
            </Label>
            <Select
              value={settings.thinkingBudget?.toString() || 'auto'}
              onValueChange={(value) =>
                updateSettings({
                  thinkingBudget: value === 'auto' ? undefined : parseInt(value)
                })
              }
            >
              <SelectTrigger id="thinking-budget">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (25% of max tokens)</SelectItem>
                <SelectItem value="1024">1,024 (Minimum)</SelectItem>
                <SelectItem value="2048">2,048</SelectItem>
                <SelectItem value="4096">4,096</SelectItem>
                <SelectItem value="8192">8,192</SelectItem>
                <SelectItem value="16384">16,384</SelectItem>
                <SelectItem value="32768">32,768</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher budgets enable more thorough reasoning
            </p>
          </div>
        )}

        {/* Web Search */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="web-search">Web Search</Label>
              <p className="text-xs text-muted-foreground">
                Include web search results in context
              </p>
            </div>
          </div>
          <Switch
            id="web-search"
            checked={settings.webSearch}
            onCheckedChange={(checked) =>
              updateSettings({ webSearch: checked })
            }
          />
        </div>

        {/* Prompt Caching */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <Database className="w-4 h-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="prompt-caching">Prompt Caching</Label>
              <p className="text-xs text-muted-foreground">
                Reduce costs and latency (recommended)
              </p>
            </div>
          </div>
          <Switch
            id="prompt-caching"
            checked={settings.usePromptCaching}
            onCheckedChange={(checked) =>
              updateSettings({ usePromptCaching: checked })
            }
          />
        </div>

        {/* Temperature Slider */}
        <div className="space-y-2">
          <Label htmlFor="temperature">
            Temperature: {settings.temperature.toFixed(1)}
          </Label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) =>
              updateSettings({ temperature: parseFloat(e.target.value) })
            }
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower = more focused, Higher = more creative
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor="max-tokens">Max Tokens</Label>
          <Select
            value={settings.maxTokens.toString()}
            onValueChange={(value) =>
              updateSettings({ maxTokens: parseInt(value) })
            }
          >
            <SelectTrigger id="max-tokens">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1024">1,024 (Short)</SelectItem>
              <SelectItem value="2048">2,048 (Medium)</SelectItem>
              <SelectItem value="4096">4,096 (Long)</SelectItem>
              <SelectItem value="8192">8,192 (Very Long)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
