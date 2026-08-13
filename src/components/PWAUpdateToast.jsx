import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAUpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto p-3 rounded-2xl bg-midnight-800/95 border border-rosegold-400/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-slate-100"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <div className="text-xs">
            <span className="font-bold text-champagne-300 block">Neues Update verfügbar!</span>
            <span className="text-slate-300 text-[11px]">Tippe zum Aktualisieren</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-900 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Neu laden
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="p-1 text-slate-400 hover:text-slate-200"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
