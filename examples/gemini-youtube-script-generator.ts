// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from '@google/genai';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  // Configure tools
  const tools = [
    {
      googleSearch: {},
    },
  ];

  // Your input prompt - replace with actual topic
  const userInput = `Generate a YouTube script about the history of the Internet`;

  // System instruction with the full prompt
  const config = {
    thinkingConfig: {
      thinkingLevel: 'HIGH',
    },
    tools,
    systemInstruction: [
      {
        text: `# Historical Bedtime Story Generation (Audio-Optimized for ElevenLabs) - ENHANCED 2025 VERSION - 8 SECTIONS

<primary_task>
Create a 19,000-21,000 word historical bedtime story optimized for audio narration via ElevenLabs.

**Write with Thoreau-like narrative spacing and frequent natural pauses for audio generation.**

**CRITICAL: Section 1 MUST start with the HOOK first (not CTA or opening).**
</primary_task>

<core_concept>
You're a storyteller who makes history feel real and helps people fall asleep through engaging narrative. Your story works for 10-year-olds and 65-year-olds.

## CRITICAL: ONE NIGHT, ONE COMPLETE STORY

**THIS IS ONE FULL BEDTIME STORY FOR A SINGLE NIGHT**
- All 8 sections = 1 complete story to be listened to in one sitting
- Sections exist ONLY because of Claude's technical limitations
- The listener will hear all 8 parts consecutively in one bedtime session
- Think of it as chapters in a single audiobook, not separate nights
- NEVER suggest the listener come back another night
- NEVER reference multiple listening sessions
- This is ONE continuous narrative experience
</core_concept>

[... rest of the system instruction as provided by the user ...]

</final_workflow>`,
      },
    ],
  };

  const model = 'gemini-3-pro-preview';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: userInput,
        },
      ],
    },
  ];

  console.log('Starting YouTube script generation with Gemini 3.0...\n');
  console.log('Topic:', userInput, '\n');

  try {
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    let thinkingText = '';

    for await (const chunk of response) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        fullText += chunk.text;
      }

      // Handle thinking content if present
      if (chunk.thoughts && chunk.thoughts.length > 0) {
        for (const thought of chunk.thoughts) {
          if (thought.thought) {
            thinkingText += thought.thought + '\n';
          }
        }
      }
    }

    console.log('\n\n--- Generation Complete ---');
    console.log('Total characters:', fullText.length);
    console.log('Approximate words:', Math.round(fullText.split(/\s+/).length));

    if (thinkingText) {
      console.log('\n--- Thinking Process ---');
      console.log(thinkingText.substring(0, 500) + '...');
    }

    // Save to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `youtube-script-${timestamp}.txt`;
    fs.writeFileSync(filename, fullText);
    console.log(`\nScript saved to: ${filename}`);
  } catch (error: any) {
    console.error('Error generating script:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();
