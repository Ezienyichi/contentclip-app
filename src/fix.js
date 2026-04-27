const fs = require('fs');
const lines = fs.readFileSync('src/app/import/page.tsx', 'utf8').split('\n');
lines.splice(242, 8);
fs.writeFileSync('src/app/import/page.tsx', lines. join('\n'));
console.log('Done! Removed broken lines.');
console.log('New line 242:', lines[242]);
console.log('New line 243:', lines[243]);
