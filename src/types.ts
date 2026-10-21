export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  audioUrl?: string;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
  isAudioInput?: boolean;
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

export type VoiceMode = 'neural_kore' | 'neural_zephyr' | 'browser_hindi';

export interface AppSettings {
  voiceMode: VoiceMode;
  autoListen: boolean; // Continuous conversational loop
  soundEffects: boolean;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'purple';
  speechRate: number;
  silenceThresholdMs: number;
}
