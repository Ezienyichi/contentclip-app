// Plan → monthly processing-minute entitlement.
//
// SINGLE SOURCE OF TRUTH. This is the number the server enforces in
// /api/process-youtube-v2 and the number every usage display shows, so the
// UI can never promise minutes the backend won't grant.
//
// Deliberately NOT in billingConfig.ts: that file is marked server-side only,
// and this map has to be readable from 'use client' components (Sidebar,
// dashboard, settings). Nothing here is secret. billingConfig re-exports it
// so server code can still reach it from the billing module.
//
// Keys include legacy plan aliases still present in profiles.plan:
// 'solo' (old Starter) and 'professional' (old Pro).

export const PLAN_MINUTES: Record<string, number> = {
  free:         30,
  solo:         180,
  starter:      180,
  professional: 400,
  pro:          400,
  agency:       900,
};

export const DEFAULT_PLAN_MINUTES = PLAN_MINUTES.free;

/** Monthly minute cap for a plan. Unknown/missing plans fall back to Free. */
export function planMinutes(plan?: string | null): number {
  return PLAN_MINUTES[(plan ?? 'free').toLowerCase()] ?? DEFAULT_PLAN_MINUTES;
}

export const PLAN_LABELS: Record<string, string> = {
  free:         'Free',
  solo:         'Starter',
  starter:      'Starter',
  professional: 'Pro',
  pro:          'Pro',
  agency:       'Agency',
};

/** Display name for a plan, collapsing legacy aliases onto current names. */
export function planLabel(plan?: string | null): string {
  const p = (plan ?? 'free').toLowerCase();
  return PLAN_LABELS[p] ?? (p.charAt(0).toUpperCase() + p.slice(1));
}

/**
 * Usage figures for a plan, derived from profiles.minutes_used — the column
 * the quota check actually reads. Do not derive usage from profiles.credits;
 * that is a separate prepaid balance spent by /api/process.
 */
export function planUsage(plan?: string | null, minutesUsed?: number | null) {
  const limit = planMinutes(plan);
  const used  = Math.max(0, minutesUsed ?? 0);
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    pct:       Math.min(100, limit > 0 ? Math.round((used / limit) * 100) : 0),
  };
}
