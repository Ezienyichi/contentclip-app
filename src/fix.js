const fs = require('fs');
const lines = fs.readFileSync('src/app/import/page.tsx', 'utf8').split('\n');

// Fix line 243 (index 242)
lines[242] = '        {clip.video_url && (';

// Fix line 244 (index 243)  
lines[243] = '            href={clip.video_url}';

// Fix line 245 (index 244)
lines[244] = '            target="_blank"';

fs.writeFileSync('src/app/import/page.tsx', lines.join('\n'));
console.log('Fixed:');
console.log(lines[242]);
console.log(lines[243]);
console.log(lines[244]);