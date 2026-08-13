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
  await page.setContent('<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>');

  for (const item of assets) {
    const filePath = path.join(artifactsDir, item.src);
    if (!fs.existsSync(filePath)) {
      console.error('File NOT found:', filePath);
      continue;
    }

    const base64 = fs.readFileSync(filePath).toString('base64');

    const dataUrlResult = await page.evaluate(async ({ base64Data, size }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.getElementById('c');
          c.width = size;
          c.height = size;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          const imgData = ctx.getImageData(0, 0, size, size);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            const lum = Math.max(r, g, b);
            if (lum < 15) {
              d[i + 3] = 0;
            } else if (lum < 50) {
              d[i + 3] = Math.round(((lum - 15) / 35) * 255);
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(new Error('Failed to load image in page'));
        img.src = `data:image/jpeg;base64,${base64Data}`;
      });
    }, { base64Data: base64, size: item.size });

    const pngBuffer = Buffer.from(dataUrlResult.replace(/^data:image\/png;base64,/, ''), 'base64');
    const outPath = path.join(outDir, item.name);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`✅ Saved ${item.name} (${item.size}x${item.size}, ${pngBuffer.length} bytes)`);
  }

  await browser.close();
  console.log('🎉 All 3D sprites exported with full data!');
}

prepareAssets().catch(console.error);
