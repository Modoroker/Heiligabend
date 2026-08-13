import React, { useState, useRef, useEffect } from 'react';
import { Flame, KeyRound, Gift, Heart, Gamepad2 } from 'lucide-react';

export default function Navbar({
  streak,
  total = 365,
  onOpenSecretModal,
  onOpenBonusModal,
  onOpenGameModal,
  adminBypass,
  onResetAdmin,
}) {
  const [logoTaps, setLogoTaps] = useState(0);
  const tapTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const handleLogoTap = () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 3) {
      setLogoTaps(0);
      onOpenSecretModal();
    } else {
      tapTimeoutRef.current = setTimeout(() => setLogoTaps(0), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLogoTap();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-rosegold-500/20 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo with EKG Heartbeat & Secret Code Trigger */}
        <div
          role="button"
          tabIndex={0}
          aria-label="365 Gründe, warum ich dich Liebe (3x tippen für Geheimcode)"
          onClick={handleLogoTap}
          onKeyDown={handleKeyDown}
          className="flex items-center gap-2 cursor-pointer select-none group focus:outline-none focus:ring-1 focus:ring-rosegold-400 rounded-lg p-1 min-w-0 flex-1"
          title="Tippe 3x auf den Titel für den Geheimcode-Dialog"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rosegold-500/20 border border-rosegold-500/30 flex-shrink-0 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 fill-red-400/40 ekg-heartbeat" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] sm:text-sm font-serif font-bold gold-gradient-text tracking-tight leading-tight">
              <span>365 Gründe,</span>
              <br className="inline sm:hidden" />
              <span className="sm:inline"> warum ich dich Liebe</span>
            </h1>
          </div>
        </div>

        {/* Right Actions: Admin, Game, Gift Box, and Streak */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {adminBypass && (
            <button
              onClick={onResetAdmin}
              aria-label="Admin Freigabe zurücksetzen"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] font-medium flex-shrink-0"
              title="Admin Freigabe zurücksetzen"
            >
              <KeyRound className="w-3 h-3" /> Admin
            </button>
          )}

          {/* Minigame Button 🎮 */}
          <button
            onClick={onOpenGameModal}
            aria-label="Herzen-Fang Minispiel öffnen"
            className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 transition-all flex items-center justify-center flex-shrink-0 shadow-sm"
            title="Herzen-Fang Minispiel spielen 🎮"
          >
            <Gamepad2 className="w-4 h-4 text-pink-300 animate-pulse" />
          </button>

          {/* Bonus Secret Messages Gift Modal 🎁 (Fixed size to never squash!) */}
          <button
            onClick={onOpenBonusModal}
            aria-label="Geheim-Nachrichten und Geschenke öffnen"
            className="w-8 h-8 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 hover:bg-rosegold-500/30 transition-all flex items-center justify-center flex-shrink-0 shadow-sm p-1"
            title="Geheim-Nachrichten öffnen 🎁"
          >
            <img src="/sprites/gift-box.png" alt="Geschenk" className="w-5 h-5 object-contain animate-bounce pointer-events-none" />
          </button>

          {/* Streak Badge */}
          <div
            aria-label={`Fortschritt: ${streak} von ${total} Gründen geöffnet`}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-midnight-800/90 border border-rosegold-500/30 text-[11px] sm:text-xs font-semibold shadow-inner flex-shrink-0"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
            <span className="text-rosegold-200 font-mono">{streak}</span>
            <span className="text-slate-500 font-normal font-mono text-[10px]">/{total}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
