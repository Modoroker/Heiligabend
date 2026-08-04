import React from 'react';
import { Heart, Sparkles, Smartphone } from 'lucide-react';

export default function StatsFooter({ openedCount, total = 365 }) {
  const percentage = Math.round((openedCount / total) * 100);

  return (
    <footer className="w-full mt-8 pt-6 border-t border-rosegold-500/20 text-center space-y-4 pb-12">
      {/* Progress Bar */}
      <div className="max-w-xs mx-auto space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Dein Jahres-Fortschritt</span>
          <span className="text-rosegold-300 font-mono font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-midnight-800 rounded-full overflow-hidden border border-rosegold-500/20">
          <div
            className="h-full bg-gradient-to-r from-rosegold-500 via-rosegold-400 to-champagne-400 rounded-full transition-all duration-700 shadow-rose-glow"
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
      </div>

      {/* Romantic Sign-off */}
      <div className="pt-2">
        <p className="font-serif text-xl font-bold tracking-wide gold-gradient-text">
          In Liebe für meine traumhafte Ehefrau Nina
        </p>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-champagne-400" />
          Jeden Tag ein Stück von meinem Herzen
        </p>
      </div>
    </footer>
  );
}
