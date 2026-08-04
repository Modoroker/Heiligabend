export const SPECIAL_DAYS = {
  '02-02': {
    title: '🎂 Ninas Geburtstag',
    badge: 'Geburtstag',
    icon: '🎂',
    color: 'from-pink-500 to-rose-400'
  },
  '07-05': {
    title: '💍 Unser Hochzeitstag',
    badge: 'Hochzeitstag',
    icon: '💍',
    color: 'from-amber-400 to-yellow-300'
  },
  '12-24': {
    title: '🎄 Heiligabend',
    badge: 'Weihnachten',
    icon: '🎄',
    color: 'from-emerald-400 to-red-500'
  },
  '12-31': {
    title: '🎆 Silvester',
    badge: 'Silvester',
    icon: '🎆',
    color: 'from-purple-400 to-pink-500'
  },
  '02-14': {
    title: '💖 Valentinstag',
    badge: 'Valentinstag',
    icon: '💖',
    color: 'from-rose-500 to-red-400'
  },
  '01-01': {
    title: '✨ Neujahr',
    badge: 'Neujahr',
    icon: '✨',
    color: 'from-amber-300 to-yellow-500'
  }
};

export function getSpecialDayInfo(dateStr) {
  if (!dateStr) return null;
  // dateStr is YYYY-MM-DD -> extract MM-DD
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const monthDay = `${parts[1]}-${parts[2]}`;
  return SPECIAL_DAYS[monthDay] || null;
}
