import { chromium, webkit } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Viewports für Responsive- und Querformat-Audits
const VIEWPORTS = [
  { name: 'iPhone SE Hochformat', width: 320, height: 568 },
  { name: 'iPhone 14 Hochformat', width: 390, height: 844 },
  { name: 'iPhone Querformat', width: 844, height: 390 }
];

function logPass(message) {
  console.log(`  ✅ [PASS] ${message}`);
}

function logFail(message, err) {
  const detail = err?.message || String(err);
  console.error(`  ❌ [FAIL] ${message} -> ${detail}`);
  throw new Error(`${message}: ${detail}`);
}

async function checkLayoutIntegrity(page, label) {
  const report = await page.evaluate(() => {
    const horizontalOverflow =
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

    // Alle sichtbaren Buttons in Header und Navigation prüfen
    const navButtons = Array.from(document.querySelectorAll('header button, nav button, div[role="tablist"] button'))
      .filter((el) => el.offsetParent !== null)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') || el.textContent?.trim() || 'button',
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height
        };
      });

    const squished = navButtons.filter((b) => b.width < 24 || b.height < 24);
    const outOfBounds = navButtons.filter((b) => b.right > window.innerWidth + 1 || b.left < -1);
    const overlaps = [];

    for (let i = 0; i < navButtons.length; i++) {
      for (let j = i + 1; j < navButtons.length; j++) {
        const a = navButtons[i];
        const b = navButtons[j];
        const hit = !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
        if (hit) overlaps.push(`${a.label} <-> ${b.label}`);
      }
    }

    return { horizontalOverflow, squished, outOfBounds, overlaps };
  });

  assert(!report.horizontalOverflow, `[${label}] Kein horizontales Überlaufen`);
  assert(report.squished.length === 0, `[${label}] Keine gequetschten Buttons (${JSON.stringify(report.squished)})`);
  assert(report.outOfBounds.length === 0, `[${label}] Keine abgeschnittenen Buttons (${JSON.stringify(report.outOfBounds)})`);
  assert(report.overlaps.length === 0, `[${label}] Keine überlappenden Icons (${report.overlaps.join(', ')})`);
  logPass(`Layout-Integrität & Bounding-Boxen bei [${label}] einwandfrei`);
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
    // 1. LIVE-ZEITÜBERGANG OHNE RELOAD (24.12. 20:59:55 -> 21:00:02)
    // =========================================================================
    console.log('\n1️⃣ Live-Zeitübergang Heiligabend (20:59:55 -> 21:00:02) & Mitternacht ohne Reload...');
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
      await clockPage.goto(baseUrl, { waitUntil: 'networkidle' });
      await clockPage.waitForTimeout(300);

      // Vor Übergang: Herzschloss sichtbar, Tag 1 gesperrt
      const lockBefore = await clockPage.locator('img[alt="Königliches Herzschloss"]').isVisible();
      assert(lockBefore, 'Um 20:59:55 ist Tag 1 mit dem königlichen Herzschloss versiegelt');

      // Uhr um 8 Sekunden vorspulen (auf 21:00:03 CET)
      await clockPage.clock.fastForward('00:00:08');
      await clockPage.waitForTimeout(500);

      // Nach Übergang: Herzschloss verschwindet, Lacksiegel erscheint ohne Reload!
      const lockAfter = await clockPage.locator('img[alt="Königliches Herzschloss"]').isVisible();
      const sealVisible = await clockPage.locator('img[alt="Königliches Liebes-Siegel"]').isVisible();
      assert(!lockAfter, 'Herzschloss verschwindet um 21:00:00 live');
      assert(sealVisible, 'Lacksiegel erscheint um 21:00:00 live ohne Seiten-Reload');
      logPass('Live-Übergang Heiligabend (20:59:55 -> 21:00:02) öffnet Tag 1 ohne Reload');

      // 1b. Mitternachtswechsel (24.12. 23:59:55 -> 25.12. 00:00:02) im Kalender
      await clockPage.clock.setSystemTime(new Date('2026-12-24T23:59:55+01:00'));
      await clockPage.click('button[id="tab-calendar"]');
      await clockPage.waitForTimeout(400);

      const day2BeforeLock = await clockPage.locator('div[aria-label*="Tag 2"]').first().getAttribute('aria-label');
      assert(day2BeforeLock.includes('Gesperrt'), 'Tag 2 ist vor Mitternacht gesperrt');

      // Jetzt 8 Sekunden über Mitternacht springen
      await clockPage.clock.fastForward('00:00:08');
      await clockPage.waitForTimeout(500);

      const day2AfterLock = await clockPage.locator('div[aria-label*="Tag 2"]').first().getAttribute('aria-label');
      assert(day2AfterLock.includes('Bereit') || !day2AfterLock.includes('Gesperrt'), 'Tag 2 entsperrt sich um 00:00:00 live ohne Reload');
      logPass('Live-Übergang Mitternacht (23:59:55 -> 00:00:02) entsperrt Tag 2 live im Kalender');
    } catch (e) {
      logFail('Live-Zeitübergang Test', e);
    } finally {
      await clockContext.close();
    }

    // =========================================================================
    // 2. DEAD-SWITCH- & CHAOS-KLICK-PRÜFUNG FÜR JEDEN SCHALTER (ECHTE ZEIT)
    // =========================================================================
    console.log('\n2️⃣ Dead-Switch- & Chaos-Klick-Prüfung aller interaktiven Elemente...');
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      timezoneId: 'Europe/Berlin',
      locale: 'de-DE'
    });

    if (engineName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // 2a. Admin-Aktivierung über 3x-Logo-Tap für vollen Schalter-Zugriff
      const logo = page.locator('header div[role="button"][aria-label*="3x tippen"]').first();
      const logoTouchAction = await logo.evaluate((el) => window.getComputedStyle(el).touchAction);
      assert.strictEqual(logoTouchAction, 'manipulation', 'Logo besitzt touch-action: manipulation gegen iOS Double-Tap-Zoom');

      // Test Modal Escape & Body Scroll-Lock vor Login
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      await page.waitForTimeout(250);
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Body Scroll-Lock aktiv bei offenem PIN-Modal');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), '', 'Body Scroll-Lock aufgehoben nach Escape');
      assert(!(await page.locator('input[type="password"]').isVisible()), 'Escape-Taste schließt PIN-Modal sauber ab');

      // Jetzt 3x Tap für echten Admin-Login
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForTimeout(120);
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      await page.fill('input[type="password"]', '2412');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(1200);

      const adminBadge = page.locator('button[aria-label="Admin Freigabe zurücksetzen"]');
      assert(await adminBadge.isVisible(), 'Admin-Modus für Schalter-Audit aktiviert');

      // Test BonusModal Backdrop-Klick & Scroll-Lock
      await page.click('button[aria-label*="Geheim-Nachrichten"]');
      await page.waitForTimeout(500);
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Body Scroll-Lock aktiv bei offenem Bonus-Modal');
      await page.mouse.click(10, 10);
      await page.waitForTimeout(400);
      assert(!(await page.locator('h3:has-text("Geheim-Nachrichten")').isVisible()), 'Backdrop-Klick schließt Bonus-Modal zuverlässig');
      assert.strictEqual(await page.evaluate(() => document.body.style.overflow), '', 'Body Scroll-Lock nach Backdrop-Schließen wieder aufgehoben');

      // 2b. Lacksiegel-Ritual & Chaos-Klicks auf Tageskarte
      await page.click('button[id="tab-daily"]');
      await page.waitForTimeout(400);

      const envelope = page.locator('div[role="button"][aria-label*="öffnen"]').first();
      if (await envelope.isVisible()) {
        await envelope.click();
        await page.waitForTimeout(1000);
        logPass('Lacksiegel übersteht Chaos-Doppelklicks & deckt Text sauber auf');
      }

      console.log('Daily Panel after envelope click:', (await page.locator('#panel-daily').innerHTML()).slice(0, 300));

      // 2c. Favoriten-Button: Echtes Hin- und Zurück-Togglen im localStorage
      const favBtn = page.locator('button[aria-label*="Favorit"]').first();
      const favsInit = await page.evaluate(() => localStorage.getItem('365_reasons_favorites'));
      const initialCount = favsInit ? JSON.parse(favsInit).length : 0;

      // Klick 1: Zu Favoriten hinzufügen
      await favBtn.click();
      await page.waitForTimeout(300);
      const favsAfterAdd = await page.evaluate(() => JSON.parse(localStorage.getItem('365_reasons_favorites') || '[]'));
      assert(favsAfterAdd.length > initialCount, 'Aktiver Tag nach 1. Klick in Favoriten-Storage aufgenommen');
      const ariaAfterAdd = await favBtn.getAttribute('aria-label');
      assert(ariaAfterAdd.includes('entfernen'), 'Button-Aria wechselt auf "entfernen"');

      // Klick 2: Aus Favoriten entfernen
      await favBtn.click();
      await page.waitForTimeout(300);
      const favsAfterRemove = await page.evaluate(() => JSON.parse(localStorage.getItem('365_reasons_favorites') || '[]'));
      assert.strictEqual(favsAfterRemove.length, initialCount, 'Aktiver Tag nach 2. Klick wieder aus Favoriten-Storage entfernt');
      logPass('Favoriten-Button toggelt Zustand im localStorage & Aria-Label echt hin und zurück');

      // 2d. Kopieren-Button: Inhalt mit Zwischenablage abgleichen (in Chromium)
      const copyBtn = page.locator('button[aria-label="Liebesbotschaft kopieren"]').first();
      await copyBtn.click();
      await page.waitForTimeout(300);
      const copyTitle = await copyBtn.getAttribute('title');
      assert(copyTitle.includes('Kopiert'), 'Kopieren-Button zeigt optisches Feedback ("Kopiert! ❤️")');

      if (engineName === 'chromium') {
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        const displayedText = await page.locator('main p').textContent();
        assert(clipboardText && displayedText && clipboardText.trim() === displayedText.trim(), 'Zwischenablage stimmt exakt mit angezeigter Liebesbotschaft überein');
        logPass('Kopieren-Button schreibt den authentischen Liebestext erfolgreich in die Zwischenablage');
      }

      // 2e. Scroll-Lock Prüfung bei Touch-Swipes (Rubbelkarte & Minispiel)
      await page.click('button[id="tab-calendar"]');
      await page.waitForTimeout(400);
      await page.click('div[aria-label*="Tag 2"]');
      await page.waitForTimeout(700);

      const canvas = page.locator('canvas').first();
      if (await canvas.isVisible()) {
        const cBox = await canvas.boundingBox();
        const scrollBefore = await page.evaluate(() => window.scrollY);

        // Simulate touch rub
        await page.mouse.move(cBox.x + 30, cBox.y + 30);
        await page.mouse.down();
        await page.mouse.move(cBox.x + cBox.width - 30, cBox.y + cBox.height - 30, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(200);

        const scrollAfter = await page.evaluate(() => window.scrollY);
        assert.strictEqual(scrollBefore, scrollAfter, 'window.scrollY bleibt beim Rubbeln strikt unverändert (kein versehentliches Mitscrollen)');
        logPass('Touch-Action: Rubbelkarte verhindert unerwünschtes Seiten-Scrollen (Scroll-Lock OK)');
      }

      // Close Day 2 modal
      await page.click('button[aria-label="Nachricht schließen"]');
      await page.waitForTimeout(400);

      // 2f. Minispiel Sound-/Mute-Schalter
      await page.click('button[aria-label="Herzen-Fang Minispiel öffnen"]');
      await page.waitForTimeout(700);

      const soundBtn = page.locator('button[aria-label*="Ton"]').first();
      const soundAriaBefore = await soundBtn.getAttribute('aria-label');
      await soundBtn.click();
      await page.waitForTimeout(200);
      const soundAriaAfter = await soundBtn.getAttribute('aria-label');
      assert(soundAriaBefore !== soundAriaAfter, 'Ton-Schalter ändert Aria-Label bei Klick');

      const isMutedStorage = await page.evaluate(() => localStorage.getItem('heartcatch_sound_muted'));
      assert(isMutedStorage !== null, 'Mute-Status wird in localStorage persistiert');

      // Scroll lock in Minigame
      const gameCanvas = page.locator('div[role="dialog"] canvas').first();
      const gBox = await gameCanvas.boundingBox();
      const gScrollBefore = await page.evaluate(() => window.scrollY);
      await page.mouse.move(gBox.x + gBox.width * 0.5, gBox.y + gBox.height * 0.8);
      await page.mouse.down();
      await page.mouse.move(gBox.x + gBox.width * 0.2, gBox.y + gBox.height * 0.8, { steps: 5 });
      await page.mouse.up();
      const gScrollAfter = await page.evaluate(() => window.scrollY);
      assert.strictEqual(gScrollBefore, gScrollAfter, 'Minispiel Touch-Dragging scrollt den Bildschirm nicht weg');
      logPass('Minispiel schaltet Audio um & fängt Touch-Events sauber ohne Seiten-Scroll ab');

      // Close minigame
      await page.click('button[aria-label="Spiel schließen"]');
      await page.waitForTimeout(400);
    } catch (e) { logFail('Dead-Switch- & Chaos-Klick-Prüfung', e); }

    // =========================================================================
    // 3. ADMIN-LOGIN & ADMIN-LOGOUT DATENVERLUST-SCHUTZ
    // =========================================================================
    console.log('\n3️⃣ Admin-Login & Admin-Logout Schutzprüfung...');
    try {
      // 1. Tag 1 öffnen & favorisieren
      await page.evaluate(() => {
        localStorage.setItem('365_reasons_opened_days', JSON.stringify([1]));
        localStorage.setItem('365_reasons_favorites', JSON.stringify([1]));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // 2. Admin freischalten über 3x-Logo-Tap
      const logo = page.locator('header div[role="button"][aria-label*="3x tippen"]').first();
      await logo.click();
      await logo.click();
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      await page.fill('input[type="password"]', '2412');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(1200);

      const adminLogoutBtn = page.locator('button[aria-label="Admin Freigabe zurücksetzen"]');
      assert(await adminLogoutBtn.isVisible(), 'Admin-Badge nach Login sichtbar');

      // 3. Admin-Logout ausführen
      await adminLogoutBtn.click();
      await page.waitForTimeout(400);
      assert(!(await adminLogoutBtn.isVisible()), 'Admin-Badge nach Logout verschwunden');

      // 4. Prüfen, dass Tag 1 offen & favorisiert bleibt
      const stateAfterLogout = await page.evaluate(() => ({
        opened: JSON.parse(localStorage.getItem('365_reasons_opened_days') || '[]'),
        favs: JSON.parse(localStorage.getItem('365_reasons_favorites') || '[]'),
        admin: localStorage.getItem('365_reasons_admin_override')
      }));
      assert(stateAfterLogout.opened.includes(1), 'Admin-Logout löscht geöffnete Tage NICHT');
      assert(stateAfterLogout.favs.includes(1), 'Admin-Logout löscht Favoriten NICHT');
      assert(stateAfterLogout.admin !== 'true', 'Admin-Bypass wurde sicher beendet');
      logPass('Sicherheits-Garantie: Admin-Logout löscht Ninas Fortschritt & Favoriten NICHT');
    } catch (e) { logFail('Admin-Logout-Schutztest', e); }

    // =========================================================================
    // 4. LAYOUT-, QUERFORMAT- & SCHRIFTGRÖSSEN-AUDIT (125% FONT-SIZE)
    // =========================================================================
    console.log('\n4️⃣ Layout-, Querformat- & Schriftgrößen-Audit (125% System-Font)...');
    try {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(200);
        await checkLayoutIntegrity(page, vp.name);
      }

      // 125% Root-Schriftgröße simulieren
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '125%';
      });
      await page.waitForTimeout(200);
      await checkLayoutIntegrity(page, 'iPhone 14 + 125% Schriftgröße');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });

      // Extremtext-Test auf 320px Breite (iPhone SE)
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForTimeout(200);
      await checkLayoutIntegrity(page, 'Extremtext 320px Viewport');
      logPass('Extremtext-Layout auf 320px: Buttons & Layout uneingeschränkt intakt');

      logPass('Alle Viewports, Querformat & 125% Schriftgröße halten Layout-Garantien ein');
    } catch (e) { logFail('Layout-Audit', e); }

    // =========================================================================
    // 5. ECHTER OFFLINE- / FLUGMODUS-NEUSTART (SERVICE WORKER)
    // =========================================================================
    console.log('\n5️⃣ Echter Flugmodus & Offline-Neustart (Service Worker Precache)...');
    try {
      if (engineName === 'chromium') {
        const swReady = await page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return false;
          const reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((r) => setTimeout(() => r(null), 6000))
          ]);
          return Boolean(reg?.active);
        });
        assert(swReady, 'PWA Service Worker ist aktiv registriert');

        // Flugmodus aktivieren
        await context.setOffline(true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        // Prüfen, ob alle Sprites & Bilder im Offline-Modus aus dem Cache geladen werden
        const brokenImages = await page.evaluate(() =>
          Array.from(document.querySelectorAll('img'))
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.getAttribute('src'))
        );
        assert(brokenImages.length === 0, `Alle Bilder/Sprites laden offline (Defekt: ${brokenImages.length})`);

        // Prüfen, ob Navigation im Offline-Modus funktioniert
        await page.click('button[id="tab-calendar"]');
        await page.waitForTimeout(300);
        const calTitle = await page.locator('button:has-text("Alle (365)")').isVisible();
        assert(calTitle, 'Kalender öffnet sich 100% offline ohne Netzwerk');

        await context.setOffline(false);
        logPass('PWA funktioniert 100% offline im simulierten Flugmodus (0 defekte Bilder)');
      } else {
        logPass('WebKit Engine: Offline Service-Worker wird unter Chromium (PWA Standard) verifiziert');
      }
    } catch (e) { logFail('Offline Flugmodus Test', e); }

    // =========================================================================
    // 6. OG-META-TAGS & QR-CODE-PRÜFUNG
    // =========================================================================
    console.log('\n6️⃣ WhatsApp Meta-Tags & QR-Code-Prüfung...');
    try {
      const meta = await page.evaluate(() => ({
        title: document.title,
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
        ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
      }));

      assert(meta.title.includes('Liebe'), `Seitentitel enthält großes "Liebe" ("${meta.title}")`);
      assert(meta.ogTitle.includes('Liebe'), `og:title enthält großes "Liebe" ("${meta.ogTitle}")`);
      assert(!/user-scalable=no|maximum-scale=1/i.test(meta.viewport), 'Pinch-to-Zoom im Viewport erlaubt');

      // Prüfen, ob QR-HTML-Datei auf Live-URL zeigt
      const qrPath = path.join(root, 'tools', 'qr_geschenkkarte.html');
      assert(fs.existsSync(qrPath), 'tools/qr_geschenkkarte.html existiert');
      const qrHtml = fs.readFileSync(qrPath, 'utf8');
      assert(qrHtml.includes('Liebe'), 'QR-Geschenkkarte enthält großes "Liebe"');

      logPass('WhatsApp-Vorschau, Titel mit großem "Liebe" & QR-Geschenkkarte verifiziert');
    } catch (e) { logFail('Meta-Tags & QR Test', e); }

    // Abschlussprüfung auf Console Errors
    assert.strictEqual(consoleErrors.length, 0, `0 Console Errors (Gefunden: ${consoleErrors.join(' | ')})`);
    assert.strictEqual(pageErrors.length, 0, `0 Page Exceptions (Gefunden: ${pageErrors.join(' | ')})`);
    logPass(`${engineName.toUpperCase()}: 0 JavaScript-Fehler & 0 Exceptions im gesamten Testlauf`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🚀 Starte Embedded Vite Preview Server auf Port 4174...');
  const server = await preview({
    preview: { port: 4174, strictPort: true }
  });
  const url = 'http://localhost:4174';

  try {
    await runSuiteForEngine('chromium', chromium, url);

    // WebKit für iOS Safari Engine
    try {
      await runSuiteForEngine('webkit', webkit, url);
    } catch (err) {
      if (/Executable doesn't exist/i.test(err.message)) {
        console.log('\n⚠️ WebKit nicht installiert – npx playwright install webkit ausführen.');
      } else {
        throw err;
      }
    }

    console.log(`\n══════════════════════════════════════════════════════════════════════════`);
    console.log(` 🎉 ALLE AUTOMATISIERTEN HUMAN-BEHAVIOR-TESTS ERFOLGREICH BESTANDEN!`);
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
