'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from './Icon';
import { colors, gradients, radius } from '@/lib/tokens';
import { createBrowserClient } from '@supabase/ssr';

const ADMIN_EMAIL = 'adminvangelclip@gmail.com';
const NAV = [
  { label: 'Home', icon: 'home', href: '/dashboard' },
  { label: 'Projects', icon: 'video_library', href: '/import' },
  { label: 'Clips', icon: 'movie_edit', href: '/clips' },
  { label: 'Analytics', icon: 'query_stats', href: '/analytics' },
  { label: 'Scheduler', icon: 'calendar_month', href: '/calendar' },
  { label: 'Templates', icon: 'dashboard', href: '/templates' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === ADMIN_EMAIL);
    });
  }, []);
  const go = (href: string) => {
    if (href === '#signout') { router.push('/auth'); return; }
    if (href === '#') return;
    router.push(href);
  };
  const content = (
    <>
      <Link href="/" style={{ textDecoration: 'none', display: 'block', padding: '8px', marginBottom: '24px' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'Arial Black, Arial, sans-serif' }}>
          Vangel<span style={{ color: '#7c3aed' }}>Clip</span>
        </span>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
          ← Home
        </div>
      </Link>
      <button onClick={() => router.push('/import')} style={{ background: gradients.cta, color: '#000', padding: '10px 16px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', marginBottom: '28px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', fontFamily: "'Inter', sans-serif" }}>
        <Icon name="add_circle" size={20} /> Create New
      </button>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map((item) => {
          const a = isActive(item.href);
          return (
            <button key={item.href} onClick={() => go(item.href)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: a ? '0 6px 6px 0' : '6px', background: a ? 'rgba(156,72,234,0.08)' : 'transparent', borderLeft: `2px solid ${a ? '#9c48ea' : 'transparent'}`, color: a ? '#cc97ff' : colors.onSurfaceVariant, fontWeight: a ? 600 : 500, fontSize: '13px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif", borderLeftStyle: 'solid' as const, borderLeftWidth: '2px', borderLeftColor: a ? '#9c48ea' : 'transparent' }}>
              <Icon name={item.icon} size={20} style={{ color: a ? '#cc97ff' : colors.onSurfaceVariant }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credits</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#cc97ff', background: 'rgba(156,72,234,0.15)', padding: '2px 8px', borderRadius: radius.full }}>PRO</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>47 <span style={{ fontSize: '12px', color: colors.onSurfaceVariant, fontWeight: 500 }}>/ 100</span></div>
        <div style={{ width: '100%', height: '4px', background: colors.surfaceContainer, borderRadius: radius.full, marginTop: '8px', overflow: 'hidden' }}>
          <div style={{ width: '47%', height: '100%', background: gradients.cta, borderRadius: radius.full }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {isAdmin && (
          <button onClick={() => router.push('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontWeight: 600, fontSize: '13px', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif", marginBottom: '4px' }}>
            <Icon name="admin_panel_settings" size={20} style={{ color: '#a78bfa' }} /><span>Admin Panel</span>
          </button>
        )}
        {[{ label: 'Support', icon: 'contact_support', href: '#' }, { label: 'Sign Out', icon: 'logout', href: '#signout' }].map((item) => (
          <button key={item.label} onClick={() => go(item.href)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', background: 'transparent', color: colors.onSurfaceVariant, fontWeight: 500, fontSize: '13px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif" }}>
            <Icon name={item.icon} size={20} /><span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
  return (
    <>
      <aside className="sidebar-desktop" style={{ position: 'fixed', left: 0, top: 0, width: '256px', height: '100vh', background: colors.surfaceContainerLowest, borderRight: '1px solid rgba(70,69,85,0.15)', display: 'flex', flexDirection: 'column', padding: '16px', zIndex: 40, overflowY: 'auto' }}>{content}</aside>
      <nav className="sidebar-mobile" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.surfaceContainerLowest, borderTop: '1px solid rgba(70,69,85,0.15)', display: 'none', justifyContent: 'space-around', padding: '8px 4px', paddingBottom: 'env(safe-area-inset-bottom, 8px)', zIndex: 40 }}>
        {[NAV[0],NAV[1],NAV[2],NAV[5],NAV[6]].map((item) => {
          const a = isActive(item.href);
          return (
            <button key={item.href} onClick={() => go(item.href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: a ? '#cc97ff' : colors.onSurfaceVariant, fontSize: '10px', fontWeight: a ? 600 : 400, fontFamily: "'Inter', sans-serif", padding: '4px 8px' }}>
              <Icon name={item.icon} size={22} filled={a} style={{ color: a ? '#cc97ff' : colors.onSurfaceVariant }} />{item.label}
            </button>
          );
        })}
      </nav>
      <style>{`
        @media (min-width: 769px) { .sidebar-desktop { display: flex !important; } .sidebar-mobile { display: none !important; } }
        @media (max-width: 768px) { .sidebar-desktop { display: none !important; } .sidebar-mobile { display: flex !important; } }
      `}</style>
    </>
  );
}
