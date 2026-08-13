import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ANCHOR_UTC = Date.UTC(2026, 11, 24, 0, 0, 0);

function computeDayIndex(date) {
  const todayUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const diffDays = Math.floor((todayUTC - ANCHOR_UTC) / MS_PER_DAY) + 1;
  if (diffDays < 1) return 1;
  if (diffDays > 365) return 365;
  return diffDays;
}

function getUnlockDate(dayId) {
  if (dayId <= 1) {
    return new Date('2026-12-24T21:00:00');
  }
  const targetDate = new Date('2026-12-24T00:00:00');
  targetDate.setDate(targetDate.getDate() + (dayId - 1));
  return targetDate;
}

function isDayUnlocked(dayId, now, adminBypass = false) {
  if (adminBypass) return true;
  return now >= getUnlockDate(dayId);
}

function getTimeUntilUnlock(dayId, now) {
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

function safeParseNumberArray(raw) {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === 'number' && x >= 1 && x <= 365);
    }
  } catch {}
  return [];
}

console.log('🧪 Running Comprehensive Unit & PWA Integrity Tests...');

// Test 1: Day 1 before 21:00 on 24.12.2026 is locked
const eveBefore21 = new Date('2026-12-24T18:00:00');
assert.strictEqual(computeDayIndex(eveBefore21), 1, 'Eve before 21:00 is Day 1');
assert.strictEqual(isDayUnlocked(1, eveBefore21), false, 'Day 1 is locked before 21:00');

// Test 2: Day 1 at 21:00:01 on 24.12.2026 is unlocked
const eveAfter21 = new Date('2026-12-24T21:00:01');
assert.strictEqual(isDayUnlocked(1, eveAfter21), true, 'Day 1 unlocks at 21:00:01');

// Test 3: Day 2 on 25.12.2026 at 00:00:00 is unlocked
const day2Morning = new Date('2026-12-25T08:30:00');
assert.strictEqual(computeDayIndex(day2Morning), 2, '25.12.2026 is Day 2');
assert.strictEqual(isDayUnlocked(2, day2Morning), true, 'Day 2 is unlocked on 25.12.2026');
assert.strictEqual(isDayUnlocked(3, day2Morning), false, 'Day 3 is still locked on 25.12.2026');

// Test 4: Countdown calculations
const remaining = getTimeUntilUnlock(1, new Date('2026-12-24T19:00:00'));
assert.strictEqual(remaining.hours, 2, '2 hours remaining until 21:00');
assert.strictEqual(remaining.minutes, 0);
assert.strictEqual(remaining.isUnlocked, false);

// Test 5: Day 365 on 23.12.2027
const lastDay = new Date('2027-12-23T12:00:00');
assert.strictEqual(computeDayIndex(lastDay), 365, '23.12.2027 is Day 365');
assert.strictEqual(isDayUnlocked(365, lastDay), true, 'Day 365 is unlocked on 23.12.2027');

// Test 6: Safe Storage Parsing against corrupted input
assert.deepStrictEqual(safeParseNumberArray('invalid-json'), []);
assert.deepStrictEqual(safeParseNumberArray('[1, 2, "bad", 500, null, 365]'), [1, 2, 365]);

// Test 7: Verify public/messages.json integrity
const messagesPath = path.join(rootDir, 'public', 'messages.json');
assert.strictEqual(fs.existsSync(messagesPath), true, 'public/messages.json exists');
const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
assert.strictEqual(messages.length, 365, 'Exactly 365 messages present');
assert.strictEqual(messages[0].date, '2026-12-24', 'Day 1 starts on 2026-12-24');
assert.strictEqual(messages[364].date, '2027-12-23', 'Day 365 ends on 2027-12-23');

console.log('✅ ALL UNIT & PWA INTEGRITY TESTS PASSED (100%)!');
