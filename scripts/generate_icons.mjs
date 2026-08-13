import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const svgPath = path.join(rootDir, 'public', 'favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; align-items: center; justify-content: center; background: transparent; }
        </style>
      </head>
      <body>
        <div id="icon" style="width: 512px; height: 512px;">
          ${svgContent}
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);

  // 1. Generate 512x512 PNG
  await page.setViewportSize({ width: 512, height: 512 });
  const element512 = await page.$('#icon');
  await element512.screenshot({
    path: path.join(rootDir, 'public', 'pwa-512x512.png'),
    type: 'png',
  });
  console.log('✅ Generated pwa-512x512.png');

  // 2. Generate 192x192 PNG
  const html192 = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; align-items: center; justify-content: center; background: transparent; }
          svg { width: 192px; height: 192px; }
        </style>
      </head>
      <body>
        <div id="icon" style="width: 192px; height: 192px;">
          ${svgContent}
        </div>
      </body>
    </html>
  `;
  await page.setContent(html192);
  await page.setViewportSize({ width: 192, height: 192 });
  const element192 = await page.$('#icon');
  await element192.screenshot({
    path: path.join(rootDir, 'public', 'pwa-192x192.png'),
    type: 'png',
  });
  console.log('✅ Generated pwa-192x192.png');

  // 3. Generate apple-touch-icon.png (180x180)
  const html180 = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; align-items: center; justify-content: center; background: transparent; }
          svg { width: 180px; height: 180px; }
        </style>
      </head>
      <body>
        <div id="icon" style="width: 180px; height: 180px;">
          ${svgContent}
        </div>
      </body>
    </html>
  `;
  await page.setContent(html180);
  await page.setViewportSize({ width: 180, height: 180 });
  const element180 = await page.$('#icon');
  await element180.screenshot({
    path: path.join(rootDir, 'public', 'apple-touch-icon.png'),
    type: 'png',
  });
  console.log('✅ Generated apple-touch-icon.png');

  await browser.close();
}

generate().catch(console.error);
