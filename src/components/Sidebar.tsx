'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from './Icon';
import { colors, gradients, radius } from '@/lib/tokens';
import { createClient } from '@/lib/supabase-browser';
import { clearClipStorage } from '@/lib/clearClipStorage';
import { planMinutes } from '@/lib/planLimits';
import UpgradeModal from './UpgradeModal';

const ADMIN_EMAIL = 'adminvangelclip@gmail.com';
const NAV = [
  { label: 'Home',      icon: 'home',           href: '/dashboard' },
  { label: 'Projects',  icon: 'video_library',  href: '/import' },
  { label: 'Clips',     icon: 'movie_edit',     href: '/clips' },
  { label: 'Scheduler', icon: 'calendar_month', href: '/scheduler' },
  { label: 'Settings',  icon: 'settings',       href: '/settings' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [credits,      setCredits]      = useState(0);
  const [plan,         setPlan]         = useState<string>('free');
  const [showMore,     setShowMore]     = useState(false);
  const [showUpgrade,  setShowUpgrade]  = useState(false);
  const [usageLoaded,  setUsageLoaded]  = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setIsAdmin(user.email === ADMIN_EMAIL);
      // Same source the dashboard and the quota check use: profiles.minutes_used.
      // (Settings reads `credits` instead — a different, prepaid balance.)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('minutes_used, plan')
        .eq('id', user.id)
        .single();
      if (error) {
        // Don't paint a misleading "0 / 30" when the read failed.
        console.warn('[Sidebar] usage fetch failed:', error.message);
        return;
      }
      if (profile) {
        setCredits(profile.minutes_used ?? 0);
        setPlan(profile.plan ?? 'free');
        setUsageLoaded(true);
      }
    });
  }, []);

  const go = async (href: string) => {
    setShowMore(false);
    if (href === '#signout') {
      clearClipStorage();
      await createClient().auth.signOut({ scope: 'global' });
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
      router.push('/auth');
      return;
    }
    if (href === '#') return;
    router.push(href);
  };

  // ── Usage widget — called as a function, NOT as <UsageWidget /> ──────────
  // Using it as a JSX component would create a new function reference each render,
  // causing React to unmount/remount it and swallow the setShowUpgrade state update.

  function renderUsageWidget(compact?: boolean) {
    const maxCr = planMinutes(plan);
    const pct   = Math.min(100, maxCr > 0 ? Math.round((credits / maxCr) * 100) : 0);
    return (
      <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: compact ? '12px' : '16px', marginBottom: compact ? '8px' : '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minutes</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#cc97ff', background: 'rgba(156,72,234,0.15)', padding: '2px 8px', borderRadius: radius.full }}>{usageLoaded ? plan.toUpperCase() : '—'}</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
          {usageLoaded ? credits : '—'}{' '}
          <span style={{ fontSize: '12px', color: colors.onSurfaceVariant, fontWeight: 500 }}>/ {maxCr}</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: colors.surfaceContainer, borderRadius: radius.full, marginTop: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: gradients.cta, borderRadius: radius.full }} />
        </div>
        {plan !== 'agency' && (
          <button onClick={() => { setShowMore(false); setShowUpgrade(true); }} style={{ marginTop: '10px', fontSize: '11px', color: '#cc97ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Inter', sans-serif" }}>
            Upgrade plan →
          </button>
        )}
      </div>
    );
  }

  // ── One nav row. Shared so Settings can be rendered apart from the rest,
  //    with the usage widget sitting between them.
  function navButton(item: { label: string; icon: string; href: string }) {
    const a = isActive(item.href);
    return (
      <button key={item.href} onClick={() => go(item.href)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: a ? '0 6px 6px 0' : '6px', background: a ? 'rgba(156,72,234,0.08)' : 'transparent', color: a ? '#cc97ff' : colors.onSurfaceVariant, fontWeight: a ? 600 : 500, fontSize: '13px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif", flexShrink: 0, borderLeftStyle: 'solid' as const, borderLeftWidth: '2px', borderLeftColor: a ? '#9c48ea' : 'transparent' }}>
        <Icon name={item.icon} size={20} style={{ color: a ? '#cc97ff' : colors.onSurfaceVariant }} />
        <span style={{ flex: 1 }}>{item.label}</span>
      </button>
    );
  }

  // ── Bottom-item buttons (Support, Sign Out) ───────────────────────────────

  const BottomActions = ({ large }: { large?: boolean }) => (
    <>
      {isAdmin && (
        <button onClick={() => go('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: large ? '14px 12px' : '10px 12px', borderRadius: '6px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontWeight: 600, fontSize: large ? '14px' : '13px', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif", marginBottom: '4px' }}>
          <Icon name="admin_panel_settings" size={large ? 22 : 20} style={{ color: '#a78bfa' }} /><span>Admin Panel</span>
        </button>
      )}
      <button onClick={() => go('/about#contact')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: large ? '14px 12px' : '10px 12px', borderRadius: '6px', background: 'transparent', color: colors.onSurfaceVariant, fontWeight: 500, fontSize: large ? '14px' : '13px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif" }}>
        <Icon name="contact_support" size={large ? 22 : 20} /><span>Support</span>
      </button>
      <button onClick={() => go('#signout')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: large ? '14px 12px' : '10px 12px', borderRadius: '6px', background: 'transparent', color: '#DC2626', fontWeight: 600, fontSize: large ? '14px' : '13px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Inter', sans-serif" }}>
        <Icon name="logout" size={large ? 22 : 20} style={{ color: '#DC2626' }} /><span>Sign Out</span>
      </button>
    </>
  );

  // ── Desktop sidebar content ───────────────────────────────────────────────

  const desktopContent = (
    <>
      <Link href="/" style={{ textDecoration: 'none', display: 'block', padding: '8px', marginBottom: '24px' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'Arial Black, Arial, sans-serif' }}>
          Vangel<span style={{ color: '#7c3aed' }}>Clip</span>
        </span>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>← Home</div>
      </Link>

      <button onClick={() => router.push('/import')} style={{ background: gradients.cta, color: '#000', padding: '10px 16px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', marginBottom: '28px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', fontFamily: "'Inter', sans-serif" }}>
        <Icon name="add_circle" size={20} /> Create New
      </button>

      {/* Main nav, minus Settings — sized to its content, never grows. */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
        {NAV.filter(i => i.href !== '/settings').map(navButton)}
      </nav>

      {/* Collapsible spacer: pushes the block below to the bottom on tall
          viewports, but shrinks to 0 on short ones so nothing is pushed
          out of view. (Previously `flex:1` lived on <nav>, which could not
          collapse and forced the usage widget below the fold.) */}
      <div style={{ flex: '1 1 0', minHeight: 0 }} />

      {renderUsageWidget()}

      {/* Settings sits directly under the usage widget */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0, marginBottom: '4px' }}>
        {NAV.filter(i => i.href === '/settings').map(navButton)}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
        <BottomActions />
      </div>
    </>
  );

  // ── Mobile "More" bottom sheet ────────────────────────────────────────────

  const moreSheet = showMore && (
    <>
      <div onClick={() => setShowMore(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 49 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.surfaceContainerLowest, borderRadius: '20px 20px 0 0', padding: '0 16px 32px', zIndex: 51, border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, margin: '12px auto 20px' }} />
        {renderUsageWidget(true)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <BottomActions large />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar-desktop" style={{ position: 'fixed', left: 0, top: 0, width: '256px', height: '100vh', background: colors.surfaceContainerLowest, borderRight: '1px solid rgba(70,69,85,0.15)', display: 'flex', flexDirection: 'column', padding: '16px', zIndex: 40, overflowY: 'auto' }}>
        {desktopContent}
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="sidebar-mobile" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.surfaceContainerLowest, borderTop: '1px solid rgba(70,69,85,0.15)', display: 'none', justifyContent: 'space-around', padding: '8px 4px', paddingBottom: 'env(safe-area-inset-bottom, 8px)', zIndex: 40 }}>
        {NAV.map((item) => {
          const a = isActive(item.href);
          return (
            <button key={item.href} onClick={() => go(item.href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: a ? '#cc97ff' : colors.onSurfaceVariant, fontSize: '10px', fontWeight: a ? 600 : 400, fontFamily: "'Inter', sans-serif", padding: '4px 8px', minWidth: 48 }}>
              <Icon name={item.icon} size={22} filled={a} style={{ color: a ? '#cc97ff' : colors.onSurfaceVariant }} />
              {item.label}
            </button>
          );
        })}
        {/* More — exposes Support, Sign Out, usage */}
        <button onClick={() => setShowMore(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: showMore ? '#cc97ff' : colors.onSurfaceVariant, fontSize: '10px', fontWeight: showMore ? 600 : 400, fontFamily: "'Inter', sans-serif", padding: '4px 8px', minWidth: 48 }}>
          <Icon name="more_horiz" size={22} style={{ color: showMore ? '#cc97ff' : colors.onSurfaceVariant }} />
          More
        </button>
      </nav>

      {/* More sheet rendered at root so it covers the bottom nav */}
      {moreSheet}

      {/* Floating upgrade pill — mobile only, hidden on desktop, hidden for agency */}
      {plan !== 'agency' && (
        <button
          className="upgrade-fab"
          onClick={() => setShowUpgrade(true)}
          style={{
            position:    'fixed',
            bottom:      '68px',
            right:       '14px',
            background:  gradients.primary,
            color:       '#fff',
            border:      'none',
            borderRadius:radius.full,
            padding:     '10px 18px',
            fontWeight:  700,
            fontSize:    '13px',
            cursor:      'pointer',
            zIndex:      38,
            display:     'none',
            alignItems:  'center',
            gap:         '6px',
            boxShadow:   '0 4px 20px rgba(155,93,229,0.5)',
            fontFamily:  "'Inter', sans-serif",
          }}
        >
          <Icon name="arrow_upward" size={15} style={{ color: '#fff' }} />
          Upgrade
        </button>
      )}

      {/* Upgrade modal — rendered at root level so it covers everything */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <style>{`
        @media (min-width: 769px) { .sidebar-desktop { display: flex !important; } .sidebar-mobile { display: none !important; } .upgrade-fab { display: none !important; } }
        @media (max-width: 768px) { .sidebar-desktop { display: none !important; } .sidebar-mobile { display: flex !important; } .upgrade-fab { display: flex !important; } }
      `}</style>
    </>
  );
}
