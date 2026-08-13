import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function processIcons() {
  const sourceImagePath = 'C:/Users/Dennis/.gemini/antigravity/brain/12dc5d06-ec55-4958-ba14-f2d569945d5b/luxury_pwa_icon_1786653081918.jpg';
  const publicDir = path.resolve('public');

  if (!fs.existsSync(sourceImagePath)) {
    console.error('Source image not found:', sourceImagePath);
    process.exit(1);
  }

  const base64Data = fs.readFileSync(sourceImagePath).toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const targets = [
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const target of targets) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${target.size}px; height: ${target.size}px; overflow: hidden; background: transparent; }
            img { width: 100%; height: 100%; object-fit: cover; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `;

    await page.setViewportSize({ width: target.size, height: target.size });
    await page.setContent(htmlContent);
    await page.waitForLoadState('networkidle');

    const outPath = path.join(publicDir, target.name);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`✅ Saved ${target.name} (${target.size}x${target.size})`);
  }

  await browser.close();
  console.log('🎉 All icons processed successfully!');
}

processIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
