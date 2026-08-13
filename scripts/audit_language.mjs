import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const messagesPath = path.join(rootDir, 'public', 'messages.json');
const bonusPath = path.join(rootDir, 'src', 'data', 'bonusMessages.json');

const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
const bonus = JSON.parse(fs.readFileSync(bonusPath, 'utf8'));

const issues = [];

function checkText(id, text, type = 'Tagesnachricht') {
  // 1. Check broken UTF-8 encoding or replacement chars
  if (text.includes('\uFFFD') || text.includes('&auml;') || text.includes('&ouml;') || text.includes('&uuml;') || text.includes('&szlig;')) {
    issues.push(`[${type} #${id}] Encoding issue / HTML entities found in: "${text}"`);
  }

  // 2. Check double spaces
  if (text.includes('  ')) {
    issues.push(`[${type} #${id}] Double space found in: "${text}"`);
  }

  // 3. Check for starting with "Weil"
  if (/^\s*weil\b/i.test(text)) {
    issues.push(`[${type} #${id}] Starts with 'Weil': "${text}"`);
  }

  // 4. Check for lowercase sentence starts
  const firstChar = text.trim().charAt(0);
  if (firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase()) {
    issues.push(`[${type} #${id}] Starts with lowercase: "${text}"`);
  }

  // 5. Check proper sentence endings (. ! ? ❤️ ✨ etc.)
  const trimmed = text.trim();
  const validEndings = ['.', '!', '?', '❤️', '✨', '👑', '🌹', '”', '"', ')'];
  const hasValidEnding = validEndings.some(e => trimmed.endsWith(e));
  if (!hasValidEnding && trimmed.slice(-1).match(/[a-zA-Z0-9]/)) {
    issues.push(`[${type} #${id}] Missing ending punctuation in: "${text}"`);
  }
}

// Audit messages
messages.forEach(m => checkText(m.id, m.text, 'Tag'));
bonus.forEach(b => checkText(b.id, b.text, 'Bonus'));

console.log('=== LANGUAGE & TYPOGRAPHY AUDIT RESULTS ===');
if (issues.length === 0) {
  console.log('PASSED: All 365 daily messages and 7 bonus messages passed with 0 issues!');
} else {
  console.log(`Found ${issues.length} potential issues:`);
  issues.forEach(i => console.log(' - ' + i));
}
