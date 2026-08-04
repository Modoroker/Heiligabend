import { fireBirthdayFireworks, fireValentineHeartRain } from './confettiUtils';

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

// Trigger once-per-day Special Day startup effects (Smart sessionStorage flags)
export function checkAndTriggerSpecialDayStartup(date) {
  const d = date ? new Date(date) : new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;

  const sessionKey = `special_day_triggered_${key}_${d.getFullYear()}`;

  try {
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already triggered once in this session today!
    }
  } catch (e) {
    console.error(e);
  }

  if (key === '02-02') {
    // Nina's Birthday Full-Screen Fireworks
    fireBirthdayFireworks();
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch {}
  } else if (key === '02-14') {
    // Valentine's Day Heart Rain
    fireValentineHeartRain();
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch {}
  }
}
