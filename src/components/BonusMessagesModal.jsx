import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Sparkles } from 'lucide-react';
import bonusMessages from '../data/bonusMessages.json';
import { fireHeartExplosion } from '../utils/confettiUtils';

export default function BonusMessagesModal({ isOpen, onClose, openedCount, streak, now, adminBypass }) {
  const [selectedBonus, setSelectedBonus] = useState(null);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Check if a bonus message is unlocked based on streak or date
  const isBonusUnlocked = (bonus) => {
    if (adminBypass) return true;

    if (bonus.triggerType === 'streak') {
      return streak >= bonus.triggerValue || openedCount >= bonus.triggerValue;
    }

    if (bonus.triggerType === 'date') {
      // Map trigger MM-DD to full year (2026 for Dec, 2027 for rest)
      const targetYear = bonus.triggerValue.startsWith('12') ? '2026' : '2027';
      const targetDate = new Date(`${targetYear}-${bonus.triggerValue}T00:00:00`);
      return now >= targetDate;
    }

    return false;
  };

  const handleOpenBonus = (bonus) => {
    if (isBonusUnlocked(bonus)) {
      setSelectedBonus(bonus);
      fireHeartExplosion();
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bonus-modal-title"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-midnight-950/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-rosegold-500/20 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 p-1 rounded-2xl bg-rosegold-500/20 flex-shrink-0 flex items-center justify-center border border-rosegold-400/30">
                <img src="/sprites/gift-box.png" alt="Geschenkbox" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 id="bonus-modal-title" className="text-base sm:text-lg font-serif font-bold gold-gradient-text truncate">
                  Geheim-Nachrichten
                </h3>
                <span className="text-xs text-slate-300 block truncate font-medium">
                  {adminBypass ? '✨ Admin-Modus: Alle 7 Briefe freigeschaltet' : 'Überraschungs-Extra-Post für Nina'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Schließen"
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex-shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: List or Selected Detail View */}
          <div className="py-3 flex-1 min-h-0 overflow-y-auto space-y-2.5 overscroll-contain">
            {selectedBonus ? (
              <div className="flex flex-col items-center justify-between min-h-0 flex-1 space-y-4 py-1">
                {/* Scrollable Letter Body */}
                <div className="w-full flex-1 min-h-0 overflow-y-auto space-y-3 text-center px-1">
                  <span className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rosegold-500/20 text-rosegold-200 border border-rosegold-500/30 inline-block shadow-sm">
                    {selectedBonus.title}
                  </span>

                  <div className="p-5 sm:p-6 rounded-2xl bg-midnight-950/90 border border-rosegold-500/35 shadow-inner relative">
                    <span className="text-3xl font-serif text-rosegold-400/50 select-none block -mb-1">“</span>
                    <p className="text-base sm:text-lg font-serif leading-relaxed text-slate-100 font-medium px-1">
                      {selectedBonus.text}
                    </p>
                    <span className="text-3xl font-serif text-rosegold-400/50 select-none block -mt-1">”</span>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setSelectedBonus(null)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-950 font-bold text-sm hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  ← Zurück zur Übersicht
                </button>
              </div>
            ) : (
              bonusMessages.map((bonus) => {
                const unlocked = isBonusUnlocked(bonus);

                return (
                  <div
                    key={bonus.id}
                    role="button"
                    tabIndex={unlocked ? 0 : -1}
                    aria-label={`${bonus.title}: ${bonus.subtitle}${unlocked ? ' (Freigeschaltet)' : ' (Gesperrt)'}`}
                    onClick={() => handleOpenBonus(bonus)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenBonus(bonus);
                      }
                    }}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-rosegold-400 ${
                      unlocked
                        ? 'bg-midnight-900/90 border-rosegold-500/40 hover:border-rosegold-300 shadow-rose-glow'
                        : 'bg-midnight-900/50 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
                          unlocked
                            ? 'bg-rosegold-500/20 border-champagne-400/40 text-champagne-300 animate-pulse'
                            : 'bg-midnight-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {unlocked ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-champagne-300" /> : <Lock className="w-5 h-5 text-slate-500" />}
                      </div>

                      <div className="min-w-0 flex-1 pr-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-100 font-serif truncate">
                          {bonus.title}
                        </h4>
                        <span className="text-xs text-rosegold-300 block truncate font-medium mt-0.5">
                          {bonus.subtitle}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1.5 rounded-full font-bold border flex-shrink-0 ml-2 shadow-sm ${
                        unlocked
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {unlocked ? 'Öffnen 💌' : 'Gesperrt'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
