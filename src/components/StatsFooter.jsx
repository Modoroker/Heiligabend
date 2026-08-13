import React from 'react';
import { Sparkles } from 'lucide-react';

export default function StatsFooter({ openedCount = 0, total = 365 }) {
  const safeOpened = Number(openedCount) || 0;
  const safeTotal = Number(total) || 365;
  const percentage = Math.min(100, Math.max(0, Math.round((safeOpened / safeTotal) * 100)));

  return (
    <footer className="w-full mt-6 pt-2 text-center pb-8">
      {/* Luxury Progress Bar */}
      <div className="max-w-xs mx-auto space-y-2 px-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-serif font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-champagne-400" />
            Jahres-Fortschritt
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rosegold-500/20 text-champagne-300 font-mono font-bold text-[11px] border border-rosegold-500/30 shadow-sm">
            {percentage}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Dein Jahres-Fortschritt"
          className="w-full h-3.5 bg-midnight-950/80 rounded-full overflow-hidden p-0.5 border border-rosegold-400/30 shadow-inner relative"
        >
          {/* Ambient Background Track Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-rosegold-500/5 via-champagne-500/10 to-transparent pointer-events-none" />

          {/* Glowing Fill Bar */}
          <div
            className="h-full bg-gradient-to-r from-rosegold-500 via-rose-400 to-champagne-300 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(232,180,184,0.6)] relative overflow-hidden"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          >
            {/* Shimmer Light Reflection */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
