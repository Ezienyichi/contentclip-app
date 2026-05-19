'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  plan: string;
  status: string;
  created_at: string;
}

export default function AdminRevenue() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('transactions').select('id, user_id, amount, plan, status, created_at').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { setTransactions(data ?? []); setLoading(false); });
  }, []);

  const completed = transactions.filter((t) => t.status === 'completed');
  const totalRevenue = completed.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const avgTransaction = completed.length > 0 ? totalRevenue / completed.length : 0;

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#fff' }}>Revenue</h1>
      <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{transactions.length} total transactions</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Revenue', value: `$${(totalRevenue / 100).toFixed(2)}`, sub: 'completed only' },
          { label: 'Completed', value: completed.length, sub: `of ${transactions.length} transactions` },
          { label: 'Avg Transaction', value: `$${(avgTransaction / 100).toFixed(2)}` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: '#fff' }}>{value}</div>
            {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['User', 'Plan', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: '12px' }}>{t.user_id.slice(0, 8)}...</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{t.plan ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>${((t.amount ?? 0) / 100).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: t.status === 'completed' ? '#10b981' : t.status === 'failed' ? '#f87171' : '#f59e0b', background: t.status === 'completed' ? 'rgba(16,185,129,0.12)' : t.status === 'failed' ? 'rgba(248,113,113,0.12)' : 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {t.status ?? 'unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
