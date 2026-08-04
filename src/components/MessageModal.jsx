import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { fireDayAnimation } from '../utils/confettiUtils';

export default function MessageModal({ day, isOpen, onClose, isFavorite, onToggleFavorite }) {
  useEffect(() => {
    if (isOpen && day) {
      fireDayAnimation(day.id);
    }
  }, [isOpen, day]);

  if (!isOpen || !day) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 3 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          className="w-full max-w-md glass-card rounded-3xl p-6 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col justify-between"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 border-b border-rosegold-500/20 pb-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rosegold-500/20 text-rosegold-200 border border-rosegold-500/30">
              Tag {day.id} von 365
            </span>
          </div>

          <div className="py-8 text-center">
            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mb-1">“</span>
            <p className="text-lg sm:text-xl font-serif leading-relaxed text-slate-100 font-medium gold-gradient-text">
              {day.text}
            </p>
            <span className="text-3xl font-serif text-rosegold-400/40 select-none block mt-1">”</span>
          </div>

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
