import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const messages = JSON.parse(fs.readFileSync(path.join(root, 'public/messages.json'), 'utf8'));
const bonus = JSON.parse(fs.readFileSync(path.join(root, 'src/data/bonusMessages.json'), 'utf8'));

console.log('══════════════════════════════════════════════════════════════════════════');
console.log(' 📝 AUDIT: SPRACH-, STIL-, FAKTEN- & KALENDER-LEKTORAT');
console.log('══════════════════════════════════════════════════════════════════════════\n');

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// 1. Datum & Wochentag für alle 365 Tage vorbereiten
const calendarDays = [];
let curDate = new Date('2026-12-24T00:00:00');
for (let i = 0; i < 365; i++) {
  const y = curDate.getFullYear();
  const m = String(curDate.getMonth() + 1).padStart(2, '0');
  const d = String(curDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const dayOfWeek = weekdays[curDate.getDay()];
  calendarDays.push({
    id: i + 1,
    dateStr,
    dayOfWeek,
    isWeekend: curDate.getDay() === 0 || curDate.getDay() === 6,
    month: curDate.getMonth() + 1
  });
  curDate.setDate(curDate.getDate() + 1);
}

// 2. KLISCHEES, ANGLIZISMEN & STIL-PRÜFUNG
console.log('1️⃣ SUCHE NACH KI-FLOSKELN, ANGLIZISMEN & HOLPRIGEN FORMULIERUNGEN...');
const cliches = [
  { pattern: /lächeln.*(?:zauber|bring)/i, label: 'KI-Floskel: "Lächeln ins Gesicht zaubern"' },
  { pattern: /schmelz/i, label: 'Kitsch/Floskel: "schmelzen" (z. B. Herz zum Schmelzen bringen)' },
  { pattern: /selbstverständlich\s+nehmen/i, label: 'Unidiomatisch: "als selbstverständlich nehmen" (besser: für selbstverständlich halten)' },
  { pattern: /erhell/i, label: 'Kitsch/Floskel: "erhellen" (z. B. den Raum erhellen)' },
  { pattern: /macht\s+sinn/i, label: 'Anglizismus: "macht Sinn" (besser: ergibt Sinn)' },
  { pattern: /\brealisier/i, label: 'Anglizismus: "realisieren" im Sinne von begreifen/merken' },
  { pattern: /perfektest/i, label: 'Grammatik: "perfekteste" (perfekt ist nicht steigerbar)' },
  { pattern: /einzigartigst/i, label: 'Grammatik: "einzigartigste" (einzigartig ist nicht steigerbar)' },
  { pattern: /optimalst/i, label: 'Grammatik: "optimalste" (optimal ist nicht steigerbar)' },
  { pattern: /seelenverwandt/i, label: 'Genus-Check: "Seelenverwandte(r)"' },
  { pattern: /\bfreund\b/i, label: 'Genus-Check: "Freund" (männlich)' },
  { pattern: /atem.*raub/i, label: 'Floskel: "den Atem rauben"' },
  { pattern: /fels\s+in\s+der\s+brandung/i, label: 'Metapher: "Fels in der Brandung"' },
  { pattern: /schmetterling/i, label: 'Floskel: "Schmetterlinge im Bauch"' }
];

const foundCliches = [];
messages.forEach((m) => {
  cliches.forEach((c) => {
    if (c.pattern.test(m.text)) {
      foundCliches.push({ id: m.id, date: m.date, text: m.text, label: c.label });
    }
  });
});

console.log(`  Gefundene Stil- & Floskel-Treffer: ${foundCliches.length}`);
foundCliches.forEach((f) => {
  console.log(`  - Tag ${f.id} (${f.date}): ${f.label}`);
  console.log(`    "${f.text}"`);
});

// 3. SATZANFANG- & NACHBARSCHAFTS-CHECK
console.log('\n2️⃣ ANALYSE VON SATZANFÄNGEN & NACHBARSCHAFTEN...');
const openings = new Map();
messages.forEach((m) => {
  const words = m.text.trim().split(/\s+/).slice(0, 3).join(' ');
  const normalized = words.replace(/[,;:.!?]/g, '').toLowerCase();
  if (!openings.has(normalized)) openings.set(normalized, []);
  openings.get(normalized).push(m.id);
});

console.log('  Häufigste Satzanfänge (Top 6):');
const sortedOpenings = Array.from(openings.entries())
  .filter(([_, ids]) => ids.length > 3)
  .sort((a, b) => b[1].length - a[1].length);

sortedOpenings.slice(0, 8).forEach(([prefix, ids]) => {
  console.log(`    - "${prefix}..." (${ids.length}x): Tage ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? '...' : ''}`);
});

// Nachbar-Tage mit identischem Anfang
const neighborDuplicates = [];
for (let i = 0; i < messages.length - 1; i++) {
  const m1 = messages[i];
  const m2 = messages[i + 1];
  const w1 = m1.text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase().replace(/[,;:.!?]/g, '');
  const w2 = m2.text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase().replace(/[,;:.!?]/g, '');
  if (w1 === w2) {
    neighborDuplicates.push({
      day1: m1.id,
      day2: m2.id,
      prefix: w1,
      t1: m1.text,
      t2: m2.text
    });
  }
}

console.log(`\n  Nachbar-Tage mit identischem Satzanfang (Dopplungen in Folge): ${neighborDuplicates.length}`);
neighborDuplicates.forEach((nd) => {
  console.log(`  - Tag ${nd.day1} & Tag ${nd.day2}: "${nd.prefix}..."`);
  console.log(`    Tag ${nd.day1}: "${nd.t1}"`);
  console.log(`    Tag ${nd.day2}: "${nd.t2}"`);
});

// 4. WOCHENTAGS- & KALENDER-PLAUSIBILITÄT
console.log('\n3️⃣ WOCHENTAGS- & KALENDER-PLAUSIBILITÄTS-CHECK...');
const weekdayPatterns = [
  { word: 'montag', dayNum: 1 },
  { word: 'dienstag', dayNum: 2 },
  { word: 'mittwoch', dayNum: 3 },
  { word: 'donnerstag', dayNum: 4 },
  { word: 'freitag', dayNum: 5 },
  { word: 'samstag', dayNum: 6 },
  { word: 'sonntag', dayNum: 0 },
  { word: 'wochenende', requiresWeekend: true }
];

const calendarIssues = [];
messages.forEach((m, idx) => {
  const cal = calendarDays[idx];
  const lower = m.text.toLowerCase();
  
  // Wochentag-Prüfung
  weekdayPatterns.forEach((wp) => {
    if (new RegExp(`\\b${wp.word}\\b`, 'i').test(lower)) {
      if (wp.requiresWeekend) {
        if (!cal.isWeekend) {
          calendarIssues.push({
            id: m.id,
            date: cal.dateStr,
            weekday: cal.dayOfWeek,
            reason: `Erwähnt "Wochenende", fällt aber auf einen ${cal.dayOfWeek}`,
            text: m.text
          });
        }
      } else if (new Date(cal.dateStr).getDay() !== wp.dayNum) {
        calendarIssues.push({
          id: m.id,
          date: cal.dateStr,
          weekday: cal.dayOfWeek,
          reason: `Erwähnt "${wp.word}", ist im Kalender 2027 aber ein ${cal.dayOfWeek}`,
          text: m.text
        });
      }
    }
  });

  // Jahreszeiten-Prüfung
  if (/schnee|winter|weihnacht|heiligabend|silvester/i.test(lower)) {
    if (cal.month >= 5 && cal.month <= 9) {
      calendarIssues.push({
        id: m.id,
        date: cal.dateStr,
        weekday: cal.dayOfWeek,
        reason: `Winter-/Schneebezug im Sommermonat ${cal.month}`,
        text: m.text
      });
    }
  }
  if (/hochsommer|sommerhitze|badesee|strand/i.test(lower)) {
    if (cal.month === 12 || cal.month === 1 || cal.month === 2) {
      calendarIssues.push({
        id: m.id,
        date: cal.dateStr,
        weekday: cal.dayOfWeek,
        reason: `Sommerbezug im Wintermonat ${cal.month}`,
        text: m.text
      });
    }
  }
});

console.log(`  Gefundene Kalender- & Wochentags-Abweichungen: ${calendarIssues.length}`);
calendarIssues.forEach((ci) => {
  console.log(`  - Tag ${ci.id} (${ci.date}, ${ci.weekday}): ${ci.reason}`);
  console.log(`    "${ci.text}"`);
});

// 5. VOLLSTÄNDIGER FAKTEN-ÜBER-NINA EXTRAKTOR
console.log('\n4️⃣ VOLLSTÄNDIGER FAKTEN-EXTRAKTOR ÜBER NINA...');
const factKeywords = [
  { category: 'Trinken & Genuss', regex: /\b(kaffee|tee|kakao|wein|sekt|bier|cola|getränk|tasse|espresso|cappuccino)\b/gi },
  { category: 'Essen & Kochen', regex: /\b(koch|back|pizza|pasta|schokolade|frühstück|abendessen|snack|hunger|gericht|kuchen)\b/gi },
  { category: 'Aktivitäten & Hobbys', regex: /\b(tanz|wander|spazier|sport|joggen|yoga|buch|lesen|serie|film|musik|kino|spiel|zocken)\b/gi },
  { category: 'Reisen & Spontaneität', regex: /\b(spontan|reise|urlaub|koffer|ausflug|auto|fahrt|flug|hotel|strand|meer|berge)\b/gi },
  { category: 'Schlaf & Morgenroutine', regex: /\b(schlaf|wecker|morgenmuffel|frühaufsteher|bettdecke|kissen|traum|träum|müde|gähnen)\b/gi },
  { category: 'Körper & Angewohnheiten', regex: /\b(füße|fuß|hand|hände|haare|duft|parfüm|augen|blick|stimme|lachen|lächeln|stur|sturkopf|kuschel)\b/gi }
];

const extractedFacts = [];
const redFlags = [];

messages.forEach((m) => {
  factKeywords.forEach((fk) => {
    const matches = m.text.match(fk.regex);
    if (matches) {
      matches.forEach((match) => {
        const lowerMatch = match.toLowerCase();
        extractedFacts.push({
          id: m.id,
          date: m.date,
          category: fk.category,
          word: lowerMatch,
          text: m.text
        });

        // Bekannte "Das stimmt nicht für Nina"-Fallen
        if (['kaffee', 'kakao', 'tanz', 'tanzen', 'spontan'].some(rf => lowerMatch.includes(rf))) {
          redFlags.push({
            id: m.id,
            date: m.date,
            word: lowerMatch,
            text: m.text
          });
        }
      });
    }
  });
});

console.log(`  Gesamtzahl gefundener Fakten-Stellen: ${extractedFacts.length}`);
console.log('\n  📋 VOLLSTÄNDIGE LISTE ALLER BEHAUPTUNGEN ÜBER NINA:');
extractedFacts.forEach((ef) => {
  console.log(`  - Tag ${ef.id} (${ef.date}) [${ef.category} / "${ef.word}"]:`);
  console.log(`    "${ef.text}"`);
});

console.log(`\n  ⚠️ ALARM: Stellen mit bekannten Nicht-Fakten (Kaffee, Kakao, Tanzen, Spontan): ${redFlags.length}`);
redFlags.forEach((rf) => {
  console.log(`  - Tag ${rf.id} (${rf.date}) [Signalwort: "${rf.word}"]:`);
  console.log(`    "${rf.text}"`);
});

// 6. GRAMMATIK & ZEICHENSETZUNG (KOMMAS VOR WEIL/DASS/OB/WENN)
console.log('\n5️⃣ GRAMMATIK-, ZEICHENSETZUNGS- & TYPOGRAFIE-CHECK...');
const grammarIssues = [];
messages.forEach((m) => {
  const text = m.text;
  
  // Fehlendes Komma vor Konjunktionen
  if (/[a-zäöüß]\s+(dass|weil|obwohl|sodass|während|indem)\b/i.test(text)) {
    // Check if comma immediately precedes
    const matches = text.match(/([a-zäöüß]+)\s+(dass|weil|obwohl|sodass|während|indem)\b/i);
    if (matches && !matches[0].includes(',')) {
      grammarIssues.push({ id: m.id, issue: `Möglicherweise fehlendes Komma vor "${matches[2]}"`, text });
    }
  }

  // Doppelte Leerzeichen oder Leerzeichen vor Satzzeichen
  if (/\s{2,}/.test(text)) {
    grammarIssues.push({ id: m.id, issue: 'Doppeltes Leerzeichen gefunden', text });
  }
  if (/\s+[,.!?;:]/.test(text)) {
    grammarIssues.push({ id: m.id, issue: 'Leerzeichen vor Satzzeichen (Plenk)', text });
  }

  // Fehlendes Satzzeichen am Ende
  if (!/[.!?…"»')]$/.test(text.trim())) {
    grammarIssues.push({ id: m.id, issue: 'Fehlendes Satzzeichen am Textende', text });
  }
});

console.log(`  Gefundene Grammatik-/Zeichensetzungs-Hinweise: ${grammarIssues.length}`);
grammarIssues.forEach((gi) => {
  console.log(`  - Tag ${gi.id}: ${gi.issue}`);
  console.log(`    "${gi.text}"`);
});

// 7. BONUS-BRIEFE AUDIT
console.log('\n6️⃣ AUDIT DER 7 BONUS-BRIEFE (src/data/bonusMessages.json)...');
bonus.forEach((b) => {
  console.log(`  Bonus #${b.id}: "${b.title}" (Trigger: ${b.triggerType} = ${b.triggerValue})`);
  const bText = b.text || '';
  cliches.forEach((c) => {
    if (c.pattern.test(bText)) {
      console.log(`    ⚠️ Stil-Treffer: ${c.label}`);
    }
  });
  if (/\b(kaffee|kakao|tanz|tanzen|spontan)\b/i.test(bText)) {
    console.log(`    ⚠️ Fakten-Treffer: Unpassende Gewohnheit im Bonus-Brief!`);
  }
});

console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(' ✅ AUDIT-SCAN VOLLSTÄNDIG ABGESCHLOSSEN!');
console.log('══════════════════════════════════════════════════════════════════════════\n');
