import fs from 'fs';
import path from 'path';

const srcHtml = 'C:\\Users\\Dennis\\.gemini\\antigravity\\brain\\12dc5d06-ec55-4958-ba14-f2d569945d5b\\qr_geschenkkarte.html';
const srcPng = 'C:\\Users\\Dennis\\.gemini\\antigravity\\brain\\12dc5d06-ec55-4958-ba14-f2d569945d5b\\qr_heiligabend.png';

const destProjectHtml = 'C:\\Users\\Dennis\\Desktop\\Nina Geschenk\\qr_geschenkkarte.html';
const destProjectPng = 'C:\\Users\\Dennis\\Desktop\\Nina Geschenk\\qr_heiligabend.png';

const destDesktopHtml = 'C:\\Users\\Dennis\\Desktop\\qr_geschenkkarte.html';
const destDesktopPng = 'C:\\Users\\Dennis\\Desktop\\qr_heiligabend.png';

fs.copyFileSync(srcHtml, destProjectHtml);
fs.copyFileSync(srcPng, destProjectPng);
fs.copyFileSync(srcHtml, destDesktopHtml);
fs.copyFileSync(srcPng, destDesktopPng);

console.log('Successfully copied files to Desktop and project folder!');
