'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

const ADMIN_EMAILS = ['adminvangelclip@gmail.com'];

const NAV_LINKS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Clips', href: '/admin/clips' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Events', href: '/admin/events' },
  { label: 'System', href: '/admin/system' },
  { label: 'Alerts', href: '/admin/alerts' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
        router.replace(user ? '/dashboard' : '/auth?next=/admin');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Verifying access...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '56px', gap: '32px' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Vangel<span style={{ color: '#7c3aed' }}>Clip</span></span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.15)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.08em' }}>ADMIN</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflowX: 'auto' }}>
            {NAV_LINKS.map((link) => {
              const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.5)', background: active ? 'rgba(124,58,237,0.2)' : 'transparent', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/dashboard" style={{ textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            ← Exit Admin
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
}
