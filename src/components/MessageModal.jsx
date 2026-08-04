import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Share2, CheckCircle2, Calendar } from 'lucide-react';

export default function MessageModal({ day, isOpen, onClose, isFavorite, onToggleFavorite }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !day) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `365 Gründe für Dich – Tag ${day.id}`,
          text: `"${day.text}" ❤️`,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      navigator.clipboard.writeText(`"${day.text}" ❤️ - 365 Gründe für Dich (Tag ${day.id})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
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
              Tag {day.id}
            </span>
            <span className="text-xs text-slate-400 font-serif italic">
              {day.category}
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
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-slate-400 hover:text-champagne-300 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
              </button>
            </div>

            <span className="font-handwriting text-lg text-rosegold-300">
              Für Nina
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
