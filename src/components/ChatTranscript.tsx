import React, { useRef, useEffect } from 'react';
import {
  Volume2,
  Copy,
  Check,
  ExternalLink,
  Bot,
  User,
  Radio,
} from 'lucide-react';
import { Message } from '../types';

interface ChatTranscriptProps {
  messages: Message[];
  onPlayMessageAudio: (msg: Message) => void;
  currentlyPlayingId: string | null;
}

export const ChatTranscript: React.FC<ChatTranscriptProps> = ({
  messages,
  onPlayMessageAudio,
  currentlyPlayingId,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (messages.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-6 text-center select-none">
        <div className="hud-glass hud-border rounded-2xl p-5 border-dashed border-cyan-500/20">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <h3 className="font-tech text-base font-bold text-white mb-1">
            यूकेजी न्यूरल लिंक तैयार है
          </h3>
          <p className="text-xs text-slate-400 font-hindi max-w-sm mx-auto leading-relaxed">
            बोलने के लिए माइक बटन दबाएं या ऊपर दिए गए त्वरित सवालों में से किसी एक पर टैप करें।
            यूकेजी शुद्ध, ज्ञानवर्धक और मधुर हिंदी आवाज़ में जवाब देगी।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-2 my-2 select-text">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[10px] font-mono-hud text-cyan-400 tracking-wider uppercase">
          टेलीमेट्री ट्रांसक्रिप्ट • TELEMETRY LOG
        </span>
        <span className="text-[10px] font-mono-hud text-slate-500">
          {messages.length} सन्देश (MESSAGES)
        </span>
      </div>

      <div
        ref={scrollRef}
        className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
      >
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isPlaying = currentlyPlayingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col p-3 rounded-xl transition-all ${
                isAssistant
                  ? 'hud-glass hud-border bg-cyan-950/20 border-cyan-500/30 ml-1'
                  : 'bg-slate-900/70 border border-slate-700/60 mr-1'
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono-hud">
                <div className="flex items-center gap-1.5">
                  {isAssistant ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5 text-cyan-300" />
                      </div>
                      <span className="font-tech font-bold text-cyan-300">
                        यूकेजी (UKG)
                      </span>
                      <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300">
                        FEMALE
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-slate-300" />
                      </div>
                      <span className="text-slate-300 font-semibold">आप (User)</span>
                      {msg.isAudioInput && (
                        <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300">
                          VOICE
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* Play audio button */}
                  <button
                    onClick={() => onPlayMessageAudio(msg)}
                    className={`p-1 rounded hover:bg-cyan-500/20 transition-colors ${
                      isPlaying
                        ? 'text-cyan-400 bg-cyan-500/20 animate-pulse'
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                    title={isPlaying ? 'Playing Audio' : 'Listen with UKG voice'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy message */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Message text content */}
              <p className="text-sm text-slate-100 font-hindi leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Search Grounding Sources if present */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono-hud text-cyan-400/90">
                    सत्यापित स्रोत (SOURCES):
                  </span>
                  {msg.sources.map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:border-cyan-400 transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span className="max-w-[120px] truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
