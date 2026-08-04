import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fireDayAnimation } from '../utils/confettiUtils';
import { getSpecialDayInfo } from '../utils/specialDaysUtils';
import ScratchCard from './ScratchCard';

export default function MessageModal({
  day,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  isOpened,
  onMarkOpened,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
}) {
  const [showScratch, setShowScratch] = useState(false);

  useEffect(() => {
    if (isOpen && day) {
      if (!isOpened) {
        setShowScratch(true);
      } else {
        setShowScratch(false);
        fireDayAnimation(day.id);
      }
    }
  }, [isOpen, day, isOpened]);

  const handleScratchComplete = () => {
    setShowScratch(false);
    if (onMarkOpened && day) {
      onMarkOpened(day.id);
    }
    if (day) {
      fireDayAnimation(day.id);
    }
  };

  if (!isOpen || !day) return null;

  const mode = day.id % 8;
  const specialInfo = getSpecialDayInfo(day.date);

  // 8 Unique Framer Motion Animation Variants for the modal card
  const animationVariants = {
    1: {
      initial: { opacity: 0, scale: 0.7, y: 50 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.7, y: 50 },
      transition: { type: 'spring', damping: 15, stiffness: 220 }
    },
    2: {
      initial: { opacity: 0, rotateY: 90, scale: 0.8 },
      animate: { opacity: 1, rotateY: 0, scale: 1 },
      exit: { opacity: 0, rotateY: -90, scale: 0.8 },
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    3: {
      initial: { opacity: 0, rotate: -15, scale: 0.6 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 15, scale: 0.6 },
      transition: { type: 'spring', damping: 12, stiffness: 180 }
    },
    4: {
      initial: { opacity: 0, y: -100 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 100 },
      transition: { type: 'spring', damping: 18, stiffness: 200 }
    },
    5: {
      initial: { opacity: 0, scale: 0.2 },
      animate: { opacity: 1, scale: [0.2, 1.08, 1] },
      exit: { opacity: 0, scale: 0.5 },
      transition: { duration: 0.45 }
    },
    6: {
      initial: { opacity: 0, x: -80, rotate: -5 },
      animate: { opacity: 1, x: 0, rotate: 0 },
      exit: { opacity: 0, x: 80, rotate: 5 },
      transition: { type: 'spring', damping: 16, stiffness: 190 }
    },
    7: {
      initial: { opacity: 0, y: 120, scale: 0.8 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -120, scale: 0.8 },
      transition: { type: 'spring', damping: 14, stiffness: 210 }
    },
    0: {
      initial: { opacity: 0, rotateX: 60, scale: 0.85 },
      animate: { opacity: 1, rotateX: 0, scale: 1 },
      exit: { opacity: 0, rotateX: -60, scale: 0.85 },
      transition: { duration: 0.45, ease: 'easeOut' }
    }
  };

  const currentAnim = animationVariants[mode] || animationVariants[1];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md">
        {/* Previous Navigation Chevron */}
        {hasPrev && !showScratch && (
          <button
            onClick={onNavigatePrev}
            className="absolute left-2 z-50 p-3 rounded-full bg-midnight-800/80 text-rosegold-300 hover:text-white hover:bg-rosegold-500/20 border border-rosegold-500/30 transition-all shadow-rose-glow"
            title="Vorheriger Tag"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Navigation Chevron */}
        {hasNext && !showScratch && (
          <button
            onClick={onNavigateNext}
            className="absolute right-2 z-50 p-3 rounded-full bg-midnight-800/80 text-rosegold-300 hover:text-white hover:bg-rosegold-500/20 border border-rosegold-500/30 transition-all shadow-rose-glow"
            title="Nächster Tag"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={day.id}
          initial={currentAnim.initial}
          animate={currentAnim.animate}
          exit={currentAnim.exit}
          transition={currentAnim.transition}
          className="w-full max-w-md glass-card rounded-3xl p-6 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col justify-between"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-rosegold-500/20 pb-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rosegold-500/20 text-rosegold-200 border border-rosegold-500/30">
              Tag {day.id} von 365
            </span>
            {specialInfo && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-gold-glow animate-pulse">
                {specialInfo.icon} {specialInfo.title}
              </span>
            )}
          </div>

          {/* Text Content Area with ScratchCard Overlay */}
          <div className="py-8 text-center relative min-h-[180px] flex flex-col justify-center items-center">
            {showScratch && (
              <ScratchCard onComplete={handleScratchComplete} threshold={0.3} />
            )}

            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mb-1">“</span>
            <p className="text-lg sm:text-xl font-serif leading-relaxed text-slate-100 font-medium gold-gradient-text">
              {day.text}
            </p>
            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mt-1">”</span>
          </div>

          {/* Footer */}
          <div className="border-t border-rosegold-500/20 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(day.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-slate-400 hover:text-rosegold-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
              </button>
            </div>

            <span className="font-serif font-bold text-sm text-rosegold-300 tracking-wide">
              Für Nina
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
