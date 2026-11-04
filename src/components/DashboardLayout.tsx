'use client';
import React from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { colors } from '@/lib/tokens';
import { useInactivityLogout } from '@/lib/useInactivityLogout';
import { UploadProvider, useUploadContext } from '@/lib/upload-context';

// ── Floating upload progress widget ──────────────────────────────────────────

function UploadWidget() {
  const { phase, fileName, uploadProgress, error, dismiss } = useUploadContext();
  if (phase === 'idle') return null;

  const shortName = fileName.length > 28 ? fileName.slice(0, 25) + '…' : fileName;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
      background: '#1A1714', borderRadius: 14, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
      minWidth: 260, maxWidth: 320, fontFamily: 'inherit',
    }}>
      {phase === 'uploading' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#E4E2DD', fontWeight: 600 }}>Uploading</span>
            <span style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{uploadProgress}%</span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: colors.onSurfaceVariant, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</p>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg,#9B5DE5,#7C3AED)', transition: 'width 0.3s ease', borderRadius: 2 }} />
          </div>
        </>
      )}

      {phase === 'clipping' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, height: 20, border: '2px solid #9B5DE5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'uw-spin 0.8s linear infinite', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#E4E2DD', fontWeight: 600 }}>Processing clips…</p>
            <p style={{ margin: 0, fontSize: 12, color: colors.onSurfaceVariant, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName}</p>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#E4E2DD', fontWeight: 600 }}>Clips ready!</p>
            <Link href="/clips" style={{ fontSize: 12, color: '#9B5DE5', textDecoration: 'none' }}>View in My Clips →</Link>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#E4E2DD', fontWeight: 600 }}>Upload failed</p>
            <p style={{ margin: 0, fontSize: 12, color: colors.onSurfaceVariant, wordBreak: 'break-word' }}>{error}</p>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
        </div>
      )}

      <style>{`@keyframes uw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

function DashboardInner({ children, title, subtitle, actions, bg, titleColor, subtitleColor }: { children: React.ReactNode; title?: string; subtitle?: string; actions?: React.ReactNode; bg?: string; titleColor?: string; subtitleColor?: string }) {
  const { warning, stayLoggedIn } = useInactivityLogout();

  return (
    <div style={{ minHeight: '100vh', background: bg ?? colors.background }}>
      <Sidebar />
      <main className="dashboard-main" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
        <header style={{ padding: '24px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            {title && <h1 style={{ fontSize: '28px', fontWeight: 800, color: titleColor ?? '#fff', letterSpacing: '-0.02em' }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: '14px', color: subtitleColor ?? colors.onSurfaceVariant, marginTop: '4px' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {actions && actions}
            <NotificationBell />
          </div>
        </header>
        <div style={{ padding: '24px 32px', paddingBottom: '100px' }}>{children}</div>
      </main>

      <UploadWidget />

      {warning && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#1A1714', borderRadius: 12, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: '90vw', width: 'max-content' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#E4E2DD', fontWeight: 500 }}>
            You&apos;ll be signed out in 2 minutes due to inactivity.
          </p>
          <button onClick={stayLoggedIn} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#9B5DE5,#7C3AED)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            Stay logged in
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) { .dashboard-main { margin-left: 256px; } }
        @media (max-width: 768px) {
          .dashboard-main { margin-left: 0; }
          .dashboard-main header { padding: 14px 14px 0 !important; }
          .dashboard-main header h1 { font-size: 20px !important; }
          .dashboard-main header p { font-size: 12px !important; }
          .dashboard-main > div:last-child { padding: 14px !important; padding-bottom: 96px !important; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout(props: { children: React.ReactNode; title?: string; subtitle?: string; actions?: React.ReactNode; bg?: string; titleColor?: string; subtitleColor?: string }) {
  return (
    <UploadProvider>
      <DashboardInner {...props} />
    </UploadProvider>
  );
}
