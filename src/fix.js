const fs = require('fs');
let c = fs.readFileSync('src/app/import/page.tsx', 'utf8');
c = c.replace(
    'setResult(date);',
    'if (data.polling && data.rekajobId) {
         const interval = setInterval(async () => {
            try {
                const pollRes = await fetch('/api/poll?rekaJobID=' + data.rekajobId + '&userId' + user.id);
                const pollData = await pollRes.json();
                if (pollData.status === 'completed' && pollData.clips) {
                    clearInterval(interval);
                    setResult({ success: true, jobId: data.rekajobId, clips: pollData.clips, creditsUsed: data.creditsUsed, creditsRemaining: data.creditsRemaining });
                    setLoading(false);
                }   else if (pollData.error) {
                    clearInterval(interval);
                    setError(pollData.error);
                    setLoading(false);
                }
            }   catch(a) { console.error('poll error:', e); }
        }, 15000);
        return;
    }
    setResult(data);'
);
fs.writeFileSync('src/app/import/page.tsx', c);
console.log('Done!');