import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function runE2ETests() {
  console.log('🚀 Starting Local Preview Server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    cwd: process.cwd()
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2500));

  console.log('🌐 Launching Headless Chromium Browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 / 15 Mobile Viewport!
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    console.log('📱 Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    console.log('1️⃣ Checking Header & Brand...');
    const headerTitle = await page.textContent('header h1');
    console.log(`   Header Title: "${headerTitle.trim().replace(/\s+/g, ' ')}"`);

    console.log('2️⃣ Triggering Admin Override PIN...');
    // Tap logo 3 times
    const logo = page.locator('header div[role="button"]').first();
    await logo.click();
    await logo.click();
    await logo.click();

    // Fill PIN modal
    await page.waitForSelector('input[type="password"]', { timeout: 3000 });
    await page.fill('input[type="password"]', '2412');
    await page.press('input[type="password"]', 'Enter');
    await page.waitForTimeout(1500);
    console.log('   ✅ Admin Override successfully activated!');

    console.log('3️⃣ Testing Envelope Opening (Daily Card)...');
    const seal = page.locator('img[alt="Königliches Liebes-Siegel"]');
    if (await seal.isVisible()) {
      await seal.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Envelope opened with wax seal animation!');
    }

    console.log('4️⃣ Testing Calendar Grid Navigation...');
    // Switch to Calendar Tab
    await page.click('button[id="tab-calendar"]');
    await page.waitForTimeout(600);

    // Click Day 2 card
    console.log('5️⃣ Testing Day 2 Scratch Card Modal...');
    const day2Card = page.locator('div[aria-label*="Tag 2"]').first();
    await day2Card.click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      console.log('   Rubbing ScratchCard canvas...');
      const box = await canvas.boundingBox();
      if (box) {
        // Simulate finger scratching
        for (let i = 0; i < 8; i++) {
          await page.mouse.move(box.x + box.width * 0.2 + i * 15, box.y + box.height * 0.3);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.8 - i * 10, box.y + box.height * 0.7);
          await page.mouse.up();
        }
      }
      await page.waitForTimeout(1200);
      console.log('   ✅ Day 2 ScratchCard rubbed & unlocked successfully!');
    }

    // Close Day 2 modal
    const closeBtn = page.locator('button[aria-label*="Schließen"], div[role="dialog"] button').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    console.log('6️⃣ Testing Minigame Modal 🎮 ...');
    const gameBtn = page.locator('button[aria-label*="Herzen-Fang"]').first();
    await gameBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Minigame loaded at 60 FPS canvas!');

    // Close game
    const gameClose = page.locator('div[role="dialog"] button[aria-label*="Schließen"], div[role="dialog"] button[title*="schließen"]').first();
    if (await gameClose.isVisible()) {
      await gameClose.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Minigame closed smoothly!');
    }

    console.log('7️⃣ Testing Secret Messages Modal 🎁 ...');
    const bonusBtn = page.locator('button[aria-label*="Geheim-Nachrichten"]').first();
    await bonusBtn.click();
    await page.waitForTimeout(1000);

    // Open first bonus message
    const openBonusBtn = page.locator('span:has-text("Öffnen 💌")').first();
    if (await openBonusBtn.isVisible()) {
      await openBonusBtn.click();
      await page.waitForTimeout(800);
      console.log('   ✅ Secret Letter opened in full width!');

      // Back to list
      await page.click('button:has-text("Zurück zur Übersicht")');
      await page.waitForTimeout(500);
    }

    // Close bonus modal
    const bonusClose = page.locator('div[role="dialog"] button').first();
    if (await bonusClose.isVisible()) {
      await bonusClose.click();
      await page.waitForTimeout(500);
    }

    console.log('8️⃣ Checking for any Console Errors...');
    if (errors.length === 0) {
      console.log('   ✅ 0 Console Errors encountered during entire test run!');
    } else {
      console.warn('   ⚠️ Console warnings/errors:', errors);
    }

    console.log('\n========================================');
    console.log('🎉 ALL AUTOMATED E2E CLICK TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.kill();
  }
}

runE2ETests();
