import { useState, useEffect, useMemo, useCallback } from 'react';
import messagesData from '../data/messages.json';

const LOCAL_STORAGE_OPENED_KEY = '365_reasons_opened_days';
const LOCAL_STORAGE_FAVORITES_KEY = '365_reasons_favorites';
const LOCAL_STORAGE_OVERRIDE_KEY = '365_reasons_admin_override';

// Start date: 2026-12-24 at 22:00:00
const START_CHRISTMAS_EVE = new Date('2026-12-24T22:00:00');

export function useCalendar() {
  const [openedDays, setOpenedDays] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_OPENED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adminBypass, setAdminBypass] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_OVERRIDE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Current time state (updates every second for live countdown)
  const [now, setNow] = useState(() => {
    // Check URL search params for ?devDate=2026-12-24T21:59:50
    const params = new URLSearchParams(window.location.search);
    const devDate = params.get('devDate');
    if (devDate) {
      const parsed = new Date(devDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const devDate = params.get('devDate');
      if (devDate) {
        setNow(new Date(devDate));
      } else {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate current active day number based on date
  const currentDayIndex = useMemo(() => {
    // Day 1 target: 2026-12-24
    const anchor = new Date('2026-12-24T00:00:00');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = today.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays < 1) return 1; // Before start date, focus on Day 1 countdown
    if (diffDays > 365) return 365;
    return diffDays;
  }, [now]);

  // Check if specific day is unlocked
  const isDayUnlocked = useCallback((dayId) => {
    if (adminBypass) return true;

    if (dayId === 1) {
      // Day 1 unlocks on 2026-12-24 at 22:00:00
      return now >= START_CHRISTMAS_EVE;
    }

    // Day N (2..365): unlocks on 2026-12-24 + (N-1) days at 00:00:00
    const targetDate = new Date('2026-12-24T00:00:00');
    targetDate.setDate(targetDate.getDate() + (dayId - 1));
    return now >= targetDate;
  }, [now, adminBypass]);

  // Get unlock target date for a day
  const getUnlockDate = useCallback((dayId) => {
    if (dayId === 1) return START_CHRISTMAS_EVE;
    const targetDate = new Date('2026-12-24T00:00:00');
    targetDate.setDate(targetDate.getDate() + (dayId - 1));
    return targetDate;
  }, []);

  // Time remaining until unlock
  const getTimeUntilUnlock = useCallback((dayId) => {
    const target = getUnlockDate(dayId);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, isUnlocked: false };
  }, [now, getUnlockDate]);

  // Mark day as opened
  const markDayOpened = useCallback((dayId) => {
    setOpenedDays((prev) => {
      if (prev.includes(dayId)) return prev;
      const next = [...prev, dayId];
      try {
        localStorage.setItem(LOCAL_STORAGE_OPENED_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save opened days', e);
      }
      return next;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((dayId) => {
    setFavorites((prev) => {
      const next = prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId];
      try {
        localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return next;
    });
  }, []);

  // Validate Admin PIN (e.g., 2412, 1234, NINA, or MODOROKER)
  const verifyAndUnlockSecret = useCallback((pin) => {
    const validPins = ['2412', '1234', 'NINA', 'HEILIGABEND', '2026'];
    const cleanPin = pin.trim().toUpperCase();
    if (validPins.includes(cleanPin)) {
      setAdminBypass(true);
      try {
        localStorage.setItem(LOCAL_STORAGE_OVERRIDE_KEY, 'true');
      } catch (e) {
        console.error('Failed to set admin override', e);
      }
      return true;
    }
    return false;
  }, []);

  const resetAdminBypass = useCallback(() => {
    setAdminBypass(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Compute streak
  const streak = useMemo(() => {
    return openedDays.length;
  }, [openedDays]);

  return {
    now,
    messages: messagesData,
    currentDayIndex,
    openedDays,
    favorites,
    adminBypass,
    streak,
    isDayUnlocked,
    getUnlockDate,
    getTimeUntilUnlock,
    markDayOpened,
    toggleFavorite,
    verifyAndUnlockSecret,
    resetAdminBypass,
  };
}
