import React, { useState, useMemo } from 'react';
import { Search, Lock, Heart, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import MessageModal from './MessageModal';

export default function CalendarGrid({
  messages,
  openedDays,
  favorites,
  isDayUnlocked,
  onToggleFavorite,
  onOpenSecretModal,
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'unlocked', 'favorites'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const categories = [
    { id: 'all', label: 'Alle' },
    { id: 'Liebe & Wertschätzung', label: 'Liebe' },
    { id: 'Humor & Beziehungs-Klassiker', label: 'Humor' },
    { id: 'Zukunft & Gemeinsame Reise', label: 'Zukunft' },
  ];

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const unlocked = isDayUnlocked(msg.id);
      const isFav = favorites.includes(msg.id);

      // Filter Mode
      if (filterMode === 'unlocked' && !unlocked) return false;
      if (filterMode === 'favorites' && !isFav) return false;

      // Category
      if (selectedCategory !== 'all' && msg.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesText = msg.text.toLowerCase().includes(q);
        const matchesDay = String(msg.id) === q || `tag ${msg.id}`.includes(q);
        const matchesCat = msg.category.toLowerCase().includes(q);
        return matchesText || matchesDay || matchesCat;
      }

      return true;
    });
  }, [messages, filterMode, selectedCategory, searchQuery, isDayUnlocked, favorites]);

  return (
    <div className="w-full space-y-4">
      {/* Search & Main Filter Controls */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Tag oder Stichwort..."
            className="w-full pl-10 pr-4 py-2.5 bg-midnight-800/80 border border-rosegold-500/20 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rosegold-400 transition-all"
          />
        </div>

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

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-champagne-500/20 text-champagne-300 border-champagne-500/50'
                  : 'bg-midnight-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Keine Botschaften gefunden.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
          {filteredMessages.map((msg) => {
            const unlocked = isDayUnlocked(msg.id);
            const opened = openedDays.includes(msg.id);
            const fav = favorites.includes(msg.id);

            return (
              <div
                key={msg.id}
                onClick={() => {
                  if (unlocked) {
                    setSelectedDay(msg);
                  }
                }}
                className={`aspect-square rounded-2xl p-2 flex flex-col items-center justify-between cursor-pointer border transition-all relative overflow-hidden select-none group ${
                  opened
                    ? 'bg-midnight-800/90 border-rosegold-500/40 hover:border-rosegold-400 shadow-rose-glow'
                    : unlocked
                    ? 'bg-midnight-800/60 border-champagne-500/30 hover:border-champagne-400'
                    : 'bg-midnight-900/60 border-slate-800 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Top Badge */}
                <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono font-bold text-rosegold-300">#{msg.id}</span>
                  {fav && <Heart className="w-3 h-3 text-red-400 fill-red-400" />}
                </div>

                {/* Main Icon Center */}
                <div className="my-auto flex flex-col items-center">
                  {opened ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : unlocked ? (
                    <Sparkles className="w-6 h-6 text-champagne-300 animate-pulse" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-500 group-hover:text-rosegold-400 transition-colors" />
                  )}
                </div>

                {/* Status Text */}
                <span className="text-[9px] tracking-tight font-medium text-slate-400">
                  {opened ? 'Gelesen' : unlocked ? 'Frei!' : 'Sperre'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Modal for inspecting opened messages */}
      <MessageModal
        day={selectedDay}
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        isFavorite={selectedDay ? favorites.includes(selectedDay.id) : false}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}
