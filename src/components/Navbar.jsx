import React, { useState } from 'react';
import { Heart, Flame, KeyRound, Sparkles } from 'lucide-react';

export default function Navbar({ streak, total = 365, onOpenSecretModal, adminBypass, onResetAdmin }) {
  const [logoTaps, setLogoTaps] = useState(0);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 3) {
      setLogoTaps(0);
      onOpenSecretModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-rosegold-500/20 px-4 py-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Secret Code Trigger */}
        <div 
          onClick={handleLogoTap}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="Tippe 3x auf den Titel für den Geheimcode-Dialog"
        >
          <div>
            <h1 className="text-base font-serif font-bold gold-gradient-text tracking-wide leading-tight">
              365 Gründe für Dich
            </h1>
            <p className="text-[10px] text-slate-400 font-sans tracking-wider uppercase">
              Für meine Nina
            </p>
          </div>
        </div>

        {/* Right Actions & Streak */}
        <div className="flex items-center gap-2">
          {adminBypass && (
            <button
              onClick={onResetAdmin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-medium"
              title="Admin Freigabe zurücksetzen"
            >
              <KeyRound className="w-3 h-3" /> Admin
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-midnight-800/90 border border-rosegold-500/30 text-xs font-semibold shadow-inner">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-pulse" />
            <span className="text-rosegold-200">{streak}</span>
            <span className="text-slate-500 font-normal">/ {total}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
