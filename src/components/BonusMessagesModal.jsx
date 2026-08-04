import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Lock, Sparkles, Heart } from 'lucide-react';
import bonusMessages from '../data/bonusMessages.json';
import { fireHeartExplosion } from '../utils/confettiUtils';

export default function BonusMessagesModal({ isOpen, onClose, openedCount, streak, now, adminBypass }) {
  const [selectedBonus, setSelectedBonus] = useState(null);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="w-full max-w-md glass-card rounded-3xl p-6 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-rosegold-500/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rosegold-500/20 text-rosegold-300">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold gold-gradient-text">
                  Geheim-Nachrichten
                </h3>
                <span className="text-[11px] text-slate-400">
                  {adminBypass ? '✨ Admin-Modus: Alle 7 Briefe freigeschaltet' : 'Überraschungs-Extra-Post für Nina'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: List or Selected Detail View */}
          <div className="py-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
            {selectedBonus ? (
              <div className="space-y-4 text-center py-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rosegold-500/20 text-rosegold-200 border border-rosegold-500/30 inline-block">
                  {selectedBonus.title}
                </span>

                <div className="py-4">
                  <span className="text-3xl font-serif text-rosegold-400/40 select-none block mb-1">“</span>
                  <p className="text-lg font-serif leading-relaxed text-slate-100 gold-gradient-text">
                    {selectedBonus.text}
                  </p>
                  <span className="text-3xl font-serif text-rosegold-400/40 select-none block mt-1">”</span>
                </div>

                <button
                  onClick={() => setSelectedBonus(null)}
                  className="px-4 py-2 rounded-full bg-midnight-800 border border-rosegold-500/30 text-xs text-rosegold-200 hover:bg-slate-800 transition-colors"
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
                    onClick={() => handleOpenBonus(bonus)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      unlocked
                        ? 'bg-midnight-800/80 border-rosegold-500/40 hover:border-rosegold-300 shadow-rose-glow'
                        : 'bg-midnight-900/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          unlocked
                            ? 'bg-rosegold-500/20 border-champagne-400/40 text-champagne-300 animate-pulse'
                            : 'bg-midnight-900 border-slate-800 text-slate-600'
                        }`}
                      >
                        {unlocked ? <Sparkles className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-200 font-serif">
                          {bonus.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {bonus.subtitle}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                        unlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
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
