'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';

const P = [
  {
    n: 'Free', d: 'Try it out', badge: null,
    monthly: 0, annual: 0,
    min: 30,
    f: {
      'Minutes/month': '30',
      'Export':         '720p MP4',
      'Projects':       '1',
      'Captions':       'Basic',
      'Hook Detection': '✓',
      '9:16 Reframe':   '✓',
      'Priority Support':'—',
      'Scheduler':      '—',
    },
  },
  {
    n: 'Starter', d: 'Growing creators', badge: 'Most Popular',
    monthly: 24, annual: 19,
    min: 150,
    f: {
      'Minutes/month':  '150',
      'Export':         '1080p MP4',
      'Projects':       '5',
      'Captions':       'Custom',
      'Hook Detection': '✓',
      '9:16 Reframe':   '✓',
      'Priority Support':'—',
      'Scheduler':      'Coming soon',
    },
  },
  {
    n: 'Pro', d: 'Serious creators', badge: 'Best Value',
    monthly: 49, annual: 39,
    min: 400,
    f: {
      'Minutes/month':  '400',
      'Export':         '4K',
      'Projects':       'Unlimited',
      'Captions':       'Animated',
      'Hook Detection': '✓',
      '9:16 Reframe':   '✓',
      'Priority Support':'✓',
      'Scheduler':      'Coming soon',
    },
  },
  {
    n: 'Agency', d: 'Teams & agencies', badge: null,
    monthly: 124, annual: 99,
    min: 1200,
    f: {
      'Minutes/month':  '1,200',
      'Export':         '4K + ProRes',
      'Projects':       'Unlimited',
      'Captions':       'All styles',
      'Hook Detection': '✓',
      '9:16 Reframe':   '✓',
      'Priority Support':'✓',
      'Scheduler':      'Coming soon',
    },
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const keys = Object.keys(P[0].f);

  return (
    <div className="mkt-page" style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter',sans-serif", minHeight: '100vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: radius.md, background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="auto_awesome" size={18} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800 }}>VangelClip</span>
        </div>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#fff', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer' }}>
          Get Started
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '12px' }}>Choose Your Plan</h1>
          <p style={{ color: colors.onSurfaceVariant, fontSize: '16px', marginBottom: '28px' }}>Start free. Upgrade when you&apos;re ready.</p>
          <div style={{ display: 'inline-flex', background: colors.surfaceContainerHigh, borderRadius: radius.full, padding: '4px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: !annual ? colors.primary : 'transparent', color: !annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Monthly</button>
            <button onClick={() => setAnnual(true)}  style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: annual ? colors.primary : 'transparent', color: annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Annual <span style={{ color: annual ? '#fff' : '#4ade80', fontSize: '11px' }}>-20%</span></button>
          </div>
        </div>

        {/* Minutes explainer */}
        <div style={{ maxWidth: 600, margin: '0 auto 32px', padding: '14px 20px', borderRadius: radius.lg, background: colors.surfaceContainerHigh, border: '1px solid ' + colors.outlineVariant, fontSize: '13px', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
          <strong style={{ color: colors.onSurface }}>How minutes work:</strong> a 30-minute video uses 30 minutes, regardless of how many clips you generate. Quota resets monthly. Unused minutes don&apos;t roll over.
        </div>

        {/* Plan cards */}
        <div className="pricing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '64px' }}>
          {P.map(plan => {
            const dp = annual ? plan.annual : plan.monthly;
            const hi = plan.badge !== null;
            return (
              <div key={plan.n} style={{ background: hi ? colors.surfaceContainerHigh : colors.surfaceContainerLow, borderRadius: radius.xl, padding: '32px', border: hi ? '1px solid ' + colors.primary + '40' : '1px solid transparent', position: 'relative', boxShadow: hi ? shadows.glow : 'none' }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: gradients.primary, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: radius.full, whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{plan.n}</h3>
                <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginBottom: dp > 0 ? '12px' : '20px' }}>{plan.d}</p>
                <div style={{ marginBottom: dp > 0 ? '4px' : '16px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 800 }}>${dp}</span>
                  <span style={{ fontSize: '14px', color: colors.onSurfaceVariant }}>/mo</span>
                </div>
                {dp > 0 && (
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, margin: '0 0 8px', opacity: 0.7 }}>
                    {annual ? 'Billed annually' : 'Billed monthly'}
                  </p>
                )}
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.primary, margin: '0 0 20px' }}>
                  {plan.min.toLocaleString()} minutes/month
                </p>
                <button onClick={() => router.push('/auth')} style={{ width: '100%', background: hi ? gradients.primary : colors.surfaceContainer, color: hi ? '#FAF7FF' : colors.onSurface, border: hi ? 'none' : '1px solid ' + colors.outlineVariant, padding: '12px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  {dp === 0 ? 'Get Started' : 'Start Trial'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px', overflow: 'auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Feature Comparison</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Feature</th>
                {P.map(p => (
                  <th key={p.n} style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: 700, color: p.badge ? colors.primary : colors.onSurface, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{p.n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key, i) => (
                <tr key={key}>
                  <td style={{ padding: '12px', fontSize: '13px', color: colors.onSurfaceVariant, borderBottom: i < keys.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>{key}</td>
                  {P.map(p => {
                    const v = p.f[key as keyof typeof p.f];
                    const isComingSoon = v === 'Coming soon';
                    const isDash = v === '—';
                    return (
                      <td key={p.n} style={{ textAlign: 'center', padding: '12px', fontSize: '13px', borderBottom: i < keys.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', color: isDash ? colors.outlineVariant : v === '✓' ? '#4ade80' : isComingSoon ? colors.primary : colors.onSurface }}>
                        {v === '✓' ? <Icon name="check" size={16} style={{ color: '#4ade80' }} /> : isComingSoon ? <span style={{ fontSize: '11px', fontWeight: 600 }}>Soon</span> : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{'@media(max-width:768px){.pricing-cards{grid-template-columns:1fr!important}}'}</style>
    </div>
  );
}
