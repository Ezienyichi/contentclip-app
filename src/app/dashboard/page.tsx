'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
import { createClient } from '@/lib/supabase-browser';

type Job = {
  id: string;
  source_url: string;
  status: string;
  num_clips: number | null;
  created_at: string;
};

type Profile = {
  plan: string;
  credits: number;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sourceLabel(url: string): string {
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v');
    return v ? `youtube.com/watch?v=${v}` : u.hostname.replace('www.', '') + u.pathname.slice(0, 30);
  } catch {
    return url.slice(0, 50);
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clipCount, setClipCount] = useState(0);
  const [jobTotal, setJobTotal] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setUserEmail(user.email ?? null);
      Promise.all([
        supabase.from('profiles').select('plan, credits, full_name').eq('id', user.id).single(),
        supabase.from('clip_jobs').select('id, source_url, status, num_clips, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('clip_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clips').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]).then(([profileRes, jobsRes, jobCountRes, clipsRes]) => {
        if (profileRes.data) {
          setProfile(profileRes.data);
          setUserName((profileRes.data as any).full_name ?? null);
        }
        setJobs(jobsRes.data ?? []);
        setJobTotal(jobCountRes.count ?? 0);
        setClipCount(clipsRes.count ?? 0);
        setLoading(false);
      });
    });
  }, []);

  const planLabel = profile
    ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
    : '—';

  const STATS = [
    { label: 'Clips Generated', value: loading ? '—' : String(clipCount),         icon: 'movie_edit',        color: '#C0C1FF' },
    { label: 'Credits Remaining', value: loading ? '—' : String(profile?.credits ?? 0), icon: 'toll',         color: '#89CEFF' },
    { label: 'Projects',          value: loading ? '—' : String(jobTotal),         icon: 'folder_open',       color: '#ff97b5' },
    { label: 'Plan',              value: loading ? '—' : planLabel,                icon: 'workspace_premium', color: '#4ade80' },
  ];

  return (
    <DashboardLayout
      title={`Welcome back${userName ? `, ${userName.split(' ')[0]}` : ''}`}
      subtitle={userEmail ?? "Here's your account at a glance."}
      actions={
        <button
          onClick={() => router.push('/import')}
          style={{ background: gradients.cta, color: '#fff', padding: '10px 20px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter',sans-serif" }}
        >
          <Icon name="add_circle" size={18} /> New Project
        </button>
      }
    >
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: radius.md, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon name={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Projects</h2>
          <button
            onClick={() => router.push('/import')}
            style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
          >
            + New Project
          </button>
        </div>

        {loading ? (
          <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '32px', textAlign: 'center' }}>
            <span style={{ color: colors.onSurfaceVariant, fontSize: '14px' }}>Loading…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}><Icon name="movie_creation" size={40} style={{ color: colors.onSurfaceVariant }} /></div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No projects yet</p>
            <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, marginBottom: '24px' }}>
              Import a YouTube video to generate your first clips.
            </p>
            <button
              onClick={() => router.push('/import')}
              style={{ background: gradients.cta, color: '#fff', padding: '10px 24px', borderRadius: radius.md, fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
            >
              Import Video
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobs.map(j => (
              <div
                key={j.id}
                onClick={() => j.status === 'complete' ? router.push('/clips') : undefined}
                style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: j.status === 'complete' ? 'pointer' : 'default' }}
              >
                <div style={{ width: 56, height: 42, borderRadius: radius.md, background: colors.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="play_circle" size={22} style={{ color: colors.onSurfaceVariant }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sourceLabel(j.source_url)}
                  </p>
                  <span style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>{timeAgo(j.created_at)}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {j.status === 'complete'
                    ? <span style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80' }}>{j.num_clips ?? 0} clips</span>
                    : <span style={{ fontSize: '12px', fontWeight: 600, color: colors.primary }}>Processing…</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{'@media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:480px){.stats-grid{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
