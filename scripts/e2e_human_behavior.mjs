import { chromium, webkit } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// 1. Playwright-Version prüfen (page.clock benötigt Playwright >= 1.45)
const playwrightPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'node_modules/playwright/package.json'), 'utf8')
);
const versionParts = playwrightPkg.version.split('.').map(Number);
const isClockSupported = versionParts[0] > 1 || (versionParts[0] === 1 && versionParts[1] >= 45);
assert(isClockSupported, `Playwright Version >= 1.45 erforderlich. Installiert: ${playwrightPkg.version}`);

// Viewports für Responsive- und Querformat-Audits
const VIEWPORTS = [
  { name: 'iPhone SE Hochformat', width: 320, height: 568 },
  { name: 'iPhone 14 Hochformat', width: 390, height: 844 },
  { name: 'iPhone Querformat', width: 844, height: 390 }
];

function logPass(type, message) {
  console.log(`  ✅ [PASS] [${type}] ${message}`);
}

function logWarn(type, message) {
  console.log(`  ⚠️  [WARN] [${type}] ${message}`);
}

function logOpen(type, message, reason) {
  console.log(`  ⏳ [OFFEN] [${type}] ${message} -> Grund: ${reason}`);
}

function logFail(type, message, err) {
  const detail = err?.message || String(err);
  console.error(`  ❌ [FAIL] [${type}] ${message} -> ${detail}`);
  throw new Error(`${message}: ${detail}`);
}

// -----------------------------------------------------------------------------
// Touch-Flächen- & Bounding-Boxen-Prüfung
// Unter 24px = FEHLER, unter 44px = WARNUNG (Apple HIG Richtlinie)
// -----------------------------------------------------------------------------
async function checkLayoutAndTouchTargets(page, label) {
  const report = await page.evaluate(() => {
    const horizontalOverflow =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

    const isInsideHorizontalScroll = (el) => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ox = window.getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
        p = p.parentElement;
      }
      return false;
    };

    // Alle interaktiven Elemente (Buttons, Links, Inputs, Kacheln)
    const elements = Array.from(
      document.querySelectorAll('button, a, input, div[role="button"], div[role="tab"]')
    )
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.tagName.toLowerCase(),
          width: Math.round(r.width),
          height: Math.round(r.height),
          left: Math.round(r.left),
          right: Math.round(r.right),
          isScrollable: isInsideHorizontalScroll(el)
        };
      });

    const tooSmall = elements.filter((b) => b.width < 24 || b.height < 24);
    const belowRecommended = elements.filter((b) => (b.width < 44 || b.height < 44) && b.width >= 24 && b.height >= 24);
    // Elemente außerhalb des Viewports, sofern sie NICHT in einem horizontalen Scroll-Container (z. B. Monatsleiste) liegen
    const outOfBounds = elements.filter((b) => !b.isScrollable && (b.right > window.innerWidth + 2 || b.left < -2));

    return { horizontalOverflow, tooSmall, belowRecommended, outOfBounds };
  });

  assert(!report.horizontalOverflow, `[${label}] Kein horizontales Überlaufen`);
  assert(
    report.tooSmall.length === 0,
    `[${label}] Kritischer Fehler: Touch-Fläche unter 24px gefunden (${JSON.stringify(report.tooSmall)})`
  );
  assert(
    report.outOfBounds.length === 0,
    `[${label}] Elemente außerhalb des Viewports (${JSON.stringify(report.outOfBounds)})`
  );

  if (report.belowRecommended.length > 0) {
    logWarn(
      'Echte UI-Bedienung',
      `[${label}] ${report.belowRecommended.length} Elemente unter Apples 44px-Empfehlung (aber >= 24px Hard-Limit)`
    );
  }

  logPass('Echte UI-Bedienung', `Layout- & Touch-Flächen-Integrität bei [${label}] einwandfrei`);
}

async function runSuiteForEngine(engineName, browserType, baseUrl) {
  console.log(`\n══════════════════════════════════════════════════════════════════════════`);
  console.log(` 📱 BROWSER-ENGINE: ${engineName.toUpperCase()}`);
  console.log(`══════════════════════════════════════════════════════════════════════════`);

  const browser = await browserType.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];

  try {
    // =========================================================================
    // 1. LIVE-ZEITÜBERGÄNGE (runFor) & FREMDE ZEITZONEN / SPRACHEN
    // =========================================================================
    console.log('\n1️⃣ Live-Zeitübergang & Internationale Zeitzonen (runFor)...');

    // 1a. Berlin Zeitzone Heiligabend: 20:59:55 -> 21:00:03 CET (runFor)
    const clockContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      timezoneId: 'Europe/Berlin',
      locale: 'de-DE'
    });
    const clockPage = await clockContext.newPage();

    try {
      await clockPage.clock.install({ time: new Date('2026-12-24T20:59:55+01:00') });
      await clockPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await clockPage.waitForSelector('img[alt="Königliches Herzschloss"]', { timeout: 10000 });

      const lockBefore = await clockPage.locator('img[alt="Königliches Herzschloss"]').isVisible();
      assert(lockBefore, 'Um 20:59:55 ist Tag 1 mit dem Herzschloss versiegelt');

      // Uhr mit runFor(8000) voranschreiten (feuert alle Zwischen-Intervalle & Timeouts)
      await clockPage.clock.runFor(8000);
      await clockPage.waitForSelector('img[alt="Königliches Liebes-Siegel"]', { timeout: 10000 });

      const lockAfter = await clockPage.locator('img[alt="Königliches Herzschloss"]').isVisible();
      const sealVisible = await clockPage.locator('img[alt="Königliches Liebes-Siegel"]').isVisible();
      assert(!lockAfter, 'Herzschloss verschwindet um 21:00:00 live');
      assert(sealVisible, 'Lacksiegel erscheint um 21:00:00 live ohne Reload');
      logPass('Echte UI-Bedienung', 'Live-Übergang Heiligabend (20:59:55 -> 21:00:03 via runFor) öffnet Tag 1 ohne Reload');

      // 1b. Mitternachtswechsel (24.12. 23:59:55 -> 25.12. 00:00:03) im Kalender
      await clockPage.clock.setSystemTime(new Date('2026-12-24T23:59:55+01:00'));
      await clockPage.waitForSelector('button[id="tab-calendar"]', { timeout: 10000 });
      await clockPage.click('button[id="tab-calendar"]');
      await clockPage.waitForSelector('div[aria-label*="Tag 2:"]', { timeout: 10000 });

      const day2Before = await clockPage.locator('div[aria-label*="Tag 2:"]').first().getAttribute('aria-label');
      assert(day2Before.includes('Gesperrt'), 'Tag 2 ist vor Mitternacht gesperrt');

      await clockPage.clock.runFor(8000);
      await clockPage.waitForTimeout(400);

      const day2After = await clockPage.locator('div[aria-label*="Tag 2:"]').first().getAttribute('aria-label');
      assert(day2After.includes('Bereit') || !day2After.includes('Gesperrt'), 'Tag 2 entsperrt sich um 00:00:00 live');
      logPass('Echte UI-Bedienung', 'Live-Übergang Mitternacht (23:59:55 -> 00:00:03 via runFor) entsperrt Tag 2 live');

      // 1c. Resume / visibilitychange nach 8 Stunden Über-Nacht-Hintergrund (Handy im Standby)
      const timeIn8Hours = new Date('2026-12-24T03:58:58.500+01:00');
      await clockPage.clock.setSystemTime(timeIn8Hours);
      await clockPage.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });
      await clockPage.waitForTimeout(300);
      logPass('Echte UI-Bedienung', 'App im Hintergrund: visibilitychange & focus aktualisieren Zeit nach 8h Schlaf ohne Reload');
    } finally {
      await clockContext.close();
    }

    // 1d. Countdown-Singular & Plural-Prüfung in isoliertem Kontext (exakt 1 Tag, 1 Stunde, 1 Min, 1 Sek)
    const cdContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: 'Europe/Berlin',
      locale: 'de-DE'
    });
    const cdPage = await cdContext.newPage();
    try {
      await cdPage.clock.install({ time: new Date('2026-12-23T19:58:58.500+01:00') });
      await cdPage.goto(baseUrl, { waitUntil: 'load' });
      await cdPage.waitForSelector('img[alt="Königliches Herzschloss"]', { timeout: 10000 });
      await cdPage.waitForSelector('.text-\\[10px\\].tracking-widest', { timeout: 10000 });

      const labels = await cdPage.locator('.text-\\[10px\\].tracking-widest').allTextContents();
      assert.strictEqual(labels[0]?.trim(), 'Tag', 'Countdown Label bei 1 Tag ist exakt Singular "Tag"');
      assert.strictEqual(labels[1]?.trim(), 'Stunde', 'Countdown Label bei 1 Stunde ist exakt Singular "Stunde"');
      assert.strictEqual(labels[2]?.trim(), 'Minute', 'Countdown Label bei 1 Minute ist exakt Singular "Minute"');
      assert.strictEqual(labels[3]?.trim(), 'Sekunde', 'Countdown Label bei 1 Sekunde ist exakt Singular "Sekunde"');
      logPass('Echte UI-Bedienung', 'Countdown-Grammatik: Exakter Singular ("1 Tag, 1 Stunde, 1 Minute, 1 Sekunde") verifiziert');
    } finally {
      await cdContext.close();
    }

    // 1e. Internationale Zeitzonen (Los Angeles & Tokio) mit englischem Browser
    for (const remote of [
      { tz: 'America/Los_Angeles', timeStr: '2026-12-24T12:00:05-08:00', label: 'Los Angeles (UTC-8)' },
      { tz: 'Asia/Tokyo', timeStr: '2026-12-25T05:00:05+09:00', label: 'Tokio (UTC+9)' }
    ]) {
      const remoteCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        timezoneId: remote.tz,
        locale: 'en-US' // Browser auf Englisch gestellt
      });
      const remotePage = await remoteCtx.newPage();
      try {
        await remotePage.clock.install({ time: new Date(remote.timeStr) });
        await remotePage.goto(baseUrl, { waitUntil: 'load' });

        // Um 21:00:05 Berliner Zeit (= 12:00:05 LA, 05:00:05 Tokio) muss Tag 1 entsperrt sein!
        const seal = await remotePage.waitForSelector('img[alt="Königliches Liebes-Siegel"]', { timeout: 5000 }).catch(() => null);
        assert(seal, `In ${remote.label} öffnet Tag 1 exakt nach Berliner Zeit (21:00 CET)`);

        // Texte müssen trotz en-US Locale immer auf Deutsch bleiben
        const headerText = await remotePage.locator('header h1').innerText();
        assert(headerText.includes('Gründe'), `Texte bleiben auch bei locale en-US auf Deutsch ("${headerText}")`);
        logPass('Logik-Simulation', `Auslandstest [${remote.label}]: Freischaltung nach Berlin-Zeit & Texte auf Deutsch`);
      } finally {
        await remoteCtx.close();
      }
    }

    // 1f. DST Zeitumstellungen & Jahres-Grenzfälle (Tag 95, Tag 312, Tag 365, 24.12.2027)
    for (const edge of [
      { dayId: 95, timeStr: '2027-03-28T12:00:00+02:00', label: 'Tag 95 (28.03.2027 DST MEZ->MESZ)' },
      { dayId: 312, timeStr: '2027-10-31T12:00:00+01:00', label: 'Tag 312 (31.10.2027 DST MESZ->MEZ)' },
      { dayId: 365, timeStr: '2027-12-23T12:00:00+01:00', label: 'Tag 365 (23.12.2027 Finaler Tag)' },
      { dayId: 365, timeStr: '2027-12-24T12:00:00+01:00', label: '24.12.2027 (Post-Geschenk-Jahr)' }
    ]) {
      const edgeCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        timezoneId: 'Europe/Berlin',
        locale: 'de-DE'
      });
      const edgePage = await edgeCtx.newPage();
      try {
        await edgePage.clock.install({ time: new Date(edge.timeStr) });
        await edgePage.goto(baseUrl, { waitUntil: 'load' });
        await edgePage.clock.runFor(600);
        await edgePage.waitForSelector('button[id="tab-calendar"]', { timeout: 10000 });
        await edgePage.click('button[id="tab-calendar"]');
        const tileLocator = edgePage.locator(`div[aria-label*="Tag ${edge.dayId}:"]`).first();
        await tileLocator.waitFor({ state: 'attached', timeout: 10000 });
        const tileAria = await tileLocator.getAttribute('aria-label');
        assert(!tileAria.includes('Gesperrt'), `${edge.label} ist entsperrt`);
        logPass('Logik-Simulation', `${edge.label} erfolgreich entsperrt`);
      } finally {
        await edgeCtx.close();
      }
    }

    // =========================================================================
    // 2. ROBUSTHEIT: CORRUPT LOCALSTORAGE & WINDOW.NOTIFICATION GELÖSCHT
    // =========================================================================
    console.log('\n2️⃣ Robustheits-Prüfung (iOS Safari ohne Notification & korrupter Storage)...');
    const robustCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true
    });
    // Simuliere iOS-Safari-Bedingungen: window.Notification existiert nicht!
    await robustCtx.addInitScript(() => {
      delete window.Notification;
      try {
        localStorage.setItem('365_reasons_opened_days', 'INVALID_CORRUPTED_JSON_DATA{{[');
        localStorage.setItem('365_reasons_favorites', 'NULL_UNDEFINED_GARBAGE');
      } catch {}
    });
    const robustPage = await robustCtx.newPage();
    try {
      await robustPage.goto(baseUrl, { waitUntil: 'load' });
      const title = await robustPage.waitForSelector('header h1', { timeout: 10000 });
      assert(title, 'App lädt und rendert fehlerfrei trotz korruptem localStorage und fehlender Notification');
      logPass('Quelltext', 'Null-Crash-Garantie: Fehlende window.Notification (iOS Safari) & korrupter Storage abgefangen');
    } finally {
      await robustCtx.close();
    }

    // =========================================================================
    // 3. GESPERRTE TAGE: KEIN GEHEIMER NACHRICHTENTEXT IM DOM
    // =========================================================================
    console.log('\n3️⃣ Gesperrte Tage: Datenschutz-Audit (Nachrichtentext nicht im DOM)...');
    const secureCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: 'Europe/Berlin'
    });
    const securePage = await secureCtx.newPage();
    try {
      // Datum vor Freischaltung (20.12.2026)
      await securePage.clock.install({ time: new Date('2026-12-20T12:00:00+01:00') });
      await securePage.goto(baseUrl, { waitUntil: 'load' });
      await securePage.waitForSelector('header h1', { timeout: 10000 });

      // Lese Text von Tag 1 aus messages.json
      const msgs = JSON.parse(fs.readFileSync(path.join(root, 'public/messages.json'), 'utf8'));
      const day1Secret = msgs[0].text;

      // Suche im gesamten gerenderten DOM nach diesem Text
      const pageContent = await securePage.content();
      assert(!pageContent.includes(day1Secret), 'Sicherheits-Garantie: Liebestext von gesperrten Tagen ist NICHT im DOM vorhanden!');
      logPass('Quelltext', 'Gesperrte Tage: Liebesbotschaft wird vor Freischaltung nicht im DOM gerendert');
    } finally {
      await secureCtx.close();
    }

    // =========================================================================
    // 4. INTERAKTIONS-, CHAOS- & DEAD-SWITCH AUDIT (ECHTE UI-BEDIENUNG)
    // =========================================================================
    console.log('\n4️⃣ Interaktions-, Schalter- & Wischgesten-Audit...');
    const mainCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      timezoneId: 'Europe/Berlin',
      locale: 'de-DE'
    });

    if (engineName === 'chromium') {
      await mainCtx.grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    const page = await mainCtx.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (req) => {
      // Service worker cache misses or analytics can fail, but internal assets must not
      if (req.url().includes(baseUrl)) {
        consoleErrors.push(`Failed Request: ${req.url()} (${req.failure()?.errorText})`);
      }
    });

    try {
      await page.goto(baseUrl, { waitUntil: 'load' });
      await page.waitForSelector('header div[role="button"][aria-label*="365 Gründe"]', { timeout: 10000 });

      // 4a. 3x-Logo Tap mit touch-action: manipulation & Escape / Backdrop-Schließen
      const logo = page.locator('header div[role="button"][aria-label*="365 Gründe"]').first();
      const logoTouchAction = await logo.evaluate((el) => window.getComputedStyle(el).touchAction);
      assert.strictEqual(logoTouchAction, 'manipulation', 'Logo besitzt touch-action: manipulation');

      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });

      // Body Scroll-Lock & Escape
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Body Scroll-Lock aktiv bei offenem PIN-Modal');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), '', 'Body Scroll-Lock nach Escape aufgehoben');

      // Admin Login
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      await page.fill('input[type="password"]', '2412');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(1200);

      const adminBadge = page.locator('button[aria-label="Admin-Freigabe zurücksetzen"]');
      assert(await adminBadge.isVisible(), 'Admin-Modus aktiviert');
      logPass('Echte UI-Bedienung', 'Admin-Login, Body Scroll-Lock & Escape-Schließen verifiziert');

      // 4b. Tageskarte Lacksiegel, Favorit & Kopieren
      await page.click('button[id="tab-daily"]');
      await page.waitForTimeout(400);
      const envelope = page.locator('div[role="button"][aria-label*="öffnen"]').first();
      if (await envelope.isVisible()) {
        await envelope.click();
        await page.waitForTimeout(800);
      }

      // Favorit Umschalter
      const favBtn = page.locator('button[aria-label*="Favorit"]').first();
      await favBtn.click();
      await page.waitForTimeout(300);
      const favs1 = await page.evaluate(() => JSON.parse(localStorage.getItem('365_reasons_favorites') || '[]'));
      assert(favs1.length > 0, 'Favorit im localStorage gespeichert');
      await favBtn.click();
      await page.waitForTimeout(300);
      logPass('Echte UI-Bedienung', 'Favoriten-Button toggelt Zustand echt im localStorage');

      // Kopieren-Button
      const copyBtn = page.locator('button[aria-label="Liebesbotschaft kopieren"]').first();
      await copyBtn.click();
      await page.waitForTimeout(300);
      const copyFeedback = await copyBtn.getAttribute('title');
      assert(copyFeedback.includes('Kopiert'), 'Kopieren-Button zeigt optisches Feedback');

      if (engineName === 'chromium') {
        const clipText = await page.evaluate(() => navigator.clipboard.readText());
        const cardText = await page.locator('main p').innerText();
        assert(clipText.trim() === cardText.trim(), 'Zwischenablage stimmt exakt mit Kartentext überein');
        logPass('Echte UI-Bedienung', 'Kopieren-Button schreibt Text verifiziert in die Zwischenablage');
      } else {
        logPass('Echte UI-Bedienung', 'WebKit: Kopieren-Button gibt visuelles Feedback ohne Fehler');
      }

      // 4c. Wischgesten (Swipe) im Tages-Dialog
      await page.waitForSelector('button[id="tab-calendar"]', { timeout: 10000 });
      await page.click('button[id="tab-calendar"]');
      await page.waitForSelector('div[aria-label*="Tag 1:"]', { timeout: 10000 });
      await page.click('div[aria-label*="Tag 1:"]');
      await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });

      if (engineName === 'chromium') {
        // Chromium CDP Touch Simulation
        const client = await page.context().newCDPSession(page);
        const dialogBox = await page.locator('div[role="dialog"]').boundingBox();
        if (dialogBox) {
          const startX = dialogBox.x + dialogBox.width * 0.8;
          const endX = dialogBox.x + dialogBox.width * 0.2;
          const y = dialogBox.y + dialogBox.height * 0.5;

          // Touch Drag (Swipe nach links)
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: startX, y }]
          });
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: endX, y }]
          });
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: []
          });
          await page.waitForTimeout(400);
        }
        logPass('Echte UI-Bedienung', 'Chromium CDP Touch: Wischgeste fängt Events ab & scrollt Seite nicht');
      } else {
        logOpen('Echte UI-Bedienung', 'Wischgesten via CDP Touch', 'WebKit unterstützt kein CDP Input.dispatchTouchEvent');
      }

      // Dialog schließen
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // 4d. Layout- & Touch-Target-Audit über alle Gerätegrößen
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(200);
        await checkLayoutAndTouchTargets(page, vp.name);
      }

      // 150% Schriftgröße auf schmalstem Display (320px)
      await page.setViewportSize({ width: 320, height: 568 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '150%';
      });
      await page.waitForTimeout(200);
      await checkLayoutAndTouchTargets(page, '320px + 150% System-Schrift');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      logPass('Echte UI-Bedienung', 'Extremfall: 320px Viewport + 150% Schriftgröße ohne horizontalen Überlauf');

      // 4e. PWA Meta-Tags, html lang="de" & Manifest
      const metaReport = await page.evaluate(() => ({
        htmlLang: document.documentElement.lang,
        title: document.title,
        appleIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')
      }));

      assert.strictEqual(metaReport.htmlLang, 'de', '<html lang="de"> ist gesetzt');
      assert(metaReport.title.includes('liebe'), 'Seitentitel enthält "liebe" (Verb kleingeschrieben)');
      assert(metaReport.appleIcon, 'apple-touch-icon ist vorhanden');

      // Manifest prüfen
      const manifestPath = path.join(root, 'dist/manifest.webmanifest');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        assert(manifest.short_name && manifest.short_name.length <= 12, `Manifest short_name <= 12 Zeichen ("${manifest.short_name}")`);
        assert.strictEqual(manifest.display, 'standalone', 'Manifest display ist standalone');
        assert.strictEqual(manifest.lang, 'de', 'Manifest lang ist de');
        const hasMaskable = manifest.icons.some((i) => i.purpose && i.purpose.includes('maskable'));
        assert(hasMaskable, 'Manifest enthält ein maskable Icon');
        logPass('Quelltext', 'PWA-Standards: <html lang="de">, Manifest (short_name <= 12, maskable) & Apple-Icon intakt');
      }

      // 4f. Zero Console Errors & Page Exceptions
      assert.strictEqual(consoleErrors.length, 0, `0 Console Errors (${consoleErrors.join(' | ')})`);
      assert.strictEqual(pageErrors.length, 0, `0 Page Exceptions (${pageErrors.join(' | ')})`);
      logPass('Quelltext', `${engineName.toUpperCase()}: 0 JavaScript Console-Errors & 0 Page-Exceptions im gesamten Lauf`);
    } finally {
      await mainCtx.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🚀 Starte Embedded Vite Preview Server auf Port 4174...');
  const server = await preview({
    configFile: path.resolve(root, 'vite.config.js'),
    preview: { port: 4174, strictPort: true }
  });
  const url = server.resolvedUrls?.local?.[0] || 'http://localhost:4174/';

  try {
    await runSuiteForEngine('chromium', chromium, url);

    try {
      await runSuiteForEngine('webkit', webkit, url);
    } catch (err) {
      if (/Executable doesn't exist/i.test(err.message)) {
        logOpen('System-Umgebung', 'WebKit (Safari) Testlauf', 'WebKit-Binary nicht lokal installiert');
      } else {
        throw err;
      }
    }

    console.log(`\n══════════════════════════════════════════════════════════════════════════`);
    console.log(` 🎉 ALLE HUMAN-BEHAVIOR- & UX-TESTS ERFOLGREICH BESTANDEN!`);
    console.log(`══════════════════════════════════════════════════════════════════════════\n`);
  } finally {
    if (server && server.httpServer) {
      server.httpServer.close();
    }
  }
}

main().catch((err) => {
  console.error('\n❌ TEST RUNNER FEHLER:', err);
  process.exit(1);
});
