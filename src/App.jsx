import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import DailyCard from './components/DailyCard';
import LockOverlay from './components/LockOverlay';
import CalendarGrid from './components/CalendarGrid';
import MilestoneCard from './components/MilestoneCard';
import NotificationBanner from './components/NotificationBanner';
import StatsFooter from './components/StatsFooter';
import { useCalendar } from './hooks/useCalendar';
import { getTimeOfDayTheme } from './utils/timeOfDayUtils';
import { checkAndTriggerSpecialDayStartup } from './utils/specialDaysUtils';
import { Calendar as CalendarIcon, Heart, Home } from 'lucide-react';

// Code-split heavy modal components to optimize initial JS bundle
const SecretPinModal = lazy(() => import('./components/SecretPinModal'));
const BonusMessagesModal = lazy(() => import('./components/BonusMessagesModal'));
const HeartCatchGame = lazy(() => import('./components/HeartCatchGame'));

export default function App() {
  const {
    now,
    messages,
    isLoadingMessages,
    currentDayIndex,
    openedDays,
    favorites,
    adminBypass,
    streak,
    isDayUnlocked,
    getTimeUntilUnlock,
    markDayOpened,
    toggleFavorite,
    verifyAndUnlockSecret,
    resetAdminBypass,
  } = useCalendar();

  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'calendar', 'favorites'
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  // Trigger special day effects (Birthday Fireworks / Valentine Heart Rain) once per day
  useEffect(() => {
    checkAndTriggerSpecialDayStartup(now);
  }, [now]);

  // Dynamic time of day gradient theme
  const timeTheme = getTimeOfDayTheme(now);

  // Current day data (with graceful fallback while messages are loading)
  const todayMessage = (messages && messages.length > 0)
    ? (messages.find((m) => m.id === currentDayIndex) || messages[0])
    : { id: currentDayIndex, text: 'Lädt Liebesbotschaft...', category: 'Liebe & Wertschätzung', date: '2026-12-24' };

  const isTodayUnlocked = isDayUnlocked(currentDayIndex);
  const countdown = getTimeUntilUnlock(currentDayIndex);
  const isTodayOpened = openedDays.includes(currentDayIndex);
  const isTodayFavorite = favorites.includes(currentDayIndex);

  return (
    <div className={`min-h-screen ${timeTheme.gradientClass} text-slate-100 flex flex-col justify-between max-w-md mx-auto relative border-x border-rosegold-500/10 shadow-2xl transition-colors duration-1000`}>
      {/* Push Notification Banner */}
      <NotificationBanner />

      {/* Top Navbar */}
      <Navbar
        streak={streak}
        total={365}
        adminBypass={adminBypass}
        onResetAdmin={resetAdminBypass}
        onOpenSecretModal={() => setIsSecretModalOpen(true)}
        onOpenBonusModal={() => setIsBonusModalOpen(true)}
        onOpenGameModal={() => setIsGameModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 p-4 pb-20 space-y-6">
        {/* Milestone & Streak Info Banner */}
        <MilestoneCard
          openedCount={openedDays.length}
          streak={streak}
          startDateStr="2026-12-24"
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-midnight-800/80 rounded-2xl border border-rosegold-500/20 text-xs font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-900 shadow-rose-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4" /> Heute
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-900 shadow-rose-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> 365 Tage
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-rosegold-500 to-champagne-400 text-midnight-900 shadow-rose-glow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" /> Favoriten
          </button>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            {isTodayUnlocked ? (
              <DailyCard
                day={todayMessage}
                isOpened={isTodayOpened}
                isFavorite={isTodayFavorite}
                onMarkOpened={markDayOpened}
                onToggleFavorite={toggleFavorite}
              />
            ) : (
              <LockOverlay
                day={todayMessage}
                countdown={countdown}
                onOpenSecretModal={() => setIsSecretModalOpen(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarGrid
            messages={messages}
            openedDays={openedDays}
            favorites={favorites}
            isDayUnlocked={isDayUnlocked}
            onToggleFavorite={toggleFavorite}
            onMarkOpened={markDayOpened}
            onOpenSecretModal={() => setIsSecretModalOpen(true)}
          />
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold gold-gradient-text flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              Deine Lieblingsgründe ({favorites.length})
            </h2>

            {favorites.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-rosegold-500/20">
                <Heart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">
                  Du hast noch keine Favoriten gespeichert.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Klicke bei deinen Lieblingsbotschaften auf das Herz-Symbol, um sie hier aufzubewahren.
                </p>
              </div>
            ) : (
              <CalendarGrid
                messages={messages.filter((m) => favorites.includes(m.id))}
                openedDays={openedDays}
                favorites={favorites}
                isDayUnlocked={isDayUnlocked}
                onToggleFavorite={toggleFavorite}
                onMarkOpened={markDayOpened}
                onOpenSecretModal={() => setIsSecretModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <StatsFooter openedCount={openedDays.length} total={365} />
      </main>

      {/* Lazy Loaded Secret PIN Modal */}
      <Suspense fallback={null}>
        {isSecretModalOpen && (
          <SecretPinModal
            isOpen={isSecretModalOpen}
            onClose={() => setIsSecretModalOpen(false)}
            onUnlockSecret={verifyAndUnlockSecret}
          />
        )}
      </Suspense>

      {/* Lazy Loaded Bonus Secret Messages Modal */}
      <Suspense fallback={null}>
        {isBonusModalOpen && (
          <BonusMessagesModal
            isOpen={isBonusModalOpen}
            onClose={() => setIsBonusModalOpen(false)}
            openedCount={openedDays.length}
            streak={streak}
            now={now}
            adminBypass={adminBypass}
          />
        )}
      </Suspense>

      {/* Lazy Loaded Heart Catch Minigame Modal 🎮 */}
      <Suspense fallback={null}>
        {isGameModalOpen && (
          <HeartCatchGame
            isOpen={isGameModalOpen}
            onClose={() => setIsGameModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
