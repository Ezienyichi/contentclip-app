'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { colors as _colors, gradients, radius } from '@/lib/tokens';

const colors = {
  ..._colors,
  background:              '#E4E2DD',
  surfaceContainer:        '#EFECEA',
  surfaceContainerHigh:    '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest:  '#F5F3EF',
  onSurface:               '#1A1714',
  onSurfaceVariant:        '#6B6560',
  outlineVariant:          'rgba(0,0,0,0.12)',
};

// ── Platform icons ────────────────────────────────────────────────────────────

const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" fill="#010101"/>
  </svg>
);
const InstagramIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <defs>
      <radialGradient id="ig-sched" cx="30%" cy="107%" r="150%">
        <stop offset="0%"  stopColor="#fdf497"/>
        <stop offset="5%"  stopColor="#fdf497"/>
        <stop offset="45%" stopColor="#fd5949"/>
        <stop offset="60%" stopColor="#d6249f"/>
        <stop offset="90%" stopColor="#285AEB"/>
      </radialGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#ig-sched)"/>
  </svg>
);
const YouTubeIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" fill="#FF0000"/>
  </svg>
);
const FacebookIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
  </svg>
);
const XIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.261 2.25H8.08l4.261 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="#000000"/>
  </svg>
);

const PLATFORMS: { id: string; label: string; sublabel: string; icon: React.ReactNode; iconSm: React.ReactNode; bgColor: string }[] = [
  { id: 'tiktok',    label: 'TikTok',          sublabel: 'Short-form vertical video', icon: <TikTokIcon />,    iconSm: <TikTokIcon size={16} />,    bgColor: 'rgba(1,1,1,0.08)'     },
  { id: 'instagram', label: 'Instagram Reels', sublabel: 'Reels up to 90 seconds',    icon: <InstagramIcon />, iconSm: <InstagramIcon size={16} />, bgColor: 'rgba(214,36,159,0.10)' },
  { id: 'youtube',   label: 'YouTube Shorts',  sublabel: 'Shorts under 60 seconds',   icon: <YouTubeIcon />,   iconSm: <YouTubeIcon size={16} />,   bgColor: 'rgba(255,0,0,0.08)'   },
  { id: 'facebook',  label: 'Facebook',        sublabel: 'Reels & feed video',        icon: <FacebookIcon />,  iconSm: <FacebookIcon size={16} />,  bgColor: 'rgba(24,119,242,0.10)' },
  { id: 'twitter',   label: 'X (Twitter)',     sublabel: 'Video posts & threads',     icon: <XIcon />,         iconSm: <XIcon size={16} />,         bgColor: 'rgba(0,0,0,0.07)'     },
];

const POST_STATUSES = [
  { label: 'Scheduled',  desc: 'Queued and waiting for its posting time.',        bg: 'rgba(59,130,246,0.10)',  color: '#2563EB' },
  { label: 'Publishing', desc: 'Being sent to the platform right now.',            bg: 'rgba(245,158,11,0.10)',  color: '#D97706' },
  { label: 'Published',  desc: 'Live on the platform. Shareable link available.', bg: 'rgba(5,150,105,0.10)',   color: '#059669' },
  { label: 'Failed',     desc: "Something went wrong. We'll retry or notify you.", bg: 'rgba(220,38,38,0.10)',   color: '#DC2626' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scheduled:  { bg: 'rgba(59,130,246,0.12)',  color: '#2563EB', label: 'Scheduled'  },
  publishing: { bg: 'rgba(245,158,11,0.12)',  color: '#D97706', label: 'Publishing' },
  published:  { bg: 'rgba(5,150,105,0.12)',   color: '#059669', label: 'Published'  },
  failed:     { bg: 'rgba(220,38,38,0.12)',   color: '#DC2626', label: 'Failed'     },
  cancelled:  { bg: 'rgba(0,0,0,0.06)',       color: '#9CA3AF', label: 'Cancelled'  },
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatScheduledAt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function getGroup(iso: string): 'today' | 'tomorrow' | 'week' | 'later' | 'past' {
  const now  = new Date();
  const d    = new Date(iso);
  const sod  = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const today = sod(now);
  const tom   = new Date(today.getTime() + 86400000);
  const dat   = new Date(tom.getTime()   + 86400000);
  const week  = new Date(today.getTime() + 7 * 86400000);
  if (d < today)  return 'past';
  if (d < tom)    return 'today';
  if (d < dat)    return 'tomorrow';
  if (d < week)   return 'week';
  return 'later';
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Connection = { id: string; platform: string; account_name: string | null; account_avatar: string | null; connected_at: string };
type ScheduledPost = {
  id: string; platform: string; scheduled_at: string; caption: string | null;
  status: string; published_url: string | null; error_message: string | null;
  clips: { id: string; title: string; thumbnail_url: string | null; video_url: string | null } | null;
};
type SavedClip = { id: string; title: string; suggested_caption: string; virality_score: number; thumbnail_url: string | null };

// ── Component ─────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const router = useRouter();

  // Connections
  const [connections,   setConnections]   = useState<Connection[]>([]);
  const [loadingConns,  setLoadingConns]  = useState(true);
  const [connecting,    setConnecting]    = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Scheduled posts
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts,   setLoadingPosts]   = useState(true);
  const [cancellingId,   setCancellingId]   = useState<string | null>(null);
  const [showPast,       setShowPast]       = useState(false);

  // Saved clips (for modal)
  const [savedClips, setSavedClips] = useState<SavedClip[]>([]);

  // Modal
  const [showModal,      setShowModal]      = useState(false);
  const [modalClipId,    setModalClipId]    = useState('');
  const [modalPlatforms, setModalPlatforms] = useState<string[]>([]);
  const [modalCaption,   setModalCaption]   = useState('');
  const [modalDate,      setModalDate]      = useState('');
  const [modalTime,      setModalTime]      = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  // Banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Loaders ──
  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/social/connections');
      if (res.ok) setConnections((await res.json()).connections ?? []);
    } catch {} finally { setLoadingConns(false); }
  }, []);

  const loadScheduledPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/scheduled-posts');
      if (res.ok) setScheduledPosts((await res.json()).posts ?? []);
    } catch {} finally { setLoadingPosts(false); }
  }, []);

  const loadSavedClips = useCallback(async () => {
    try {
      const res = await fetch('/api/clips/list');
      if (res.ok) {
        const data = await res.json();
        setSavedClips((data.clips ?? []).map((c: any) => ({
          id: c.id, title: c.title, suggested_caption: c.suggested_caption ?? '',
          virality_score: c.virality_score, thumbnail_url: c.thumbnail_url ?? null,
        })));
      }
    } catch {}
  }, []);

  // ── Init ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const err       = params.get('error');
    if (connected) {
      const label = PLATFORMS.find(p => p.id === connected)?.label ?? connected;
      setBanner({ type: 'success', msg: `${label} connected successfully.` });
      router.replace('/scheduler', { scroll: false });
    } else if (err) {
      setBanner({ type: 'error', msg: decodeURIComponent(err) });
      router.replace('/scheduler', { scroll: false });
    }
    loadConnections();
    loadScheduledPosts();
    loadSavedClips();
  }, [loadConnections, loadScheduledPosts, loadSavedClips, router]);

  // ── Connect / Disconnect ──
  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      const res  = await fetch('/api/social/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: platformId }) });
      const data = await res.json();
      if (!res.ok || !data.authUrl) { setBanner({ type: 'error', msg: data.error ?? 'Failed to start connection.' }); setConnecting(null); return; }
      window.location.href = data.authUrl;
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); setConnecting(null); }
  };

  const handleDisconnect = async (connectionId: string, platformLabel: string) => {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/social/connections/${connectionId}`, { method: 'DELETE' });
      if (res.ok) { setConnections(prev => prev.filter(c => c.id !== connectionId)); setBanner({ type: 'success', msg: `${platformLabel} disconnected.` }); }
      else { const data = await res.json(); setBanner({ type: 'error', msg: data.error ?? 'Failed to disconnect.' }); }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setDisconnecting(null); }
  };

  // ── Schedule modal ──
  const openModal = () => {
    const next = new Date(); next.setHours(next.getHours() + 1, 0, 0, 0);
    setModalDate(next.toISOString().split('T')[0]);
    setModalTime(`${String(next.getHours()).padStart(2, '0')}:00`);
    setModalClipId(''); setModalPlatforms([]); setModalCaption('');
    setShowModal(true);
  };

  const handleClipSelect = (clipId: string) => {
    setModalClipId(clipId);
    const clip = savedClips.find(c => c.id === clipId);
    if (clip?.suggested_caption) setModalCaption(clip.suggested_caption);
  };

  const handleSchedule = async () => {
    if (!modalClipId || modalPlatforms.length === 0 || !modalDate || !modalTime) return;
    setSubmitting(true);
    try {
      const scheduled_at = new Date(`${modalDate}T${modalTime}`).toISOString();
      const results = await Promise.all(
        modalPlatforms.map(platform =>
          fetch('/api/scheduled-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clip_id: modalClipId, platform, caption: modalCaption, scheduled_at }) })
            .then(async r => ({ platform, ok: r.ok, data: await r.json() }))
            .catch(() => ({ platform, ok: false, data: { error: 'Network error.' } }))
        )
      );
      const failures = results.filter(r => !r.ok);
      if (failures.length === 0) {
        const n = results.length;
        setShowModal(false);
        setBanner({ type: 'success', msg: `${n} post${n !== 1 ? 's' : ''} scheduled.` });
        loadScheduledPosts();
      } else if (failures.length < results.length) {
        const platLabels = failures.map(f => PLATFORMS.find(p => p.id === f.platform)?.label ?? f.platform).join(', ');
        setBanner({ type: 'error', msg: `Scheduled on some platforms. Failed: ${platLabels}.` });
        loadScheduledPosts();
      } else {
        setBanner({ type: 'error', msg: failures[0].data?.error ?? 'Failed to schedule posts.' });
      }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  // ── Cancel post ──
  const handleCancelPost = async (postId: string) => {
    setCancellingId(postId);
    try {
      const res = await fetch(`/api/scheduled-posts/${postId}`, { method: 'DELETE' });
      if (res.ok) { setScheduledPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'cancelled' } : p)); setBanner({ type: 'success', msg: 'Post cancelled.' }); }
      else { const data = await res.json(); setBanner({ type: 'error', msg: data.error ?? 'Failed to cancel.' }); }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setCancellingId(null); }
  };

  // ── Derived ──
  const connectedCount  = connections.length;
  const hasConnections  = connectedCount > 0;
  const today           = new Date().toISOString().split('T')[0];

  const upcomingPosts   = scheduledPosts.filter(p => p.status === 'scheduled' || p.status === 'publishing');
  const pastPosts       = scheduledPosts.filter(p => p.status !== 'scheduled' && p.status !== 'publishing');

  const GROUP_LABELS: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', week: 'This Week', later: 'Later' };
  const upcomingGroups = (['today', 'tomorrow', 'week', 'later'] as const)
    .map(g => ({ key: g, label: GROUP_LABELS[g], posts: upcomingPosts.filter(p => getGroup(p.scheduled_at) === g) }))
    .filter(g => g.posts.length > 0);

  const canSchedule = modalClipId && modalPlatforms.length > 0 && modalDate && modalTime && !submitting;

  // ── Render helpers ──
  const renderPostCard = (post: ScheduledPost) => {
    const plat   = PLATFORMS.find(p => p.id === post.platform);
    const st     = STATUS_STYLE[post.status] ?? STATUS_STYLE.scheduled;
    const { date, time } = formatScheduledAt(post.scheduled_at);
    const isCancelling   = cancellingId === post.id;
    const canCancel      = post.status === 'scheduled';

    return (
      <div key={post.id} style={{ background: colors.surfaceContainer, border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: radius.md, background: plat?.bgColor ?? colors.surfaceContainerHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {plat?.icon ?? '📱'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.clips?.title ?? 'Clip'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant }}>{plat?.label ?? post.platform} · {date} at {time}</p>
          {post.error_message && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#DC2626' }}>{post.error_message}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: radius.full, letterSpacing: '0.02em' }}>{st.label}</span>
          {canCancel && (
            <button onClick={() => handleCancelPost(post.id)} disabled={isCancelling} style={{ fontSize: 11, fontWeight: 600, color: colors.onSurfaceVariant, background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: radius.md, padding: '4px 10px', cursor: isCancelling ? 'default' : 'pointer', opacity: isCancelling ? 0.5 : 1, fontFamily: "'Inter',sans-serif" }}>
              {isCancelling ? '...' : 'Cancel'}
            </button>
          )}
          {post.published_url && (
            <a href={post.published_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: '#059669', textDecoration: 'none' }}>View ↗</a>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Scheduler" subtitle="Auto-post your clips to every platform" bg="#E4E2DD" titleColor="#1A1714" subtitleColor="#6B6560">

      {/* ── Banner ── */}
      {banner && (
        <div style={{ marginBottom: 20, padding: '12px 18px', borderRadius: radius.lg, background: banner.type === 'success' ? 'rgba(5,150,105,0.10)' : 'rgba(220,38,38,0.10)', border: `1px solid ${banner.type === 'success' ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.25)'}`, color: banner.type === 'success' ? '#059669' : '#DC2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{banner.type === 'success' ? '✓ ' : '✕ '}{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ background: '#1A1714', borderRadius: radius.xl, padding: '32px 36px', marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Automatic Scheduling</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.55)', maxWidth: 480, lineHeight: 1.6 }}>Connect your accounts below, generate clips, then schedule them to go live automatically across all platforms.</p>
          </div>
          <div style={{ padding: '10px 18px', borderRadius: radius.md, background: hasConnections ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${hasConnections ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`, color: hasConnections ? '#4ade80' : 'rgba(255,255,255,0.45)', fontWeight: 700, fontSize: 13, alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
            {loadingConns ? '...' : `${connectedCount} account${connectedCount !== 1 ? 's' : ''} connected`}
          </div>
        </div>
      </div>

      {/* ── How it Works ── */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>How it Works</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { step: '01', title: 'Connect your accounts',  desc: 'Link TikTok, Instagram, YouTube, Facebook, and X once. Your tokens are stored securely.' },
          { step: '02', title: 'Generate your clips',     desc: 'Process any long video and get AI-selected, captioned clips ready to publish.' },
          { step: '03', title: 'Set your schedule',       desc: 'Pick posting times manually, or let VangelClip suggest the highest-engagement windows per platform.' },
          { step: '04', title: 'We post for you',         desc: "Clips go live at exactly the right time. Track every post's status from one dashboard." },
        ].map(item => (
          <div key={item.step} style={{ background: colors.surfaceContainer, border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '18px 20px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: colors.primary, letterSpacing: '0.05em' }}>{item.step}</span>
            <p style={{ margin: '6px 0 6px', fontSize: 14, fontWeight: 700, color: colors.onSurface }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.onSurfaceVariant, lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Your Accounts ── */}
      <div id="your-accounts" style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Your Accounts</h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: '0 0 14px', opacity: 0.8 }}>Connect once and we handle posting, timing, and retries across all of them.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 32 }}>
        {PLATFORMS.map(p => {
          const conn = connections.find(c => c.platform === p.id);
          const isConnected     = !!conn;
          const isConnecting    = connecting === p.id;
          const isDisconnecting = conn ? disconnecting === conn.id : false;
          return (
            <div key={p.id} style={{ background: colors.surfaceContainer, border: isConnected ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: radius.md, background: p.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface }}>{p.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isConnected ? (conn.account_name ?? 'Connected') : p.sublabel}</p>
              </div>
              {isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.12)', padding: '3px 8px', borderRadius: radius.full }}>✓ Connected</span>
                  <button onClick={() => handleDisconnect(conn.id, p.label)} disabled={isDisconnecting} style={{ fontSize: 10, fontWeight: 600, color: colors.onSurfaceVariant, background: 'none', border: 'none', cursor: isDisconnecting ? 'default' : 'pointer', padding: '2px 4px', fontFamily: "'Inter',sans-serif", opacity: isDisconnecting ? 0.5 : 1 }}>
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <button onClick={() => handleConnect(p.id)} disabled={isConnecting} style={{ fontSize: 11, fontWeight: 700, color: isConnecting ? 'rgba(155,93,229,0.5)' : '#7C3AED', background: isConnecting ? 'rgba(155,93,229,0.05)' : 'rgba(155,93,229,0.08)', border: '1px solid rgba(155,93,229,0.25)', padding: '6px 14px', borderRadius: radius.full, cursor: isConnecting ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {isConnecting ? 'Opening...' : 'Connect'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scheduled Posts ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>Scheduled Posts</h3>
          <p style={{ fontSize: 12, color: colors.onSurfaceVariant, margin: 0, opacity: 0.7 }}>
            {loadingPosts ? 'Loading...' : `${upcomingPosts.length} upcoming`}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <button
            onClick={hasConnections ? openModal : () => document.getElementById('your-accounts')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ fontSize: 12, fontWeight: 700, color: hasConnections ? '#fff' : colors.onSurfaceVariant, background: hasConnections ? gradients.primary : colors.surfaceContainerHighest, border: hasConnections ? 'none' : '1px solid rgba(0,0,0,0.1)', padding: '8px 16px', borderRadius: radius.full, cursor: 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap', opacity: loadingConns ? 0.5 : 1 }}
          >
            + Schedule a Post
          </button>
          {!hasConnections && !loadingConns && (
            <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: 0, textAlign: 'right' }}>
              Connect a social account first.{' '}
              <button onClick={() => document.getElementById('your-accounts')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, cursor: 'pointer', fontSize: 11, fontFamily: "'Inter',sans-serif", padding: 0 }}>Go to Your Accounts</button>
            </p>
          )}
        </div>
      </div>

      {/* Upcoming groups */}
      {!loadingPosts && upcomingGroups.length === 0 && (
        <div style={{ background: colors.surfaceContainer, border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '36px 24px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>📅</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.onSurface, margin: '0 0 4px' }}>No posts scheduled yet</p>
          <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: '0 0 16px' }}>
            {hasConnections ? 'Schedule your first post above.' : 'Connect a social account to get started.'}
          </p>
          {!hasConnections && (
            <button onClick={() => document.getElementById('your-accounts')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 12, fontWeight: 700, color: colors.primary, background: 'rgba(155,93,229,0.08)', border: '1px solid rgba(155,93,229,0.25)', padding: '8px 18px', borderRadius: radius.full, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
              Connect an Account
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 12 }}>
        {upcomingGroups.map(group => (
          <div key={group.key}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.posts.map(renderPostCard)}
            </div>
          </div>
        ))}
      </div>

      {/* Past posts toggle */}
      {pastPosts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => setShowPast(v => !v)} style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10 }}>{showPast ? '▲' : '▼'}</span>
            {showPast ? 'Hide' : `Show ${pastPosts.length} past post${pastPosts.length !== 1 ? 's' : ''}`}
          </button>
          {showPast && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, opacity: 0.7 }}>
              {pastPosts.map(renderPostCard)}
            </div>
          )}
        </div>
      )}
      {pastPosts.length === 0 && upcomingGroups.length > 0 && <div style={{ marginBottom: 32 }} />}

      {/* ── Post States ── */}
      <div style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Post States</h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: '0 0 14px', opacity: 0.8 }}>Every scheduled post will show one of these statuses so you always know what&apos;s happening.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 32 }}>
        {POST_STATUSES.map(s => (
          <div key={s.label} style={{ background: colors.surfaceContainer, border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: radius.full, letterSpacing: '0.03em' }}>{s.label}</span>
            <p style={{ margin: 0, fontSize: 12.5, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Schedule a Post Modal ── */}
      {showModal && (
        <div onClick={() => !submitting && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#F5F3EF', borderRadius: radius.xl, padding: '28px', width: '100%', maxWidth: 480, position: 'relative' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.onSurface }}>Schedule a Post</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.onSurfaceVariant, lineHeight: 1, padding: '4px 6px' }}>×</button>
            </div>

            {/* 1. Select clip */}
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Clip</label>
            {savedClips.length === 0 ? (
              <div style={{ padding: '14px 16px', borderRadius: radius.md, background: colors.surfaceContainerHighest, border: '1px solid rgba(0,0,0,0.07)', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20 }}>
                No saved clips yet.{' '}
                <a href="/import" style={{ color: colors.primary, fontWeight: 600, textDecoration: 'none' }}>Generate clips first →</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 240, overflowY: 'auto', marginBottom: 20, paddingRight: 2 }}>
                {savedClips.map(c => {
                  const selected = modalClipId === c.id;
                  return (
                    <button key={c.id} onClick={() => handleClipSelect(c.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: 'none', border: selected ? `2px solid ${colors.primary}` : '2px solid rgba(0,0,0,0.08)', borderRadius: radius.md, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                      {/* Thumbnail */}
                      <div style={{ width: '100%', aspectRatio: '9/16', background: '#2A2624', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 22, opacity: 0.4 }}>▶</span>}
                        {/* Virality badge */}
                        <span style={{ position: 'absolute', top: 5, right: 5, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 5px', borderRadius: 4, letterSpacing: '0.02em' }}>{c.virality_score}</span>
                        {/* Selected checkmark */}
                        {selected && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(155,93,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 22, color: '#fff', fontWeight: 800 }}>✓</span>
                          </div>
                        )}
                      </div>
                      {/* Title */}
                      <div style={{ padding: '5px 7px', background: selected ? 'rgba(155,93,229,0.08)' : '#fff' }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: selected ? colors.primary : colors.onSurface, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{c.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Platforms (multi-select) */}
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Platforms</label>
            <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: '0 0 8px', opacity: 0.75 }}>Select one or more. A separate post is created for each.</p>
            {connections.length === 0 ? (
              <div style={{ padding: '14px 16px', borderRadius: radius.md, background: colors.surfaceContainerHighest, border: '1px solid rgba(0,0,0,0.07)', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20 }}>
                No connected accounts.{' '}
                <button onClick={() => { setShowModal(false); document.getElementById('your-accounts')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", padding: 0 }}>Connect an account →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {connections.map(conn => {
                  const plat    = PLATFORMS.find(p => p.id === conn.platform);
                  const selected = modalPlatforms.includes(conn.platform);
                  const toggle  = () => setModalPlatforms(prev => selected ? prev.filter(p => p !== conn.platform) : [...prev, conn.platform]);
                  return (
                    <button key={conn.id} onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: radius.full, border: selected ? `2px solid ${colors.primary}` : '1px solid rgba(0,0,0,0.12)', background: selected ? 'rgba(155,93,229,0.08)' : '#fff', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: selected ? colors.primary : colors.onSurface }}>
                      {plat?.iconSm}
                      {plat?.label ?? conn.platform}
                      {selected && <span style={{ fontSize: 10, marginLeft: 2 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Caption */}
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Caption</label>
            <textarea value={modalCaption} onChange={e => setModalCaption(e.target.value)} rows={3} placeholder="Write a caption..." style={{ width: '100%', padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif", resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }} />

            {/* 4. Date + Time */}
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Date &amp; Time</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <input type="date" min={today} value={modalDate} onChange={e => setModalDate(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif" }} />
              <input type="time" value={modalTime} onChange={e => setModalTime(e.target.value)} style={{ width: 120, padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif" }} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.1)', background: colors.surfaceContainerHighest, color: colors.onSurface, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button onClick={handleSchedule} disabled={!canSchedule} style={{ flex: 2, padding: '11px', borderRadius: radius.md, border: 'none', background: canSchedule ? gradients.primary : colors.surfaceContainerHighest, color: canSchedule ? '#fff' : colors.onSurfaceVariant, fontSize: 13, fontWeight: 700, cursor: canSchedule ? 'pointer' : 'default', fontFamily: "'Inter',sans-serif", transition: 'opacity 0.15s' }}>
                {submitting ? 'Scheduling...' : modalPlatforms.length > 1 ? `Schedule to ${modalPlatforms.length} Platforms` : 'Schedule Post'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
