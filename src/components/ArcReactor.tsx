import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';

interface ArcReactorProps {
  state: AssistantState;
  analyser: AnalyserNode | null;
  onCoreClick?: () => void;
  themeColor: 'cyan' | 'amber' | 'emerald' | 'purple';
}

const themeColors = {
  cyan: {
    primary: '#06b6d4',
    secondary: '#38bdf8',
    glow: 'rgba(6, 182, 212, 0.45)',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    ring: 'rgba(6, 182, 212, 0.8)',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.45)',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    ring: 'rgba(245, 158, 11, 0.8)',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    ring: 'rgba(16, 185, 129, 0.8)',
  },
  purple: {
    primary: '#a855f7',
    secondary: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.45)',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    ring: 'rgba(168, 85, 247, 0.8)',
  },
};

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  analyser,
  onCoreClick,
  themeColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const colors = themeColors[themeColor];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.38;

      angle += 0.02;

      // Read audio data if active
      let avgVolume = 0;
      if (analyser && (state === 'listening' || state === 'speaking')) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        avgVolume = sum / bufferLength;
      } else if (state === 'processing') {
        avgVolume = 35 + Math.sin(angle * 4) * 15;
      } else {
        avgVolume = 12 + Math.sin(angle * 1.5) * 6; // gentle idle breathing
      }

      const normalizedVol = Math.min(avgVolume / 100, 1.8);

      // Draw outer glowing wave rings
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 15 + normalizedVol * 14, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'listening' ? 'rgba(239, 68, 68, 0.5)' : colors.glow;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Radial frequency bars around circular core
      const bars = 36;
      for (let i = 0; i < bars; i++) {
        const barAngle = (i / bars) * Math.PI * 2 + (state === 'processing' ? angle * 2 : 0);
        const dataIdx = i % bufferLength;
        const barHeight =
          state === 'listening' || state === 'speaking'
            ? Math.max(4, (dataArray[dataIdx] / 255) * 36)
            : state === 'processing'
            ? 6 + Math.sin(angle * 3 + i) * 6
            : 3 + Math.sin(angle + i * 0.3) * 3;

        const x1 = centerX + Math.cos(barAngle) * (radius - 2);
        const y1 = centerY + Math.sin(barAngle) * (radius - 2);
        const x2 = centerX + Math.cos(barAngle) * (radius + barHeight + 4);
        const y2 = centerY + Math.sin(barAngle) * (radius + barHeight + 4);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle =
          state === 'listening'
            ? `rgba(244, 63, 94, ${0.4 + (barHeight / 40) * 0.6})`
            : state === 'speaking'
            ? `rgba(56, 189, 248, ${0.5 + (barHeight / 40) * 0.5})`
            : `${colors.ring}`;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Inner glowing core
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius * 0.72
      );

      if (state === 'listening') {
        gradient.addColorStop(0, 'rgba(255, 99, 132, 0.95)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (state === 'speaking') {
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
        gradient.addColorStop(0.4, colors.glow);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (state === 'processing') {
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.95)');
        gradient.addColorStop(0.5, colors.glow);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(0.5, colors.glow);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Orbiting energy dots
      const numOrbits = 3;
      for (let o = 0; o < numOrbits; o++) {
        const dotAngle = angle * (o % 2 === 0 ? 1.5 : -1.8) + (o * Math.PI * 2) / numOrbits;
        const dotRadius = radius * (0.45 + o * 0.12);
        const dx = centerX + Math.cos(dotAngle) * dotRadius;
        const dy = centerY + Math.sin(dotAngle) * dotRadius;

        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = colors.primary;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, analyser, colors]);

  const getStateLabel = () => {
    switch (state) {
      case 'listening':
        return 'सुना जा रहा है... (LISTENING)';
      case 'processing':
        return 'विचार विमर्श... (THINKING)';
      case 'speaking':
        return 'यूकेजी बोल रही है... (SPEAKING)';
      default:
        return 'यूकेजी तैयार है (ONLINE)';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center my-2 select-none">
      {/* Outer rotating HUD ring */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Outer dashed spinning ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed ${colors.border} animate-spin-slow`}
        />
        {/* Inner reverse spinning ring */}
        <div
          className={`absolute inset-3 rounded-full border border-dotted border-cyan-400/25 animate-spin-reverse`}
        />
        {/* HUD tick notches */}
        <div className="absolute inset-1 border-t-2 border-b-2 border-cyan-400/30 rounded-full" />
        <div className="absolute inset-1 border-l-2 border-r-2 border-transparent rounded-full" />

        {/* Dynamic canvas visualizer */}
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          onClick={onCoreClick}
          className="relative z-10 w-full h-full cursor-pointer transition-transform active:scale-95"
          title="Tap to speak with UKG"
        />

        {/* Center Holographic Core Overlay */}
        <div
          onClick={onCoreClick}
          className="absolute z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center cursor-pointer pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all"
        >
          <div className="text-[10px] tracking-widest font-mono-hud text-cyan-300 font-bold uppercase">
            UKG CORE
          </div>
          <div className="text-xl sm:text-2xl font-black font-tech text-white tracking-wider">
            यूकेजी
          </div>
          <div className="text-[9px] font-mono-hud text-cyan-400/80 uppercase">
            HINDI FEMALE
          </div>
        </div>
      </div>

      {/* State Badge with glowing indicator */}
      <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full hud-glass hud-border">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-rose-500 animate-ping'
              : state === 'speaking'
              ? 'bg-cyan-400 animate-pulse'
              : state === 'processing'
              ? 'bg-purple-400 animate-bounce'
              : 'bg-emerald-400'
          }`}
        />
        <span className="text-xs font-mono-hud tracking-wider text-slate-200">
          {getStateLabel()}
        </span>
      </div>
    </div>
  );
};
