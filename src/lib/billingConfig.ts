// Server-side only. Never import this in client components.
// Client sends only plan + period + currency — never the amount.

export type Currency = 'USD' | 'NGN';
export type PlanKey  = 'starter' | 'pro' | 'agency';
export type Period   = 'monthly' | 'annual';

export const BILLING_PLANS: Record<PlanKey, Record<Currency, Record<Period, number>>> = {
  starter: {
    USD: { monthly: 29,     annual: 290     },
    NGN: { monthly: 39000,  annual: 390000  },
  },
  pro: {
    USD: { monthly: 59,     annual: 590     },
    NGN: { monthly: 79000,  annual: 790000  },
  },
  agency: {
    USD: { monthly: 119,    annual: 1190    },
    NGN: { monthly: 159000, annual: 1590000 },
  },
};

export const VALID_PLANS:      PlanKey[]  = ['starter', 'pro', 'agency'];
export const VALID_PERIODS:    Period[]   = ['monthly', 'annual'];
export const VALID_CURRENCIES: Currency[] = ['USD', 'NGN'];

export function isPlanKey(v: unknown): v is PlanKey {
  return VALID_PLANS.includes(v as PlanKey);
}
export function isPeriod(v: unknown): v is Period {
  return VALID_PERIODS.includes(v as Period);
}
export function isCurrency(v: unknown): v is Currency {
  return VALID_CURRENCIES.includes(v as Currency);
}

export function renewalDays(period: Period): number {
  return period === 'annual' ? 365 : 30;
}
