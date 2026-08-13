import React from 'react';
import { Heart } from 'lucide-react';

export default function StatsFooter({ openedCount = 0, total = 365 }) {
  const safeOpened = Number(openedCount) || 0;
  const safeTotal = Number(total) || 365;
  const percentage = Math.min(100, Math.max(0, Math.round((safeOpened / safeTotal) * 100)));

  return (
    <footer className="w-full mt-8 pt-6 border-t border-rosegold-500/20 text-center space-y-4 pb-12">
      {/* Progress Bar */}
      <div className="max-w-xs mx-auto space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Dein Jahres-Fortschritt</span>
          <span className="text-rosegold-300 font-mono font-bold">{percentage}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Dein Jahres-Fortschritt"
          className="w-full h-2.5 bg-midnight-800 rounded-full overflow-hidden border border-rosegold-500/20"
        >
          <div
            className="h-full bg-gradient-to-r from-rosegold-500 via-rosegold-400 to-champagne-400 rounded-full transition-all duration-700 shadow-rose-glow"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
      </div>

      {/* Romantic Sign-off - Prominent "Jeden Tag ein Stück von meinem Herzen" with Heart */}
      <div className="pt-3">
        <p className="font-serif text-lg sm:text-xl font-bold tracking-wide gold-gradient-text flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-red-400 fill-red-400/30 animate-pulse" />
          Jeden Tag ein Stück von meinem Herzen
        </p>
      </div>
    </footer>
  );
}
