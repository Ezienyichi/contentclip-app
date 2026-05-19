'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface ClipRow {
  id: string;
  user_id: string;
  source_url: string;
  status: string;
  prompt: string;
  num_clips: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  failed: '#f87171',
  processing: '#f59e0b',
  queued: '#60a5fa',
};

export default function AdminClips() {
  const [clips, setClips] = useState<ClipRow[]>([]);
  const [loading, setLoading] = useState(true);

  const counts = {
    total: clips.length,
    completed: clips.filter((c) => c.status === 'completed').length,
    failed: clips.filter((c) => c.status === 'failed').length,
    processing: clips.filter((c) => c.status === 'processing' || c.status === 'queued').length,
  };

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('clip_jobs').select('id, user_id, source_url, status, prompt, num_clips, created_at').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { setClips(data ?? []); setLoading(false); });
  }, []);

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#fff' }}>Clip Jobs</h1>
      <p style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{clips.length} total jobs</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total', value: counts.total, color: '#fff' },
          { label: 'Completed', value: counts.completed, color: '#10b981' },
          { label: 'Failed', value: counts.failed, color: '#f87171' },
          { label: 'In Progress', value: counts.processing, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
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
                  {['User', 'Source URL', 'Clips', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clips.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontSize: '12px' }}>{c.user_id.slice(0, 8)}...</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{c.source_url}</a>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{c.num_clips ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLORS[c.status] ?? '#fff', background: `${STATUS_COLORS[c.status] ?? '#fff'}18`, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {c.status ?? 'unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {clips.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>No clip jobs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
