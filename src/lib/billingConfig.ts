// Server-side only. Never import this in client components.
// Amounts in USD. Client sends only plan name + period — never the amount.

export const BILLING_PLANS = {
  starter: { monthly: 29,  annual: 290  },
  pro:     { monthly: 59,  annual: 590  },
  agency:  { monthly: 119, annual: 1190 },
} as const;

export type PlanKey = keyof typeof BILLING_PLANS;
export type Period  = 'monthly' | 'annual';

export const VALID_PLANS:   PlanKey[] = Object.keys(BILLING_PLANS) as PlanKey[];
export const VALID_PERIODS: Period[]  = ['monthly', 'annual'];

export function isPlanKey(v: unknown): v is PlanKey {
  return VALID_PLANS.includes(v as PlanKey);
}
export function isPeriod(v: unknown): v is Period {
  return VALID_PERIODS.includes(v as Period);
}

export function renewalDays(period: Period): number {
  return period === 'annual' ? 365 : 30;
}
