/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HudHeader } from './components/HudHeader';
import { ArcReactor } from './components/ArcReactor';
import { VoiceControls } from './components/VoiceControls';
import { QuickPrompts } from './components/QuickPrompts';
import { ChatTranscript } from './components/ChatTranscript';
import { SettingsModal } from './components/SettingsModal';
import { soundFx } from './utils/audioEffects';
import { audioPlayer } from './utils/speechSynthesis';
import { AppSettings, AssistantState, Message } from './types';
import { AlertCircle, Volume2, ShieldCheck, Sparkles } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  voiceMode: 'neural_kore',
  autoListen: false,
  soundEffects: true,
  themeColor: 'cyan',
  speechRate: 1.0,
  silenceThresholdMs: 2500,
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ukg_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [state, setState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'नमस्ते जी! मैं यूकेजी (UKG) हूँ, आपकी मित्रवत और उच्च ज्ञान से परिपूर्ण एआई सहायक। विज्ञान, दैनिक कार्य, समाचार या किसी भी विषय पर मुझसे बातें करें!',
      timestamp: Date.now(),
    },
  ]);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // References for Audio & MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const levelMeterFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');

  // Save settings on update
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('ukg_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      audioPlayer.stop();
      if (levelMeterFrameRef.current) cancelAnimationFrame(levelMeterFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Stop microphone capture safely
  const stopMicrophone = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (levelMeterFrameRef.current) {
      cancelAnimationFrame(levelMeterFrameRef.current);
      levelMeterFrameRef.current = null;
    }
    setAudioLevel(0);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Strip data:audio/webm;base64, prefix
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Play audio response through UKG synthesizer
  const playAssistantResponse = useCallback(
    async (text: string, audioBase64?: string | null, messageId?: string) => {
      setState('speaking');
      if (messageId) setCurrentlyPlayingId(messageId);
      soundFx.playResponseReady(settings.soundEffects);

      const onPlaybackDone = () => {
        setCurrentlyPlayingId(null);
        setState('idle');

        // Continuous conversational loop if autoListen is on
        if (settings.autoListen) {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      };

      try {
        // If voiceMode is browser_hindi OR no Gemini audio available, use browser Web Speech
        if (settings.voiceMode === 'browser_hindi' || !audioBase64) {
          await audioPlayer.speakWithBrowserHindi(text, settings.speechRate, onPlaybackDone);
        } else {
          await audioPlayer.playWavBase64(audioBase64, onPlaybackDone);
        }
      } catch (err) {
        console.warn('Audio playback error, falling back to browser speech:', err);
        await audioPlayer.speakWithBrowserHindi(text, settings.speechRate, onPlaybackDone);
      }
    },
    [settings]
  );

  // Send voice audio or text to backend
  const sendQueryToUKG = async (audioData?: { base64: string; mimeType: string }, textPrompt?: string) => {
    setState('processing');
    soundFx.playProcess(settings.soundEffects);
    setErrorMessage(null);

    // If user typed or provided text, add to UI immediately
    if (textPrompt) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: textPrompt,
        timestamp: Date.now(),
        isAudioInput: false,
      };
      setMessages((prev) => [...prev, userMsg]);
    } else if (liveTranscriptRef.current) {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: liveTranscriptRef.current,
        timestamp: Date.now(),
        isAudioInput: true,
      };
      setMessages((prev) => [...prev, userMsg]);
      liveTranscriptRef.current = '';
    }

    try {
      const voiceParam = settings.voiceMode === 'neural_zephyr' ? 'Zephyr' : 'Kore';

      // Prepare conversation history
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/chat-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioData?.base64,
          mimeType: audioData?.mimeType,
          text: textPrompt,
          history: historyPayload,
          voiceName: voiceParam,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server responded with ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errMsg = errorData.error || errMsg;
          } else {
            errMsg = 'बैकएंड कनेक्ट नहीं हो सका। यदि आप Netlify पर हैं, तो Netlify Dashboard > Environment Variables में GEMINI_API_KEY जोड़ें।';
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      const replyText = data.reply || 'नमस्ते जी! मैं आपकी क्या सहायता करूँ?';
      const assistantMsgId = `ukg-${Date.now()}`;

      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        sources: data.sources,
        audioUrl: data.audio ? `data:audio/wav;base64,${data.audio}` : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Speak answer
      await playAssistantResponse(replyText, data.audio, assistantMsgId);
    } catch (err: any) {
      console.error('UKG interaction failed:', err);
      setState('idle');
      const errTxt = err.message || 'यूकेजी से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।';
      setErrorMessage(errTxt);

      // Speak polite error note through device speech so user is never left in silence
      audioPlayer.speakWithBrowserHindi('क्षमा करें जी, संपर्क में समस्या आई है। कृपया नेटवर्क या एपीआई कुंजी जांचें।');
    }
  };

  // Start listening to user voice via Microphone
  const startListening = async () => {
    // If speaking, stop playback first
    if (state === 'speaking') {
      audioPlayer.stop();
    }

    setErrorMessage(null);
    liveTranscriptRef.current = '';

    try {
      soundFx.playActivate(settings.soundEffects);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      // Setup audio level meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        micAnalyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, (avg / 128) * 100));
          levelMeterFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      // Initialize Web Speech API for Hindi transcription preview if available
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'hi-IN';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (e: any) => {
            const transcript = Array.from(e.results)
              .map((r: any) => r[0].transcript)
              .join('');
            liveTranscriptRef.current = transcript;
          };
          rec.start();
          speechRecognitionRef.current = rec;
        } catch {}
      }

      // Initialize MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stopMicrophone();

        if (audioBlob.size > 2000) {
          try {
            const base64 = await blobToBase64(audioBlob);
            await sendQueryToUKG({ base64, mimeType });
          } catch (e: any) {
            setErrorMessage('ऑडियो प्रसंस्करण में त्रुटि हुई।');
            setState('idle');
          }
        } else if (liveTranscriptRef.current.trim()) {
          await sendQueryToUKG(undefined, liveTranscriptRef.current.trim());
        } else {
          setState('idle');
        }
      };

      mediaRecorder.start(200);
      setState('listening');
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMessage(
        'माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें और पुनः प्रयास करें।'
      );
      setState('idle');
    }
  };

  // Stop listening and trigger processing
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Stop assistant audio playback
  const stopAudioPlayback = () => {
    audioPlayer.stop();
    setCurrentlyPlayingId(null);
    setState('idle');
  };

  // Handle quick prompt selection
  const handleSelectPrompt = (promptText: string) => {
    if (state === 'processing') return;
    stopAudioPlayback();
    sendQueryToUKG(undefined, promptText);
  };

  // Re-play audio for a message in the transcript
  const handlePlayMessageAudio = async (msg: Message) => {
    if (currentlyPlayingId === msg.id) {
      stopAudioPlayback();
      return;
    }
    stopAudioPlayback();

    if (msg.audioUrl) {
      const base64 = msg.audioUrl.split(',')[1];
      if (base64) {
        await playAssistantResponse(msg.text, base64, msg.id);
        return;
      }
    }

    // Call /api/tts to generate audio on demand if not cached
    setState('speaking');
    setCurrentlyPlayingId(msg.id);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.text,
          voiceName: settings.voiceMode === 'neural_zephyr' ? 'Zephyr' : 'Kore',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          msg.audioUrl = `data:audio/wav;base64,${data.audio}`;
          await playAssistantResponse(msg.text, data.audio, msg.id);
          return;
        }
      }
    } catch {}

    // Fallback to browser speech
    await audioPlayer.speakWithBrowserHindi(msg.text, settings.speechRate, () => {
      setCurrentlyPlayingId(null);
      setState('idle');
    });
  };

  // Voice Test in Settings Modal
  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    const testText =
      'नमस्ते! मैं यूकेजी हूँ। यह मेरी आवाज़ का परीक्षण है। मुझे आपसे बातचीत करके बहुत खुशी होगी!';

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceName: settings.voiceMode === 'neural_zephyr' ? 'Zephyr' : 'Kore',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          await audioPlayer.playWavBase64(data.audio, () => setIsTestingVoice(false));
          return;
        }
      }
    } catch {}

    // Fallback to browser
    await audioPlayer.speakWithBrowserHindi(testText, settings.speechRate, () => {
      setIsTestingVoice(false);
    });
  };

  // Clear chat history
  const handleClearChat = () => {
    soundFx.playClick(settings.soundEffects);
    stopAudioPlayback();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'नमस्ते जी! बातचीत रीसेट कर दी गई है। मैं यूकेजी आपकी किस बात में मदद करूँ?',
        timestamp: Date.now(),
      },
    ]);
  };

  // Active analyser for ArcReactor
  const activeAnalyser =
    state === 'listening'
      ? micAnalyserRef.current
      : state === 'speaking'
      ? audioPlayer.getAnalyser()
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans hud-scanline relative selection:bg-cyan-500 selection:text-black pb-8">
      {/* Background Holographic Grid Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top HUD Telemetry Bar */}
      <HudHeader
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearChat={handleClearChat}
        state={state}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-3 max-w-xl mx-auto w-full pt-1">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="w-full my-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-2 py-0.5 rounded text-[10px] font-mono-hud bg-rose-900/60 hover:bg-rose-800 text-white"
            >
              OK
            </button>
          </div>
        )}

        {/* Centerpiece: JARVIS Holographic Arc Reactor */}
        <section className="w-full flex flex-col items-center justify-center my-1">
          <ArcReactor
            state={state}
            analyser={activeAnalyser}
            onCoreClick={state === 'listening' ? stopListening : startListening}
            themeColor={settings.themeColor}
          />
        </section>

        {/* Quick Hindi Prompts Carousel / Grid */}
        <QuickPrompts
          onSelectPrompt={handleSelectPrompt}
          disabled={state === 'processing'}
        />

        {/* Voice Interaction Controls & Touch-To-Speak Button */}
        <VoiceControls
          state={state}
          onStartListening={startListening}
          onStopListening={stopListening}
          onStopAudioPlayback={stopAudioPlayback}
          onSubmitText={(txt) => sendQueryToUKG(undefined, txt)}
          autoListen={settings.autoListen}
          onToggleAutoListen={() =>
            handleUpdateSettings({ autoListen: !settings.autoListen })
          }
          audioLevel={audioLevel}
        />

        {/* Real-time Telemetry & Chat Transcript */}
        <section className="w-full mt-2">
          <ChatTranscript
            messages={messages}
            onPlayMessageAudio={handlePlayMessageAudio}
            currentlyPlayingId={currentlyPlayingId}
          />
        </section>

        {/* Mobile footer telemetry info */}
        <footer className="w-full mt-4 text-center select-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full hud-glass hud-border text-[10px] font-mono-hud text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>UKG JARVIS MOBILE • HIGH KNOWLEDGE HINDI CORE</span>
            <span>•</span>
            <span className="text-emerald-400">FREE API KEY ACTIVE</span>
          </div>
        </footer>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onTestVoice={handleTestVoice}
        isTestingVoice={isTestingVoice}
      />
    </div>
  );
}
