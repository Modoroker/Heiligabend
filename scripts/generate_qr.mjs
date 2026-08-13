import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const targetUrl = process.env.VITE_APP_URL || 'https://heiligabend.vercel.app';
const outputDir = path.join(rootDir, 'public');

const pngPath = path.join(outputDir, 'qr_heiligabend.png');
const svgPath = path.join(outputDir, 'qr_heiligabend.svg');
const htmlPath = path.join(rootDir, 'qr_geschenkkarte.html');

async function main() {
  // Generate PNG
  await QRCode.toFile(pngPath, targetUrl, {
    color: {
      dark: '#070B19',
      light: '#FFFFFF'
    },
    width: 600,
    margin: 2
  });

  // Generate SVG
  const svgString = await QRCode.toString(targetUrl, {
    type: 'svg',
    color: {
      dark: '#070B19',
      light: '#FFFFFF'
    },
    margin: 2
  });
  fs.writeFileSync(svgPath, svgString);

  // Generate Base64 for embedded HTML printable card
  const base64Image = await QRCode.toDataURL(targetUrl, {
    color: {
      dark: '#070B19',
      light: '#FFFFFF'
    },
    width: 500,
    margin: 2
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Geschenkkarte – 365 Gründe warum ich dich liebe ❤️</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@400;600&display=swap');
    
    body {
      background: #f4ece1;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 40px;
    }
    
    .card {
      background: linear-gradient(135deg, #0b132b 0%, #070b19 100%);
      color: #f7e7ce;
      width: 440px;
      padding: 40px 30px;
      border-radius: 28px;
      border: 2px solid #b76e79;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border: 1px solid rgba(212, 175, 55, 0.3);
      margin: 10px;
      border-radius: 20px;
      pointer-events: none;
    }

    h1 {
      font-family: 'Great Vibes', cursive;
      font-size: 44px;
      color: #e8b4b8;
      margin: 0 0 5px 0;
      font-weight: normal;
    }

    h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22px;
      color: #f7e7ce;
      margin: 0 0 20px 0;
      letter-spacing: 1px;
    }

    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 20px;
      display: inline-block;
      box-shadow: 0 10px 28px rgba(183, 110, 121, 0.35);
      margin: 15px 0;
    }

    .qr-box img {
      width: 220px;
      height: 220px;
      display: block;
    }

    p.subtext {
      font-size: 13px;
      color: #cbd5e1;
      margin-top: 15px;
      line-height: 1.6;
    }

    .badge {
      display: inline-block;
      background: rgba(183, 110, 121, 0.25);
      border: 1px solid rgba(232, 180, 184, 0.4);
      color: #e8b4b8;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Für meine liebe Nina</h1>
    <h2>365 Gründe warum ich dich liebe ❤️</h2>
    
    <div class="qr-box">
      <img src="${base64Image}" alt="QR-Code zum Scannen" />
    </div>
    
    <p class="subtext">
      Einfach mit deiner Smartphone-Kamera scannen,<br>um deine täglichen Liebesbotschaften zu öffnen!
    </p>
    
    <div class="badge">🎁 Dein persönliches Heiligabend-Geschenk</div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  console.log('SUCCESS: Generated QR Code PNG, SVG, and HTML Printable Card with relative paths!');
}

main().catch(console.error);
