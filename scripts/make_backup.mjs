import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..');
const backupDir = 'C:\\Users\\Dennis\\Desktop\\Backup_365_Gruende_Final_2026';
const zipPath = 'C:\\Users\\Dennis\\Desktop\\Backup_365_Gruende_Final_2026.zip';

console.log('📦 Erstelle vollständiges Offline-Backup...');

// 1. Ordner-Kopie erstellen (ohne node_modules, dist, .git, .vercel)
const ignoreList = ['node_modules', 'dist', '.git', '.vercel'];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    const base = path.basename(src);
    if (ignoreList.includes(base)) return;

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    const base = path.basename(src);
    if (ignoreList.includes(base)) return;
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(backupDir)) {
  fs.rmSync(backupDir, { recursive: true, force: true });
}

copyRecursiveSync(srcDir, backupDir);
console.log('✅ Lokaler Backup-Ordner erstellt:', backupDir);

// 2. PowerShell ZIP erstellen
try {
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${backupDir}\\*' -DestinationPath '${zipPath}' -Force"`);
  console.log('✅ ZIP-Archiv erfolgreich erstellt:', zipPath);
} catch (e) {
  console.log('ZIP Info:', e.message);
}

console.log('🎉 SICHERUNG VOLLSTÄNDIG ABGESCHLOSSEN!');
