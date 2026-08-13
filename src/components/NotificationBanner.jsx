import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';

const LOCAL_STORAGE_NOTIF_DISMISSED = '365_reasons_notif_banner_dismissed';

export default function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [permissionState, setPermissionState] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
      let isDismissed = false;
      try {
        isDismissed = localStorage.getItem(LOCAL_STORAGE_NOTIF_DISMISSED) === 'true';
      } catch {}
      if (Notification.permission === 'default' && !isDismissed) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermissionState(result);
        if (result === 'granted') {
          setShowBanner(false);
          const notifTitle = 'Liebesbotschaften Erinnerung 💌';
          const notifOptions = {
            body: 'Toll! Du wirst jetzt jeden Morgen an deine neue Botschaft erinnert. ❤️',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
          };

          // Try Service Worker registration first for mobile PWA support
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
              .then((reg) => {
                reg.showNotification(notifTitle, notifOptions);
              })
              .catch(() => {
                new Notification(notifTitle, notifOptions);
              });
          } else {
            new Notification(notifTitle, notifOptions);
          }
        }
      } catch (err) {
        console.error('Notification error', err);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTIF_DISMISSED, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  if (!showBanner || permissionState !== 'default') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        role="region"
        aria-label="Benachrichtigung aktivieren"
        className="w-full bg-gradient-to-r from-rosegold-500/20 via-midnight-800 to-rosegold-500/20 border-b border-rosegold-500/30 px-4 py-2.5 shadow-md"
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <div className="p-1.5 rounded-full bg-rosegold-500/20 border border-rosegold-500/40 text-rosegold-200">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-semibold text-champagne-300 block leading-tight">
                Tägliche Erinnerung aktivieren?
              </span>
              <span className="text-[11px] text-slate-400">
                Erhalte jeden Morgen um 09:00 Uhr deine Botschaft.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRequestPermission}
              aria-label="Erinnerung aktivieren"
              className="px-3 py-1 rounded-full bg-rosegold-500 hover:bg-rosegold-400 text-white font-medium text-[11px] shadow-rose-glow flex items-center gap-1 transition-all"
            >
              <Check className="w-3.5 h-3.5" /> Ja!
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Banner schließen"
              className="p-1 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
