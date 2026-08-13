import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function prepareAssets() {
  const artifactsDir = 'C:/Users/Dennis/.gemini/antigravity/brain/12dc5d06-ec55-4958-ba14-f2d569945d5b';
  const outDir = path.resolve('public/sprites');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const assets = [
    { src: 'sprite_ruby_heart_1786653460125.jpg', name: 'ruby-heart.png', size: 128 },
    { src: 'sprite_gold_heart_1786653473328.jpg', name: 'gold-heart.png', size: 128 },
    { src: 'sprite_diamond_1786653487380.jpg', name: 'diamond.png', size: 128 },
    { src: 'sprite_broken_heart_1786653500281.jpg', name: 'broken-heart.png', size: 128 },
    { src: 'sprite_magnet_orb_1786653514719.jpg', name: 'magnet-orb.png', size: 128 },
    { src: 'sprite_freeze_ice_1786653530908.jpg', name: 'freeze-ice.png', size: 128 },
    { src: 'sprite_emerald_heart_1786653544497.jpg', name: 'emerald-heart.png', size: 128 },
    { src: 'ui_wax_seal_nd_1786653846562.jpg', name: 'wax-seal.png', size: 256 },
    { src: 'ui_heart_lock_1786653577803.jpg', name: 'heart-lock.png', size: 256 },
    { src: 'ui_gift_box_1786653592548.jpg', name: 'gift-box.png', size: 256 },
  ];

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const item of assets) {
    const filePath = path.join(artifactsDir, item.src);
    if (!fs.existsSync(filePath)) {
      console.warn('File not found:', filePath);
      continue;
    }

    const base64 = fs.readFileSync(filePath).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; background: transparent; overflow: hidden; }
            canvas { display: block; }
          </style>
        </head>
        <body>
          <canvas id="c" width="${item.size}" height="${item.size}"></canvas>
          <script>
            const img = new Image();
            img.onload = () => {
              const c = document.getElementById('c');
              const ctx = c.getContext('2d');
              ctx.drawImage(img, 0, 0, ${item.size}, ${item.size});

              // Process transparent alpha for black background
              const imgData = ctx.getImageData(0, 0, ${item.size}, ${item.size});
              const d = imgData.data;
              for (let i = 0; i < d.length; i += 4) {
                const r = d[i], g = d[i+1], b = d[i+2];
                const lum = Math.max(r, g, b);
                if (lum < 10) {
                  d[i+3] = 0; // Pure transparent
                } else if (lum < 40) {
                  // Smooth anti-aliased edge falloff
                  d[i+3] = Math.round(((lum - 10) / 30) * 255);
                }
              }
              ctx.putImageData(imgData, 0, 0);
              window.renderDone = true;
            };
            img.src = '${dataUrl}';
          </script>
        </body>
      </html>
    `;

    await page.setViewportSize({ width: item.size, height: item.size });
    await page.setContent(html);
    await page.waitForFunction(() => window.renderDone === true);

    const outPath = path.join(outDir, item.name);
    await page.screenshot({ path: outPath, type: 'png', omitBackground: true });
    console.log(`✅ Exported 3D sprite: ${item.name} (${item.size}x${item.size})`);
  }

  await browser.close();
  console.log('🎉 All 3D sprites ready in public/sprites/!');
}

prepareAssets().catch(console.error);
