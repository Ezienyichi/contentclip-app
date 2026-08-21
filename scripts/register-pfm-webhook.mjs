/**
 * One-time webhook registration for Post for Me.
 *
 * Run once (after deploying to production):
 *   node scripts/register-pfm-webhook.mjs
 *
 * Requires in .env.local:
 *   POST_FOR_ME_API_KEY=...
 *   NEXT_PUBLIC_APP_URL=https://yourdomain.com
 *
 * After running, add the printed secret to .env.local:
 *   PFM_WEBHOOK_SECRET=...
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env.local ───────────────────────────────────────────────────────────

const env = {};
try {
  const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }
} catch {
  // .env.local may not exist in CI — fall through to process.env
}

const API_KEY = env.POST_FOR_ME_API_KEY  ?? process.env.POST_FOR_ME_API_KEY;
const APP_URL = env.NEXT_PUBLIC_APP_URL  ?? process.env.NEXT_PUBLIC_APP_URL;

if (!API_KEY) {
  console.error('❌  POST_FOR_ME_API_KEY not found in .env.local');
  process.exit(1);
}
if (!APP_URL) {
  console.error('❌  NEXT_PUBLIC_APP_URL not found in .env.local  (e.g. https://yourdomain.vercel.app)');
  process.exit(1);
}

const webhookUrl = `${APP_URL}/api/webhooks/pfm`;
console.log(`\nRegistering Post for Me webhook → ${webhookUrl}\n`);

// ── Call PfM ──────────────────────────────────────────────────────────────────

const res = await fetch('https://api.postforme.dev/v1/webhooks', {
  method:  'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({
    url:         webhookUrl,
    event_types: ['social.post.result.created'],
  }),
});

const body = await res.json();

if (!res.ok) {
  console.error('❌  PfM returned an error:');
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

// ── Print instructions ────────────────────────────────────────────────────────

console.log('✅  Webhook registered!\n');
console.log('Add the following line to your .env.local (and to Vercel environment variables):\n');
console.log(`  PFM_WEBHOOK_SECRET=${body.secret}\n`);
console.log('Full PfM response:');
console.log(JSON.stringify(body, null, 2));
console.log('');
console.log('⚠️  Do not run this script again unless you intentionally want a second webhook.');
console.log('   (PfM would fire duplicate events to both URLs.)');
console.log('   If you need to re-register, delete the old webhook first via the PfM dashboard');
console.log(`   or call: DELETE https://api.postforme.dev/v1/webhooks/${body.id}`);
