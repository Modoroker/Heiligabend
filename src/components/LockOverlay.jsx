import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, KeyRound, HeartHandshake } from 'lucide-react';

export default function LockOverlay({ day, countdown, onOpenSecretModal }) {
  const [isShaking, setIsShaking] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleLockClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // Secret trigger: tap lock 3 times to open PIN modal
    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    if (nextCount >= 3) {
      setTapCount(0);
      onOpenSecretModal();
    }
  };

  const isChristmasEve = day.id === 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full glass-panel rounded-3xl p-6 text-center border border-rosegold-500/30 shadow-rose-glow relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]"
    >
      {/* Background ambient glow */}
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-rosegold-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-champagne-500/10 rounded-full blur-3xl" />

      {/* Lock Icon Circle */}
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        onClick={handleLockClick}
        className="cursor-pointer relative group mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-midnight-800 to-midnight-700 border border-rosegold-400/30 flex items-center justify-center shadow-lg group-hover:border-rosegold-400/60 transition-all">
          <Lock className="w-9 h-9 text-rosegold-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-champagne-500 text-midnight-900 rounded-full p-1 shadow-md">
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </motion.div>

      {/* Title */}
      <h2 className="text-2xl font-serif font-bold gold-gradient-text mb-2">
        {isChristmasEve ? 'Heiligabend – Noch Versiegelt 🎁' : `Tag ${day.id} – Noch Versiegelt`}
      </h2>

      <p className="text-slate-300 text-sm max-w-xs mb-6">
        {isChristmasEve
          ? 'Noch etwas Geduld bis zur Bescherung! Die erste Botschaft öffnet sich um 22:00 Uhr.'
          : 'Diese liebevolle Botschaft schaltet sich am jeweiligen Tag um 00:00 Uhr frei.'}
      </p>

      {/* Countdown display */}
      {!countdown.isUnlocked && (
        <div className="flex items-center justify-center gap-3 my-2 bg-midnight-800/80 px-6 py-3 rounded-2xl border border-rosegold-500/20 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-rosegold-300">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Stunden</span>
          </div>
          <span className="text-xl font-bold text-rosegold-500/60 mb-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-champagne-300">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Minuten</span>
          </div>
          <span className="text-xl font-bold text-rosegold-500/60 mb-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-rosegold-300">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Sekunden</span>
          </div>
        </div>
      )}

      {/* Secret unlock button */}
      <button
        onClick={onOpenSecretModal}
        className="mt-6 inline-flex items-center gap-2 text-xs text-rosegold-400/80 hover:text-rosegold-300 hover:underline transition-all"
      >
        <KeyRound className="w-3.5 h-3.5" /> Bescherung früher? (Geheimcode eingeben)
      </button>
    </motion.div>
  );
}
