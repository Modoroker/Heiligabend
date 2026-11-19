import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const root = process.cwd();

// 1. Daten laden
const messagesPath = path.join(root, 'public/messages.json');
const bonusPath = path.join(root, 'src/data/bonusMessages.json');
const indexPath = path.join(root, 'index.html');

const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
const bonus = JSON.parse(fs.readFileSync(bonusPath, 'utf8'));
const indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('══════════════════════════════════════════════════════════════════════════');
console.log(' 🇩🇪 UMFASSENDES DEUTSCH-, LEKTORATS- & SPRACH-AUDIT');
console.log('══════════════════════════════════════════════════════════════════════════');
console.log(`Geladen: ${messages.length} Tages-Botschaften, ${bonus.length} Bonus-Briefe, index.html`);

const hints = [];

function addHint(category, id, date, text, problem, suggestion) {
  hints.push({
    category,
    id,
    date,
    text,
    problem,
    suggestion
  });
}

// -----------------------------------------------------------------------------
// REGEL 1: Jahreszeit, Wetter & Wochentage vs. Kalenderdatum (2026/2027)
// -----------------------------------------------------------------------------
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

messages.forEach((m) => {
  const d = new Date(m.date + 'T12:00:00Z');
  const month = d.getUTCMonth() + 1; // 1-12
  const weekdayName = WEEKDAYS[d.getUTCDay()];
  const text = m.text;

  // Wochentag-Erwähnung prüfen
  WEEKDAYS.forEach((w) => {
    const r = new RegExp(`\\b${w}\\b`, 'i');
    if (r.test(text)) {
      if (w.toLowerCase() !== weekdayName.toLowerCase()) {
        addHint(
          'Wochentag-Inkonsistenz',
          m.id,
          m.date,
          text,
          `Der Text nennt „${w}“, das Datum (${m.date}) ist aber ein ${weekdayName}!`,
          text.replace(new RegExp(w, 'gi'), weekdayName === 'Sonntag' ? 'Wochenende' : 'Nachmittag')
        );
      }
    }
  });

  // Sommerwörter in Nicht-Sommermonaten (Juni-August = Sommer)
  if (/\b(Sommertag|Sommernacht|Sommerhitze|Strandtag)\b/i.test(text)) {
    if (month < 6 || month > 8) {
      addHint(
        'Jahreszeit-Plausibilität',
        m.id,
        m.date,
        text,
        `Sommer-Begriff im Monat ${month} (${m.date}). Bei Metaphern unkritisch, bei Realitätsbezug prüfen.`,
        'Text auf saisonale Passung prüfen'
      );
    }
  }

  // Winterwörter in Nicht-Wintermonaten (Dezember-Februar = Winter)
  if (/\b(Wintertag|Winterabend|Schneeflocke|Kaminfeuer|eiskalt)\b/i.test(text)) {
    if (month > 3 && month < 11) {
      addHint(
        'Jahreszeit-Plausibilität',
        m.id,
        m.date,
        text,
        `Winter-Begriff im Monat ${month} (${m.date}). Bei Metaphern unkritisch, bei Realitätsbezug prüfen.`,
        'Text auf saisonale Passung prüfen'
      );
    }
  }
});

// -----------------------------------------------------------------------------
// REGEL 2: Männliche Formen ohne „-in“ an Nina gerichtet
// -----------------------------------------------------------------------------
const malePatterns = [
  { regex: /\b(mein|bester|ein|der|perfekter|wahrer|treuer)\s+(Freund|Partner|Seelenverwandter|Held|Ratgeber|Begleiter)\b/i, label: 'Männliche Form statt weiblicher' },
  { regex: /\b(Seelenverwandter)\b/i, label: 'Männliches „Seelenverwandter“ statt „Seelenverwandte“' },
  { regex: /\b(bester Freund)\b/i, label: '„bester Freund“ statt „beste Freundin“' },
  { regex: /\b(Held)\b/i, label: '„Held“ statt „Heldin“' }
];

messages.forEach((m) => {
  malePatterns.forEach((p) => {
    // Ausschluss: "beste Freundin", "Seelenverwandte", "Heldin"
    if (p.regex.test(m.text)) {
      if (!/Freundin|Partnerin|Seelenverwandte|Heldin|Begleiterin|Ratgeberin/i.test(m.text)) {
        addHint(
          'Genus / Weibliche Form',
          m.id,
          m.date,
          m.text,
          p.label,
          'In weibliche Form umwandeln (z. B. Freundin, Partnerin, Seelenverwandte)'
        );
      }
    }
  });
});

// -----------------------------------------------------------------------------
// REGEL 3: „das“ statt „dass“ & fehlendes Komma vor Konjunktionen
// -----------------------------------------------------------------------------
messages.forEach((m) => {
  // Mögliches "das" statt "dass"
  const dasMatch = m.text.match(/,\s*das\s+(ich|du|er|sie|es|wir|ihr|man)\b/i);
  if (dasMatch) {
    addHint(
      '„das“ vs „dass“ (Hinweis)',
      m.id,
      m.date,
      m.text,
      `Prüfen, ob Relativpronomen („welches“) oder Konjunktion („dass“): „${dasMatch[0]}“`,
      'Falls Konjunktion: durch „dass“ ersetzen. Falls Relativsatz: korrekt so lassen.'
    );
  }

  // Fehlendes Komma vor Konjunktionen (dass, weil, damit, obwohl, sodass)
  const conjMatch = m.text.match(/([^,.;!?–\s]\s+)(dass|weil|damit|obwohl|sodass)\b/i);
  if (conjMatch) {
    // Ausnahmen wie "ohne dass" werden gesondert geprüft
    if (!/ohne\s+dass/i.test(m.text)) {
      addHint(
        'Kommasetzung',
        m.id,
        m.date,
        m.text,
        `Möglicherweise fehlendes Komma vor „${conjMatch[2]}“`,
        m.text.replace(conjMatch[0], `${conjMatch[1].trim()}, ${conjMatch[2]}`)
      );
    }
  }
});

// -----------------------------------------------------------------------------
// REGEL 4: Typografie, Anführungszeichen, Ellipsen, Gedankenstriche
// -----------------------------------------------------------------------------
messages.forEach((m) => {
  if (/["']/.test(m.text)) {
    addHint(
      'Typografie: Gerade Anführungszeichen',
      m.id,
      m.date,
      m.text,
      'Gerade Anführungszeichen (" oder \') gefunden statt deutscher typografischer Anführungszeichen („ und “)',
      'Typografische Anführungszeichen „...“ verwenden'
    );
  }
  if (/\.\.\./.test(m.text)) {
    addHint(
      'Typografie: Drei Punkte',
      m.id,
      m.date,
      m.text,
      'Drei einzelne Punkte (...) statt typografischer Ellipse (…)',
      m.text.replace(/\.\.\./g, '…')
    );
  }
  if (/\s-\s/.test(m.text)) {
    addHint(
      'Typografie: Bindestrich',
      m.id,
      m.date,
      m.text,
      'Einfacher Bindestrich als Gedankenstrich gefunden statt Halbgeviertstrich (–)',
      m.text.replace(/\s-\s/g, ' – ')
    );
  }
  if (/\b(fuer|waere|schoen|gluecklich|muesste)\b/i.test(m.text)) {
    addHint(
      'Ersatzschreibweise (ae/oe/ue)',
      m.id,
      m.date,
      m.text,
      'Mögliche Ersatzschreibweise für Umlaut gefunden',
      'Durch echten deutschen Umlaut ersetzen'
    );
  }
});

// -----------------------------------------------------------------------------
// REGEL 5: Uneinheitliche Groß-/Kleinschreibung von Anredepronomen
// -----------------------------------------------------------------------------
messages.forEach((m) => {
  // Wenn mitten im Satz "Du", "Dich", "Dir", "Dein" großgeschrieben wird (nach Kleinschreibung)
  const pronounMatch = m.text.match(/[a-zäöüß],\s+(Du|Dich|Dir|Deine?r?n?s?m?)\b/);
  if (pronounMatch) {
    addHint(
      'Anredepronomen Großschreibung',
      m.id,
      m.date,
      m.text,
      `Großgeschriebenes Anredepronomen mitten im Satz nach Komma: „${pronounMatch[0]}“`,
      'Einheitliche Kleinschreibung („du/dich/dir/dein“) oder bewusste Duden-Briefanrede prüfen'
    );
  }
});

// -----------------------------------------------------------------------------
// REGEL 6: Zahlen im Text vs. Tag (z. B. 365 Tage vor Tag 365)
// -----------------------------------------------------------------------------
messages.forEach((m) => {
  if (m.id < 365) {
    if (/\b365\s*(Tage|Gründe|Tagen)\b/i.test(m.text)) {
      addHint(
        'Zahlen-Inkonsistenz',
        m.id,
        m.date,
        m.text,
        `Tag ${m.id} erwähnt bereits „365 Tage/Gründe“, obwohl erst Tag ${m.id} geöffnet ist!`,
        'Text anpassen, sodass er sich auf „jeden Tag“ oder den aktuellen Tag bezieht'
      );
    }
  }
});

// -----------------------------------------------------------------------------
// REGEL 7: KI-Floskeln & Lehnübersetzungen
// -----------------------------------------------------------------------------
const cliches = [
  { regex: /Lächeln\s+(aufs?|ins?)\s+Gesicht\s+(zu\s+)?zaubern?/i, label: 'KI-Floskel: „Lächeln ins Gesicht zaubern“' },
  { regex: /letzten Atemzug teilen/i, label: 'Englische Lehnübersetzung: „letzten Atemzug teilen“' },
  { regex: /jeden Raum erhell/i, label: 'Klischee: „jeden Raum erhellen“' },
  { regex: /Herz zum Schmelzen/i, label: 'Klischee: „Herz zum Schmelzen bringen“' },
  { regex: /Sinn machen/i, label: 'Anglizismus: „Sinn machen“ statt „Sinn ergeben“' },
  { regex: /als selbstverständlich nehmen/i, label: 'Unidiomatisch: „als selbstverständlich nehmen“' }
];

messages.forEach((m) => {
  cliches.forEach((c) => {
    if (c.regex.test(m.text)) {
      addHint(
        'KI-Floskel / Lehnübersetzung',
        m.id,
        m.date,
        m.text,
        c.label,
        'Durch authentisches, gesprochenes Deutsch ersetzen'
      );
    }
  });
});

// -----------------------------------------------------------------------------
// REGEL 8: Satzanfänge & Wiederholungen
// -----------------------------------------------------------------------------
const starters = {};
let consecutiveSameStarters = 0;
let prevStarter = '';

messages.forEach((m, idx) => {
  const words = m.text.trim().split(/\s+/).slice(0, 3).join(' ');
  starters[words] = (starters[words] || 0) + 1;
  if (words === prevStarter) {
    consecutiveSameStarters++;
    addHint(
      'Satzanfang-Wiederholung',
      m.id,
      m.date,
      m.text,
      `Exakt gleicher Satzanfang („${words}“) wie an Vortag ${messages[idx - 1].id}`,
      'Satzanfang variieren'
    );
  }
  prevStarter = words;
});

// -----------------------------------------------------------------------------
// 9. BROWSER-TEST: Tatsächlich gerenderte Texte aller Ansichten extrahieren
// -----------------------------------------------------------------------------
console.log('\n🌐 Starte Browser zur Extraktion aller tatsächlich gerenderten UI-Texte...');

console.log('  [1/6] Starte Vite Preview Server auf Port 4175...');
const previewServer = await preview({
  configFile: path.resolve(root, 'vite.config.js'),
  preview: { port: 4175, strictPort: true }
});
const baseUrl = previewServer.resolvedUrls?.local?.[0] || 'http://localhost:4175/';
console.log('  [2/6] Preview Server bereit unter:', baseUrl);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin'
});
console.log('  [3/6] Browser & Page initialisiert.');

const extractedTexts = {
  metaAndManifest: [],
  lockScreen: [],
  navbar: [],
  dailyView: [],
  calendarView: [],
  notificationBanner: [],
  secretModal: [],
  bonusModal: [],
  minigame: []
};

try {
  console.log('  [4/6] Navigiere zu:', baseUrl);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  console.log('  [4/6] Sperrbildschirm geladen!');
  await page.waitForTimeout(600);

  // Meta & Manifest
  extractedTexts.metaAndManifest.push({
    label: 'Seitentitel (document.title)',
    text: await page.title()
  });
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content').catch(() => '');
  const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content').catch(() => '');
  extractedTexts.metaAndManifest.push({ label: 'Open Graph Title (og:title)', text: ogTitle });
  extractedTexts.metaAndManifest.push({ label: 'Open Graph Description (og:description)', text: ogDesc });

  // Sperrbildschirm
  const lockTitle = await page.locator('h2').innerText().catch(() => '');
  const lockSub = await page.locator('main p').innerText().catch(() => '');
  extractedTexts.lockScreen.push({ label: 'Sperrbildschirm Überschrift', text: lockTitle });
  extractedTexts.lockScreen.push({ label: 'Sperrbildschirm Hinweistext', text: lockSub });

  // Countdown Labels
  const countdownLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('main span')).map((s) => s.textContent.trim()).filter(Boolean);
  });
  extractedTexts.lockScreen.push({ label: 'Sperrbildschirm Countdown-Elemente', text: countdownLabels.join(' | ') });

  // Navbar
  const navbarAria = await page.locator('header div[role="button"]').first().getAttribute('aria-label').catch(() => '');
  const navbarTitle = await page.locator('header h1').innerText().catch(() => '');
  extractedTexts.navbar.push({ label: 'Logo Aria-Label', text: navbarAria });
  extractedTexts.navbar.push({ label: 'Header Titel Text', text: navbarTitle.replace(/\n/g, ' ') });

  // Secret Modal Tests
  const logo = page.locator('header div[role="button"]').first();
  await logo.click();
  await page.waitForTimeout(120);
  await logo.click();
  await page.waitForTimeout(120);
  await logo.click();
  await page.waitForSelector('#secret-pin-title', { timeout: 3000 }).catch(() => {});

  // Secret Modal Texts
  const secretTitle = await page.locator('#secret-pin-title').innerText().catch(() => '');
  const secretSub = await page.locator('div[role="dialog"] p').innerText().catch(() => '');
  const secretPlaceholder = await page.locator('input[type="password"]').getAttribute('placeholder').catch(() => '');
  extractedTexts.secretModal.push({ label: 'Geheim-PIN Dialog Titel', text: secretTitle });
  extractedTexts.secretModal.push({ label: 'Geheim-PIN Dialog Untertitel', text: secretSub });
  extractedTexts.secretModal.push({ label: 'Geheimcode Input Placeholder', text: secretPlaceholder });

  // Admin-Bypass direkt via localStorage aktivieren für nahtlose Ansichts-Erfassung
  await page.evaluate(() => {
    localStorage.setItem('365_reasons_admin_override', 'true');
    localStorage.setItem('365_reasons_opened_days', JSON.stringify([1]));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // Daily View Texts nach Entsperrung
  const envelope = page.locator('div[role="button"][aria-label*="öffnen"]').first();
  if (await envelope.isVisible().catch(() => false)) {
    const envelopeAria = await envelope.getAttribute('aria-label').catch(() => '');
    extractedTexts.dailyView.push({ label: 'Briefumschlag Aria-Label', text: envelopeAria });
    await envelope.click();
    await page.waitForTimeout(600);
  }
  const dailyText = await page.locator('main p').innerText().catch(() => '');
  extractedTexts.dailyView.push({ label: 'Aufgedeckte Tages-Botschaft (Tag 1)', text: dailyText });

  // Bonus Modal
  await page.click('button[aria-label*="Geheimpost"]');
  await page.waitForTimeout(500);
  const bonusHeader = await page.locator('h3:has-text("Geheimpost")').innerText().catch(() => '');
  extractedTexts.bonusModal.push({ label: 'Bonus-Modal Überschrift', text: bonusHeader });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Kalender Ansicht
  await page.click('button[id="tab-calendar"]');
  await page.waitForTimeout(400);
  const filterTabs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div[role="tablist"] button, div.flex.items-center.gap-1\\.5.p-1 button')).map((b) => b.textContent.trim())
  );
  extractedTexts.calendarView.push({ label: 'Filter-Tabs', text: filterTabs.join(' | ') });

  // Minispiel
  await page.click('button[aria-label*="Minispiel"]');
  await page.waitForTimeout(500);
  const gameTitle = await page.locator('div[role="dialog"] h2, div[role="dialog"] h3').first().innerText().catch(() => '');
  const gameHint = await page.locator('div[role="dialog"] p').first().innerText().catch(() => '');
  extractedTexts.minigame.push({ label: 'Minispiel Titel', text: gameTitle });
  extractedTexts.minigame.push({ label: 'Minispiel Spielanleitung / Hinweis', text: gameHint });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
} finally {
  await browser.close();
  if (previewServer && previewServer.httpServer) {
    previewServer.httpServer.close();
  }
}

// -----------------------------------------------------------------------------
// 10. GENERIERE DIE LESEDATEI tools/alle_texte_zum_lesen.md
// -----------------------------------------------------------------------------
const outputMdPath = path.join(root, 'tools/alle_texte_zum_lesen.md');

let md = `# Alle Texte der PWA „365 Gründe, warum ich dich liebe ❤️“ zum Gegenlesen

> **Zweck dieser Datei:**
> Diese Datei enthält lückenlos jeden einzelnen Text, den Nina in der App je sehen oder hören kann – von den Meta-Tags über sämtliche UI-Schaltflächen, Tooltips, Dialoge und Bonus-Briefe bis hin zu allen 365 Tages-Botschaften (aufgeteilt in 4 handliche 90-Tage-Abschnitte zum gemütlichen Probelesen).

---

## Inhaltsverzeichnis
1. [Meta-Tags, Open Graph & PWA-Manifest](#1-meta-tags-open-graph--pwa-manifest)
2. [Sperrbildschirm & Countdown-Ansicht](#2-sperrbildschirm--countdown-ansicht)
3. [Header & Navigation](#3-header--navigation)
4. [Tägliches Liebespost-Ritual (Tageskarte)](#4-tägliches-liebespost-ritual-tageskarte)
5. [Kalender & Monatsansicht](#5-kalender--monatsansicht)
6. [Benachrichtigungs-Banner](#6-benachrichtigungs-banner)
7. [Geheimcode-PIN-Dialog (Admin / Easter Eggs)](#7-geheimcode-pin-dialog-admin--easter-eggs)
8. [Die 7 Bonus-Briefe & Meilensteine](#8-die-7-bonus-briefe--meilensteine)
9. [Herzen fangen Minispiel (Alle Texte & Toasts)](#9-herzen-fangen-minispiel-alle-texte--toasts)
10. [Die 365 Liebesbotschaften](#10-die-365-liebesbotschaften)
    - [Teil 1: Tag 1 bis Tag 90 (24.12.2026 – 23.03.2027)](#teil-1-tag-1-bis-tag-90-24122026--23032027)
    - [Teil 2: Tag 91 bis Tag 180 (24.03.2027 – 21.06.2027)](#teil-2-tag-91-bis-tag-180-24032027--21062027)
    - [Teil 3: Tag 181 bis Tag 270 (22.06.2027 – 19.09.2027)](#teil-3-tag-181-bis-tag-270-22062027--19092027)
    - [Teil 4: Tag 271 bis Tag 365 (20.09.2027 – 23.12.2027)](#teil-4-tag-271-bis-tag-365-20092027--23122027)

---

## 1. Meta-Tags, Open Graph & PWA-Manifest

| Element / Eigenschaft | Textinhalt | Zweck / Sichtbarkeit |
| :--- | :--- | :--- |
| **HTML-Sprache** | \`<html lang="de">\` | Silbentrennung & Screenreader Deutsch |
| **Seitentitel** | \`365 Gründe, warum ich dich liebe ❤️\` | Browser-Tab & Lesezeichen |
| **App-Kurzname (Manifest)** | \`365 Gründe\` (10 Zeichen) | Text unter dem PWA-Icon auf dem Handy |
| **App-Vollname (Manifest)** | \`365 Gründe, warum ich dich liebe ❤️\` | Installations-Dialog |
| **App-Beschreibung** | \`Ein Jahr voller Liebe und Wertschätzung für meine wundervolle Frau Nina.\` | PWA-Manifest & Browser-Stores |
| **WhatsApp Vorschau-Titel** | \`365 Gründe, warum ich dich liebe ❤️\` | WhatsApp / Social Media Link-Vorschau |
| **WhatsApp Vorschau-Text** | \`365 persönliche Liebesbotschaften für Nina – jeden Tag ein neuer Grund.\` | Link-Beschreibung beim Teilen |

---

## 2. Sperrbildschirm & Countdown-Ansicht

*Dieser Bildschirm erscheint vor der Bescherung am 24.12.2026 sowie nachts vor der Freischaltung zukünftiger Tage.*

- **Überschrift (Heiligabend):** \`Heiligabend – noch versiegelt\`
- **Überschrift (reguläre Tage):** \`Tag {id} – noch versiegelt\`
- **Hinweistext (Heiligabend):** \`Noch etwas Geduld bis zur Bescherung! Die erste Botschaft öffnet sich um 21:00 Uhr.\`
- **Hinweistext (reguläre Tage):** \`Noch ein bisschen Geduld – diese Botschaft öffnet sich am {Datum} um 00:00 Uhr.\`
- **Countdown-Labels (Singular/Plural):**
  - \`1 Tag\` vs. \`{n} Tage\`
  - \`1 Stunde\` vs. \`{n} Stunden\`
  - \`1 Minute\` vs. \`{n} Minuten\`
  - \`1 Sekunde\` vs. \`{n} Sekunden\`
- **Aria-Label des Herzschlosses:** \`Tag {id} noch versiegelt\`

---

## 3. Header & Navigation

- **Logo-Button (Aria-Label):** \`365 Gründe, warum ich dich liebe\`
- **Logo-Tooltip:** \`365 Gründe, warum ich dich liebe ❤️\`
- **Sichtbarer Header-Titel:** \`365 Gründe, warum ich dich liebe\`
- **Herzen fangen Minispiel-Button (Aria-Label):** \`Minispiel „Herzen fangen“ öffnen\` (Tooltip: \`Herzen fangen spielen 🎮\`)
- **Geheimpost Geschenkbox-Button (Aria-Label):** \`Geheimpost öffnen\` (Tooltip: \`Geheimpost öffnen 🎁\`)
- **Fortschritts-Badge:** \`{opened} / 365\` (Aria-Label: \`Fortschritt: {opened} von 365 Gründen entdeckt\`)
- **Admin-Badge (nur bei aktivem Override):** \`Admin\` (Aria-Label & Tooltip: \`Admin-Freigabe zurücksetzen\`)
- **Tabs:** \`Tagesbotschaft\` (#tab-daily) & \`Kalender & Übersicht\` (#tab-calendar)

---

## 4. Tägliches Liebespost-Ritual (Tageskarte)

- **Briefumschlag Aria-Label:** \`Tagesbotschaft {id} öffnen\`
- **Briefumschlag Siegel-Beschriftung:** \`N & D\` (Königliches Lacksiegel)
- **Tageskarte Kopfzeile:** \`Tag {id} von 365\`
- **Tageskarte Herz-Button:** \`Zu Favoriten hinzufügen\` bzw. \`Aus Favoriten entfernen\`
- **Tageskarte Kopieren-Button:** \`Liebesbotschaft kopieren\` (Tooltip bei Klick: \`Kopiert! ❤️\`)
- **Tageskarte Zauber-Effekt:** 12 deterministische Konfetti- & Zaubereffekte je nach Tag

---

## 5. Kalender & Monatsansicht

- **Meilenstein-Karte:**
  - \`{opened} Grund entdeckt\` / \`{opened} Gründe entdeckt\`
  - \`{opened} Grund gelesen\` / \`{opened} Gründe gelesen\`
  - \`Nächstes Ziel: {ziel} 🏆\`
- **Filter-Tabs:**
  - \`Alle (365)\`
  - \`Freigeschaltet\`
  - \`Favoriten ({anzahl})\`
- **Zähler-Anzeige:** \`{anzahl} von 365 angezeigt\`
- **Monats-Filterleiste:** \`Alle Monate\`, \`Dezember '26\`, \`Januar '27\`, \`Februar '27\`, ..., \`Dezember '27\`
- **Kachel-Status Labels:**
  - \`Gelesen\` (grün, mit Häkchen)
  - \`Frei!\` (golden, mit Glitzern)
  - \`Tag {id}\` (gesperrt mit Schlosssymbol)
- **Feiertags-Badges auf Kacheln:**
  - 🎂 Geburtstag (02.02.)
  - 💖 Valentinstag (14.02.)
  - 💍 Hochzeitstag (05.07.)
  - 🎄 Weihnachten (24.12.)
  - 🎆 Silvester (31.12.)
  - ✨ Neujahr (01.01.)
- **Leerer Filter-Zustand:** \`Für diese Auswahl gibt es gerade keine Botschaften.\`

---

## 6. Benachrichtigungs-Banner

- **Region-Aria:** \`Erinnerung an deine tägliche Liebespost\`
- **Text:** \`Tägliche Liebespost 💌\`
- **Aktivieren-Button:** \`Aktivieren\`
- **Schließen-Button (Aria-Label):** \`Banner schließen\`

---

## 7. Geheimcode-PIN-Dialog (Admin / Easter Eggs)

- **Titel:** \`Geheimcode\`
- **Untertitel:** \`Bitte gib den Geheimcode ein.\`
- **Input-Placeholder:** \`Geheimcode eingeben\` (Aria-Label: \`Geheimcode\`)
- **Fehlermeldung:** \`Der Code stimmt leider nicht. Versuch es bitte noch einmal.\`
- **Erfolgsmeldung:** \`Erfolgreich freigeschaltet! ✨\`
- **Schließen-Button (Aria-Label):** \`Schließen\`

---

## 8. Die 7 Bonus-Briefe & Meilensteine

`;

bonus.forEach((b, idx) => {
  md += `### Bonus-Brief ${idx + 1}: ${b.title}\n`;
  md += `- **Freischalt-Bedingung:** ${b.subtitle}\n`;
  md += `- **ID / Trigger:** \`${b.id}\` (\`${b.triggerType}\`: \`${b.triggerValue}\`)\n\n`;
  md += `> „${b.text}“\n\n`;
});

md += `---

## 9. Herzen fangen Minispiel (Alle Texte & Toasts)

- **Spieltitel:** \`Herzen fangen\`
- **Spielanleitung / Hinweis:** \`Fange bunte Herzen & meide gebrochene! 🎀\`
- **HUD-Labels:** \`Punkte\` & \`Rekord\`
- **Steuerung:** Korb mit Finger (Touch) oder Pfeiltasten links/rechts steuern.
- **Pausieren-Button (Aria-Label):** \`Spiel pausieren\` / \`Spiel fortsetzen\`
- **Ton-Button (Aria-Label):** \`Ton stummschalten\` / \`Ton einschalten\`
- **Schließen-Button (Aria-Label):** \`Spiel schließen\`
- **Combo- & Power-Up-Toasts:**
  - \`🔥 2er-Kombo!\`
  - \`⚡ 3× Herzensrausch! 🌟\`
  - \`🔥 Herzensrausch verlängert!\`
  - \`🧲 Magnet aktiviert!\`
  - \`❄️ Zeitlupe aktiviert!\`
- **Highscore-Toast:** \`✨ Neuer persönlicher Rekord! 👑\`
- **Game-Over-Bildschirm:**
  - Überschrift: \`Spiel beendet\`
  - Erreichte Punkte & Bester Rekord
  - Button: \`Noch einmal spielen\`

---

## 10. Die 365 Liebesbotschaften

`;

// 4 Teile à ca. 90 Tage
const parts = [
  { num: 1, title: 'Teil 1: Tag 1 bis Tag 90 (24.12.2026 – 23.03.2027)', start: 1, end: 90 },
  { num: 2, title: 'Teil 2: Tag 91 bis Tag 180 (24.03.2027 – 21.06.2027)', start: 91, end: 180 },
  { num: 3, title: 'Teil 3: Tag 181 bis Tag 270 (22.06.2027 – 19.09.2027)', start: 181, end: 270 },
  { num: 4, title: 'Teil 4: Tag 271 bis Tag 365 (20.09.2027 – 23.12.2027)', start: 271, end: 365 }
];

parts.forEach((p) => {
  md += `### ${p.title}\n\n`;
  md += `| Tag | Datum | Liebesbotschaft für Nina |\n`;
  md += `| :---: | :--- | :--- |\n`;
  for (let id = p.start; id <= p.end; id++) {
    const m = messages.find((x) => x.id === id);
    if (m) {
      md += `| **Tag ${m.id}** | ${m.date} | ${m.text.replace(/\|/g, '\\|')} |\n`;
    }
  }
  md += `\n`;
});

fs.writeFileSync(outputMdPath, md, 'utf8');
console.log(`\n📄 Lesedatei erfolgreich geschrieben nach: ${outputMdPath}`);

// -----------------------------------------------------------------------------
// BERICHT ZUSAMMENFASSUNG
// -----------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log(` 📊 AUDIT-ERGEBNISSE (${hints.length} HINWEISE GEFUNDEN)`);
console.log('══════════════════════════════════════════════════════════════════════════');

if (hints.length === 0) {
  console.log('✅ Keine auffälligen Muster gefunden.');
  console.log('⚠️ Hinweis: „Keine Treffer“ heißt nicht „völlig fehlerfrei“. Menschliches Gegenlesen bleibt empfohlen!');
} else {
  hints.forEach((h, i) => {
    console.log(`\n[${i + 1}] Kategorie: ${h.category} | Tag ${h.id} (${h.date})`);
    console.log(`    Satz: "${h.text}"`);
    console.log(`    Problem: ${h.problem}`);
    console.log(`    Vorschlag: ${h.suggestion}`);
  });
}
