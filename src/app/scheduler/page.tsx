'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { colors as _colors, gradients, radius } from '@/lib/tokens';

const colors = {
  ..._colors,
  background: '#E4E2DD',
  surfaceContainer: '#EFECEA',
  surfaceContainerHigh: '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest: '#F5F3EF',
  onSurface: '#1A1714',
  onSurfaceVariant: '#6B6560',
  outlineVariant: 'rgba(0,0,0,0.12)',
};

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',            icon: '📱', color: '#010101' },
  { id: 'instagram', label: 'Instagram Reels',   icon: '📸', color: '#E1306C' },
  { id: 'youtube',   label: 'YouTube Shorts',    icon: '▶️', color: '#FF0000' },
  { id: 'facebook',  label: 'Facebook',          icon: '👥', color: '#1877F2' },
  { id: 'twitter',   label: 'X (Twitter)',       icon: '🐦', color: '#1DA1F2' },
];

const MOCK_QUEUE = [
  { platform: 'TikTok',          title: 'Sunday Sermon Highlights', date: 'Mon, Aug 18', time: '9:00 AM', status: 'scheduled' },
  { platform: 'Instagram Reels', title: 'Top 3 Quotes This Week',   date: 'Mon, Aug 18', time: '2:00 PM', status: 'scheduled' },
  { platform: 'YouTube Shorts',  title: 'Faith Over Fear — Clip 1', date: 'Tue, Aug 19', time: '10:00 AM', status: 'scheduled' },
];

export default function SchedulerPage() {
  return (
    <DashboardLayout
      title="Scheduler"
      subtitle="Schedule clips to social media"
      bg="#E4E2DD"
      titleColor="#1A1714"
      subtitleColor="#6B6560"
    >
      {/* Coming Soon Banner */}
      <div style={{
        background: '#1A1714',
        borderRadius: radius.xl,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Coming Soon
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>
            Post for Me — Automatic Scheduling
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 460 }}>
            Connect your TikTok, Instagram, YouTube, and more. We&apos;ll post your clips at the best times automatically.
          </p>
        </div>
        <button
          disabled
          style={{ padding: '12px 24px', borderRadius: radius.md, background: 'rgba(155,93,229,0.2)', border: '1px solid rgba(155,93,229,0.35)', color: 'rgba(155,93,229,0.7)', fontWeight: 700, fontSize: 13, cursor: 'not-allowed', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}
        >
          Join Waitlist
        </button>
      </div>

      {/* Platform Connection Cards */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Connected Platforms
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        {PLATFORMS.map(p => (
          <div
            key={p.id}
            style={{
              background: colors.surfaceContainer,
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: radius.lg,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface }}>{p.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant }}>Not connected</p>
            </div>
            <button
              disabled
              style={{ padding: '6px 12px', borderRadius: radius.sm, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: colors.onSurfaceVariant, fontSize: 11, fontWeight: 600, cursor: 'not-allowed', fontFamily: "'Inter',sans-serif" }}
            >
              Connect
            </button>
          </div>
        ))}
      </div>

      {/* Scheduled Queue Preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
          Upcoming Queue
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest, padding: '4px 10px', borderRadius: radius.full, border: '1px solid rgba(0,0,0,0.07)' }}>
          Preview only
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {MOCK_QUEUE.map((item, i) => (
          <div
            key={i}
            style={{
              background: colors.surfaceContainer,
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: radius.lg,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: 0.6,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: radius.md, background: colors.surfaceContainerHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              {PLATFORMS.find(p => p.label === item.platform)?.icon ?? '📱'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant }}>{item.platform} · {item.date} at {item.time}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6560', background: colors.surfaceContainerHighest, padding: '4px 10px', borderRadius: radius.full, flexShrink: 0 }}>
              Pending
            </span>
          </div>
        ))}
      </div>

      {/* How it will work */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        How it Works
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {[
          { step: '01', title: 'Connect accounts', desc: 'Link your TikTok, Instagram, YouTube, and more in one place.' },
          { step: '02', title: 'Generate clips', desc: 'Use VangelClip to extract your best moments automatically.' },
          { step: '03', title: 'Set a schedule', desc: 'Choose your posting frequency and preferred times per platform.' },
          { step: '04', title: 'We post for you', desc: 'Clips go live at the optimal time — no manual effort required.' },
        ].map(item => (
          <div
            key={item.step}
            style={{
              background: colors.surfaceContainer,
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: radius.lg,
              padding: '18px 20px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: colors.primary, letterSpacing: '0.05em' }}>{item.step}</span>
            <p style={{ margin: '6px 0 4px', fontSize: 14, fontWeight: 700, color: colors.onSurface }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
