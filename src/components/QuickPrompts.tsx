import React from 'react';
import { Sparkles, Compass, Atom, Heart, Lightbulb, Newspaper } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled: boolean;
}

const prompts = [
  {
    icon: Sparkles,
    label: 'नमस्ते यूकेजी! हालचाल बताओ',
    text: 'नमस्ते यूकेजी, आप कैसी हैं? मुझे अपने बारे में और अपनी खूबियों के बारे में बताएं।',
    category: 'दोस्ती (Friendship)',
  },
  {
    icon: Newspaper,
    label: 'ताज़ा समाचार और मौसम',
    text: 'आज के मुख्य समाचार और मौसम का हाल बताइए।',
    category: 'ज्ञान (Updates)',
  },
  {
    icon: Atom,
    label: 'विज्ञान का रहस्य',
    text: 'ब्रह्मांड, ब्लैक होल या क्वांटम भौतिकी का कोई हैरान कर देने वाला वैज्ञानिक तथ्य बताओ।',
    category: 'विज्ञान (Science)',
  },
  {
    icon: Heart,
    label: 'प्यारी प्रेरक शायरी',
    text: 'मुझे प्रेरित करने वाली और दिल को छू जाने वाली एक खूबसूरत हिंदी शायरी सुनाओ।',
    category: 'शायरी (Poetry)',
  },
  {
    icon: Compass,
    label: 'दोस्त जैसी सलाह',
    text: 'एक सच्ची दोस्त की तरह बताओ कि जीवन में हमेशा ऊर्जावान और खुश कैसे रहें?',
    category: 'प्रेरणा (Life)',
  },
  {
    icon: Lightbulb,
    label: 'JARVIS तकनीक कैसे काम करती है?',
    text: 'टोनी स्टार्क के जार्विस जैसी एआई तकनीक और आपकी कार्यप्रणाली कैसे काम करती है?',
    category: 'तकनीक (Tech)',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto my-2 px-2 select-none">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-mono-hud text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          त्वरित प्रश्न • QUICK COMMANDS
        </span>
        <span className="text-[10px] font-mono-hud text-slate-500">
          टैप करें और सुनें
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.text)}
              disabled={disabled}
              className="group relative flex flex-col items-start p-2 rounded-lg hud-glass hud-border hover:border-cyan-400/60 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-950/20 active:scale-95"
            >
              <div className="flex items-center gap-1.5 w-full mb-1">
                <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono-hud text-slate-400 group-hover:text-cyan-300">
                  {p.category}
                </span>
              </div>
              <span className="text-xs text-slate-200 group-hover:text-white font-medium line-clamp-1 leading-tight">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
