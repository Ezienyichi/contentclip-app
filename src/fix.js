const fs = require('fs');
let c = fs.readFileSync('src/app/api/process/route.ts', 'utf8');
c = c.replace(
    'clip.download_url',
    'clip.signed_s3_video_url ?? clip.download_url'
);
fs.writeFileSync('src/app/api/process/route.ts', c);
console.log('Done!');