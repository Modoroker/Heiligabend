import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const checks = [];

function check(name, ok, detail) {
  checks.push({ check: name, ok, detail });
}

// 1. PWA Icons exist
['public/pwa-192x192.png', 'public/pwa-512x512.png', 'public/apple-touch-icon.png'].forEach(f => {
  const full = path.join(root, f);
  const exists = fs.existsSync(full);
  const size = exists ? fs.statSync(full).size : 0;
  check(f, exists && size > 1000, exists ? size + ' bytes' : 'MISSING');
});

// 2. messages.json integrity
const msgs = JSON.parse(fs.readFileSync(path.join(root, 'public/messages.json'), 'utf8'));
check('messages.json count', msgs.length === 365, msgs.length + ' messages');
check('messages.json first date', msgs[0].date === '2026-12-24', msgs[0].date);
check('messages.json last date', msgs[364].date === '2027-12-23', msgs[364].date);
check('messages.json first id', msgs[0].id === 1, 'id=' + msgs[0].id);
check('messages.json last id', msgs[364].id === 365, 'id=' + msgs[364].id);

// 3. Category diversity
const cats = new Set(msgs.map(m => m.category));
check('Category diversity', cats.size >= 3, cats.size + ' categories');

// 4. No Weil starters
const weil = msgs.filter(m => /^\s*weil\b/i.test(m.text));
check('No Weil starters', weil.length === 0, weil.length + ' found');

// 5. No src/data/messages.json duplicate
check('No duplicate src/data/messages.json', !fs.existsSync(path.join(root, 'src/data/messages.json')), 'correctly removed');

// 6. bonusMessages.json exists
const bonus = JSON.parse(fs.readFileSync(path.join(root, 'src/data/bonusMessages.json'), 'utf8'));
check('bonusMessages.json', bonus.length === 7, bonus.length + ' bonus messages');

// 7. No duplicate manifest.json
check('No duplicate public/manifest.json', !fs.existsSync(path.join(root, 'public/manifest.json')), 'correctly removed');

// 8. vite.config.js
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
check('vite.config navigateFallback', viteConfig.includes('navigateFallback'), viteConfig.includes('navigateFallback') ? 'present' : 'MISSING');
check('vite.config skipWaiting', viteConfig.includes('skipWaiting: true'), viteConfig.includes('skipWaiting: true') ? 'present' : 'MISSING');
check('vite.config clientsClaim', viteConfig.includes('clientsClaim: true'), viteConfig.includes('clientsClaim: true') ? 'present' : 'MISSING');

// 9. index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check('OG meta tags', html.includes('og:title'), html.includes('og:title') ? 'present' : 'MISSING');
check('Twitter card', html.includes('twitter:card'), html.includes('twitter:card') ? 'present' : 'MISSING');
check('Font preload', html.includes('preload'), html.includes('preload') ? 'present' : 'MISSING');

// 10. SecretPinModal does NOT reveal PINs
const pinModal = fs.readFileSync(path.join(root, 'src/components/SecretPinModal.jsx'), 'utf8');
check('PIN not revealed in error text', !pinModal.includes('Versuche 2412'), 'neutralized');
check('PIN not in placeholder', !pinModal.includes('2412 oder NINA'), 'neutralized');

// 11. a11y attributes
const navbar = fs.readFileSync(path.join(root, 'src/components/Navbar.jsx'), 'utf8');
const dailyCard = fs.readFileSync(path.join(root, 'src/components/DailyCard.jsx'), 'utf8');
const lockOverlay = fs.readFileSync(path.join(root, 'src/components/LockOverlay.jsx'), 'utf8');
const calGrid = fs.readFileSync(path.join(root, 'src/components/CalendarGrid.jsx'), 'utf8');
check('Navbar a11y', navbar.includes('role="button"'), navbar.includes('role="button"') ? 'present' : 'MISSING');
check('DailyCard a11y', dailyCard.includes('role="button"'), dailyCard.includes('role="button"') ? 'present' : 'MISSING');
check('LockOverlay a11y', lockOverlay.includes('role="button"'), lockOverlay.includes('role="button"') ? 'present' : 'MISSING');
check('CalendarGrid a11y', calGrid.includes('role="button"'), calGrid.includes('role="button"') ? 'present' : 'MISSING');

// 12. useCalendar UTC unlock
const useCalendar = fs.readFileSync(path.join(root, 'src/hooks/useCalendar.js'), 'utf8');
check('useCalendar UTC unlock', useCalendar.includes('Date.UTC(2026, 11, 24, 20, 0, 0)'), 'correct (20:00 UTC = 21:00 CET)');
check('useCalendar AbortController', useCalendar.includes('AbortController'), 'present');
check('useCalendar exponential backoff', useCalendar.includes('Math.pow(2,'), 'present');

// 13. ScratchCard optimized
const scratch = fs.readFileSync(path.join(root, 'src/components/ScratchCard.jsx'), 'utf8');
check('ScratchCard downsampled', scratch.includes('step'), 'optimized');
check('ScratchCard ResizeObserver', scratch.includes('ResizeObserver'), 'present');

// 14. HeartCatchGame preventDefault
const game = fs.readFileSync(path.join(root, 'src/components/HeartCatchGame.jsx'), 'utf8');
check('HeartCatch preventDefault', game.includes('e.preventDefault()'), 'present');

// 15. .gitignore covers .env
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
check('.gitignore covers .env.local', gitignore.includes('.env.local'), 'protected');

// 16. CI pipeline exists
check('CI pipeline exists', fs.existsSync(path.join(root, '.github/workflows/ci.yml')), 'present');

// 17. favicon.svg exists
check('favicon.svg exists', fs.existsSync(path.join(root, 'public/favicon.svg')), 'present');

// Print results
console.log('\n========================================');
console.log('  FINAL VERIFICATION REPORT');
console.log('========================================\n');
let passed = 0, failed = 0;
checks.forEach(c => {
  const icon = c.ok ? '✅' : '❌';
  console.log(`${icon}  ${c.check}  →  ${c.detail}`);
  if (c.ok) passed++; else failed++;
});
console.log('\n========================================');
if (failed === 0) {
  console.log(`  🎉 RESULT: ${passed}/${passed} checks passed — ALL CLEAR!`);
} else {
  console.log(`  ⚠️ RESULT: ${passed}/${passed + failed} checks passed (${failed} FAILED)`);
}
console.log('========================================\n');
