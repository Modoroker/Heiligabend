import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const messages = JSON.parse(fs.readFileSync(path.join(root, 'public/messages.json'), 'utf8'));
const bonus = JSON.parse(fs.readFileSync(path.join(root, 'src/data/bonusMessages.json'), 'utf8'));

const issues = [];
const seenTexts = new Map();

// Typische Rechtschreib- und Formatierungsfallen
const spellingPatterns = [
  { regex: /\s{2,}/g, label: 'Doppeltes Leerzeichen' },
  { regex: /\s+[,.;!?]/g, label: 'Leerzeichen vor Satzzeichen' },
  { regex: /[,.;!?][A-Za-zÄÖÜäöüß]/g, label: 'Fehlendes Leerzeichen nach Satzzeichen' },
  { regex: /(TODO|FIXME|XXX|LOREM|PLATZHALTER|TESTTEXT)/i, label: 'Platzhalter-Rest gefunden' },
  { regex: /\b(seid)\s+(dem|einem|einer|jahren|monaten|wochen|tagen|gestern|heute|immer)\b/i, label: 'Mögliches "seid" statt "seit"' },
  { regex: /\b(seit)\s+(ihr|alle|bereit)\b/i, label: 'Mögliches "seit" statt "seid"' },
  { regex: /Ã¤|Ã¶|Ã¼|ÃŸ|ï¿½/g, label: 'Kaputtes UTF-8-Encoding (Umlaut)' },
  { regex: /\b(\w+)\s+\1\b/i, label: 'Doppeltes Wort hintereinander' }
];

function checkTextBlock(context, text, { isTitle = false } = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    issues.push(`${context}: Text ist leer`);
    return;
  }
  const trimmed = text.trim();
  // Emojis am Satzende ignorieren, wenn direkt davor ein Satzzeichen steht
  const withoutTrailingEmojis = trimmed.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/gu, '');
  if (!isTitle && !/[.!?…"»')]$/.test(withoutTrailingEmojis)) {
    issues.push(`${context}: Fehlendes Satzzeichen am Ende ("${trimmed.slice(-25)}")`);
  }
  if (trimmed.length > 420) {
    issues.push(`${context}: Sehr langer Text (${trimmed.length} Zeichen) – Mobile-Umbruch prüfen`);
  }
  for (const rule of spellingPatterns) {
    const match = trimmed.match(rule.regex);
    if (match) {
      issues.push(`${context}: ${rule.label} → "${match[0]}"`);
    }
  }
  const normalized = trimmed.toLowerCase();
  if (seenTexts.has(normalized)) {
    issues.push(`${context}: Doppelter Text identisch mit ${seenTexts.get(normalized)}`);
  } else {
    seenTexts.set(normalized, context);
  }
}

// 1. Alle 365 Tagesnachrichten prüfen
if (!Array.isArray(messages) || messages.length !== 365) {
  issues.push(`messages.json: Erwartet 365 Einträge, gefunden: ${messages?.length ?? 0}`);
}

const startDate = new Date('2026-12-24T12:00:00Z');
messages.forEach((entry, index) => {
  const expectedId = index + 1;
  const expectedDateObj = new Date(startDate.getTime() + index * 86400000);
  const expectedDate = expectedDateObj.toISOString().slice(0, 10);

  if (entry.id !== expectedId) {
    issues.push(`Eintrag Index ${index}: Erwartete ID ${expectedId}, gefunden ${entry.id}`);
  }
  if (entry.date !== expectedDate) {
    issues.push(`Tag ${expectedId}: Erwartetes Datum ${expectedDate}, gefunden ${entry.date}`);
  }

  const textField = entry.text ?? entry.message ?? entry.reason ?? entry.content;
  checkTextBlock(`Tag ${expectedId} (${entry.date})`, textField);
  if (entry.title) checkTextBlock(`Tag ${expectedId} Titel`, entry.title, { isTitle: true });
});

// 2. Bonus-Briefe prüfen
const bonusList = Array.isArray(bonus) ? bonus : Object.values(bonus).flat();
bonusList.forEach((item, idx) => {
  const label = `Bonus-Brief #${idx + 1} (${item.title ?? item.id ?? 'ohne Titel'})`;
  if (item.title) checkTextBlock(`${label} Titel`, item.title, { isTitle: true });
  const body = item.text ?? item.message ?? item.content;
  checkTextBlock(label, body);
});

// 3. UI-Komponenten auf Encoding-Fehler oder Platzhalter scannen
const compDir = path.join(root, 'src/components');
for (const file of fs.readdirSync(compDir)) {
  if (!file.endsWith('.jsx')) continue;
  const content = fs.readFileSync(path.join(compDir, file), 'utf8');
  if (/Ã¤|Ã¶|Ã¼|ÃŸ|ï¿½/.test(content)) {
    issues.push(`Komponente ${file}: Kaputtes UTF-8-Encoding gefunden`);
  }
  if (/\b(TODO|FIXME|PLATZHALTER|LOREM IPSUM)\b/i.test(content)) {
    issues.push(`Komponente ${file}: TODO/Platzhalter gefunden`);
  }
}

console.log('\n=== NINA-QA & TEXT-AUDIT ===');
if (issues.length === 0) {
  console.log('Keine formalen Text-, Datums- oder Encoding-Probleme gefunden.');
} else {
  console.log(`Gefundene Hinweise (${issues.length}):`);
  issues.forEach((i) => console.log(' - ' + i));
}

// 4. Bestehende Tests & Mobile-E2E durchlaufen lassen
console.log('\n=== STARTE BESTEHENDE TEST-SUITEN ===');
for (const cmd of [
  'npm test',
  'node scripts/final_verify.mjs',
  'node scripts/qa_deep_simulation_suite.mjs',
  'node scripts/e2e_full_test.mjs'
]) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
