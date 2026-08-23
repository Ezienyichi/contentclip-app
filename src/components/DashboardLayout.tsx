'use client';
import React from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { colors } from '@/lib/tokens';
import { useInactivityLogout } from '@/lib/useInactivityLogout';

export default function DashboardLayout({ children, title, subtitle, actions, bg, titleColor, subtitleColor }: { children: React.ReactNode; title?: string; subtitle?: string; actions?: React.ReactNode; bg?: string; titleColor?: string; subtitleColor?: string }) {
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
