import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

function formatLockDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const dayNum = parseInt(parts[2], 10);
  const monthNum = parseInt(parts[1], 10);
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return `${dayNum}. ${monthNames[monthNum - 1] || ''}`;
}

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLockClick();
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

      {/* 3D Heart Lock Icon */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Tag ${day?.id || ''} noch versiegelt`}
        onKeyDown={handleKeyDown}
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        onClick={handleLockClick}
        className="cursor-pointer relative group mb-5 focus:outline-none focus:ring-2 focus:ring-rosegold-400 rounded-full"
      >
        <div className="w-24 h-24 relative flex items-center justify-center drop-shadow-[0_10px_25px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-transform">
          <img
            src="/sprites/heart-lock.png"
            alt="Königliches Herzschloss"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </motion.div>

      {/* Title */}
      <h2 className="text-2xl font-serif font-bold gold-gradient-text mb-2">
        {isChristmasEve ? 'Heiligabend – noch versiegelt' : `Tag ${day.id} – noch versiegelt`}
      </h2>

      <p className="text-slate-300 text-sm max-w-xs mb-6">
        {isChristmasEve
          ? 'Noch etwas Geduld bis zur Bescherung! Die erste Botschaft öffnet sich um 21:00 Uhr.'
          : `Noch ein bisschen Geduld – diese Botschaft öffnet sich am ${formatLockDate(day.date)} um 00:00 Uhr.`}
      </p>

      {/* Countdown display (supports Days, Hours, Minutes, Seconds) */}
      {!countdown.isUnlocked && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 my-2 bg-midnight-800/80 px-2.5 sm:px-5 py-3 rounded-2xl border border-rosegold-500/20 shadow-inner max-w-full">
          {countdown.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold font-mono text-champagne-300">
                  {countdown.days}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {countdown.days === 1 ? 'Tag' : 'Tage'}
                </span>
              </div>
              <span className="text-xl font-bold text-rosegold-500/60 mb-3">:</span>
            </>
          )}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-rosegold-300">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              {countdown.hours === 1 ? 'Stunde' : 'Stunden'}
            </span>
          </div>
          <span className="text-xl font-bold text-rosegold-500/60 mb-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-champagne-300">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              {countdown.minutes === 1 ? 'Minute' : 'Minuten'}
            </span>
          </div>
          <span className="text-xl font-bold text-rosegold-500/60 mb-3">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-mono text-rosegold-300">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              {countdown.seconds === 1 ? 'Sekunde' : 'Sekunden'}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
