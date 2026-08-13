import React, { useState, useMemo, memo } from 'react';
import { Lock, Heart, CheckCircle2, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import MessageModal from './MessageModal';
import { getSpecialDayInfo } from '../utils/specialDaysUtils';

// Helper to format ISO date string (YYYY-MM-DD) to German calendar format e.g. "24. Dez"
function formatCalendarDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${day}. ${monthNames[month - 1] || ''}`;
}

function getMonthNameWithYear(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const fullMonths = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const shortYr = year.slice(-2);
  return `${fullMonths[month - 1] || ''} '${shortYr}`;
}

const MONTH_OPTIONS = [
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

// Memoized Individual Day Card for 60 FPS scrolling and rendering across 365 items
const DayCardItem = memo(function DayCardItem({
  msg,
  unlocked,
  opened,
  fav,
  onSelect,
}) {
  const formattedDate = formatCalendarDate(msg.date);
  const specialInfo = getSpecialDayInfo(msg.date);

  return (
    <div
      role="button"
      tabIndex={unlocked ? 0 : -1}
      aria-label={`Tag ${msg.id}: ${formattedDate}${unlocked ? (opened ? ' (Geöffnet)' : ' (Bereit zum Öffnen)') : ' (Gesperrt)'}`}
      onClick={() => {
        if (unlocked) onSelect(msg);
      }}
      onKeyDown={(e) => {
        if (unlocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(msg);
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
          <Lock className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
        )}
      </div>

      {/* Bottom Status Label */}
      <span
        className={`text-[10px] font-medium tracking-tight ${
          opened
            ? 'text-emerald-400/90'
            : unlocked
            ? 'text-champagne-400 font-semibold'
            : 'text-slate-400'
        }`}
      >
        {opened ? 'Gelesen' : unlocked ? 'Frei!' : `Tag ${msg.id}`}
      </span>
    </div>
  );
});

export default function CalendarGrid({
  messages = [],
  openedDays = [],
  favorites = [],
  isDayUnlocked,
  onToggleFavorite,
  onMarkOpened,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unlocked', 'favorites'
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);

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
  }, [messages, isDayUnlocked, favorites, filterMode, selectedMonth]);

  // Messages list for modal left/right swipe navigation
  const navigableMessages = useMemo(() => {
    return messages.filter((msg) => isDayUnlocked(msg.id));
  }, [messages, isDayUnlocked]);

  // Modal navigation indices
  const currentNavIndex = useMemo(() => {
    if (!selectedDay) return -1;
    return navigableMessages.findIndex((m) => m.id === selectedDay.id);
  }, [selectedDay, navigableMessages]);

  const handleNavigatePrev = () => {
    if (currentNavIndex > 0) {
      setSelectedDay(navigableMessages[currentNavIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (currentNavIndex >= 0 && currentNavIndex < navigableMessages.length - 1) {
      setSelectedDay(navigableMessages[currentNavIndex + 1]);
    }
  };

  // Group filtered messages by month for clear structured headings
  const groupedByMonth = useMemo(() => {
    const groups = {};
    filteredMessages.forEach((msg) => {
      const monthKey = msg.date.substring(0, 7); // "2026-12", "2027-01", etc.
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(msg);
    });
    return groups;
  }, [filteredMessages]);

  return (
    <div className="w-full space-y-6">
      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-rosegold-500/20">
        {/* Main Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-midnight-900/80 rounded-2xl border border-rosegold-500/20 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-rosegold-500 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle (365)
          </button>
          <button
            onClick={() => setFilterMode('unlocked')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterMode === 'unlocked'
                ? 'bg-rosegold-500 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Freigeschaltet
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              filterMode === 'favorites'
                ? 'bg-rose-600 text-white shadow-rose-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            Favoriten ({favorites.length})
          </button>
        </div>

        {/* Count Indicator */}
        <div className="text-xs text-slate-400 font-serif">
          Zeige <strong className="text-champagne-300 font-mono">{filteredMessages.length}</strong> von 365
        </div>
      </div>

      {/* 13-Month Scrollable Filter Bar */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMonth(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedMonth === m.id
                  ? 'bg-champagne-400/20 text-champagne-300 border border-champagne-400/40 shadow-gold-glow'
                  : 'bg-midnight-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Months Content */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-card border border-rosegold-500/20">
          <p className="text-slate-400 font-serif text-sm">
            Keine Botschaften für die gewählte Filterung gefunden.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([monthKey, daysInMonth]) => {
            const firstDateInGroup = daysInMonth[0]?.date;
            const monthHeader = getMonthNameWithYear(firstDateInGroup);

            return (
              <div key={monthKey} className="space-y-3">
                {/* Month Group Header */}
                <div className="flex items-center gap-2 px-1">
                  <CalendarIcon className="w-4 h-4 text-rosegold-400" />
                  <h3 className="font-serif text-base font-bold gold-gradient-text tracking-wide">
                    {monthHeader}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({daysInMonth.length} Türchen)
                  </span>
                </div>

                {/* Month Calendar Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {daysInMonth.map((msg) => (
                    <DayCardItem
                      key={msg.id}
                      msg={msg}
                      unlocked={isDayUnlocked(msg.id)}
                      opened={openedDays.includes(msg.id)}
                      fav={favorites.includes(msg.id)}
                      onSelect={setSelectedDay}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Message Modal */}
      {selectedDay && (
        <MessageModal
          day={selectedDay}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          isFavorite={favorites.includes(selectedDay.id)}
          onToggleFavorite={onToggleFavorite}
          isOpened={openedDays.includes(selectedDay.id)}
          onMarkOpened={onMarkOpened}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          hasPrev={currentNavIndex > 0}
          hasNext={currentNavIndex >= 0 && currentNavIndex < navigableMessages.length - 1}
        />
      )}
    </div>
  );
}
