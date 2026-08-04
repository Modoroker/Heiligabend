import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, HeartHandshake, Bookmark, Share2, CheckCircle2 } from 'lucide-react';
import { fireHeartConfetti } from '../utils/confettiUtils';

export default function DailyCard({
  day,
  isOpened,
  isFavorite,
  onMarkOpened,
  onToggleFavorite,
}) {
  const [isOpen, setIsOpen] = useState(isOpened);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsOpen(isOpened);
  }, [isOpened]);

  const handleOpenEnvelope = () => {
    if (!isOpen) {
      setIsOpen(true);
      onMarkOpened(day.id);
      fireHeartConfetti();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `365 Gründe für Dich – Tag ${day.id}`,
          text: `"${day.text}" ❤️`,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(`"${day.text}" ❤️ - 365 Gründe für Dich (Tag ${day.id})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full relative perspective-1000">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* CLOSED ENVELOPE RITUAL */
          <motion.div
            key="envelope-closed"
            initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 1.05, rotateY: 90 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={handleOpenEnvelope}
            className="w-full glass-panel rounded-3xl p-8 cursor-pointer border border-rosegold-500/40 shadow-envelope flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px] group select-none hover:border-rosegold-400 transition-all"
          >
            {/* Ambient shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-rosegold-500/10 via-transparent to-champagne-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />
            
            {/* Envelope Flap visual decoration */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-midnight-700/60 to-transparent clip-path-flap pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-rosegold-300 font-semibold mb-6">
                Tagesbotschaft #{day.id}
              </span>

              {/* Romantic Wax Seal */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-rosegold-600 via-rosegold-500 to-champagne-400 p-1 shadow-rose-glow wax-seal-pulse flex items-center justify-center mb-6 relative"
              >
                <div className="w-full h-full rounded-full bg-midnight-900 flex flex-col items-center justify-center border border-rosegold-300/40">
                  <Heart className="w-10 h-10 text-rosegold-300 fill-rosegold-500/40 animate-pulse" />
                  <span className="text-[9px] text-champagne-300 tracking-wider font-sans font-bold uppercase mt-0.5">
                    Öffnen
                  </span>
                </div>
              </motion.div>

              <p className="text-xs text-slate-400 max-w-xs flex items-center justify-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-champagne-400 animate-spin" />
                Tippe auf das Siegel, um deinen Grund zu enthüllen
              </p>
            </div>
          </motion.div>
        ) : (
          /* REVEALED CARD STATE */
          <motion.div
            key="envelope-opened"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', damping: 20 }}
            className="w-full glass-card rounded-3xl p-8 border border-rosegold-400/40 shadow-rose-glow relative overflow-hidden flex flex-col justify-between min-h-[380px]"
          >
            {/* Top header bar */}
            <div className="flex items-center justify-between border-b border-rosegold-500/20 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rosegold-500/20 text-rosegold-200 border border-rosegold-500/30">
                  Tag {day.id} von 365
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleFavorite(day.id)}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-slate-400 hover:text-rosegold-300 hover:bg-slate-800/50'
                  }`}
                  title="Zu Favoriten hinzufügen"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Main Romantic Text Display */}
            <div className="my-auto py-6 px-2 text-center">
              <span className="text-4xl font-serif text-rosegold-400/40 select-none block mb-1">“</span>
              <p className="text-xl sm:text-2xl font-serif leading-relaxed text-slate-100 font-medium gold-gradient-text">
                {day.text}
              </p>
              <span className="text-4xl font-serif text-rosegold-400/40 select-none block mt-1">”</span>
            </div>

            {/* Bottom Footer signature */}
            <div className="border-t border-rosegold-500/20 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="font-serif font-bold text-sm text-rosegold-300 tracking-wide">
                In Liebe für Nina
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gelesen
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
