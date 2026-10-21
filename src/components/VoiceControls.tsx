import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Send,
  MessageSquare,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { AssistantState } from '../types';

interface VoiceControlsProps {
  state: AssistantState;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopAudioPlayback: () => void;
  onSubmitText: (text: string) => void;
  autoListen: boolean;
  onToggleAutoListen: () => void;
  audioLevel: number; // 0 to 100
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  state,
  onStartListening,
  onStopListening,
  onStopAudioPlayback,
  onSubmitText,
  autoListen,
  onToggleAutoListen,
  audioLevel,
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleMainBtnClick = () => {
    if (state === 'speaking') {
      onStopAudioPlayback();
      return;
    }
    if (state === 'listening') {
      onStopListening();
      return;
    }
    if (state === 'processing') {
      return;
    }
    onStartListening();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || state === 'processing') return;
    onSubmitText(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-2 flex flex-col items-center gap-3">
      {/* Mic Input Level Meter (visible when listening) */}
      {state === 'listening' && (
        <div className="w-48 flex items-center gap-2 px-3 py-1 rounded-full hud-glass hud-border">
          <span className="text-[10px] font-mono-hud text-rose-400">MIC:</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-rose-500 transition-all duration-75"
              style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono-hud text-slate-400">
            {Math.round(audioLevel)}%
          </span>
        </div>
      )}

      {/* Main Touch-to-Speak Button */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring during listening */}
        {state === 'listening' && (
          <span className="absolute w-20 h-20 rounded-full bg-rose-500/30 animate-ping" />
        )}
        {state === 'speaking' && (
          <span className="absolute w-20 h-20 rounded-full bg-cyan-400/30 animate-pulse" />
        )}

        <button
          onClick={handleMainBtnClick}
          disabled={state === 'processing'}
          className={`relative z-10 w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            state === 'listening'
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.7)]'
              : state === 'speaking'
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.7)]'
              : state === 'processing'
              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
              : 'bg-gradient-to-b from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.5)]'
          }`}
          title={
            state === 'listening'
              ? 'टैप करके रोकें (Stop Listening)'
              : state === 'speaking'
              ? 'रोकें (Stop Speech)'
              : 'यूकेजी से बात करें (Talk to UKG)'
          }
        >
          {state === 'listening' ? (
            <>
              <Square className="w-7 h-7 fill-current" />
              <span className="text-[9px] font-mono-hud mt-0.5 tracking-tighter">STOP</span>
            </>
          ) : state === 'speaking' ? (
            <>
              <Square className="w-7 h-7 fill-current" />
              <span className="text-[9px] font-mono-hud mt-0.5 tracking-tighter">MUTE</span>
            </>
          ) : state === 'processing' ? (
            <>
              <Sparkles className="w-7 h-7 animate-spin text-purple-300" />
              <span className="text-[9px] font-mono-hud mt-0.5 tracking-tighter">THINK</span>
            </>
          ) : (
            <>
              <Mic className="w-7 h-7 text-slate-950" />
              <span className="text-[9px] font-mono-hud mt-0.5 tracking-tighter font-extrabold text-slate-950">
                SPEAK
              </span>
            </>
          )}
        </button>
      </div>

      {/* Helper text under button */}
      <div className="text-center">
        <p className="text-xs font-tech text-cyan-300 font-medium">
          {state === 'listening'
            ? 'यूकेजी आपकी आवाज़ सुन रही है... बोलें'
            : state === 'speaking'
            ? 'यूकेजी जवाब दे रही है... (रोकने के लिए टैप करें)'
            : state === 'processing'
            ? 'यूकेजी ज्ञान प्रणालियों से उत्तर तैयार कर रही है...'
            : 'बोलने के लिए बटन दबाएं (Tap to Speak in Hindi)'}
        </p>
      </div>

      {/* Auxiliary bar: Hands-free loop toggle & Text chat toggle */}
      <div className="flex items-center gap-2 text-xs">
        {/* Hands-Free Loop Toggle */}
        <button
          onClick={onToggleAutoListen}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono-hud border transition-all ${
            autoListen
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle continuous conversational listening mode"
        >
          <Headphones className={`w-3.5 h-3.5 ${autoListen ? 'text-amber-400 animate-pulse' : ''}`} />
          <span>हैंड्स-फ्री: {autoListen ? 'चालू (ON)' : 'बंद (OFF)'}</span>
        </button>

        {/* Text Input Toggle */}
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono-hud border transition-all ${
            showTextInput
              ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Type query instead of voice"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>कीबोर्ड</span>
        </button>
      </div>

      {/* Expandable Text Input Form */}
      {showTextInput && (
        <form
          onSubmit={handleTextSubmit}
          className="w-full flex items-center gap-2 mt-1 px-1"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="यूकेजी से हिंदी या इंग्लिश में पूछें..."
              className="w-full px-3.5 py-2 rounded-xl hud-glass hud-border text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || state === 'processing'}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
