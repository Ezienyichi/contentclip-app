'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';

// Display-only prices — actual charge is enforced server-side in BILLING_PLANS
const PLANS = [
  { key: 'starter', name: 'Starter', monthly: 29,  annual: 290,  annualMo: 24, minutes: 180 },
  { key: 'pro',     name: 'Pro',     monthly: 59,  annual: 590,  annualMo: 49, minutes: 400, badge: 'Most Popular' },
  { key: 'agency',  name: 'Agency',  monthly: 119, annual: 1190, annualMo: 99, minutes: 900 },
] as const;

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const router   = useRouter();
  const [annual,  setAnnual]  = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleUpgrade(planKey: string) {
    setLoading(planKey);
    setError(null);
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planKey, period: annual ? 'annual' : 'monthly' }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push('/auth'); return; }
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed.');
      window.location.href = data.payment_link;
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setLoading(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, backdropFilter: 'blur(2px)' }}
      />

      {/* Modal container — centres on desktop, sits at bottom on mobile */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
        <div
          className="upgrade-modal-card"
          style={{
            background:   colors.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding:      '28px 24px 24px',
            width:        '100%',
            maxWidth:     '520px',
            maxHeight:    '92vh',
            overflowY:    'auto',
            pointerEvents:'auto',
            border:       '1px solid rgba(255,255,255,0.07)',
            boxShadow:    shadows.float,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Upgrade Your Plan</h2>
              <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, margin: '4px 0 0' }}>More minutes, more power. Billed securely via Flutterwave.</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: radius.full, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurfaceVariant, flexShrink: 0, marginLeft: 12 }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Monthly / Annual toggle */}
          <div style={{ display: 'inline-flex', background: colors.surfaceContainerHigh, borderRadius: radius.full, padding: '3px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ padding: '6px 18px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: !annual ? gradients.primary : 'transparent', color: !annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '12px', fontFamily: "'Inter', sans-serif', transition: 'background 0.15s'" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ padding: '6px 18px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: annual ? gradients.primary : 'transparent', color: annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '12px', fontFamily: "'Inter', sans-serif" }}
            >
              Annual&nbsp;<span style={{ color: annual ? 'rgba(255,255,255,0.75)' : '#34D399', fontSize: '10px', fontWeight: 700 }}>–20%</span>
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: radius.md, padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Icon name="error" size={16} style={{ color: '#FCA5A5', flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Plan cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLANS.map(p => {
              const isHighlight = p.key === 'pro';
              const isLoading   = loading === p.key;
              const price       = annual ? p.annualMo : p.monthly;

              return (
                <div
                  key={p.key}
                  style={{
                    background:   isHighlight ? 'rgba(155,93,229,0.12)' : colors.surfaceContainerHigh,
                    border:       isHighlight ? '1px solid rgba(155,93,229,0.45)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: radius.lg,
                    padding:      '14px 16px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '12px',
                    position:     'relative',
                  }}
                >
                  {p.badge && (
                    <div style={{ position: 'absolute', top: '-9px', left: '14px', background: gradients.primary, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 10px', borderRadius: radius.full, letterSpacing: '0.05em' }}>
                      {p.badge}
                    </div>
                  )}

                  {/* Plan info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>{p.minutes.toLocaleString()} min/mo</div>
                    {annual && (
                      <div style={{ fontSize: '11px', color: '#34D399', marginTop: '2px' }}>Billed ${p.annual}/yr</div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>${price}</span>
                    <span style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>/mo</span>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleUpgrade(p.key)}
                    disabled={!!loading}
                    style={{
                      background:  isHighlight ? gradients.primary : 'rgba(255,255,255,0.08)',
                      color:       '#fff',
                      border:      isHighlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius:radius.md,
                      padding:     '9px 14px',
                      fontWeight:  700,
                      fontSize:    '13px',
                      cursor:      loading ? 'wait' : 'pointer',
                      fontFamily:  "'Inter', sans-serif",
                      opacity:     loading && !isLoading ? 0.45 : 1,
                      flexShrink:  0,
                      whiteSpace:  'nowrap',
                      minWidth:    '90px',
                    }}
                  >
                    {isLoading ? 'Opening…' : `Get ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, marginTop: '16px', textAlign: 'center', lineHeight: 1.5, opacity: 0.7 }}>
            Secure payment · Cancel anytime · Quota resets on renewal
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .upgrade-modal-card { padding: 20px 16px 20px !important; border-radius: 20px 20px 0 0 !important; }
        }
      `}</style>
    </>
  );
}
