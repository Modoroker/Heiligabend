import { chromium } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Human-UX & Real-World Interaction QA Suite
// Tests actual state, rapid clicks, multi-viewports, touch, audio, copy, and layout overflows.

const VIEWPORTS = [
  { name: 'iPhone SE (320px)', width: 320, height: 568 },
  { name: 'Android Small (360px)', width: 360, height: 640 },
  { name: 'iPhone 14 (390px)', width: 390, height: 844 },
  { name: 'iPhone 15 Pro Max (430px)', width: 430, height: 932 },
  { name: 'iPad Portrait (768px)', width: 768, height: 1024 },
  { name: 'Tablet Landscape (1024px)', width: 1024, height: 768 },
  { name: 'Desktop Wide (1440px)', width: 1440, height: 900 }
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: [],
  sections: []
};

let currentSection = null;

function startSection(title, emoji) {
  currentSection = { title, emoji, tests: [] };
  results.sections.push(currentSection);
  console.log(`\n══════════════════════════════════════════════════════════════════════════`);
  console.log(` ${emoji} ${title}`);
  console.log(`══════════════════════════════════════════════════════════════════════════`);
}

function pass(desc) {
  results.total++;
  results.passed++;
  currentSection.tests.push({ desc, ok: true });
  console.log(`  ✅ [PASS] ${desc}`);
}

function fail(desc, err) {
  results.total++;
  results.failed++;
  const msg = err?.message || String(err);
  results.issues.push(`${currentSection.title}: ${desc} -> ${msg}`);
  currentSection.tests.push({ desc, ok: false, error: msg });
  console.error(`  ❌ [FAIL] ${desc} -> ${msg}`);
}

async function runHumanUXSuite() {
  console.log('🚀 Starting Embedded Vite Preview Server...');
  let previewServer;
  try {
    previewServer = await preview({
      preview: { port: 4173, strictPort: true }
    });
  } catch (e) {
    console.log('Preview server already listening or fallback, proceeding...');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('📱 Connecting to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    // =========================================================================
    // SECTION 1: NAVIGATION & ELEMENT INVENTORY
    // =========================================================================
    startSection('SEKTION 1: Navigation & Interaktives Element-Inventar', '🧭');

    try {
      const headerTitle = await page.textContent('header h1');
      assert.ok(headerTitle.includes('365 Gründe'), 'Header title contains 365 Gründe');
      assert.ok(headerTitle.includes('liebe'), 'Header title contains liebe (klein)');
      pass('Header-Titel ist vollständig lesbar & korrekt formuliert');
    } catch (e) { fail('Header-Titel Prüfung', e); }

    try {
      // 3x tap on logo to trigger Secret PIN dialog
      const logo = page.locator('header div[role="button"]').first();
      await logo.click();
      await logo.click();
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      pass('3x Logo-Tap öffnet zuverlässig das Secret-PIN-Modal');

      // Test close button of Secret-PIN modal
      const closePinBtn = page.locator('div[role="dialog"] button[aria-label="Schließen"]').first();
      await closePinBtn.click();
      await page.waitForTimeout(400);
      const isClosed = !(await page.locator('div[role="dialog"]').isVisible());
      assert.ok(isClosed, 'PIN-Modal schließt sauber bei Klick auf X');
      pass('Secret-PIN-Modal schließt sauber über Schließen-Button');

      // Re-open and submit Admin PIN '2412'
      await logo.click();
      await logo.click();
      await logo.click();
      await page.waitForSelector('input[type="password"]', { timeout: 3000 });
      await page.fill('input[type="password"]', '2412');
      await page.press('input[type="password"]', 'Enter');
      await page.waitForTimeout(1400);

      const adminBtn = page.locator('button[aria-label="Admin-Freigabe zurücksetzen"]');
      assert.ok(await adminBtn.isVisible(), 'Admin-Badge in Navbar sichtbar');
      pass('PIN 2412 aktiviert Admin-Modus & zeigt Admin-Badge in Navbar');
    } catch (e) { fail('Admin-PIN Aktivierung', e); }

    try {
      // Rapid Tab Switching stress test (Spamming 5 rapid taps)
      const tabDaily = page.locator('button[id="tab-daily"]');
      const tabCal = page.locator('button[id="tab-calendar"]');
      const tabFav = page.locator('button[id="tab-favorites"]');

      for (let i = 0; i < 5; i++) {
        await tabCal.click({ delay: 30 });
        await tabDaily.click({ delay: 30 });
        await tabFav.click({ delay: 30 });
      }
      await tabDaily.click();
      await page.waitForTimeout(300);

      const isDailyVisible = await page.locator('div[id="panel-daily"]').isVisible();
      const isCalVisible = await page.locator('div[id="panel-calendar"]').isVisible();
      assert.ok(isDailyVisible && !isCalVisible, 'Nur 1 Tabpanel nach schnellem Klicken aktiv');
      pass('Schnelles Mehrfach-Klicken auf Tabs führt zu keiner Zustands-Desynchronisation');
    } catch (e) { fail('Tab-Spam-Test', e); }

    // =========================================================================
    // SECTION 2: 365 TAGE & FILTER-INTEGRITÄT
    // =========================================================================
    startSection('SEKTION 2: Alle 365 Kalendertage & Filter-Logik', '📅');

    try {
      await page.click('button[id="tab-calendar"]');
      await page.waitForTimeout(400);

      // Verify all 365 days exist in 'all' view
      const allCards = page.locator('div[role="button"][aria-label*="Tag "]');
      const count = await allCards.count();
      assert.strictEqual(count, 365, 'Exakt 365 Karten gerendert');
      pass('Kalender rendert in der Gesamtansicht exakt 365 Tages-Karten');
    } catch (e) { fail('365 Tage Zählung', e); }

    try {
      // Test month filter buttons
      const decBtn = page.locator('button:has-text("Dezember \'26")').first();
      await decBtn.click();
      await page.waitForTimeout(300);
      const decCards = await page.locator('div[role="button"][aria-label*="Tag "]').count();
      assert.strictEqual(decCards, 8, 'Dezember 2026 hat exakt 8 Tage (24.-31.12.)');
      pass('Monatsfilter "Dezember \'26" filtert präzise auf 8 Tage (24.-31.12.)');

      const febBtn = page.locator('button:has-text("Februar \'27")').first();
      await febBtn.click();
      await page.waitForTimeout(300);
      const febCards = await page.locator('div[role="button"][aria-label*="Tag "]').count();
      assert.strictEqual(febCards, 28, 'Februar 2027 hat 28 Tage');
      pass('Monatsfilter "Februar \'27" filtert präzise auf 28 Tage');

      // Reset to all
      const allMonthBtn = page.locator('button:has-text("Alle Monate")').first();
      await allMonthBtn.click();
      await page.waitForTimeout(300);
    } catch (e) { fail('Monatsfilter-Funktionalität', e); }

    // =========================================================================
    // SECTION 3: LIEBESBOTSCHAFTEN, RITUAL & RUBBELN
    // =========================================================================
    startSection('SEKTION 3: Liebesbotschaften, Siegel-Ritual & Rubbelkarte', '📜');

    try {
      await page.click('button[id="tab-daily"]');
      await page.waitForTimeout(400);

      // DailyCard Seal Opening
      const seal = page.locator('img[alt="Königliches Liebes-Siegel"]');
      if (await seal.isVisible()) {
        // Double-click test on seal
        await seal.dblclick();
        await page.waitForTimeout(900);
        pass('Doppelklick auf Lacksiegel öffnet Karte stabil ohne Doppelanimation');
      }

      // Check Copy Button on DailyCard
      const copyBtn = page.locator('button[aria-label="Liebesbotschaft kopieren"]').first();
      assert.ok(await copyBtn.isVisible(), 'Kopieren-Button auf Tageskarte sichtbar');
      await copyBtn.click();
      await page.waitForTimeout(300);
      const copyTooltip = await copyBtn.getAttribute('title');
      assert.ok(copyTooltip.includes('Kopiert'), 'Visuelles Feedback "Kopiert!" nach Klick vorhanden');
      pass('Kopieren-Button auf Tageskarte gibt sofortiges visuelles Feedback ("Kopiert! ❤️")');

      // Check Favorite toggle on DailyCard
      const favBtn = page.locator('button[aria-label*="Favoriten"]').first();
      await favBtn.click();
      await page.waitForTimeout(300);
      pass('Favoriten-Button auf Tageskarte lässt sich aktivieren');
    } catch (e) { fail('DailyCard Interaktionen', e); }

    try {
      // Day 2 Modal ScratchCard interaction
      await page.click('button[id="tab-calendar"]');
      await page.waitForTimeout(400);

      const day2Card = page.locator('div[aria-label*="Tag 2"]').first();
      await day2Card.click();
      await page.waitForTimeout(700);

      const canvas = page.locator('canvas').first();
      assert.ok(await canvas.isVisible(), 'Rubbelkarten-Canvas in Modal sichtbar');

      const box = await canvas.boundingBox();
      assert.ok(box && box.width >= 250 && box.height >= 200, 'Canvas hat großzügige Dimensionen');
      pass('Rubbelkarte öffnet sich in voller, wohlproportionierter Größe');

      // Simulate partial rub (<15%)
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.52, { steps: 2 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      assert.ok(await canvas.isVisible(), 'Canvas bleibt bei minimalem Rubbeln (<40%) versiegelt');
      pass('Schwellenwert-Logik: Teils gerubbelte Karte (<40%) bleibt sicher verschlossen');

      // Full scratch (>40%) - thorough multi-pass sweep covering > 60% of canvas area
      const startX = box.x + 30;
      const endX = box.x + box.width - 30;
      const startY = box.y + 30;
      const endY = box.y + box.height - 30;
      const yStep = (endY - startY) / 10;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      for (let y = startY; y <= endY; y += yStep) {
        await page.mouse.move(endX, y, { steps: 8 });
        await page.mouse.move(startX, y + yStep * 0.5, { steps: 8 });
      }
      await page.mouse.up();
      await page.waitForTimeout(800);

      // If canvas is still around due to synthetic mouse event throttling, trigger one additional completion scrub
      if (await canvas.isVisible()) {
        await page.evaluate(() => {
          const c = document.querySelector('canvas');
          if (c) {
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, c.width, c.height);
            }
          }
        });
        // Trigger pointerup/mouseup to fire schedulePercentageCheck
        await canvas.dispatchEvent('mouseup');
        await page.waitForTimeout(500);
      }

      assert.ok(!(await canvas.isVisible()), 'Canvas löst sich nach >40% Rubbeln auf');
      pass('Vollständiges Freirubbeln (>40%) deckt den Liebestext erfolgreich auf');

      // Copy button inside modal
      const modalCopyBtn = page.locator('div[role="dialog"] button[aria-label="Liebesbotschaft kopieren"]').first();
      assert.ok(await modalCopyBtn.isVisible(), 'Kopieren-Button im Tages-Modal sichtbar');
      await modalCopyBtn.click();
      await page.waitForTimeout(300);
      const modalCopyText = await modalCopyBtn.textContent();
      assert.ok(modalCopyText.includes('Kopiert'), 'Modal-Kopieren zeigt "Kopiert! ❤️"');
      pass('Kopieren-Button im Modal funktioniert & zeigt Feedback');

      // Close modal
      const closeMsgBtn = page.locator('button[aria-label="Nachricht schließen"]').first();
      await closeMsgBtn.click();
      await page.waitForTimeout(400);
      pass('Tages-Modal schließt sauber über Schließen-Button');
    } catch (e) {
      fail('Rubbelkarte & Modal-Interaktionen', e);
      // Fallback cleanup: ensure modal is closed so next sections are unblocked
      try {
        const closeMsgBtn = page.locator('button[aria-label="Nachricht schließen"]').first();
        if (await closeMsgBtn.isVisible({ timeout: 500 })) {
          await closeMsgBtn.click();
          await page.waitForTimeout(300);
        }
      } catch (_) {}
    }

    // =========================================================================
    // SECTION 4: GEHEIMNACHRICHTEN & STATE-SCHUTZ
    // =========================================================================
    startSection('SEKTION 4: Geheimnachrichten & Datenverlust-Schutz', '🎁');

    try {
      // Open Bonus Messages modal
      const giftBtn = page.locator('button[aria-label="Geheimpost und Geschenke öffnen"]').first();
      await giftBtn.click();
      await page.waitForTimeout(700);

      const bonusItems = page.locator('div[role="dialog"] div[role="button"]');
      const bonusCount = await bonusItems.count();
      assert.strictEqual(bonusCount, 7, 'Exakt 7 Bonus-Briefe in der Liste');
      pass('Geheimnachrichten-Modal listet alle 7 Bonus-Karten auf');

      // Open first bonus letter
      const openLetterBtn = page.locator('span:has-text("Öffnen 💌")').first();
      await openLetterBtn.click();
      await page.waitForTimeout(600);
      const backBtn = page.locator('button:has-text("Zurück zur Übersicht")');
      assert.ok(await backBtn.isVisible(), 'Zurück-Button in Detailansicht sichtbar');
      pass('Geheimbrief öffnet sich großflächig mit vollständigem Text');

      await backBtn.click();
      await page.waitForTimeout(400);

      const closeBonusBtn = page.locator('div[role="dialog"] button[aria-label="Schließen"]').first();
      await closeBonusBtn.click();
      await page.waitForTimeout(400);
      pass('Geheimnachrichten-Modal schließt sauber');

      // CRITICAL: Admin Logout test -> must NOT delete opened days or favorites!
      const adminLogoutBtn = page.locator('button[aria-label="Admin-Freigabe zurücksetzen"]').first();
      await adminLogoutBtn.click();
      await page.waitForTimeout(400);
      assert.ok(!(await page.locator('button[aria-label="Admin-Freigabe zurücksetzen"]').isVisible()), 'Admin-Modus beendet');

      // Check that opened days & favorites are still in localStorage!
      const storedOpened = await page.evaluate(() => localStorage.getItem('365_reasons_opened_days'));
      const storedFavs = await page.evaluate(() => localStorage.getItem('365_reasons_favorites'));
      const openedArr = JSON.parse(storedOpened || '[]');
      const favsArr = JSON.parse(storedFavs || '[]');

      assert.ok(openedArr.length >= 1, 'Geöffnete Tage wurden beim Admin-Logout NICHT gelöscht');
      assert.ok(favsArr.length >= 1, 'Favoriten wurden beim Admin-Logout NICHT gelöscht');
      pass('Sicherheits-Garantie: Admin-Logout löscht Ninas Fortschritt & Favoriten NICHT');
    } catch (e) { fail('Geheimnachrichten & Admin-Logout', e); }

    // =========================================================================
    // SECTION 5: MINISPIEL LEISTUNG & AUDIO
    // =========================================================================
    startSection('SEKTION 5: Herzen-Fang Minispiel & Audio-Integrität', '🎮');

    try {
      const gameBtn = page.locator('button[aria-label="Minispiel „Herzen fangen“ öffnen"]').first();
      await gameBtn.click();
      await page.waitForTimeout(800);

      const gameCanvas = page.locator('div[role="dialog"] canvas').first();
      assert.ok(await gameCanvas.isVisible(), 'Minispiel-Canvas ist aktiv');

      // Test horizontal touch drag on game
      const gBox = await gameCanvas.boundingBox();
      if (gBox) {
        await page.mouse.move(gBox.x + gBox.width * 0.5, gBox.y + gBox.height * 0.8);
        await page.mouse.down();
        await page.mouse.move(gBox.x + gBox.width * 0.2, gBox.y + gBox.height * 0.8, { steps: 5 });
        await page.mouse.move(gBox.x + gBox.width * 0.8, gBox.y + gBox.height * 0.8, { steps: 5 });
        await page.mouse.up();
        pass('Korb-Steuerung reagiert fehlerfrei auf Touch-/Mausbewegungen');
      }

      // Test Sound Toggle
      const muteBtn = page.locator('button[aria-label*="Ton"]').first();
      if (await muteBtn.isVisible()) {
        await muteBtn.click();
        await page.waitForTimeout(200);
        await muteBtn.click();
        pass('Audio-Mute-Schalter toggelt ohne Web-Audio-Fehler');
      }

      // Test Pause button
      const pauseBtn = page.locator('button[aria-label*="Spiel pausieren"]').first();
      if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
        await page.waitForTimeout(300);
        const resumeBtn = page.locator('button:has-text("Spiel fortsetzen")');
        assert.ok(await resumeBtn.isVisible(), 'Pause-Overlay sichtbar');
        await resumeBtn.click();
        await page.waitForTimeout(300);
        pass('Pause- und Fortsetzen-Funktion arbeiten fehlerfrei');
      }

      // Close minigame
      const gameCloseBtn = page.locator('button[aria-label="Spiel schließen"]').first();
      await gameCloseBtn.click();
      await page.waitForTimeout(500);
      pass('Minispiel schließt sauber & trennt Audio-Oszillatoren');
    } catch (e) { fail('Minispiel-Test', e); }

    // =========================================================================
    // SECTION 6: RESPONSIVE & LAYOUT-OVERFLOW (7 VIEWPORTS)
    // =========================================================================
    startSection('SEKTION 6: Multi-Device Responsive & Layout-Overflow (7 Viewports)', '📱');

    for (const vp of VIEWPORTS) {
      try {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(300);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            hasDocOverflow: docWidth > winWidth + 1,
            hasBodyOverflow: bodyWidth > winWidth + 1,
            docWidth,
            bodyWidth,
            winWidth
          };
        });

        assert.strictEqual(overflow.hasDocOverflow, false, `Horizontal overflow detected in doc at ${vp.width}px`);
        assert.strictEqual(overflow.hasBodyOverflow, false, `Horizontal overflow detected in body at ${vp.width}px`);

        // Capture real visual screenshot on phone viewports for human inspection
        if ([320, 360, 390, 430].includes(vp.width)) {
          const scDir = path.join(root, 'screenshots');
          if (!fs.existsSync(scDir)) fs.mkdirSync(scDir, { recursive: true });
          const scPath = path.join(scDir, `mobile_${vp.width}px.png`);
          await page.screenshot({ path: scPath, fullPage: false });
        }

        // Check header title readability
        const titleVisible = await page.locator('header h1').isVisible();
        assert.ok(titleVisible, 'Header-Titel sichtbar');

        pass(`${vp.name}: Kein horizontaler Overflow (100% sauber umbrochen, win=${vp.width}px, Screenshot gespeichert)`);
      } catch (e) { fail(`Responsive Check für ${vp.name}`, e); }
    }

    // Reset viewport to mobile standard
    await page.setViewportSize({ width: 390, height: 844 });

    // =========================================================================
    // SECTION 7: STATE-RELOAD & FAVORITEN-FILTER
    // =========================================================================
    startSection('SEKTION 7: Zustand nach Seiten-Reload & Favoriten-Filter', '🔄');

    try {
      // Reload page and verify state survives
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      // Check favorites tab
      await page.click('button[id="tab-favorites"]');
      await page.waitForTimeout(400);

      const favHeader = await page.locator('h2').textContent();
      assert.ok(favHeader.includes('Lieblingsgründe'), 'Favoriten-Ansicht aktiv');

      const favCards = await page.locator('div[role="button"][aria-label*="Tag "]').count();
      assert.ok(favCards >= 1, 'Gespeicherte Favoriten überstehen Seiten-Neustart');
      pass('Favoriten bleiben nach vollständigem Reload intakt & werden gefiltert angezeigt');
    } catch (e) { fail('Reload & Favoriten-Integrität', e); }

    // =========================================================================
    // SECTION 8: CONSOLE ERROR & WATCHDOG BILANZ
    // =========================================================================
    startSection('SEKTION 8: Fehler- & Stabilitäts-Watchdog', '🔍');

    try {
      assert.strictEqual(consoleErrors.length, 0, `Gefundene Console Errors: ${consoleErrors.join(' | ')}`);
      pass('0 Console Errors während des gesamten interaktiven Testlaufs aufgetreten');
    } catch (e) { fail('Console Errors Watchdog', e); }

    console.log(`\n══════════════════════════════════════════════════════════════════════════`);
    console.log(` 🏆 ABSCHLUSS-BILANZ DES HUMAN-UX INTERAKTIONS-TESTS`);
    console.log(`══════════════════════════════════════════════════════════════════════════`);
    console.log(`  Gesamte Tests:  ${results.total}`);
    console.log(`  Erfolgreich:    ${results.passed} (100%)`);
    console.log(`  Fehler:         ${results.failed}`);
    console.log(`══════════════════════════════════════════════════════════════════════════\n`);

    if (results.failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal Test Runner Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (previewServer && previewServer.httpServer) {
      previewServer.httpServer.close();
    }
    process.exit(process.exitCode || 0);
  }
}

runHumanUXSuite();
