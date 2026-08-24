'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors as _colors, gradients, radius, shadows } from '@/lib/tokens';
import { PLAN_DATA, COMPARISON_KEYS } from '@/lib/pricingData';
import { createClient } from '@/lib/supabase-browser';

const colors = {
  ..._colors,
  background:              '#E4E2DD',
  surfaceContainer:        '#EFECEA',
  surfaceContainerHigh:    '#EFECEA',
  surfaceContainerLow:     '#F5F3EF',
  surfaceContainerHighest: '#E8E5DF',
  onSurface:               '#1A1714',
  onSurfaceVariant:        '#6B6560',
  outlineVariant:          'rgba(0,0,0,0.10)',
};

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setAuthUser(data.user));
  }, []);

  return (
    <div className="mkt-page" style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter',sans-serif", minHeight: '100vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.02em', color: '#1A1714', textDecoration: 'none', fontFamily: "'Figtree',sans-serif" }}>
          Vangel<span style={{ color: '#9B5DE5' }}>Clip</span>
        </a>
        {authUser ? (
          <button onClick={() => router.push('/dashboard')} style={{ background: gradients.primary, color: '#fff', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer' }}>
            Dashboard
          </button>
        ) : (
          <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#fff', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer' }}>
            Get Started
          </button>
        )}
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '12px', color: '#1A1714' }}>Choose Your Plan</h1>
          <p style={{ color: colors.onSurfaceVariant, fontSize: '16px', marginBottom: '28px' }}>Start free. Upgrade when you&apos;re ready.</p>
          <div style={{ display: 'inline-flex', background: colors.surfaceContainerHigh, borderRadius: radius.full, padding: '4px', border: '1px solid rgba(0,0,0,0.08)' }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: !annual ? colors.primary : 'transparent', color: !annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Monthly</button>
            <button onClick={() => setAnnual(true)}  style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: annual ? colors.primary : 'transparent', color: annual ? '#fff' : colors.onSurfaceVariant, fontWeight: 600, fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Annual <span style={{ color: annual ? '#fff' : '#059669', fontSize: '11px' }}>–20%</span></button>
          </div>
        </div>

        {/* Minutes explainer */}
        <div style={{ maxWidth: 600, margin: '0 auto 32px', padding: '14px 20px', borderRadius: radius.lg, background: colors.surfaceContainerHigh, border: '1px solid rgba(0,0,0,0.08)', fontSize: '13px', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
          <strong style={{ color: colors.onSurface }}>How minutes work:</strong> a 30-minute video uses 30 minutes, regardless of how many clips you generate. Quota resets monthly. Unused minutes don&apos;t roll over.
        </div>

        {/* Plan cards */}
        <div className="pricing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '64px' }}>
          {PLAN_DATA.map(plan => {
            const dp  = annual ? plan.annual : plan.monthly;
            const hi  = plan.badge !== null;
            return (
              <div key={plan.name} style={{ background: hi ? colors.surfaceContainerHigh : colors.surfaceContainerLow, borderRadius: radius.xl, padding: '32px', border: hi ? `1px solid ${colors.primary}40` : '1px solid rgba(0,0,0,0.07)', position: 'relative', boxShadow: hi ? shadows.glow : '0 1px 3px rgba(0,0,0,0.06)' }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: gradients.primary, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: radius.full, whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: '#1A1714' }}>{plan.name}</h3>
                <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginBottom: dp > 0 ? '12px' : '20px' }}>{plan.tagline || ' '}</p>
                <div style={{ marginBottom: dp > 0 ? '4px' : '16px' }}>
                  <span style={{ fontSize: '40px', fontWeight: 800, color: '#1A1714' }}>${dp}</span>
                  <span style={{ fontSize: '14px', color: colors.onSurfaceVariant }}>/mo</span>
                </div>
                {dp > 0 && (
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, margin: '0 0 8px', opacity: 0.8 }}>
                    {annual ? `Billed annually ($${plan.annualTotal}/yr)` : 'Billed monthly'}
                  </p>
                )}
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.primary, margin: '0 0 20px' }}>
                  {plan.min.toLocaleString()} minutes/month
                </p>
                <button onClick={() => router.push('/auth')} style={{ width: '100%', background: hi ? gradients.primary : 'rgba(0,0,0,0.04)', color: hi ? '#FAF7FF' : '#1A1714', border: hi ? 'none' : '1px solid rgba(0,0,0,0.10)', padding: '12px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  {dp === 0 ? 'Get Started' : 'Start Trial'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px', border: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: '#1A1714' }}>Feature Comparison</h2>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Feature</th>
                {PLAN_DATA.map(p => (
                  <th key={p.name} style={{ textAlign: 'center', padding: '12px', fontSize: '13px', fontWeight: 700, color: p.badge ? colors.primary : '#1A1714', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_KEYS.map((key, i) => (
                <tr key={key}>
                  <td style={{ padding: '12px', fontSize: '13px', color: colors.onSurfaceVariant, borderBottom: i < COMPARISON_KEYS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>{key}</td>
                  {PLAN_DATA.map(p => {
                    const v = p.comparison[key];
                    const isComingSoon = v === 'Coming soon';
                    const isDash = v === '—';
                    return (
                      <td key={p.name} style={{ textAlign: 'center', padding: '12px', fontSize: '13px', borderBottom: i < COMPARISON_KEYS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', color: isDash ? 'rgba(0,0,0,0.25)' : v === '✓' ? '#059669' : isComingSoon ? colors.primary : '#1A1714' }}>
                        {v === '✓' ? <Icon name="check" size={16} style={{ color: '#059669' }} /> : isComingSoon ? <span style={{ fontSize: '11px', fontWeight: 600 }}>Soon</span> : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <style>{'@media(max-width:900px){.pricing-cards{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:540px){.pricing-cards{grid-template-columns:1fr!important}}'}</style>
    </div>
  );
}
