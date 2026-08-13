import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const messagesPath = path.join(rootDir, 'public', 'messages.json');
const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

// Categorization keywords & themes
const categories = [
  'Liebe & Wertschätzung',
  'Erinnerungen & Momente',
  'Alltag & Geborgenheit',
  'Humor & Lachen',
  'Zukunft & Träume',
  'Dankbarkeit & Glück'
];

function classifyMessage(text, index) {
  const t = text.toLowerCase();
  
  if (t.includes('lach') || t.includes('humor') || t.includes('spaß') || t.includes('witz') || t.includes('albern') || t.includes('kicher') || t.includes('strahl')) {
    return 'Humor & Lachen';
  }
  if (t.includes('danke') || t.includes('dankbar') || t.includes('schätze') || t.includes('glück') || t.includes('stolz') || t.includes('kraft') || t.includes('unterstütz')) {
    return 'Dankbarkeit & Glück';
  }
  if (t.includes('zukunft') || t.includes('reise') || t.includes('traum') || t.includes('träume') || t.includes('plan') || t.includes('weg') || t.includes('abenteuer') || t.includes('alt werden') || t.includes('für immer') || t.includes('jahre')) {
    return 'Zukunft & Träume';
  }
  if (t.includes('erinner') || t.includes('damals') || t.includes('moment') || t.includes('augenblick') || t.includes('tag, an dem') || t.includes('erstes') || t.includes('urlaub') || t.includes('spaziergang') || t.includes('gestern') || t.includes('nacht')) {
    return 'Erinnerungen & Momente';
  }
  if (t.includes('zuhause') || t.includes('morgen') || t.includes('abend') || t.includes('kaffee') || t.includes('kochen') || t.includes('kuschel') || t.includes('couch') || t.includes('schlafen') || t.includes('gemütlich') || t.includes('ruhe') || t.includes('umarm') || t.includes('geborgen')) {
    return 'Alltag & Geborgenheit';
  }
  
  // Cycle between categories if general
  return categories[index % categories.length];
}

const updatedMessages = messages.map((m, idx) => {
  return {
    ...m,
    category: classifyMessage(m.text, idx)
  };
});

// Count distribution
const counts = {};
updatedMessages.forEach(m => {
  counts[m.category] = (counts[m.category] || 0) + 1;
});
console.log('Category distribution:', counts);

fs.writeFileSync(messagesPath, JSON.stringify(updatedMessages, null, 2), 'utf8');
console.log('✅ Successfully updated public/messages.json with diversified categories!');
