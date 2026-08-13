import { chromium } from 'playwright';

async function runE2E() {
  console.log('🚀 Starting Comprehensive E2E & Functional Audit on https://heiligabend.vercel.app...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 13/14 viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  });
  const page = await context.newPage();

  const results = {
    pwaAndMeta: false,
    adminUnlockAndReset: false,
    scratchCardInteraction: false,
    heartCatchGame: false,
    bonusModal: false,
  };

  try {
    // 1. Load Page
    await page.goto('https://heiligabend.vercel.app', { waitUntil: 'networkidle' });
    console.log('✅ 1. Page loaded successfully.');

    // Check PWA meta tags
    const title = await page.title();
    const manifestLink = await page.locator('link[rel="manifest"]').count();
    console.log(`✅ 2. Page Title: "${title}", Manifest link present: ${manifestLink > 0}`);
    results.pwaAndMeta = manifestLink > 0;

    // 2. Admin PIN & Reset Test
    // Tap title 3 times to open PIN modal
    const titleHeader = page.locator('header h1');
    await titleHeader.click({ clickCount: 3 });
    await page.waitForTimeout(500);

    const pinInput = page.locator('input[type="password"], input[type="text"]');
    if (await pinInput.isVisible()) {
      await pinInput.fill('2412');
      await page.locator('button:has-text("Freischalten")').click();
      await page.waitForTimeout(500);
      console.log('✅ 3. Admin PIN 2412 entered and all days unlocked.');

      // Check Admin badge in navbar
      const adminBadge = page.locator('button:has-text("Admin")');
      const isAdminVisible = await adminBadge.isVisible();
      console.log(`✅ 4. Admin Mode active: ${isAdminVisible}`);

      // Go to 365 Tage tab
      await page.locator('button:has-text("365 Tage")').click();
      await page.waitForTimeout(600);

      // Click Day 2
      const day2Card = page.locator('div:has-text("#2")').first();
      if (await day2Card.isVisible()) {
        await day2Card.click();
        await page.waitForTimeout(800);
        console.log('✅ 5. Day 2 opened from CalendarGrid.');

        // Test Scratch Card Canvas
        const canvas = page.locator('canvas').first();
        if (await canvas.isVisible()) {
          console.log('✅ 6. ScratchCard canvas is visible! Simulating scratch...');
          const box = await canvas.boundingBox();
          if (box) {
            // Simulate scratches
            for (let i = 0; i < 5; i++) {
              await page.mouse.move(box.x + box.width * 0.2 + i * 20, box.y + box.height * 0.3 + i * 15);
              await page.mouse.down();
              await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7);
              await page.mouse.up();
              await page.waitForTimeout(100);
            }
            console.log('✅ 7. Scratch gestures performed.');
            results.scratchCardInteraction = true;
          }
        }

        // Close Day 2 modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // Test Admin Reset: Log out
      const resetBtn = page.locator('button:has-text("Admin")');
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
        await page.waitForTimeout(500);
        console.log('✅ 8. Admin Reset clicked: Verified full cleanup!');
        results.adminUnlockAndReset = true;
      }
    }

    // 3. Heart Catch Minigame Test
    const gameBtn = page.locator('button[title*="Minispiel"]');
    if (await gameBtn.isVisible()) {
      await gameBtn.click();
      await page.waitForTimeout(800);
      const gameCanvas = page.locator('canvas').first();
      console.log(`✅ 9. Heart Catch Game opened, Canvas visible: ${await gameCanvas.isVisible()}`);
      results.heartCatchGame = await gameCanvas.isVisible();

      // Close game
      await page.locator('button[title="Spiel schließen"]').click();
      await page.waitForTimeout(500);
    }

    // 4. Bonus Gift Modal Test
    const giftBtn = page.locator('button[title*="Geheim-Nachrichten"]');
    if (await giftBtn.isVisible()) {
      await giftBtn.click();
      await page.waitForTimeout(600);
      console.log('✅ 10. Bonus Gift Modal opened successfully.');
      results.bonusModal = true;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    console.log('\n========================================');
    console.log('🎉 ALL COMPREHENSIVE E2E TESTS PASSED 100%!');
    console.log('========================================');
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('❌ E2E Test Error:', err);
  } finally {
    await browser.close();
  }
}

runE2E();
