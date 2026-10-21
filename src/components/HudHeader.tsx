import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AppSettings, AssistantState } from '../types';

interface HudHeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
  state: AssistantState;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onClearChat,
  state,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="w-full px-3 py-2.5 hud-glass border-b border-cyan-500/20 sticky top-0 z-40 select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & System Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-tech font-bold text-sm text-cyan-300 tracking-wider">
                यूकेजी <span className="text-[11px] font-mono-hud text-slate-400 font-normal">UKG AI</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono-hud bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                JARVIS-HUD
              </span>
            </div>
            <div className="text-[10px] font-mono-hud text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </span>
              <span>•</span>
              <span className="text-cyan-400/90">FEMALE HINDI</span>
              <span>•</span>
              <span className="text-slate-400 hidden xs:inline">{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Actions */}
        <div className="flex items-center gap-1.5">
          {/* Hands-free mode indicator badge */}
          {settings.autoListen && (
            <span
              title="Continuous conversation mode active"
              className="hidden sm:flex items-center gap-1 text-[10px] font-mono-hud px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              AUTO-LISTEN
            </span>
          )}

          {/* Sound FX Toggle */}
          <button
            onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
            className="p-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 bg-slate-900/60 text-slate-300 hover:text-cyan-300 transition-colors"
            title={settings.soundEffects ? 'Sound FX On' : 'Sound FX Muted'}
          >
            {settings.soundEffects ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Clear Chat */}
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg border border-cyan-500/20 hover:border-rose-500/50 bg-slate-900/60 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 bg-slate-900/60 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Fullscreen Mode"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-500/70 bg-cyan-950/40 text-cyan-300 hover:text-white transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
