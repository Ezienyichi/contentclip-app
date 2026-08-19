'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { colors as _colors, gradients, radius } from '@/lib/tokens';

const colors = {
  ..._colors,
  background:              '#E4E2DD',
  surfaceContainer:        '#EFECEA',
  surfaceContainerHigh:    '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest:  '#F5F3EF',
  onSurface:               '#1A1714',
  onSurfaceVariant:        '#6B6560',
  outlineVariant:          'rgba(0,0,0,0.12)',
};

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" fill="#010101"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <defs>
      <radialGradient id="ig-sched" cx="30%" cy="107%" r="150%">
        <stop offset="0%"  stopColor="#fdf497"/>
        <stop offset="5%"  stopColor="#fdf497"/>
        <stop offset="45%" stopColor="#fd5949"/>
        <stop offset="60%" stopColor="#d6249f"/>
        <stop offset="90%" stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#ig-sched)"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" fill="#FF0000"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.261 2.25H8.08l4.261 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="#000000"/>
  </svg>
);

const PLATFORMS: { id: string; label: string; sublabel: string; icon: React.ReactNode; bgColor: string }[] = [
  { id: 'tiktok',    label: 'TikTok',           sublabel: 'Short-form vertical video', icon: <TikTokIcon />,    bgColor: 'rgba(1,1,1,0.08)'     },
  { id: 'instagram', label: 'Instagram Reels',  sublabel: 'Reels up to 90 seconds',   icon: <InstagramIcon />, bgColor: 'rgba(214,36,159,0.10)' },
  { id: 'youtube',   label: 'YouTube Shorts',   sublabel: 'Shorts under 60 seconds',  icon: <YouTubeIcon />,   bgColor: 'rgba(255,0,0,0.08)'    },
  { id: 'facebook',  label: 'Facebook',         sublabel: 'Reels & feed video',       icon: <FacebookIcon />,  bgColor: 'rgba(24,119,242,0.10)' },
  { id: 'twitter',   label: 'X (Twitter)',      sublabel: 'Video posts & threads',    icon: <XIcon />,         bgColor: 'rgba(0,0,0,0.07)'      },
];

const POST_STATUSES = [
  { label: 'Scheduled',  desc: 'Queued and waiting for its posting time.',              bg: 'rgba(59,130,246,0.10)',  color: '#2563EB' },
  { label: 'Publishing', desc: 'Being sent to the platform right now.',                 bg: 'rgba(245,158,11,0.10)',  color: '#D97706' },
  { label: 'Published',  desc: 'Live on the platform. Shareable link available.',       bg: 'rgba(5,150,105,0.10)',   color: '#059669' },
  { label: 'Failed',     desc: 'Something went wrong. We\'ll retry or notify you.',    bg: 'rgba(220,38,38,0.10)',   color: '#DC2626' },
];

const MOCK_QUEUE: { platform: string; title: string; date: string; time: string; status: string }[] = [
  { platform: 'TikTok',          title: 'Sunday Sermon Highlights',  date: 'Mon, Aug 18', time: '9:00 AM',  status: 'Published'  },
  { platform: 'Instagram Reels', title: 'Top 3 Quotes This Week',    date: 'Mon, Aug 18', time: '2:00 PM',  status: 'Scheduled'  },
  { platform: 'YouTube Shorts',  title: 'Faith Over Fear — Clip 1',  date: 'Tue, Aug 19', time: '10:00 AM', status: 'Publishing' },
  { platform: 'Facebook',        title: 'Wednesday Message Clip',    date: 'Tue, Aug 19', time: '3:00 PM',  status: 'Failed'     },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Scheduled:  { bg: 'rgba(59,130,246,0.12)',  color: '#2563EB' },
  Publishing: { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  Published:  { bg: 'rgba(5,150,105,0.12)',   color: '#059669' },
  Failed:     { bg: 'rgba(220,38,38,0.12)',   color: '#DC2626' },
};

export default function SchedulerPage() {
  return (
    <DashboardLayout
      title="Scheduler"
      subtitle="Auto-post your clips to every platform"
      bg="#E4E2DD"
      titleColor="#1A1714"
      subtitleColor="#6B6560"
    >
      {/* ── Coming Soon Banner ── */}
      <div style={{
        background: '#1A1714',
        borderRadius: radius.xl,
        padding: '32px 36px',
        marginBottom: 28,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', marginBottom: 10 }}>
              Coming Soon
            </span>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Post for Me: Automatic Scheduling
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.55)', maxWidth: 480, lineHeight: 1.6 }}>
              Generate your clips, connect your accounts once, and let VangelClip handle the rest. Your content goes live at the right time on every platform, with no manual uploading and no missed posting windows.
            </p>
          </div>
          <button
            disabled
            style={{ padding: '12px 24px', borderRadius: radius.md, background: 'rgba(155,93,229,0.2)', border: '1px solid rgba(155,93,229,0.35)', color: 'rgba(155,93,229,0.7)', fontWeight: 700, fontSize: 13, cursor: 'not-allowed', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap', alignSelf: 'flex-start' }}
          >
            Join Waitlist
          </button>
        </div>

        {/* 3-step flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 12 }}>
          {[
            { icon: '🔗', step: 'Connect your accounts', desc: 'Link TikTok, Instagram, YouTube, Facebook & X in one place' },
            { icon: '🗓️', step: 'Schedule your clips',   desc: 'Pick posting times or let us suggest the best windows'     },
            { icon: '🚀', step: 'We post automatically', desc: 'Clips go live on schedule so you can focus on creating'     },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div style={{ flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.04)', borderRadius: radius.md, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{s.step}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
              {i < 2 && (
                <div style={{ padding: '0 10px', color: 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: 300, flexShrink: 0 }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Platforms Coming at Launch ── */}
      <div style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
          Platforms Coming at Launch
        </h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: '0 0 14px', opacity: 0.8 }}>
          Connect once and we handle posting, timing, and retries across all of them.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 32 }}>
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
            <div style={{ width: 40, height: 40, borderRadius: radius.md, background: p.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {p.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface }}>{p.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sublabel}</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9B5DE5', background: 'rgba(155,93,229,0.10)', padding: '3px 8px', borderRadius: radius.full, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.03em' }}>
              Soon
            </span>
          </div>
        ))}
      </div>

      {/* ── Post Statuses ── */}
      <div style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
          Post States
        </h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: '0 0 14px', opacity: 0.8 }}>
          Every scheduled post will show one of these statuses so you always know what&apos;s happening.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 32 }}>
        {POST_STATUSES.map(s => (
          <div key={s.label} style={{ background: colors.surfaceContainer, border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: radius.full, letterSpacing: '0.03em' }}>
              {s.label}
            </span>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Upcoming Queue Preview ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>
            Upcoming Queue
          </h3>
          <p style={{ fontSize: 12, color: colors.onSurfaceVariant, margin: 0, opacity: 0.7 }}>Sample of what your queue will look like</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest, padding: '4px 10px', borderRadius: radius.full, border: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          Preview only
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {MOCK_QUEUE.map((item, i) => {
          const plat = PLATFORMS.find(p => p.label === item.platform);
          const st   = STATUS_STYLE[item.status] ?? STATUS_STYLE.Scheduled;
          return (
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
                opacity: 0.65,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: radius.md, background: plat?.bgColor ?? colors.surfaceContainerHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {plat?.icon ?? '📱'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant }}>{item.platform} · {item.date} at {item.time}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: radius.full, flexShrink: 0, letterSpacing: '0.02em' }}>
                {item.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── How it Works ── */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        How it Works
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {[
          {
            step: '01',
            title: 'Connect your accounts',
            desc:  'Link TikTok, Instagram, YouTube, Facebook, and X once. VangelClip stores your tokens securely, so you never re-authenticate.',
          },
          {
            step: '02',
            title: 'Generate your clips',
            desc:  'Process any long video and get AI-selected, captioned clips ready to publish. Choose the ones you want scheduled.',
          },
          {
            step: '03',
            title: 'Set your schedule',
            desc:  'Pick posting times manually, or let VangelClip suggest the highest-engagement windows per platform and audience.',
          },
          {
            step: '04',
            title: 'We post for you',
            desc:  'Clips go live at exactly the right time. Track every post\'s status from one dashboard: Scheduled, Publishing, Published, or Failed.',
          },
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
            <p style={{ margin: '6px 0 6px', fontSize: 14, fontWeight: 700, color: colors.onSurface }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.onSurfaceVariant, lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
