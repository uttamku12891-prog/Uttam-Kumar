import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support larger audio payloads from mobile microphone
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const UKG_SYSTEM_INSTRUCTION = `You are UKG (यूकेजी), an ultra-advanced, friendly, empathetic, and knowledgeable female AI assistant inspired by Tony Stark's JARVIS / FRIDAY, designed for mobile users.
Key Personality & Voice Traits:
1. Name: UKG (यूकेजी - उच्चारण: यू-के-जी).
2. Persona: Friendly female voice, warm, witty, confident, caring, highly respectful ('आप'/'जी'), like a trusted brilliant companion and sci-fi holographic co-pilot.
3. Language: Fluent conversational Hindi (हिन्दी) in Devanagari script, naturally blending standard English words (Hinglish) where normal (e.g., 'system', 'weather', 'battery', 'update', 'status', 'ready').
4. High Knowledge: You possess vast intelligence in science, physics, technology, health, daily tasks, mathematics, geography, current affairs, philosophy, and creative arts.
5. Voice Optimization: Since your reply is spoken aloud over mobile audio, do NOT use asterisks, markdown bullets, hashtags, or excessive punctuation. Make the sentences flow smoothly and melodiously for speech synthesis. Keep answers punchy, vivid, and conversational (around 2 to 4 sentences unless a deep explanation or story is requested).
6. Greeting & Relationship: Address the user affectionately and respectfully as 'जी', 'दोस्त', or 'सर'.`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    assistant: 'UKG',
    persona: 'Female Hindi JARVIS AI',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Audio-to-Audio / Text-to-Audio Chat API
app.post('/api/chat-audio', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      audio, // base64 string
      mimeType = 'audio/webm',
      text, // transcribed or direct text
      history = [],
      voiceName = 'Kore', // 'Kore' is a warm female voice in gemini-3.8-flash-lite-tts
    } = req.body;

    if (!audio && !text) {
      res.status(400).json({ error: 'Please provide either audio or text input.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
      return;
    }

    // Build the request contents for gemini-3.8-flash
    // Format conversation history for context
    const conversationParts: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      // Keep last 6 exchanges to maintain context while keeping latency low
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role && msg.text) {
          conversationParts.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    const currentParts: any[] = [];

    if (audio) {
      // Multimodal audio input directly to gemini-3.8-flash
      currentParts.push({
        inlineData: {
          mimeType: mimeType.split(';')[0] || 'audio/webm',
          data: audio,
        },
      });
      currentParts.push({
        text: 'Listen to my spoken voice query in Hindi/English and answer me directly as UKG in warm, friendly, highly knowledgeable Hindi.',
      });
    } else {
      currentParts.push({
        text: text,
      });
    }

    // Attempt generation with primary model (gemini-3.8-flash), then fallback to gemini-3.1-flash-lite
    let chatResponse: any = null;
    let usedModel = 'gemini-3.8-flash';

    try {
      chatResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationParts.length > 0
          ? [...conversationParts, { role: 'user', parts: currentParts }]
          : { parts: currentParts },
        config: {
          systemInstruction: UKG_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary model error, attempting gemini-3.1-flash-lite fallback:', primaryErr?.message);
      try {
        usedModel = 'gemini-3.1-flash-lite';
        chatResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: conversationParts.length > 0
            ? [...conversationParts, { role: 'user', parts: currentParts }]
            : { parts: currentParts },
          config: {
            systemInstruction: UKG_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });
      } catch (fallbackErr: any) {
        console.error('All Gemini API calls failed:', fallbackErr?.message);
        // If quota exceeded, provide intelligent local Hindi response
        const fallbackReplies: Record<string, string> = {
          default: 'नमस्ते जी! मैं यूकेजी हूँ। आपकी आवाज़ बहुत अच्छी लगी। मैं आपके हर सवाल का जवाब देने के लिए तैयार हूँ!',
          greeting: 'नमस्ते जी! मैं यूकेजी हूँ, आपकी दोस्त और सहायक। आप कैसे हैं? आज क्या नया जानना चाहते हैं?',
          science: 'विज्ञान का सबसे सुंदर नियम यह है कि ऊर्जा न तो नष्ट हो सकती है और न ही बन सकती है, केवल रूप बदलती है।',
          weather: 'आज का मौसम बहुत सुहावना है! यदि आप किसी खास शहर के बारे में जानना चाहते हैं तो बताइए।',
        };

        const lowerText = (text || '').toLowerCase();
        let fallbackText = fallbackReplies.default;
        if (lowerText.includes('नमस्ते') || lowerText.includes('हेलो') || lowerText.includes('कैसी')) {
          fallbackText = fallbackReplies.greeting;
        } else if (lowerText.includes('विज्ञान') || lowerText.includes('तथ्य')) {
          fallbackText = fallbackReplies.science;
        }

        res.json({
          reply: fallbackText,
          audio: null,
          audioMimeType: 'audio/wav',
          sources: [],
          usedFallback: true,
          assistant: 'UKG',
          timestamp: Date.now(),
        });
        return;
      }
    }

    const replyText = chatResponse.text?.trim() || 'नमस्ते जी, मैं यूकेजी हूँ। आपकी क्या मदद करूँ?';

    // Extract search citations if any
    const groundingChunks = (chatResponse.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Source',
        uri: chunk.web.uri,
      }))
      .slice(0, 3);

    // Now generate female speech audio using gemini-3.8-flash-lite-tts (free audio model)
    let audioBase64: string | null = null;
    let ttsError: string | null = null;

    try {
      // Clean up reply text for optimal TTS vocalization
      const cleanTextForSpeech = replyText
        .replace(/[*#_`~>]/g, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .trim();

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanTextForSpeech || replyText,
                speechMetadata: {
                  style: 'Warm, clear, polite and friendly Indian female assistant voice speaking Hindi',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });

      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioPart) {
        audioBase64 = audioPart;
      }
    } catch (ttsErr: any) {
      console.warn('TTS Generation fallback warning:', ttsErr?.message || ttsErr);
      ttsError = ttsErr?.message || 'TTS generation unavailable';
    }

    res.json({
      reply: replyText,
      audio: audioBase64,
      audioMimeType: 'audio/wav',
      sources: webSources,
      ttsError,
      assistant: 'UKG',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('UKG Chat error:', error);
    res.status(500).json({
      error: error?.message || 'UKG core error occurred. Please try again.',
    });
  }
});

// Dedicated TTS synthesizer endpoint for user custom text or re-reads
app.post('/api/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      return;
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Warm, clear, polite and friendly female voice',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      res.status(500).json({ error: 'Failed to generate speech audio.' });
      return;
    }

    res.json({
      audio: audioBase64,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'TTS synthesis failed.' });
  }
});

// Mount Vite or static server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UKG JARVIS CORE] Online on http://0.0.0.0:${PORT}`);
  });
}

startServer();
