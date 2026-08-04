import fs from 'fs';

const messages = JSON.parse(fs.readFileSync('src/data/messages.json', 'utf-8'));

let md = '# 365 Gründe warum ich dich Liebe (Vollständige Liste)\n\n';
md += 'Für meine traumhafte Ehefrau Nina ❤️\n\n---\n\n';

messages.forEach((msg) => {
  md += `### Tag ${msg.id} (${msg.date})\n> "${msg.text}"\n\n`;
});

fs.writeFileSync('365_botschaften_uebersicht.md', md, 'utf-8');
console.log('List created in 365_botschaften_uebersicht.md');
