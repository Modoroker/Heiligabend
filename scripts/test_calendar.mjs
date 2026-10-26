import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  computeDayIndex,
  getUnlockDate,
  isDayUnlocked,
  getTimeUntilUnlock,
  safeParseNumberArray
} from '../src/utils/dateUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Running Comprehensive Unit & UTC Unlock Tests (via dateUtils.js)...');

// Test 1: Day 1 before 20:00 UTC (21:00 German Time) on 24.12.2026 is locked
const eveBefore21 = new Date(Date.UTC(2026, 11, 24, 18, 0, 0));
assert.strictEqual(computeDayIndex(eveBefore21), 1, 'Eve before 21:00 is Day 1');
assert.strictEqual(isDayUnlocked(1, eveBefore21), false, 'Day 1 is locked before 21:00');

// Test 2: Day 1 at 20:00:01 UTC (21:00:01 German Time) on 24.12.2026 is unlocked
const eveAfter21 = new Date(Date.UTC(2026, 11, 24, 20, 0, 1));
assert.strictEqual(isDayUnlocked(1, eveAfter21), true, 'Day 1 unlocks at 21:00:01');

// Test 3: Day 2 on 25.12.2026 in Germany (e.g. 00:05 German time / 24.12. 23:05 UTC)
const day2Midnight = new Date(Date.UTC(2026, 11, 24, 23, 5, 0));
assert.strictEqual(computeDayIndex(day2Midnight), 2, '25.12.2026 00:05 German time is Day 2');
assert.strictEqual(isDayUnlocked(2, day2Midnight), true, 'Day 2 is unlocked at 00:05 German time');
assert.strictEqual(isDayUnlocked(3, day2Midnight), false, 'Day 3 is still locked on 25.12.2026');

// Test 4: Countdown calculations (2 hours remaining until unlock at 19:00 UTC = 20:00 German time)
const remaining = getTimeUntilUnlock(1, new Date(Date.UTC(2026, 11, 24, 18, 0, 0)));
assert.strictEqual(remaining.hours, 2, '2 hours remaining until 21:00 German time');
assert.strictEqual(remaining.minutes, 0);
assert.strictEqual(remaining.isUnlocked, false);

// Test 5: Day 365 on 23.12.2027
const lastDay = new Date(Date.UTC(2027, 11, 23, 12, 0, 0));
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

console.log('✅ ALL UNIT & UTC UNLOCK TESTS PASSED (100%)!');
