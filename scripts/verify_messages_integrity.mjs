import fs from 'fs';

const msgs = JSON.parse(fs.readFileSync('public/messages.json', 'utf8'));

console.log('Count:', msgs.length);
if (msgs.length !== 365) throw new Error('Not 365 messages');

const ids = new Set();
const texts = new Set();
let prevDate = null;

msgs.forEach((m, i) => {
  if (ids.has(m.id)) throw new Error('Duplicate ID: ' + m.id);
  ids.add(m.id);
  if (m.id !== i + 1) throw new Error('ID mismatch: ' + m.id + ' at index ' + i);

  if (!m.text || m.text.trim().length === 0) throw new Error('Empty text at ID: ' + m.id);
  if (texts.has(m.text)) throw new Error('Duplicate text at ID: ' + m.id);
  texts.add(m.text);

  const curDate = new Date(m.date + 'T00:00:00Z');
  if (i === 0 && m.date !== '2026-12-24') throw new Error('First date is not 2026-12-24');
  if (i === 364 && m.date !== '2027-12-23') throw new Error('Last date is not 2027-12-23');

  if (prevDate) {
    const diff = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diff !== 1) throw new Error('Date gap at ' + m.id + ': ' + m.date);
  }
  prevDate = curDate;

  if (m.text.includes('dich Liebe')) throw new Error('Found "dich Liebe" at ' + m.id);
  if (m.text.includes('Valentinschatz')) throw new Error('Found "Valentinschatz" at ' + m.id);
  if (m.text.includes('Secret Override Code')) throw new Error('Found "Secret Override Code" at ' + m.id);
  if (m.text.includes('Streak')) throw new Error('Found "Streak" at ' + m.id);
});

console.log('PASS: All 365 messages are valid, non-empty, unique, strictly sequential, and clean!');
