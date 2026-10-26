/**
 * Centralized, time-zone aware date utilities for "365 Gründe, warum ich dich Liebe".
 * All unlocks and day indices are strictly calculated in the Europe/Berlin timezone.
 */

export const ANCHOR_DATE_BERLIN = { year: 2026, month: 12, day: 24 };
export const TOTAL_DAYS = 365;

/**
 * Extracts numeric date parts in Europe/Berlin time.
 */
export function getBerlinDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const obj = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      obj[p.type] = parseInt(p.value, 10);
    }
  }
  if (obj.hour === 24) obj.hour = 0;
  return obj;
}

/**
 * Converts a specific date and time in Europe/Berlin into an exact UTC Date object.
 */
export function getBerlinTimestamp(year, month, day, hour = 0, minute = 0, second = 0) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const bp = getBerlinDateParts(guess);
  const bUtc = Date.UTC(bp.year, bp.month - 1, bp.day, bp.hour, bp.minute, bp.second);
  const offsetMs = bUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

/**
 * Computes current active day index (1..365) strictly according to Europe/Berlin calendar.
 */
export function computeDayIndex(now = new Date()) {
  const bp = getBerlinDateParts(now);
  const startUTC = Date.UTC(ANCHOR_DATE_BERLIN.year, ANCHOR_DATE_BERLIN.month - 1, ANCHOR_DATE_BERLIN.day, 0, 0, 0);
  const currentUTC = Date.UTC(bp.year, bp.month - 1, bp.day, 0, 0, 0);
  const diffDays = Math.floor((currentUTC - startUTC) / 86400000) + 1;

  if (diffDays < 1) return 1;
  if (diffDays > TOTAL_DAYS) return TOTAL_DAYS;
  return diffDays;
}

/**
 * Computes the exact unlock Date for dayId in Europe/Berlin.
 * - Day 1: 2026-12-24 at 21:00:00 Europe/Berlin
 * - Days 2..365: Respective calendar day at 00:00:00 Europe/Berlin
 */
export function getUnlockDate(dayId) {
  if (dayId <= 1) {
    return getBerlinTimestamp(2026, 12, 24, 21, 0, 0);
  }
  const anchorTime = Date.UTC(ANCHOR_DATE_BERLIN.year, ANCHOR_DATE_BERLIN.month - 1, ANCHOR_DATE_BERLIN.day);
  const targetDay = new Date(anchorTime + (dayId - 1) * 86400000);
  return getBerlinTimestamp(
    targetDay.getUTCFullYear(),
    targetDay.getUTCMonth() + 1,
    targetDay.getUTCDate(),
    0,
    0,
    0
  );
}

/**
 * Checks if dayId is unlocked at time `now`.
 */
export function isDayUnlocked(dayId, now = new Date(), adminBypass = false) {
  if (adminBypass) return true;
  return now.getTime() >= getUnlockDate(dayId).getTime();
}

/**
 * Computes remaining time until unlock of dayId.
 */
export function getTimeUntilUnlock(dayId, now = new Date()) {
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
}

/**
 * Validates and safely parses an array of day numbers (1..365) from raw string.
 */
export function safeParseNumberArray(raw) {
  try {
    if (!raw) return [];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === 'number' && Number.isFinite(x) && x >= 1 && x <= TOTAL_DAYS);
    }
  } catch {}
  return [];
}
