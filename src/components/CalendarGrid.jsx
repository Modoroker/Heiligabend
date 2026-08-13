import React, { useState, useMemo } from 'react';
import { Lock, Heart, CheckCircle2, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import MessageModal from './MessageModal';
import { getSpecialDayInfo } from '../utils/specialDaysUtils';

// Helper to format ISO date string (YYYY-MM-DD) to German calendar format e.g. "24. Dez"
function formatCalendarDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${d.getDate()}. ${monthNames[d.getMonth()]}`;
}

function getMonthNameWithYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const fullMonths = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const shortYr = String(d.getFullYear()).slice(-2);
  return `${fullMonths[d.getMonth()]} '${shortYr}`;
}

export default function CalendarGrid({
  messages,
  openedDays,
  favorites,
  isDayUnlocked,
  onToggleFavorite,
  onMarkOpened,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unlocked', 'favorites'
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);

  // Month list for filter pills with '26 and '27 on EVERY month!
  const monthOptions = [
    { id: 'all', label: 'Alle Monate' },
    { id: '2026-12', label: 'Dezember \'26' },
    { id: '2027-01', label: 'Januar \'27' },
    { id: '2027-02', label: 'Februar \'27' },
    { id: '2027-03', label: 'März \'27' },
    { id: '2027-04', label: 'April \'27' },
    { id: '2027-05', label: 'Mai \'27' },
    { id: '2027-06', label: 'Juni \'27' },
    { id: '2027-07', label: 'Juli \'27' },
    { id: '2027-08', label: 'August \'27' },
    { id: '2027-09', label: 'September \'27' },
    { id: '2027-10', label: 'Oktober \'27' },
    { id: '2027-11', label: 'November \'27' },
    { id: '2027-12', label: 'Dezember \'27' },
  ];

  // Filter messages for display based on active tab and selected month
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const unlocked = isDayUnlocked(msg.id);
      const isFav = favorites.includes(msg.id);

      if (filterMode === 'unlocked' && !unlocked) return false;
      if (filterMode === 'favorites' && !isFav) return false;

      // Month filter YYYY-MM
      if (selectedMonth !== 'all') {
        const monthKey = msg.date.substring(0, 7);
        if (monthKey !== selectedMonth) return false;
      }

      return true;
    });
  }, [messages, filterMode, selectedMonth, isDayUnlocked, favorites]);

  // Navigable unlocked messages respecting the current active filter
  const navigableMessages = useMemo(() => {
    return filteredMessages.filter((m) => isDayUnlocked(m.id));
  }, [filteredMessages, isDayUnlocked]);

  // Index of selectedDay within navigableMessages for swipe navigation
  const selectedIndex = useMemo(() => {
    if (!selectedDay) return -1;
    return navigableMessages.findIndex((m) => m.id === selectedDay.id);
  }, [selectedDay, navigableMessages]);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < navigableMessages.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) {
      setSelectedDay(navigableMessages[selectedIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      setSelectedDay(navigableMessages[selectedIndex + 1]);
    }
  };

  // Group filtered messages by month for wall calendar layout
  const groupedByMonth = useMemo(() => {
    const map = {};
    filteredMessages.forEach((msg) => {
      const monthTitle = getMonthNameWithYear(msg.date);
      if (!map[monthTitle]) {
        map[monthTitle] = [];
      }
      map[monthTitle].push(msg);
    });
    return map;
  }, [filteredMessages]);

  return (
    <div className="w-full space-y-5">
      {/* Main Filter Controls */}
      <div className="flex flex-col gap-3">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-midnight-800/60 rounded-2xl border border-rosegold-500/20 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-rosegold-500 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle (365)
          </button>
          <button
            onClick={() => setFilterMode('unlocked')}
            className={`flex-1 py-2 rounded-xl font-medium transition-all ${
              filterMode === 'unlocked'
                ? 'bg-rosegold-500 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Freigeschaltet
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-1 transition-all ${
              filterMode === 'favorites'
                ? 'bg-rosegold-500 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Favoriten
          </button>
        </div>

        {/* Month Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {monthOptions.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all border text-[11px] ${
                selectedMonth === m.id
                  ? 'bg-champagne-500/20 text-champagne-300 border-champagne-500/50 font-semibold'
                  : 'bg-midnight-800/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wall Calendar Groups */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Keine Botschaften für die gewählte Filterung gefunden.
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([monthTitle, daysInMonth]) => (
          <div key={monthTitle} className="space-y-2.5">
            {/* Month Header Banner */}
            <div className="flex items-center gap-2 border-b border-rosegold-500/20 pb-1.5 pt-2">
              <CalendarIcon className="w-4 h-4 text-rosegold-400" />
              <h3 className="text-sm font-serif font-bold gold-gradient-text tracking-wide">
                {monthTitle}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                ({daysInMonth.length} Türchen)
              </span>
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {daysInMonth.map((msg) => {
                const unlocked = isDayUnlocked(msg.id);
                const opened = openedDays.includes(msg.id);
                const fav = favorites.includes(msg.id);
                const formattedDate = formatCalendarDate(msg.date);
                const specialInfo = getSpecialDayInfo(msg.date);

                return (
                  <div
                    key={msg.id}
                    role="button"
                    tabIndex={unlocked ? 0 : -1}
                    aria-label={`Tag ${msg.id}: ${formattedDate}${unlocked ? (opened ? ' (Geöffnet)' : ' (Bereit zum Öffnen)') : ' (Gesperrt)'}`}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedDay(msg);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (unlocked && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedDay(msg);
                      }
                    }}
                    className={`aspect-square rounded-2xl p-2 flex flex-col items-center justify-between cursor-pointer border transition-all relative overflow-hidden select-none group focus:outline-none focus:ring-2 focus:ring-rosegold-400 ${
                      specialInfo
                        ? 'border-amber-400 shadow-gold-glow bg-gradient-to-b from-amber-500/20 to-midnight-800/90 animate-pulse'
                        : opened
                        ? 'bg-midnight-800/90 border-rosegold-500/40 hover:border-rosegold-400 shadow-rose-glow'
                        : unlocked
                        ? 'bg-midnight-800/70 border-champagne-500/40 hover:border-champagne-300 shadow-gold-glow'
                        : 'bg-midnight-900/60 border-slate-800 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {/* Special Day Banner at Top */}
                    {specialInfo && (
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[8px] font-bold text-center py-0.5 tracking-tighter uppercase">
                        {specialInfo.icon} {specialInfo.badge}
                      </div>
                    )}

                    {/* Top Header: Date & Day Badge */}
                    <div className={`w-full flex items-center justify-between text-[10px] ${specialInfo ? 'mt-3' : ''}`}>
                      <span className="font-semibold text-champagne-300 font-serif">
                        {formattedDate}
                      </span>
                      {fav ? (
                        <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500">#{msg.id}</span>
                      )}
                    </div>

                    {/* Main Icon Center */}
                    <div className="my-auto flex flex-col items-center">
                      {opened ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : unlocked ? (
                        <div className="w-8 h-8 rounded-full bg-rosegold-500/20 border border-champagne-400/40 flex items-center justify-center animate-pulse">
                          {specialInfo ? (
                            <span className="text-sm">{specialInfo.icon}</span>
                          ) : (
                            <Sparkles className="w-4 h-4 text-champagne-300" />
                          )}
                        </div>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600 group-hover:text-rosegold-400 transition-colors" />
                      )}
                    </div>

                    {/* Status Footer */}
                    <span className="text-[9px] tracking-tight font-medium text-slate-400">
                      {opened ? 'Gelesen' : unlocked ? 'Frei!' : `Tag ${msg.id}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Message Modal for inspecting opened messages */}
      <MessageModal
        day={selectedDay}
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        isFavorite={selectedDay ? favorites.includes(selectedDay.id) : false}
        onToggleFavorite={onToggleFavorite}
        isOpened={selectedDay ? openedDays.includes(selectedDay.id) : false}
        onMarkOpened={onMarkOpened}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}
