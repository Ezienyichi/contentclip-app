'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
import { createClient } from '@/lib/supabase-browser';
import { useTour } from '@/lib/useTour';
import Tour from '@/components/tour/Tour';
import TourInfoIcon from '@/components/tour/TourInfoIcon';
import { DASHBOARD_STEPS } from '@/components/tour/tourSteps';

type Profile = {
  plan: string;
  credits: number;
  minutes_used: number;
};

type RecentClip = {
  id: string;
  source_video_name: string | null;
  created_at: string;
};

type RecentPost = {
  id: string;
  platform: string;
  status: string;
  scheduled_at: string;
  published_url: string | null;
  created_at: string;
};

type ActivityItem = {
  key: string;
  label: string;
  sublabel: string;
  iconName: string;
  iconColor: string;
  created_at: string;
  link?: string;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 30, solo: 150, starter: 150, professional: 400, pro: 400, agency: 1200,
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube',
  facebook: 'Facebook', twitter: 'X (Twitter)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const tour = useTour('dashboard', DASHBOARD_STEPS.length);

  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [clipCount,      setClipCount]      = useState(0);
  const [jobTotal,       setJobTotal]       = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [recentClips,    setRecentClips]    = useState<RecentClip[]>([]);
  const [recentPosts,    setRecentPosts]    = useState<RecentPost[]>([]);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [userName,       setUserName]       = useState<string | null>(null);
  const [userEmail,      setUserEmail]      = useState<string | null>(null);

  // ── Refetch helpers (used by real-time callbacks) ─────────────────────────

  const refetchCounts = useCallback(async (uid: string) => {
    const supabase = createClient();
    const [scheduledRes, publishedRes] = await Promise.all([
      supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'scheduled'),
      supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'published'),
    ]);
    setScheduledCount(scheduledRes.count ?? 0);
    setPublishedCount(publishedRes.count ?? 0);
  }, []);

  const refetchActivity = useCallback(async (uid: string) => {
    const supabase = createClient();
    const [clipsRes, postsRes] = await Promise.all([
      supabase.from('clips').select('id, source_video_name, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('scheduled_posts').select('id, platform, status, scheduled_at, published_url, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
    ]);
    setRecentClips(clipsRes.data ?? []);
    setRecentPosts(postsRes.data ?? []);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth'); return; }
      setUserEmail(user.email ?? null);
      setUserId(user.id);
      Promise.all([
        supabase.from('profiles').select('plan, credits, full_name, minutes_used').eq('id', user.id).single(),
        supabase.from('clip_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('clips').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled'),
        supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
        supabase.from('clips').select('id, source_video_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('scheduled_posts').select('id, platform, status, scheduled_at, published_url, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]).then(([profileRes, jobCountRes, clipsRes, scheduledRes, publishedRes, recentClipsRes, recentPostsRes]) => {
        if (profileRes.data) {
          setProfile(profileRes.data as Profile);
          setUserName((profileRes.data as any).full_name ?? null);
        }
        setJobTotal(jobCountRes.count ?? 0);
        setClipCount(clipsRes.count ?? 0);
        setScheduledCount(scheduledRes.count ?? 0);
        setPublishedCount(publishedRes.count ?? 0);
        setRecentClips(recentClipsRes.data ?? []);
        setRecentPosts(recentPostsRes.data ?? []);
        setLoading(false);
      });
    });
  }, []);

  // ── Real-time: scheduled_posts INSERT or UPDATE → refresh counts + activity

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dash-posts:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scheduled_posts', filter: `user_id=eq.${userId}` },
        () => { refetchCounts(userId); refetchActivity(userId); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scheduled_posts', filter: `user_id=eq.${userId}` },
        () => { refetchCounts(userId); refetchActivity(userId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refetchCounts, refetchActivity]);

  // ── Derived: usage bar ────────────────────────────────────────────────────

  const planLimit       = PLAN_LIMITS[profile?.plan ?? 'free'] ?? 30;
  const minutesUsed     = profile?.minutes_used ?? 0;
  const minutesRemaining = Math.max(0, planLimit - minutesUsed);
  const usagePct        = Math.min(100, planLimit > 0 ? (minutesUsed / planLimit) * 100 : 0);
  const isLow           = usagePct >= 80;
  const planLabel       = profile ? (profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)) : 'Free';

  // ── Derived: activity feed ────────────────────────────────────────────────

  const activity = useMemo((): ActivityItem[] => {
    // Group clips by source_video_name, keeping latest created_at per group
    const clipGroups = new Map<string, { count: number; latest: string }>();
    for (const c of recentClips) {
      const name = c.source_video_name || 'Untitled Video';
      const g = clipGroups.get(name) ?? { count: 0, latest: c.created_at };
      clipGroups.set(name, {
        count:  g.count + 1,
        latest: c.created_at > g.latest ? c.created_at : g.latest,
      });
    }
    const clipItems: ActivityItem[] = [...clipGroups.entries()].map(([name, g]) => ({
      key:       `clip-${name}`,
      label:     `Generated ${g.count} clip${g.count !== 1 ? 's' : ''}`,
      sublabel:  name,
      iconName:  'movie_edit',
      iconColor: '#C0C1FF',
      created_at: g.latest,
      link:      '/clips',
    }));

    // Map each post to an activity item
    const postItems: ActivityItem[] = recentPosts.map(p => {
      const plat = PLATFORM_LABELS[p.platform] ?? p.platform;
      if (p.status === 'published') return {
        key: `post-${p.id}`, label: `Published to ${plat}`, sublabel: fmtDate(p.scheduled_at),
        iconName: 'check_circle', iconColor: '#4ade80', created_at: p.created_at,
        link: p.published_url ?? '/scheduler',
      };
      if (p.status === 'failed') return {
        key: `post-${p.id}`, label: `Failed to post to ${plat}`, sublabel: '',
        iconName: 'error', iconColor: '#DC2626', created_at: p.created_at, link: '/scheduler',
      };
      if (p.status === 'scheduled') return {
        key: `post-${p.id}`, label: `Scheduled to ${plat}`, sublabel: fmtDate(p.scheduled_at),
        iconName: 'schedule', iconColor: '#89CEFF', created_at: p.created_at, link: '/scheduler',
      };
      // cancelled
      return {
        key: `post-${p.id}`, label: `Cancelled post to ${plat}`, sublabel: '',
        iconName: 'cancel', iconColor: 'rgba(0,0,0,0.3)', created_at: p.created_at, link: '/scheduler',
      };
    });

    return [...clipItems, ...postItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [recentClips, recentPosts]);

  // ── Stat cards ────────────────────────────────────────────────────────────

  const STATS = [
    { label: 'Clips Generated', value: loading ? '—' : String(clipCount),      icon: 'movie_edit',   color: '#C0C1FF' },
    { label: 'Projects',        value: loading ? '—' : String(jobTotal),        icon: 'folder_open',  color: '#ff97b5' },
    { label: 'Scheduled',       value: loading ? '—' : String(scheduledCount),  icon: 'schedule',     color: '#89CEFF' },
    { label: 'Published',       value: loading ? '—' : String(publishedCount),  icon: 'check_circle', color: '#4ade80' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title={`Welcome back${userName ? `, ${userName.split(' ')[0]}` : ''}`}
      subtitle={userEmail ?? "Here's your account at a glance."}
      bg="#E4E2DD"
      titleColor="#1A1714"
      subtitleColor="#6B6560"
      actions={
        <>
          <button
            onClick={() => router.push('/import')}
            data-tour="new-project-btn"
            style={{ background: gradients.cta, color: '#fff', padding: '10px 20px', borderRadius: radius.md, fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter',sans-serif" }}
          >
            <Icon name="add_circle" size={18} /> New Project
          </button>
          <TourInfoIcon onClick={tour.restart} />
        </>
      }
    >

      {/* ── Stat cards ── */}
      <div data-tour="stats-grid" className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: '#1A1714', borderRadius: radius.lg, padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: radius.md, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon name={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px', color: '#fff', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Minutes usage bar ── */}
      {!loading && profile && (
        <div style={{ background: '#EFECEA', borderRadius: radius.lg, padding: '14px 20px', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: '2px 8px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1714', whiteSpace: 'nowrap' }}>
                {minutesRemaining} min remaining
                <span style={{ fontWeight: 400, color: '#6B6560', marginLeft: 6 }}>{planLabel}</span>
              </span>
              <span style={{ fontSize: 11, color: '#6B6560', whiteSpace: 'nowrap' }}>{minutesUsed} / {planLimit} min</span>
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usagePct}%`, background: isLow ? '#F59E0B' : colors.primary, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
          </div>
          {isLow && (
            <button
              onClick={() => router.push('/settings')}
              style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#F59E0B', border: 'none', padding: '6px 14px', borderRadius: radius.full, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif", flexShrink: 0 }}
            >
              Upgrade →
            </button>
          )}
        </div>
      )}

      {/* ── Recent Activity ── */}
      <div data-tour="recent-projects">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1714', margin: 0 }}>Recent Activity</h2>
          <button
            onClick={() => router.push('/import')}
            style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
          >
            + New Project
          </button>
        </div>

        {loading ? (
          <div style={{ background: '#EFECEA', borderRadius: radius.lg, padding: '32px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ color: '#6B6560', fontSize: '14px' }}>Loading…</span>
          </div>
        ) : activity.length === 0 ? (
          <div style={{ background: '#EFECEA', borderRadius: radius.lg, padding: '48px 24px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: '16px' }}><Icon name="movie_creation" size={40} style={{ color: '#6B6560' }} /></div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1A1714' }}>No activity yet</p>
            <p style={{ fontSize: '14px', color: '#6B6560', marginBottom: '24px' }}>
              Generate your first clips to see activity here.
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
            {activity.map(item => (
              <div
                key={item.key}
                onClick={() => item.link && router.push(item.link)}
                style={{ background: '#EFECEA', borderRadius: radius.lg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: item.link ? 'pointer' : 'default', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: radius.md, background: item.iconColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={item.iconName} size={18} style={{ color: item.iconColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 1px', color: '#1A1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </p>
                  {item.sublabel && (
                    <p style={{ fontSize: '12px', color: '#6B6560', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.sublabel}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#6B6560', flexShrink: 0 }}>
                  {timeAgo(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{'@media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:480px){.stats-grid{grid-template-columns:1fr!important}}'}</style>
      <Tour steps={DASHBOARD_STEPS} isOpen={tour.isOpen} step={tour.step} onNext={tour.next} onBack={tour.back} onSkip={tour.skip} />

    </DashboardLayout>
  );
}
