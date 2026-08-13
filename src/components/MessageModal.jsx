import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fireDayAnimation, fireRoyalCelebration } from '../utils/confettiUtils';
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
      fireRoyalCelebration();
    }
  };

  // Keyboard navigation (Escape to close, Left/Right arrows to navigate)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && !showScratch && onNavigatePrev) {
        onNavigatePrev();
      } else if (e.key === 'ArrowRight' && hasNext && !showScratch && onNavigateNext) {
        onNavigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, hasPrev, hasNext, showScratch, onNavigatePrev, onNavigateNext]);

  if (!isOpen || !day) return null;

  const specialInfo = getSpecialDayInfo(day.date);

  // Smooth, robust spring popup animation for all days (prevents 3D matrix canvas distortion on Day 2 etc.)
  const modalAnim = {
    initial: { opacity: 0, scale: 0.9, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 15 },
    transition: { type: 'spring', damping: 24, stiffness: 280 }
  };

  // Drag End handler for touch swipe left/right
  const handleDragEnd = (event, info) => {
    if (showScratch) return; // Don't swipe while scratch layer is active!
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && hasNext && onNavigateNext) {
      onNavigateNext();
    } else if (info.offset.x > swipeThreshold && hasPrev && onNavigatePrev) {
      onNavigatePrev();
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-modal-title"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md"
      >
        {/* Previous Navigation Chevron */}
        {hasPrev && !showScratch && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigatePrev(); }}
            className="absolute left-2 z-50 p-3 rounded-full bg-midnight-800/80 text-rosegold-300 hover:text-white hover:bg-rosegold-500/20 border border-rosegold-500/30 transition-all shadow-rose-glow"
            title="Vorheriger Tag"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Navigation Chevron */}
        {hasNext && !showScratch && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigateNext(); }}
            className="absolute right-2 z-50 p-3 rounded-full bg-midnight-800/80 text-rosegold-300 hover:text-white hover:bg-rosegold-500/20 border border-rosegold-500/30 transition-all shadow-rose-glow"
            title="Nächster Tag"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={day.id}
          drag={showScratch ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
          initial={modalAnim.initial}
          animate={modalAnim.animate}
          exit={modalAnim.exit}
          transition={modalAnim.transition}
          className={`w-full max-w-md glass-card rounded-3xl p-6 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col justify-between ${
            showScratch ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
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
              <ScratchCard onComplete={handleScratchComplete} threshold={0.4} />
            )}

            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mb-1">“</span>
            <p className="text-lg sm:text-xl font-serif leading-relaxed text-slate-100 font-medium gold-gradient-text">
              {day.text}
            </p>
            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mt-1">”</span>
          </div>

          {/* Swipe Hint when already freigerubbelt */}
          {(hasPrev || hasNext) && !showScratch && (
            <div className="text-[10px] text-center text-slate-400 mb-2 font-mono tracking-tight select-none">
              ← Wische nach links/rechts für andere Tage →
            </div>
          )}

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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
