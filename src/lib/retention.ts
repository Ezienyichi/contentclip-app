// Clip retention — single source of truth.
//
// Deletion of the underlying files is NOT done by this codebase: nothing reads
// delete_after on a schedule. Files are removed by the Cloudflare R2 bucket
// lifecycle rule. The values here only decide what the DB records and what the
// UI promises, so they must be kept in step with that rule.
//
// If this number is LOWERED, the UI starts promising less than R2 will keep —
// harmless (files linger, costing a little storage).
// If the R2 rule is lowered BEFORE these values, files vanish while rows still
// advertise them — broken links. Change the code first, R2 second.

/** Days a generated clip stays available. */
export const CLIP_RETENTION_DAYS = 10;

/**
 * Days an uploaded clip stays available, by plan.
 *
 * Floored at CLIP_RETENTION_DAYS so an upload is never shorter-lived than a
 * generated clip. Agency keeps its longer 14-day entitlement.
 */
export const UPLOAD_RETENTION_DAYS: Record<string, number> = {
  pro:          Math.max(10, CLIP_RETENTION_DAYS),
  professional: Math.max(10, CLIP_RETENTION_DAYS),
  agency:       Math.max(14, CLIP_RETENTION_DAYS),
};

/** Retention for an uploaded clip on the given plan, or null if not allowed. */
export function uploadRetentionDays(plan?: string | null): number | null {
  return UPLOAD_RETENTION_DAYS[(plan ?? '').toLowerCase()] ?? null;
}

/** ISO timestamp `days` from now — what gets stored in expires_at / delete_after. */
export function retentionExpiryISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
