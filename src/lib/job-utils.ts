import type { SupabaseClient } from '@supabase/supabase-js';
import { CLIP_RETENTION_DAYS, retentionExpiryISO } from '@/lib/retention';

export function minutesForJob(data: any): { minutes: number; basis: string } {
  const cost = Number(data?.cost_usage);
  if (Number.isFinite(cost) && cost > 0) {
    return { minutes: Math.max(1, Math.ceil(cost / 2)), basis: `cost_usage=${cost}` };
  }
  const ends: number[] = (Array.isArray(data?.clips) ? data.clips : [])
    .map((c: any) => Number(c?.end_time))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  if (ends.length > 0) {
    const span = Math.max(...ends);
    return { minutes: Math.max(1, Math.ceil(span / 60)), basis: `clip span ${Math.round(span)}s` };
  }
  return { minutes: 0, basis: 'indeterminate' };
}

export async function addMinutesUsed(
  admin: SupabaseClient,
  userId: string,
  delta: number,
  knownCurrent: number,
): Promise<void> {
  const { error: rpcErr } = await admin.rpc('increment_minutes_used', { p_user_id: userId, p_minutes: delta });
  if (!rpcErr) return;
  console.warn('[job-utils] RPC unavailable, falling back:', rpcErr.message);
  const { error } = await admin.from('profiles').update({ minutes_used: knownCurrent + delta }).eq('id', userId);
  if (error) console.error('[job-utils] minutes_used update failed:', error.message);
}

export async function saveClipsAdmin(
  admin: SupabaseClient,
  userId: string,
  rawClips: any[],
  sourceVideoName: string,
): Promise<boolean> {
  if (rawClips.length === 0) return true;
  const expiresAt = retentionExpiryISO(CLIP_RETENTION_DAYS);
  const rows = rawClips.map((c: any) => ({
    user_id:           userId,
    title:             String(c.title        || 'Clip').slice(0, 500),
    hook_text:         String(c.caption      || ''    ).slice(0, 1000),
    start_time:        Number(c.start_time   ?? 0),
    end_time:          Number(c.end_time     ?? 60),
    virality_score:    Math.min(100, Math.max(0, Math.round(Number(c.ai_score ?? 80)))),
    suggested_caption: String(c.caption      || ''    ).slice(0, 2000),
    hashtags:          Array.isArray(c.hashtags) ? c.hashtags : [],
    status:            'ready',
    video_url:         String(c.video_url    || ''    ).slice(0, 2000),
    download_url:      String(c.download_url || ''    ).slice(0, 2000),
    thumbnail_url:     String(c.thumbnail_url|| ''    ).slice(0, 2000),
    source_video_name: sourceVideoName,
    expires_at:        expiresAt,
    delete_after:      expiresAt,
  }));
  const { error } = await admin.from('clips').insert(rows);
  if (error) { console.error('[job-utils] saveClipsAdmin failed:', error.message); return false; }
  console.log('[job-utils] saved', rows.length, 'clips for user', userId);
  return true;
}

export function normalizeClips(rawClips: any[]): any[] {
  return rawClips.map((c: any) => ({
    video_url:     c.video_url     || '',
    download_url:  c.download_url  || '',
    title:         c.title         || 'Clip',
    caption:       c.desc          || c.caption || '',
    ai_score:      c.score         ?? c.ai_score,
    thumbnail_url: c.thumbnail     || c.thumbnail_url || '',
    hashtags:      Array.isArray(c.tags) ? c.tags : Array.isArray(c.hashtags) ? c.hashtags : [],
    start_time:    c.start_time    ?? 0,
    end_time:      c.end_time      ?? 60,
    duration:      c.duration,
  }));
}
