import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  computeDayIndex,
  getUnlockDate as calcUnlockDate,
  isDayUnlocked as checkDayUnlocked,
  getTimeUntilUnlock as calcTimeUntilUnlock,
  safeParseNumberArray
} from '../utils/dateUtils';

const LOCAL_STORAGE_OPENED_KEY = '365_reasons_opened_days';
const LOCAL_STORAGE_FAVORITES_KEY = '365_reasons_favorites';
const LOCAL_STORAGE_OVERRIDE_KEY = '365_reasons_admin_override';

function loadStoredArray(key) {
  try {
    return safeParseNumberArray(localStorage.getItem(key));
  } catch {
    return [];
  }
}

export function useCalendar() {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [openedDays, setOpenedDays] = useState(() => loadStoredArray(LOCAL_STORAGE_OPENED_KEY));
  const [favorites, setFavorites] = useState(() => loadStoredArray(LOCAL_STORAGE_FAVORITES_KEY));

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
      // Security: Only allow devDate parameter in development mode
      if (import.meta.env?.DEV) {
        const params = new URLSearchParams(window.location.search);
        const devDateParam = params.get('devDate');
        if (devDateParam) {
          const parsed = new Date(devDateParam);
          if (!isNaN(parsed.getTime())) {
            devDateOffsetRef.current = parsed.getTime() - Date.now();
            return parsed;
          }
        }
      }
    } catch {}
    return new Date();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (devDateOffsetRef.current !== null && import.meta.env?.DEV) {
        setNow(new Date(Date.now() + devDateOffsetRef.current));
      } else {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute current active day number (1..365) in Europe/Berlin
  const currentDayIndex = useMemo(() => {
    return computeDayIndex(now);
  }, [now]);

  // Target unlock date calculation (Europe/Berlin aware)
  const getUnlockDate = useCallback((dayId) => {
    return calcUnlockDate(dayId);
  }, []);

  // Centralized unlock check (directly compares timestamps)
  const isDayUnlocked = useCallback((dayId) => {
    return checkDayUnlocked(dayId, now, adminBypass);
  }, [now, adminBypass]);

  // Time remaining until unlock
  const getTimeUntilUnlock = useCallback((dayId) => {
    return calcTimeUntilUnlock(dayId, now);
  }, [now]);

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

  // Safely end Admin mode without wiping Nina's personal opened days or favorites
  const resetAdminBypass = useCallback(() => {
    setAdminBypass(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
    } catch (e) {
      console.error('Failed to clear admin override storage', e);
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
