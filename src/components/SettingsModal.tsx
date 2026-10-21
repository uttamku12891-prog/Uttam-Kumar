import React from 'react';
import { X, Volume2, Palette, Mic, CheckCircle, Shield } from 'lucide-react';
import { AppSettings, VoiceMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onTestVoice: () => void;
  isTestingVoice: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTestVoice,
  isTestingVoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl hud-glass hud-border p-5 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-tech font-bold text-base text-white">
                यूकेजी सेटिंग्स • UKG CONFIG
              </h2>
              <p className="text-[10px] font-mono-hud text-cyan-400/80">
                JARVIS VOICE & NEURAL PARAMETERS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-3 text-sm">
          {/* Voice Model Selector */}
          <div>
            <label className="block text-xs font-mono-hud text-cyan-300 mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              आवाज़ का चयन (FEMALE VOICE ENGINE)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                {
                  id: 'neural_kore' as VoiceMode,
                  title: 'Gemini Kore (अनुशंसित - मधुर महिला स्वर)',
                  desc: 'High-quality 24kHz Studio Neural voice with warm Hindi inflections',
                },
                {
                  id: 'neural_zephyr' as VoiceMode,
                  title: 'Gemini Zephyr (शांत एवं स्पष्ट)',
                  desc: 'Balanced neutral-female assistant timbre',
                },
                {
                  id: 'browser_hindi' as VoiceMode,
                  title: 'डिवाइस लोकल हिंदी (Offline / Fast Speech)',
                  desc: 'Device local Hindi voice with zero network latency',
                },
              ].map((v) => {
                const isSelected = settings.voiceMode === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onUpdateSettings({ voiceMode: v.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-tech font-bold text-xs text-cyan-200">
                        {v.title}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono-hud mt-0.5">
                      {v.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Test Voice Button */}
            <button
              onClick={onTestVoice}
              disabled={isTestingVoice}
              className="mt-2 w-full py-1.5 px-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-tech flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isTestingVoice ? 'animate-bounce' : ''}`} />
              {isTestingVoice ? 'परीक्षण बोला जा रहा है...' : 'यूकेजी आवाज़ का परीक्षण करें (Test Voice)'}
            </button>
          </div>

          {/* Speech Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono-hud text-cyan-300">
                बोलने की गति (SPEECH RATE): {settings.speechRate}x
              </label>
              <span className="text-[10px] font-mono-hud text-slate-400">
                {settings.speechRate < 1 ? 'धीमा' : settings.speechRate > 1 ? 'तेज़' : 'सामान्य'}
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) =>
                onUpdateSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-xs font-mono-hud text-cyan-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              JARVIS HUD थीम रंग (THEME)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cyan', label: 'Cyan Stark', color: 'bg-cyan-500' },
                { id: 'amber', label: 'Amber Mk42', color: 'bg-amber-500' },
                { id: 'emerald', label: 'Emerald HUD', color: 'bg-emerald-500' },
                { id: 'purple', label: 'Vibranium', color: 'bg-purple-500' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() =>
                    onUpdateSettings({ themeColor: theme.id as AppSettings['themeColor'] })
                  }
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    settings.themeColor === theme.id
                      ? 'border-white bg-slate-800'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${theme.color}`} />
                  <span className="text-[9px] font-mono-hud text-slate-300 text-center">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-cyan-500/20 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs text-slate-200 font-tech">
                  हैंड्स-फ्री ऑटो-लिसनिंग (Continuous Dialogue)
                </span>
                <p className="text-[10px] text-slate-400 font-mono-hud">
                  यूकेजी के जवाब के बाद दोबारा अपने आप सुनना शुरू करे
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoListen}
                onChange={(e) => onUpdateSettings({ autoListen: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs text-slate-200 font-tech">
                  JARVIS साउंड इफेक्ट्स (Procedural Audio Beeps)
                </span>
                <p className="text-[10px] text-slate-400 font-mono-hud">
                  आवाज़ शुरू होने एवं प्रतिक्रिया पर वैज्ञानिक स्वर
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer rounded"
              />
            </label>
          </div>

          {/* Assistant Info / Free API badge */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-tech font-bold mb-1">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              UKG सिस्टम विवरण (SYSTEM SPEC)
            </div>
            <p className="text-[10px] text-slate-400 font-mono-hud leading-relaxed">
              Model: Gemini 3.8 Flash (Free Key Tier) + Gemini 3.8 Flash Lite TTS (24kHz WAV).
              Real-time Google Grounding active.
              Designed specifically for mobile devices with female Hindi natural voice.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono-hud transition-colors shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            पूर्ण (DONE)
          </button>
        </div>
      </div>
    </div>
  );
};
