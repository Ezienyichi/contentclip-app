'use client';
import { useEffect, useState, useCallback } from 'react';

interface StatsData {
  totalUsers: number;
  totalClips: number;
  totalRevenue: number;
  planBreakdown: Record<string, number>;
  recentUsers: Array<{ id: string; email: string; plan: string; credits: number; created_at: string }>;
  recentClips: Array<{ id: string; user_id: string; source_url: string; status: string; created_at: string }>;
  recentTransactions: Array<{ id: string; user_id: string; amount: number; plan: string; status: string; created_at: string }>;
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.8)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ padding: '24px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: '#fff' }}>{title}</h2>
      {children}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        setStats(await res.json());
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', paddingTop: '40px', textAlign: 'center' }}>Loading stats...</div>;
  }

  if (!stats) {
    return <div style={{ color: '#f87171', fontSize: '14px', paddingTop: '40px', textAlign: 'center' }}>Failed to load stats.</div>;
  }

  const planColors: Record<string, string> = { free: '#6b7280', starter: '#3b82f6', pro: '#7c3aed', enterprise: '#f59e0b' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>Admin Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Last updated {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s</p>
        </div>
        <button onClick={fetchStats} style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <MetricCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <MetricCard label="Total Clips" value={stats.totalClips.toLocaleString()} />
        <MetricCard label="Total Revenue" value={`$${(stats.totalRevenue / 100).toFixed(2)}`} sub="completed transactions" />
        <MetricCard label="Avg Credits/User" value={stats.totalUsers > 0 ? Math.round(stats.totalClips / stats.totalUsers) : 0} sub="clips per user" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {Object.entries(stats.planBreakdown).map(([plan, count]) => (
          <div key={plan} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: planColors[plan] ?? '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{plan}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <Section title="Recent Users">
          <Table
            headers={['Email', 'Plan', 'Credits', 'Joined']}
            rows={stats.recentUsers.map((u) => [
              u.email ?? u.id.slice(0, 8),
              u.plan ?? 'free',
              u.credits ?? 0,
              new Date(u.created_at).toLocaleDateString(),
            ])}
          />
        </Section>
        <Section title="Recent Clip Jobs">
          <Table
            headers={['User', 'Status', 'Created']}
            rows={stats.recentClips.map((c) => [
              c.user_id.slice(0, 8) + '...',
              c.status ?? 'unknown',
              new Date(c.created_at).toLocaleDateString(),
            ])}
          />
        </Section>
      </div>

      <Section title="Recent Transactions">
        <Table
          headers={['User', 'Plan', 'Amount', 'Status', 'Date']}
          rows={stats.recentTransactions.map((t) => [
            t.user_id.slice(0, 8) + '...',
            t.plan ?? '—',
            `$${((t.amount ?? 0) / 100).toFixed(2)}`,
            t.status ?? 'unknown',
            new Date(t.created_at).toLocaleDateString(),
          ])}
        />
      </Section>
    </div>
  );
}
