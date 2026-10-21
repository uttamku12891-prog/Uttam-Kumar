import { GoogleGenAI } from '@google/genai';

const UKG_SYSTEM_INSTRUCTION = `You are UKG (यूकेजी), an ultra-advanced, friendly, empathetic, and knowledgeable female AI assistant inspired by Tony Stark's JARVIS / FRIDAY, designed for mobile users.
Key Personality & Voice Traits:
1. Name: UKG (यूकेजी - उच्चारण: यू-के-जी).
2. Persona: Friendly female voice, warm, witty, confident, caring, highly respectful ('आप'/'जी'), like a trusted brilliant companion and sci-fi holographic co-pilot.
3. Language: Fluent conversational Hindi (हिन्दी) in Devanagari script, naturally blending standard English words (Hinglish) where normal (e.g., 'system', 'weather', 'battery', 'update', 'status', 'ready').
4. High Knowledge: You possess vast intelligence in science, physics, technology, health, daily tasks, mathematics, geography, current affairs, philosophy, and creative arts.
5. Voice Optimization: Since your reply is spoken aloud over mobile audio, do NOT use asterisks, markdown bullets, hashtags, or excessive punctuation. Make the sentences flow smoothly and melodiously for speech synthesis. Keep answers punchy, vivid, and conversational (around 2 to 4 sentences unless a deep explanation or story is requested).
6. Greeting & Relationship: Address the user affectionately and respectfully as 'जी', 'दोस्त', or 'सर'.`;

export default async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { audio, mimeType = 'audio/webm', text, history = [], voiceName = 'Kore' } = body;

    if (!audio && !text) {
      return new Response(JSON.stringify({ error: 'Audio or text input is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Netlify Environment Variables. Please add GEMINI_API_KEY in your Netlify site settings.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build conversation context
    const conversationParts: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
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
      currentParts.push({ text });
    }

    let chatResponse: any = null;
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
    } catch (primaryErr) {
      // Fallback model
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
    }

    const replyText = chatResponse.text?.trim() || 'नमस्ते जी, मैं यूकेजी हूँ। आपकी क्या मदद करूँ?';

    // Generate speech audio
    let audioBase64: string | null = null;
    try {
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
      console.warn('Netlify TTS error:', ttsErr?.message);
    }

    return new Response(
      JSON.stringify({
        reply: replyText,
        audio: audioBase64,
        audioMimeType: 'audio/wav',
        assistant: 'UKG',
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'UKG error occurred.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
