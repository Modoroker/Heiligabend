import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const LOCAL_STORAGE_OPENED_KEY = '365_reasons_opened_days';
const LOCAL_STORAGE_FAVORITES_KEY = '365_reasons_favorites';
const LOCAL_STORAGE_OVERRIDE_KEY = '365_reasons_admin_override';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Anchor: 2026-12-24 at 00:00:00 UTC
const ANCHOR_UTC = Date.UTC(2026, 11, 24, 0, 0, 0);

// Helper for safe array parsing and type validation from localStorage
function safeParseNumberArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === 'number' && x >= 1 && x <= 365);
    }
  } catch {}
  return [];
}

export function useCalendar() {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [openedDays, setOpenedDays] = useState(() => safeParseNumberArray(LOCAL_STORAGE_OPENED_KEY));
  const [favorites, setFavorites] = useState(() => safeParseNumberArray(LOCAL_STORAGE_FAVORITES_KEY));

  const [adminBypass, setAdminBypass] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_OVERRIDE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Cached devDate reference to avoid re-parsing URL on every single interval tick
  const devDateOffsetRef = useRef(null);

  // Runtime fetch with AbortController and Exponential Backoff
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    let retryTimeoutId = null;
    const maxAttempts = 3;

    const fetchWithRetry = async (attempt = 1) => {
      try {
        const res = await fetch('/messages.json', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setMessages(Array.isArray(data) ? data : []);
          setIsLoadingMessages(false);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn(`Attempt ${attempt} failed to load /messages.json:`, err);
        if (attempt < maxAttempts && isMounted) {
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 4000);
          retryTimeoutId = setTimeout(() => {
            if (isMounted) fetchWithRetry(attempt + 1);
          }, delay);
        } else if (isMounted) {
          console.error('All retry attempts to fetch /messages.json failed.');
          setIsLoadingMessages(false);
        }
      }
    };

    fetchWithRetry(1);

    return () => {
      controller.abort();
      isMounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  const [now, setNow] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const devDateParam = params.get('devDate');
      if (devDateParam) {
        const parsed = new Date(devDateParam);
        if (!isNaN(parsed.getTime())) {
          devDateOffsetRef.current = parsed.getTime() - Date.now();
          return parsed;
        }
      }
    } catch {}
    return new Date();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (devDateOffsetRef.current !== null) {
        setNow(new Date(Date.now() + devDateOffsetRef.current));
      } else {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute current active day number (1..365) using UTC arithmetic to prevent DST & timezone edge bugs
  const currentDayIndex = useMemo(() => {
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const diffDays = Math.floor((todayUTC - ANCHOR_UTC) / MS_PER_DAY) + 1;
    
    if (diffDays < 1) return 1; // Before start date, focus on Day 1 countdown
    if (diffDays > 365) return 365;
    return diffDays;
  }, [now]);

  // Target unlock date calculation (UTC consistent across all timezones)
  const getUnlockDate = useCallback((dayId) => {
    if (dayId <= 1) {
      // Day 1: 2026-12-24 at 21:00 German time (CET UTC+1 -> 20:00:00 UTC)
      return new Date(Date.UTC(2026, 11, 24, 20, 0, 0));
    }
    // Day N (2..365): 2026-12-24 00:00:00 UTC + (dayId - 1) days
    const ts = ANCHOR_UTC + (dayId - 1) * MS_PER_DAY;
    return new Date(ts);
  }, []);

  // Centralized unlock check (directly compares timestamps)
  const isDayUnlocked = useCallback((dayId) => {
    if (adminBypass) return true;
    return now.getTime() >= getUnlockDate(dayId).getTime();
  }, [now, adminBypass, getUnlockDate]);

  // Time remaining until unlock (supports days, hours, minutes, seconds)
  const getTimeUntilUnlock = useCallback((dayId) => {
    const target = getUnlockDate(dayId);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isUnlocked: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, isUnlocked: false };
  }, [now, getUnlockDate]);

  // Mark day as opened with validation
  const markDayOpened = useCallback((dayId) => {
    if (typeof dayId !== 'number' || dayId < 1 || dayId > 365) return;
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

  // Toggle favorite with validation
  const toggleFavorite = useCallback((dayId) => {
    if (typeof dayId !== 'number' || dayId < 1 || dayId > 365) return;
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

  // Validate Admin PIN (e.g. 2412, NINA, HEILIGABEND)
  const verifyAndUnlockSecret = useCallback((pin) => {
    const validPins = ['2412', 'NINA', 'HEILIGABEND'];
    const cleanPin = String(pin || '').trim().toUpperCase();
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

  // Reset Admin mode AND clear all test progress / streak / opened days / favorites / minigame highscore
  const resetAdminBypass = useCallback(() => {
    setAdminBypass(false);
    setOpenedDays([]);
    setFavorites([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_OPENED_KEY);
      localStorage.removeItem(LOCAL_STORAGE_FAVORITES_KEY);
      localStorage.removeItem('heartcatch_highscore');
    } catch (e) {
      console.error('Failed to clear storage on admin reset', e);
    }
  }, []);

  // Compute total opened count
  const streak = useMemo(() => {
    return openedDays.length;
  }, [openedDays]);

  return {
    now,
    messages,
    isLoadingMessages,
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
