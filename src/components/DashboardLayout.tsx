'use client';
import React from 'react';
import Sidebar from './Sidebar';
import { colors } from '@/lib/tokens';
export default function DashboardLayout({ children, title, subtitle, actions }: { children: React.ReactNode; title?: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.background }}>
      <Sidebar />
      <main className="dashboard-main" style={{ minHeight: '100vh' }}>
        {title && (
          <header style={{ padding: '24px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{title}</h1>
              {subtitle && <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, marginTop: '4px' }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>{actions}</div>}
          </header>
        )}
        <div style={{ padding: '24px 32px', paddingBottom: '100px' }}>{children}</div>
      </main>
      <style>{`
        @media (min-width: 769px) { .dashboard-main { margin-left: 256px; } }
        @media (max-width: 768px) { .dashboard-main { margin-left: 0; } .dashboard-main header { padding: 16px 16px 0 !important; } .dashboard-main > div:last-child { padding: 16px !important; } }
      `}</style>
    </div>
  );
}
