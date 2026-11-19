import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

console.log('══════════════════════════════════════════════════════════════════════════');
console.log(' 🇩🇪 AUDIT: DEUTSCH, SPRACHE, STIL, SPOILER-SCHUTZ & QUALITÄT');
console.log('══════════════════════════════════════════════════════════════════════════\n');

let failureCount = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FEHLER: ${message}`);
    failureCount++;
  } else {
    console.log(`  ✅ ${message}`);
  }
}

// 1. STRUKTUR & DATEN-INTEGRITÄT
console.log('▶ Prüfe 1: Struktur & Daten-Integrität in messages.json...');
const messagesPath = path.join(root, 'public/messages.json');
const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

assert(messages.length === 365, `Exakt 365 Einträge vorhanden (ist: ${messages.length})`);

// IDs 1..365 & Dates 2026-12-24..2027-12-23
let idsAndDatesValid = true;
const startDate = new Date('2026-12-24T00:00:00Z');
const textSet = new Set();
let duplicatesFound = 0;
let lengthViolations = 0;

for (let i = 0; i < messages.length; i++) {
  const m = messages[i];
  const expectedId = i + 1;
  const curDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
  const expectedDate = curDate.toISOString().slice(0, 10);

  if (m.id !== expectedId || m.date !== expectedDate) {
    idsAndDatesValid = false;
  }
  if (!m.text || m.text.trim().length < 35 || m.text.trim().length > 260) {
    lengthViolations++;
  }
  if (textSet.has(m.text.trim())) {
    duplicatesFound++;
  }
  textSet.add(m.text.trim());
}

assert(idsAndDatesValid, 'IDs 1..365 und Kalenderdaten 2026-12-24 bis 2027-12-23 sind lückenlos und fortlaufend');
assert(lengthViolations === 0, `Alle Botschaften haben eine sinnvolle Länge (35–260 Zeichen, Verstöße: ${lengthViolations})`);
assert(duplicatesFound === 0, `Keine exakten Text-Duplikate in messages.json (gefunden: ${duplicatesFound})`);

// 2. HARTE SPERRLISTE (UI + messages.json)
console.log('\n▶ Prüfe 2: Harte Sperrliste (Rechtschreibung, Denglisch, Spoilerschutz, KI-Floskeln)...');

const filesToScan = [
  'index.html',
  'vite.config.js',
  'src/App.jsx',
  'src/components/CalendarGrid.jsx',
  'src/components/DailyCard.jsx',
  'src/components/LockOverlay.jsx',
  'src/components/MilestoneCard.jsx',
  'src/components/Navbar.jsx',
  'src/components/NotificationBanner.jsx',
  'src/components/SecretPinModal.jsx',
  'src/components/BonusMessagesModal.jsx',
  'src/components/HeartCatchGame.jsx',
  'src/data/bonusMessages.json',
  'public/messages.json'
];

const bannedSpelling = [
  'dich Liebe',
  'Noch Versiegelt',
  'Valentinschatz',
  'zu dem schönsten',
  'Admin Freigabe',
  'Tages-Botschaft',
  'Herzen-Fang',
  'Nochmal spielen',
  'schliessen',
  'Grösse',
  'ausserdem',
  'heisst',
  'Strasse'
];

const bannedSpoilers = [
  '3x tippen',
  'Geheimcode-Dialog',
  'PIN-Dialog'
];

const bannedKIFloskeln = [
  'Partnerin',
  'Authentizität',
  'Weichheit',
  'Lieblingsgefühl',
  'Strom der Dankbarkeit',
  'Tradition und Moderne',
  'durchlebt',
  'Lächeln verursacht',
  'verursacht',
  'letzten Atemzug'
];

// Scan for banned words in all UI files
let bannedHits = 0;
for (const relPath of filesToScan) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const word of bannedSpelling) {
    if (content.includes(word)) {
      console.error(`  ❌ Gefunden in ${relPath}: "${word}"`);
      bannedHits++;
    }
  }

  for (const word of bannedSpoilers) {
    if (content.includes(word)) {
      console.error(`  ❌ Spoiler gefunden in ${relPath}: "${word}"`);
      bannedHits++;
    }
  }
}

// Banned KI-Floskeln in messages.json
let kiHits = 0;
const messagesContent = fs.readFileSync(messagesPath, 'utf8');
for (const word of bannedKIFloskeln) {
  if (messagesContent.includes(word)) {
    console.error(`  ❌ KI-Floskel gefunden in messages.json: "${word}"`);
    kiHits++;
  }
}

assert(bannedHits === 0, `0 Treffer auf Rechtschreibfehler, Spoiler & verbotene Denglisch-Begriffe (Treffer: ${bannedHits})`);
assert(kiHits === 0, `0 Treffer auf verbotene KI-Floskeln in messages.json (Treffer: ${kiHits})`);

// 3. STATISTIK & WIEDERHOLUNGSOBERGRENZEN
console.log('\n▶ Prüfe 3: Anti-Schablonen- & Wiederholungs-Statistik...');

let duBistCount = 0;
let ichLiebeCount = 0;
let deinDeineCount = 0;

messages.forEach(m => {
  const t = m.text.trim();
  if (/^Du bist\b/i.test(t)) duBistCount++;
  if (/^Ich liebe\b/i.test(t)) ichLiebeCount++;
  if (/^(Dein|Deine)\b/i.test(t)) deinDeineCount++;
});

assert(duBistCount <= 55, `Satzanfänge mit „Du bist“ <= 55 (aktuell: ${duBistCount})`);
assert(ichLiebeCount <= 55, `Satzanfänge mit „Ich liebe“ <= 55 (aktuell: ${ichLiebeCount})`);
assert(deinDeineCount <= 55, `Satzanfänge mit „Dein/Deine“ <= 55 (aktuell: ${deinDeineCount})`);

// Consecutive 2-word starts
let consecutiveViolations = 0;
for (let i = 0; i < messages.length - 2; i++) {
  const w0 = messages[i].text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  const w1 = messages[i+1].text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  const w2 = messages[i+2].text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  if (w0 === w1 && w1 === w2) {
    consecutiveViolations++;
    console.error(`  ❌ 3 aufeinanderfolgende Tage mit demselben Satzanfang: Tag ${messages[i].id}-${messages[i+2].id}: "${w0}"`);
  }
}
assert(consecutiveViolations === 0, `Keine 3 aufeinanderfolgenden Tage mit demselben 2-Wort-Satzanfang (Verstöße: ${consecutiveViolations})`);

// Word frequency limits in messages.json
let aufsNeueCount = 0;
let immerWiederCount = 0;
let herzCount = 0;

messages.forEach(m => {
  const t = m.text;
  const m1 = t.match(/aufs Neue/gi);
  if (m1) aufsNeueCount += m1.length;
  const m2 = t.match(/immer wieder/gi);
  if (m2) immerWiederCount += m2.length;
  const m3 = t.match(/\b(Herz|Herzen|Herzens|Herzem)\b/gi);
  if (m3) herzCount += m3.length;
});

assert(aufsNeueCount <= 2, `Häufigkeit „aufs Neue“ <= 2 (aktuell: ${aufsNeueCount})`);
assert(immerWiederCount <= 3, `Häufigkeit „immer wieder“ <= 3 (aktuell: ${immerWiederCount})`);
assert(herzCount <= 14, `Häufigkeit „Herz/Herzen“ <= 14 (aktuell: ${herzCount})`);

// Jaccard similarity > 55%
function getCleanWords(text) {
  return new Set(
    text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()„“"'❤️✨💍🎂💖🌟🔥🏆👑–]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccardSimilarity(s1, s2) {
  let inter = 0;
  for (const w of s1) {
    if (s2.has(w)) inter++;
  }
  const union = s1.size + s2.size - inter;
  return union === 0 ? 0 : inter / union;
}

const sets = messages.map(m => ({ id: m.id, words: getCleanWords(m.text), text: m.text }));
let highSimPairs = 0;

for (let i = 0; i < sets.length; i++) {
  for (let j = i + 1; j < sets.length; j++) {
    const sim = jaccardSimilarity(sets[i].words, sets[j].words);
    if (sim > 0.55) {
      highSimPairs++;
      console.error(`  ❌ Dopplungs-Verdacht (${(sim*100).toFixed(1)}%): Tag ${sets[i].id} & Tag ${sets[j].id}`);
    }
  }
}
assert(highSimPairs === 0, `Keine Botschaften-Paare mit > 55 % Ähnlichkeit (Treffer: ${highSimPairs})`);

// 4. BONUS-BRIEFE & SONDERDATEN
console.log('\n▶ Prüfe 4: Bonus-Briefe & Sonderdaten-Check...');
const bonusPath = path.join(root, 'src/data/bonusMessages.json');
const bonus = JSON.parse(fs.readFileSync(bonusPath, 'utf8'));

assert(bonus.length === 7, `Alle 7 Bonus-Briefe vorhanden (ist: ${bonus.length})`);

let bonusThirdPersonFound = false;
let bonusMisleadingStreak = false;

bonus.forEach(b => {
  if (b.title.includes('Ninas Geburtstags') || b.title.includes('Geheimpost für Nina')) {
    bonusThirdPersonFound = true;
  }
  if (b.triggerType === 'streak' && b.triggerValue < 365 && b.title.includes('Tage')) {
    bonusMisleadingStreak = true;
  }
});

assert(!bonusThirdPersonFound, 'Keine Bonus-Briefe in 3. Person („Deine Geburtstagspost“ statt „Ninas...“)');
assert(!bonusMisleadingStreak, 'Zähler-Meilensteine nennen ehrlich „Gründe“ statt „Tage“');

const day41 = messages.find(m => m.id === 41);
const day53 = messages.find(m => m.id === 53);
const day100 = messages.find(m => m.id === 100);
const day194 = messages.find(m => m.id === 194);
const day365 = messages.find(m => m.id === 365);

assert(day41 && day41.text.includes('Geburtstag'), 'Tag 41 (02.02.) enthält Geburtstagswünsche für Nina');
assert(day53 && day53.text.includes('Valentinstag'), 'Tag 53 (14.02.) enthält Valentinstagsbotschaft');
assert(day100 && (day100.text.includes('Hundert') || day100.text.includes('100')), 'Tag 100 erwähnt 100 Gründe');
assert(day194 && day194.text.includes('Hochzeitstag'), 'Tag 194 (05.07.) feiert den Hochzeitstag');
assert(day365 && day365.text.includes('365'), 'Tag 365 rundet das ganze Jahr mit 365 Gründen ab');

// 9 Personal Insider Messages
const insiderChecks = [
  { id: 29, keyword: 'Mein Hase' },
  { id: 79, keyword: 'kontrollier' },
  { id: 113, keyword: 'Hubert und Staller' },
  { id: 140, keyword: 'Metelen' },
  { id: 187, keyword: 'Technik-Fimmel' },
  { id: 215, keyword: 'Kontrollblick' },
  { id: 244, keyword: 'Disziplin' },
  { id: 298, keyword: 'Hubert ohne Staller' },
  { id: 334, keyword: 'Mein Hase' }
];

let insiderPassed = true;
insiderChecks.forEach(c => {
  const m = messages.find(x => x.id === c.id);
  if (!m || !m.text.includes(c.keyword)) {
    insiderPassed = false;
    console.error(`  ❌ Insider-Check fehlgeschlagen für Tag ${c.id}: Keyword "${c.keyword}" nicht gefunden.`);
  }
});
assert(insiderPassed, 'Alle 9 persönlichen Insider-Botschaften (Dennis & Nina) sind korrekt platziert');

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(' 📊 STATISTIK-ÜBERSICHT');
console.log('══════════════════════════════════════════════════════════════════════════');
console.log(`• Gesamtzahl Botschaften:       ${messages.length} / 365`);
console.log(`• Satzanfänge „Du bist...“:     ${duBistCount} (Grenzwert: <= 55)`);
console.log(`• Satzanfänge „Ich liebe...“:   ${ichLiebeCount} (Grenzwert: <= 55)`);
console.log(`• Satzanfänge „Dein/Deine...“:  ${deinDeineCount} (Grenzwert: <= 55)`);
console.log(`• Häufigkeit „aufs Neue“:       ${aufsNeueCount} (Grenzwert: <= 2)`);
console.log(`• Häufigkeit „immer wieder“:    ${immerWiederCount} (Grenzwert: <= 3)`);
console.log(`• Häufigkeit „Herz/Herzen“:     ${herzCount} (Grenzwert: <= 14)`);
console.log(`• Ähnlichkeit > 55 %:           ${highSimPairs} Paare`);
console.log(`• Sperrlisten-Verstöße:         ${bannedHits + kiHits}`);
console.log('══════════════════════════════════════════════════════════════════════════\n');

if (failureCount > 0) {
  console.error(`🚨 AUDIT FEHLGESCHLAGEN: ${failureCount} Fehler festgestellt!\n`);
  process.exit(1);
} else {
  console.log('🎉 AUDIT ERFOLGREICH: Alle harten Kriterien zu 100 % erfüllt!\n');
  process.exit(0);
}
