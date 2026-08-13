import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, CheckCircle2 } from 'lucide-react';

export default function SecretPinModal({ isOpen, onClose, onUnlockSecret }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = onUnlockSecret(pin);
    if (ok) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        setSuccess(false);
        setPin('');
        onClose();
      }, 1200);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-pin-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-rosegold-500/30 shadow-rose-glow relative"
        >
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rosegold-600 to-champagne-400 p-0.5 shadow-gold-glow flex items-center justify-center">
              <div className="w-full h-full bg-midnight-800 rounded-[14px] flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-rosegold-300 animate-pulse" />
              </div>
            </div>

            <div>
              <h3 id="secret-pin-title" className="text-xl font-serif font-bold gold-gradient-text">
                Secret Override Code
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Gib deinen Geheimcode ein, um die Botschaften freizuschalten.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4 pt-2">
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Geheimcode eingeben"
                  aria-label="Geheimcode"
                  className={`w-full px-4 py-3 bg-midnight-900/90 rounded-2xl border text-center text-lg font-mono tracking-widest text-rosegold-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rosegold-400 transition-all ${
                    error ? 'border-red-500 animate-wiggle' : 'border-rosegold-500/30'
                  }`}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium">
                  Ungültiger Geheimcode. Bitte überprüfe deine Eingabe.
                </p>
              )}

              {success && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Code akzeptiert! Botschaften freigeschaltet.
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800/50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rosegold-500 to-champagne-500 text-midnight-900 font-bold text-sm shadow-rose-glow hover:opacity-95 transition"
                >
                  Freischalten
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
