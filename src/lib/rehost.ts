// Re-hosting clips from WayinVideo (signed CloudFront, short-lived) to R2
// (permanent, governed by the R2 lifecycle rule — see src/lib/retention.ts).
//
// Shared by:
//   - api/clips/save        — background pass right after clips are created
//   - api/admin/rehost-orphans — rescue pass for rows that never got re-hosted

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const R2_ENV_KEYS = [
  'CLOUDFLARE_R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
] as const;

/** Env vars required for re-hosting that are currently unset. */
export function missingR2Env(): string[] {
  return R2_ENV_KEYS.filter(k => !process.env[k]);
}

/** One client instance, shared across all parallel uploads in a pass. */
export function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * True if `url` already points at our R2 public domain — i.e. nothing to do.
 * Compared on origin, not raw prefix, so a trailing slash or a path segment in
 * R2_PUBLIC_URL doesn't produce false negatives.
 */
export function isR2Url(url: string): boolean {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url) return false;
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * Download a clip from its current URL and put it in R2.
 * Returns the public R2 URL, or null on any failure (caller keeps the old URL).
 */
export async function rehostToR2(
  s3: S3Client,
  sourceUrl: string,
  userId: string,
  clipId: string,
): Promise<string | null> {
  try {
    console.log(`[rehostToR2] clip=${clipId} downloading ${sourceUrl.slice(0, 100)}`);
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error(`[rehostToR2] clip=${clipId} download HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const contentType = res.headers.get('content-type') ?? 'video/mp4';
    const today = new Date().toISOString().slice(0, 10);
    const key = `clips/${userId}/${today}/${clipId}.mp4`;
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`[rehostToR2] clip=${clipId} downloaded ${buffer.length} bytes → uploading key=${key}`);

    await s3.send(new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET!,
      Key:           key,
      Body:          buffer,
      ContentType:   contentType,
      ContentLength: buffer.length,
    }));

    const r2Url = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`[rehostToR2] clip=${clipId} success → ${r2Url}`);
    return r2Url;
  } catch (err) {
    console.error(`[rehostToR2] clip=${clipId} threw:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}
