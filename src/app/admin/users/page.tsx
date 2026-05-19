'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface UserRow {
  id: string;
  email: string;
  plan: string;
  credits: number;
  created_at: string;
}

const PLANS = ['all', 'free', 'starter', 'pro', 'enterprise'];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('profiles').select('id, email, plan, credits, created_at').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { setUsers(data ?? []); setFiltered(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    let result = users;
    if (plan !== 'all') result = result.filter((u) => u.plan === plan);
    if (search.trim()) result = result.filter((u) => (u.email ?? '').toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [search, plan, users]);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#fff' }}>Users</h1>
      <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{users.length} total users</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          style={{ flex: 1, minWidth: '240px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
        >
          {PLANS.map((p) => <option key={p} value={p} style={{ background: '#1a1a2e' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Email', 'Plan', 'Credits', 'Joined'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: '#fff' }}>{u.email ?? <span style={{ color: 'rgba(255,255,255,0.3)' }}>{u.id.slice(0, 12)}...</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: u.plan === 'pro' ? '#a78bfa' : u.plan === 'starter' ? '#60a5fa' : 'rgba(255,255,255,0.5)', background: u.plan === 'pro' ? 'rgba(124,58,237,0.15)' : u.plan === 'starter' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {u.plan ?? 'free'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{u.credits ?? 0}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
