'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { colors as _colors, gradients, radius } from '@/lib/tokens';
import { createClient as createSupabaseBrowser } from '@/lib/supabase-browser';
import ErrorBanner from '@/components/ErrorBanner';

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

// ── sidebar palette ──────────────────────────────────────────────────────────
const SB = {
  bg:          '#161513',
  bgHover:     'rgba(255,255,255,0.04)',
  bgActive:    'rgba(155,93,229,0.14)',
  border:      'rgba(255,255,255,0.07)',
  text:        '#F5F3EF',
  muted:       'rgba(245,243,239,0.48)',
  accent:      '#9B5DE5',
};

// ── Platform icons ────────────────────────────────────────────────────────────
const TikTokIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" fill="#010101"/>
  </svg>
);
const InstagramIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <defs><radialGradient id="ig-s3" cx="30%" cy="107%" r="150%">
      <stop offset="0%"  stopColor="#fdf497"/><stop offset="5%"  stopColor="#fdf497"/>
      <stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/>
      <stop offset="90%" stopColor="#285AEB"/>
    </radialGradient></defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#ig-s3)"/>
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
const PinterestIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-.994 2.35-1.482 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" fill="#E60019"/>
  </svg>
);

const PLATFORMS: { id: string; label: string; sublabel: string; icon: React.ReactNode; iconSm: React.ReactNode; iconXs: React.ReactNode; bgColor: string }[] = [
  { id: 'tiktok',    label: 'TikTok',          sublabel: 'Short-form vertical video', icon: <TikTokIcon />,    iconSm: <TikTokIcon size={16} />,    iconXs: <TikTokIcon size={12} />,    bgColor: 'rgba(1,1,1,0.08)'     },
  { id: 'instagram', label: 'Instagram Reels', sublabel: 'Reels up to 90 seconds',    icon: <InstagramIcon />, iconSm: <InstagramIcon size={16} />, iconXs: <InstagramIcon size={12} />, bgColor: 'rgba(214,36,159,0.10)' },
  { id: 'youtube',   label: 'YouTube Shorts',  sublabel: 'Shorts under 60 seconds',   icon: <YouTubeIcon />,   iconSm: <YouTubeIcon size={16} />,   iconXs: <YouTubeIcon size={12} />,   bgColor: 'rgba(255,0,0,0.08)'   },
  { id: 'facebook',  label: 'Facebook',        sublabel: 'Reels & feed video',        icon: <FacebookIcon />,  iconSm: <FacebookIcon size={16} />,  iconXs: <FacebookIcon size={12} />,  bgColor: 'rgba(24,119,242,0.10)' },
  { id: 'twitter',   label: 'X (Twitter)',     sublabel: 'Video posts & threads',     icon: <XIcon />,         iconSm: <XIcon size={16} />,         iconXs: <XIcon size={12} />,         bgColor: 'rgba(0,0,0,0.07)'     },
  { id: 'pinterest', label: 'Pinterest',       sublabel: 'Idea pins & video pins',    icon: <PinterestIcon />, iconSm: <PinterestIcon size={16} />, iconXs: <PinterestIcon size={12} />, bgColor: 'rgba(230,0,25,0.08)'  },
];

const POST_STATUSES = [
  { label: 'Scheduled',     desc: 'Queued and waiting for its posting time.',         bg: 'rgba(59,130,246,0.10)',  color: '#2563EB' },
  { label: 'Publishing',    desc: 'Being sent to the platform right now.',             bg: 'rgba(245,158,11,0.10)',  color: '#D97706' },
  { label: 'Published',     desc: 'Live on the platform. Shareable link available.',  bg: 'rgba(5,150,105,0.10)',   color: '#059669' },
  { label: 'Failed',        desc: "Something went wrong. We'll retry or notify you.", bg: 'rgba(220,38,38,0.10)',   color: '#DC2626' },
  { label: 'Not Published', desc: 'Failed, cancelled, or missed the posting window.', bg: 'rgba(220,38,38,0.10)',   color: '#DC2626' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scheduled:     { bg: 'rgba(59,130,246,0.12)',  color: '#2563EB', label: 'Scheduled'     },
  publishing:    { bg: 'rgba(245,158,11,0.12)',  color: '#D97706', label: 'Publishing'    },
  published:     { bg: 'rgba(5,150,105,0.12)',   color: '#059669', label: 'Published'     },
  failed:        { bg: 'rgba(220,38,38,0.12)',   color: '#DC2626', label: 'Failed'        },
  cancelled:     { bg: 'rgba(0,0,0,0.06)',       color: '#9CA3AF', label: 'Cancelled'     },
  not_published: { bg: 'rgba(220,38,38,0.12)',   color: '#DC2626', label: 'Not Published' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEffectiveStatus(post: { status: string; scheduled_at: string }): string {
  const d = new Date(post.scheduled_at), now = new Date();
  if (post.status === 'failed' || post.status === 'cancelled') return 'not_published';
  if (post.status === 'scheduled'  && d < new Date(now.getTime() - 15 * 60_000)) return 'not_published';
  if (post.status === 'publishing' && d < new Date(now.getTime() - 30 * 60_000)) return 'not_published';
  return post.status;
}

function formatScheduledAt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function getGroup(iso: string): 'today' | 'tomorrow' | 'week' | 'later' | 'past' {
  const now = new Date(), d = new Date(iso);
  const sod = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const today = sod(now), tom = new Date(today.getTime() + 86400000);
  const dat = new Date(tom.getTime() + 86400000), week = new Date(today.getTime() + 7 * 86400000);
  if (d < today) return 'past';
  if (d < tom)   return 'today';
  if (d < dat)   return 'tomorrow';
  if (d < week)  return 'week';
  return 'later';
}

function getWeekStart(d: Date): Date {
  const s = new Date(d);
  s.setDate(d.getDate() - d.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Connection = { id: string; platform: string; account_name: string | null; account_avatar: string | null; connected_at: string; pfm_account_id: string };
type ScheduledPost = {
  id: string; platform: string; scheduled_at: string; caption: string | null;
  status: string; published_url: string | null; error_message: string | null;
  pfm_post_id: string | null; social_connection_id: string | null;
  clips: { id: string; title: string; thumbnail_url: string | null; video_url: string | null } | null;
};
type SavedClip = { id: string; title: string; suggested_caption: string; hashtags: string; virality_score: number | null; thumbnail_url: string | null; source: string };
type CalView = 'month' | 'week' | 'day' | 'sheet' | 'list';

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

  // Views & calendar navigation
  const [calView,    setCalView]    = useState<CalView>('month');
  const [calRefDate, setCalRefDate] = useState(() => new Date());

  // Filters
  const [filterAccount,  setFilterAccount]  = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo,   setFilterDateTo]   = useState('');

  // Search & sort (calendar header)
  const [calSearch,  setCalSearch]  = useState('');
  const [sortCol,    setSortCol]    = useState<'date' | 'status' | 'platform'>('date');
  const [sortDir,    setSortDir]    = useState<'asc' | 'desc'>('asc');

  // Mobile
  const [isMobile, setIsMobile] = useState(false);

  // Sidebar
  const [sidebarSearch,       setSidebarSearch]       = useState('');
  const [collapsedPlatforms,  setCollapsedPlatforms]  = useState<string[]>([]);
  const [showConnectMenu,     setShowConnectMenu]     = useState(false);

  // Saved clips
  const [savedClips, setSavedClips] = useState<SavedClip[]>([]);

  // Compose modal
  const [showModal,          setShowModal]          = useState(false);
  const [modalClipId,        setModalClipId]        = useState('');
  const [selectedConnIds,    setSelectedConnIds]    = useState<string[]>([]);
  const [modalCaption,       setModalCaption]       = useState('');
  const [modalDate,          setModalDate]          = useState('');
  const [modalTime,          setModalTime]          = useState('');
  const [submitting,         setSubmitting]         = useState(false);
  const [generatingCaption,  setGeneratingCaption]  = useState(false);
  const [captionGenErr,      setCaptionGenErr]      = useState<string | null>(null);

  // Side panel
  const [previewPost,    setPreviewPost]    = useState<ScheduledPost | null>(null);
  const [previewCaption, setPreviewCaption] = useState('');
  const [savingCaption,  setSavingCaption]  = useState(false);
  const [panelErr,       setPanelErr]       = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling,   setRescheduling]   = useState(false);
  const [retrying,       setRetrying]       = useState(false);

  // Pending clip from ?clip_id
  const [pendingClipId,  setPendingClipId]  = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');

  // Banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const calYear  = calRefDate.getFullYear();
  const calMonth = calRefDate.getMonth();

  const filteredPosts = useMemo(() => scheduledPosts.filter(p => {
    if (filterAccount) {
      const conn = connections.find(c => c.id === filterAccount);
      if (!conn) return false;
      const match = p.social_connection_id === filterAccount ||
        (p.social_connection_id === null && p.platform === conn.platform);
      if (!match) return false;
    }
    if (filterPlatform && p.platform !== filterPlatform) return false;
    if (filterStatus   && getEffectiveStatus(p) !== filterStatus) return false;
    if (filterDateFrom && new Date(p.scheduled_at) < new Date(filterDateFrom + 'T00:00:00')) return false;
    if (filterDateTo   && new Date(p.scheduled_at) > new Date(filterDateTo   + 'T23:59:59')) return false;
    if (calSearch) {
      const q = calSearch.toLowerCase();
      if (!p.caption?.toLowerCase().includes(q) && !p.clips?.title?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [scheduledPosts, filterAccount, filterPlatform, filterStatus, filterDateFrom, filterDateTo, connections, calSearch]);

  const sortedFilteredPosts = useMemo(() => {
    const arr = [...filteredPosts];
    const statusOrder = ['scheduled', 'publishing', 'published', 'not_published', 'cancelled', 'failed'];
    arr.sort((a, b) => {
      let diff = 0;
      if      (sortCol === 'date')     diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      else if (sortCol === 'status')   diff = statusOrder.indexOf(getEffectiveStatus(a)) - statusOrder.indexOf(getEffectiveStatus(b));
      else if (sortCol === 'platform') diff = a.platform.localeCompare(b.platform);
      return sortDir === 'asc' ? diff : -diff;
    });
    return arr;
  }, [filteredPosts, sortCol, sortDir]);

  const hasFilters = !!(filterAccount || filterPlatform || filterStatus || filterDateFrom || filterDateTo || calSearch);

  const upcomingPosts   = filteredPosts.filter(p => p.status === 'scheduled' || p.status === 'publishing');
  const pastPosts       = filteredPosts.filter(p => p.status !== 'scheduled' && p.status !== 'publishing');
  const GROUP_LABELS: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', week: 'This Week', later: 'Later' };
  const upcomingGroups  = (['today', 'tomorrow', 'week', 'later'] as const)
    .map(g => ({ key: g, label: GROUP_LABELS[g], posts: upcomingPosts.filter(p => getGroup(p.scheduled_at) === g) }))
    .filter(g => g.posts.length > 0);

  const hasConnections = connections.length > 0;
  const todayStr       = new Date().toISOString().split('T')[0];
  const canSchedule    = modalClipId && selectedConnIds.length > 0 && modalDate && modalTime && !submitting;

  // Sidebar filtered connections
  const sidebarConnections = useMemo(() => {
    if (!sidebarSearch) return connections;
    const q = sidebarSearch.toLowerCase();
    return connections.filter(c => {
      const plat = PLATFORMS.find(p => p.id === c.platform);
      return (c.account_name ?? '').toLowerCase().includes(q) || (plat?.label ?? '').toLowerCase().includes(q);
    });
  }, [connections, sidebarSearch]);

  // ── Loaders ───────────────────────────────────────────────────────────────────

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
          hashtags: c.hashtags ?? '', virality_score: c.virality_score ?? null,
          thumbnail_url: c.thumbnail_url ?? null, source: c.source ?? 'generated',
        })));
      }
    } catch {}
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const err       = params.get('error');
    const clipId    = params.get('clip_id');
    const caption   = params.get('caption') ?? '';
    if (clipId) { setPendingClipId(clipId); setPendingCaption(caption); }
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
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [loadConnections, loadScheduledPosts, loadSavedClips, router]);

  useEffect(() => {
    if (!pendingClipId || savedClips.length === 0) return;
    const clip = savedClips.find(c => c.id === pendingClipId);
    if (!clip) return;
    const next = new Date(); next.setHours(next.getHours() + 1, 0, 0, 0);
    setModalDate(next.toISOString().split('T')[0]);
    setModalTime(`${String(next.getHours()).padStart(2, '0')}:00`);
    setModalClipId(pendingClipId);
    setModalCaption([clip.suggested_caption, clip.hashtags].filter(Boolean).join('\n\n') || '');
    setSelectedConnIds([]);
    setShowModal(true);
    setPendingClipId(null);
    router.replace('/scheduler', { scroll: false });
  }, [pendingClipId, savedClips, pendingCaption, router]);

  // ── Calendar navigation ───────────────────────────────────────────────────────

  const navigateCal = useCallback((dir: 1 | -1) => {
    setCalRefDate(d => {
      const next = new Date(d);
      if      (calView === 'month') next.setMonth(d.getMonth() + dir);
      else if (calView === 'week')  next.setDate(d.getDate() + 7 * dir);
      else                          next.setDate(d.getDate() + dir);
      return next;
    });
  }, [calView]);

  const goToday = useCallback(() => setCalRefDate(new Date()), []);

  // ── Connect / Disconnect ──────────────────────────────────────────────────────

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
      else { const d = await res.json(); setBanner({ type: 'error', msg: d.error ?? 'Failed to disconnect.' }); }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setDisconnecting(null); }
  };

  // ── Compose modal ─────────────────────────────────────────────────────────────

  const openModal = (prefillDate?: Date) => {
    const base = prefillDate ?? new Date();
    const next = prefillDate ? new Date(base) : new Date();
    if (!prefillDate) next.setHours(next.getHours() + 1, 0, 0, 0);
    else { next.setHours(9, 0, 0, 0); if (next <= new Date()) next.setHours(10, 0, 0, 0); }
    setModalDate(next.toISOString().split('T')[0]);
    setModalTime(`${String(next.getHours()).padStart(2, '0')}:00`);
    setModalClipId(''); setSelectedConnIds([]); setModalCaption('');
    setCaptionGenErr(null);
    setShowModal(true);
  };

  const handleGenerateCaption = async () => {
    if (!modalClipId) return;
    setGeneratingCaption(true); setCaptionGenErr(null);
    try {
      const firstConnId = selectedConnIds[0];
      const platform    = firstConnId ? (connections.find(c => c.id === firstConnId)?.platform ?? 'tiktok') : 'tiktok';
      const res  = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_id: modalClipId, platform, current_caption: modalCaption }),
      });
      const data = await res.json();
      if (!res.ok) { setCaptionGenErr(data.error ?? 'Failed to generate caption.'); return; }
      setModalCaption([data.caption, data.hashtags].filter(Boolean).join('\n\n'));
    } catch { setCaptionGenErr('Network error. Please try again.'); }
    finally { setGeneratingCaption(false); }
  };

  const handleClipSelect = (clipId: string) => {
    setModalClipId(clipId);
    const clip = savedClips.find(c => c.id === clipId);
    if (clip) setModalCaption([clip.suggested_caption, clip.hashtags].filter(Boolean).join('\n\n'));
  };

  const handleSchedule = async () => {
    if (!modalClipId || selectedConnIds.length === 0 || !modalDate || !modalTime) return;
    setSubmitting(true);
    try {
      await createSupabaseBrowser().auth.getSession();
      const scheduled_at  = new Date(`${modalDate}T${modalTime}`).toISOString();
      const selectedConns = connections.filter(c => selectedConnIds.includes(c.id));
      const results = await Promise.all(
        selectedConns.map(conn =>
          fetch('/api/scheduled-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clip_id: modalClipId, platform: conn.platform, pfm_account_id: conn.pfm_account_id, caption: modalCaption, scheduled_at }),
          })
            .then(async r => ({ label: conn.account_name ?? PLATFORMS.find(p => p.id === conn.platform)?.label ?? conn.platform, ok: r.ok, data: await r.json() }))
            .catch(() => ({ label: conn.account_name ?? conn.platform, ok: false, data: { error: 'Network error.' } }))
        )
      );
      const failures = results.filter(r => !r.ok);
      if (failures.length === 0) {
        const n = results.length;
        setShowModal(false);
        setBanner({ type: 'success', msg: `${n} post${n !== 1 ? 's' : ''} scheduled.` });
        loadScheduledPosts();
      } else if (failures.length < results.length) {
        setBanner({ type: 'error', msg: `Scheduled on some accounts. Failed: ${failures.map(f => f.label).join(', ')}.` });
        loadScheduledPosts();
      } else {
        setBanner({ type: 'error', msg: failures[0].data?.error ?? 'Failed to schedule posts.' });
      }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  // ── Side panel ────────────────────────────────────────────────────────────────

  const openPreview = (post: ScheduledPost) => {
    setPreviewPost(post);
    setPreviewCaption(post.caption ?? '');
    setPanelErr(null);
    const d = new Date(post.scheduled_at);
    setRescheduleDate(d.toISOString().split('T')[0]);
    setRescheduleTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  const closePreview = () => { setPreviewPost(null); setPanelErr(null); };

  const patchPost = async (body: Record<string, unknown>): Promise<{ ok: boolean; data: any }> => {
    const res  = await fetch(`/api/scheduled-posts/${previewPost!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  const handleSaveCaption = async () => {
    if (!previewPost) return;
    setSavingCaption(true); setPanelErr(null);
    try {
      const { ok, data } = await patchPost({ caption: previewCaption });
      if (!ok) { setPanelErr(data.error ?? 'Failed to save caption.'); return; }
      setScheduledPosts(prev => prev.map(p => p.id === previewPost.id ? { ...p, caption: data.caption } : p));
      setPreviewPost(prev => prev ? { ...prev, caption: data.caption } : null);
      setBanner({ type: 'success', msg: 'Caption updated.' });
    } catch { setPanelErr('Network error. Please try again.'); }
    finally { setSavingCaption(false); }
  };

  const handleReschedule = async () => {
    if (!previewPost || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true); setPanelErr(null);
    try {
      const scheduled_at = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
      const { ok, data } = await patchPost({ action: 'reschedule', scheduled_at });
      if (!ok) { setPanelErr(data.error ?? 'Failed to reschedule.'); return; }
      const updated = { ...previewPost, scheduled_at: data.scheduled_at, status: data.status };
      setScheduledPosts(prev => prev.map(p => p.id === previewPost.id ? updated : p));
      setPreviewPost(updated);
      setBanner({ type: 'success', msg: 'Post rescheduled.' });
    } catch { setPanelErr('Network error. Please try again.'); }
    finally { setRescheduling(false); }
  };

  const handleRetry = async () => {
    if (!previewPost) return;
    setRetrying(true); setPanelErr(null);
    try {
      const { ok, data } = await patchPost({ action: 'retry' });
      if (!ok) { setPanelErr(data.error ?? 'Failed to retry.'); return; }
      const updated = { ...previewPost, status: data.status, scheduled_at: data.scheduled_at };
      setScheduledPosts(prev => prev.map(p => p.id === previewPost.id ? updated : p));
      setPreviewPost(updated);
      setBanner({ type: 'success', msg: 'Post queued for retry in ~5 minutes.' });
    } catch { setPanelErr('Network error. Please try again.'); }
    finally { setRetrying(false); }
  };

  const handleCancelPost = async (postId: string) => {
    setCancellingId(postId);
    try {
      const res = await fetch(`/api/scheduled-posts/${postId}`, { method: 'DELETE' });
      if (res.ok) { setScheduledPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'cancelled' } : p)); setBanner({ type: 'success', msg: 'Post cancelled.' }); }
      else { const d = await res.json(); setBanner({ type: 'error', msg: d.error ?? 'Failed to cancel.' }); }
    } catch { setBanner({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setCancellingId(null); }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Account', 'Platform', 'Clip Title', 'Caption', 'Status', 'Published URL', 'Error'];
    const rows = sortedFilteredPosts.map(p => {
      const { date, time } = formatScheduledAt(p.scheduled_at);
      const conn = connections.find(c => p.social_connection_id ? c.id === p.social_connection_id : c.platform === p.platform);
      const plat = PLATFORMS.find(pl => pl.id === p.platform);
      return [date, time, conn?.account_name ?? '', plat?.label ?? p.platform, p.clips?.title ?? '', p.caption ?? '', STATUS_STYLE[getEffectiveStatus(p)]?.label ?? getEffectiveStatus(p), p.published_url ?? '', p.error_message ?? ''];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `posts-${new Date().toISOString().split('T')[0]}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────────

  const navBtnSt: React.CSSProperties = { background: '#F0EDE9', border: '1px solid rgba(0,0,0,0.08)', borderRadius: radius.md, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: '#1A1714', fontFamily: "'Inter',sans-serif", flexShrink: 0 };

  // ── Render: post card (list / day views) ──────────────────────────────────────

  const renderPostCard = (post: ScheduledPost) => {
    const plat           = PLATFORMS.find(p => p.id === post.platform);
    const effSt          = STATUS_STYLE[getEffectiveStatus(post)] ?? STATUS_STYLE.scheduled;
    const { date, time } = formatScheduledAt(post.scheduled_at);
    const isCancelling   = cancellingId === post.id;
    const canCancel      = post.status === 'scheduled';
    return (
      <div key={post.id} onClick={() => openPreview(post)} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderLeft: `3px solid ${effSt.color}`, borderRadius: radius.lg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        {post.clips?.thumbnail_url
          ? <img src={post.clips.thumbnail_url} alt="" style={{ width: 28, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          : <div style={{ width: 28, height: 50, borderRadius: 4, background: plat?.bgColor ?? '#f0ede9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{plat?.iconSm ?? '📱'}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.clips?.title ?? 'Clip'}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.onSurfaceVariant }}>{plat?.label ?? post.platform} · {date} at {time}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: effSt.color, background: effSt.bg, padding: '4px 10px', borderRadius: radius.full }}>{effSt.label}</span>
          {canCancel && (
            <button onClick={e => { e.stopPropagation(); handleCancelPost(post.id); }} disabled={isCancelling} style={{ fontSize: 11, fontWeight: 600, color: colors.onSurfaceVariant, background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: radius.md, padding: '4px 10px', cursor: isCancelling ? 'default' : 'pointer', opacity: isCancelling ? 0.5 : 1, fontFamily: "'Inter',sans-serif" }}>
              {isCancelling ? '...' : 'Cancel'}
            </button>
          )}
          {post.published_url && (
            <a onClick={e => e.stopPropagation()} href={post.published_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: '#059669', textDecoration: 'none' }}>View ↗</a>
          )}
        </div>
      </div>
    );
  };

  // ── Render: calendar month ────────────────────────────────────────────────────

  const renderCalendarMonth = () => {
    const todayDate   = new Date();
    const isCurrentMo = calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();
    const firstDow    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const postsByDay: Record<number, ScheduledPost[]> = {};
    filteredPosts.forEach(p => {
      const d = new Date(p.scheduled_at);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push(p);
      }
    });

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', marginBottom: 2 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: colors.onSurfaceVariant, padding: '4px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 2 }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 80 }} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayPosts  = postsByDay[day] ?? [];
            const isToday   = isCurrentMo && day === todayDate.getDate();
            const isPastDay = new Date(calYear, calMonth, day + 1) <= todayDate;
            return (
              <div key={day} onClick={() => { if (hasConnections && dayPosts.length === 0) openModal(new Date(calYear, calMonth, day)); }} style={{ minHeight: 80, background: isToday ? 'rgba(124,58,237,0.06)' : '#fff', border: isToday ? '1.5px solid rgba(124,58,237,0.4)' : '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '4px', overflow: 'hidden', opacity: isPastDay && dayPosts.length === 0 ? 0.35 : 1, cursor: hasConnections && dayPosts.length === 0 && !isPastDay ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 10, fontWeight: isToday ? 800 : 500, color: isToday ? '#7C3AED' : colors.onSurfaceVariant, marginBottom: 3, lineHeight: 1 }}>{day}</div>
                {dayPosts.slice(0, 2).map(p => {
                  const effSt       = STATUS_STYLE[getEffectiveStatus(p)] ?? STATUS_STYLE.scheduled;
                  const { time }    = formatScheduledAt(p.scheduled_at);
                  const platData    = PLATFORMS.find(pl => pl.id === p.platform);
                  return (
                    <div key={p.id} onClick={(e) => { e.stopPropagation(); openPreview(p); }} title={`${p.clips?.title ?? 'Clip'} at ${time}`}
                      style={{ marginBottom: 2, padding: '3px 5px 3px 5px', borderRadius: 4, background: effSt.bg, borderLeft: `3px solid ${effSt.color}`, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.clips?.thumbnail_url && <img src={p.clips.thumbnail_url} alt="" style={{ width: 16, height: 28, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: effSt.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, lineHeight: 1.3 }}>{p.clips?.title ?? 'Clip'}</span>
                          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}>{platData?.iconXs}</span>
                        </div>
                        <div style={{ fontSize: 8, color: colors.onSurfaceVariant, lineHeight: 1.3, marginTop: 1 }}>{time}</div>
                      </div>
                    </div>
                  );
                })}
                {dayPosts.length > 2 && (
                  <div onClick={() => { setCalRefDate(new Date(calYear, calMonth, day)); setCalView('day'); }}
                    style={{ fontSize: 9, color: '#7C3AED', cursor: 'pointer', fontWeight: 600, paddingLeft: 3, lineHeight: 1.5 }}>
                    +{dayPosts.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Render: calendar week ─────────────────────────────────────────────────────

  const renderCalendarWeek = () => {
    const todayDate = new Date();
    const weekStart = getWeekStart(calRefDate);
    const weekDays  = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

    const postsByDayIdx: ScheduledPost[][] = weekDays.map(wd =>
      filteredPosts.filter(p => sameDay(new Date(p.scheduled_at), wd))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    );

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
        {weekDays.map((wd, i) => {
          const isToday  = sameDay(wd, todayDate);
          const dayPosts = postsByDayIdx[i];
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ textAlign: 'center', padding: '6px 4px', borderRadius: radius.md, background: isToday ? '#7C3AED' : 'transparent' }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: isToday ? '#fff' : colors.onSurfaceVariant }}>{wd.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isToday ? '#fff' : colors.onSurface }}>{wd.getDate()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 80 }}>
                {dayPosts.map(p => {
                  const effSt    = STATUS_STYLE[getEffectiveStatus(p)] ?? STATUS_STYLE.scheduled;
                  const { time } = formatScheduledAt(p.scheduled_at);
                  const platData = PLATFORMS.find(pl => pl.id === p.platform);
                  return (
                    <div key={p.id} onClick={() => openPreview(p)} title={p.clips?.title ?? 'Clip'}
                      style={{ padding: '3px 5px 3px 5px', borderRadius: 4, background: effSt.bg, borderLeft: `3px solid ${effSt.color}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.clips?.thumbnail_url && <img src={p.clips.thumbnail_url} alt="" style={{ width: 14, height: 25, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <span style={{ fontSize: 9, color: effSt.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{time}</span>
                          <span style={{ flexShrink: 0, display: 'flex' }}>{platData?.iconXs}</span>
                        </div>
                        <span style={{ fontSize: 9, color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.clips?.title ?? 'Clip'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render: calendar day ──────────────────────────────────────────────────────

  const renderCalendarDay = () => {
    const dayPosts = filteredPosts
      .filter(p => sameDay(new Date(p.scheduled_at), calRefDate))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    return dayPosts.length === 0
      ? <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: colors.onSurfaceVariant }}>No posts on this day.</div>
      : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{dayPosts.map(renderPostCard)}</div>;
  };

  // ── Render: mobile calendar fallback ─────────────────────────────────────────

  const renderMobileCalendar = () => {
    let periodPosts: ScheduledPost[];
    if (calView === 'week') {
      const ws = getWeekStart(calRefDate), we = new Date(ws.getTime() + 7 * 86400000);
      periodPosts = filteredPosts.filter(p => { const d = new Date(p.scheduled_at); return d >= ws && d < we; });
    } else {
      periodPosts = filteredPosts.filter(p => { const d = new Date(p.scheduled_at); return d.getFullYear() === calYear && d.getMonth() === calMonth; });
    }
    const byDay: Record<string, ScheduledPost[]> = {};
    periodPosts.forEach(p => { const k = new Date(p.scheduled_at).toDateString(); (byDay[k] = byDay[k] ?? []).push(p); });
    const keys = Object.keys(byDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return keys.length === 0
      ? <div style={{ textAlign: 'center', padding: '36px 0', fontSize: 13, color: colors.onSurfaceVariant }}>No posts for this period.</div>
      : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {keys.map(k => (
            <div key={k}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>{new Date(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{byDay[k].map(renderPostCard)}</div>
            </div>
          ))}
        </div>;
  };

  // ── Render: sheet (table) ─────────────────────────────────────────────────────

  const renderSheet = () => {
    const toggleSort = (col: 'date' | 'status') => {
      if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortCol(col); setSortDir('asc'); }
    };
    const sortArrow = (col: 'date' | 'status') => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';
    const thSt: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9F7F5', borderBottom: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' };
    const tdSt: React.CSSProperties = { padding: '10px 12px', fontSize: 12, color: colors.onSurface, borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'middle' };
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{sortedFilteredPosts.length} post{sortedFilteredPosts.length !== 1 ? 's' : ''}</span>
          <button onClick={exportCSV} style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: radius.md, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Export CSV</button>
        </div>
        {sortedFilteredPosts.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: colors.onSurfaceVariant }}>No posts match your filters.</div>
          : (
            <div style={{ overflowX: 'auto', borderRadius: radius.lg, border: '1px solid rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('date')} style={{ ...thSt, cursor: 'pointer' }}>Date{sortArrow('date')}</th>
                    <th style={thSt}>Time</th>
                    <th style={thSt}>Account</th>
                    <th style={thSt}>Platform</th>
                    <th style={thSt}>Clip</th>
                    <th style={thSt}>Caption</th>
                    <th onClick={() => toggleSort('status')} style={{ ...thSt, cursor: 'pointer' }}>Status{sortArrow('status')}</th>
                    <th style={thSt}>Published</th>
                    <th style={thSt}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredPosts.map((p, idx) => {
                    const { date, time } = formatScheduledAt(p.scheduled_at);
                    const conn   = connections.find(c => p.social_connection_id ? c.id === p.social_connection_id : c.platform === p.platform);
                    const plat   = PLATFORMS.find(pl => pl.id === p.platform);
                    const effSt  = STATUS_STYLE[getEffectiveStatus(p)] ?? STATUS_STYLE.scheduled;
                    const rowBg  = idx % 2 === 0 ? '#fff' : '#FAFAF9';
                    return (
                      <tr key={p.id} onClick={() => openPreview(p)} style={{ background: rowBg, cursor: 'pointer', borderLeft: `3px solid ${effSt.color}` }}>
                        <td style={tdSt}>{date}</td>
                        <td style={tdSt}>{time}</td>
                        <td style={tdSt}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: 120 }}>
                            {conn?.account_avatar && <img src={conn.account_avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>{conn?.account_name ?? '—'}</span>
                          </div>
                        </td>
                        <td style={tdSt}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {plat?.iconSm}
                            <span style={{ fontSize: 11, color: colors.onSurfaceVariant, whiteSpace: 'nowrap' }}>{plat?.label ?? p.platform}</span>
                          </div>
                        </td>
                        <td style={tdSt}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, maxWidth: 160 }}>
                            {p.clips?.thumbnail_url && <img src={p.clips.thumbnail_url} alt="" style={{ width: 22, height: 39, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                            <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.clips?.title ?? '—'}</span>
                          </div>
                        </td>
                        <td style={{ ...tdSt, maxWidth: 180 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: colors.onSurfaceVariant, maxWidth: 170 }}>{p.caption ?? '—'}</span>
                        </td>
                        <td style={tdSt}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: effSt.color, background: effSt.bg, padding: '3px 8px', borderRadius: radius.full, whiteSpace: 'nowrap' }}>{effSt.label}</span>
                        </td>
                        <td style={tdSt}>
                          {p.published_url
                            ? <a href={p.published_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: '#059669', fontWeight: 600, textDecoration: 'none' }}>View ↗</a>
                            : <span style={{ color: colors.onSurfaceVariant, opacity: 0.4 }}>—</span>}
                        </td>
                        <td style={{ ...tdSt, maxWidth: 160 }}>
                          {p.error_message
                            ? <span style={{ fontSize: 10, color: '#DC2626', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{p.error_message}</span>
                            : <span style={{ color: colors.onSurfaceVariant, opacity: 0.4 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    );
  };

  // ── Render: list (grouped) ────────────────────────────────────────────────────

  const renderList = () => (
    <>
      {!loadingPosts && upcomingGroups.length === 0 && (
        <div style={{ background: '#F9F7F5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: radius.lg, padding: '36px 24px', textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>📅</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.onSurface, margin: '0 0 4px' }}>{hasFilters ? 'No posts match your filters.' : 'No posts scheduled yet'}</p>
          {!hasFilters && <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: 0 }}>{hasConnections ? 'Use + Schedule above.' : 'Connect an account first.'}</p>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 12 }}>
        {upcomingGroups.map(group => (
          <div key={group.key}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{group.posts.map(renderPostCard)}</div>
          </div>
        ))}
      </div>
      {pastPosts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowPast(v => !v)} style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10 }}>{showPast ? '▲' : '▼'}</span>
            {showPast ? 'Hide' : `Show ${pastPosts.length} past post${pastPosts.length !== 1 ? 's' : ''}`}
          </button>
          {showPast && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, opacity: 0.7 }}>{pastPosts.map(renderPostCard)}</div>}
        </div>
      )}
    </>
  );

  // ── Render: sidebar ───────────────────────────────────────────────────────────

  const renderSidebar = () => {
    const platformsWithConns = PLATFORMS.filter(p => sidebarConnections.some(c => c.platform === p.id));
    const unconnectedPlatforms = PLATFORMS.filter(p => !connections.some(c => c.platform === p.id));

    return (
      <div style={{ width: 260, flexShrink: 0, background: SB.bg, borderRadius: radius.xl, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 80px)' }}>

        {/* Header */}
        <div style={{ padding: '18px 16px 12px', borderBottom: `1px solid ${SB.border}` }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: SB.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Connected Accounts</p>
          <input
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            placeholder="Search accounts…"
            style={{ width: '100%', padding: '7px 10px', borderRadius: radius.md, border: `1px solid ${SB.border}`, background: 'rgba(255,255,255,0.06)', color: SB.text, fontSize: 12, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' as const, outline: 'none' }}
          />
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>

          {/* All accounts */}
          <div onClick={() => setFilterAccount(null)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: 'pointer', background: filterAccount === null ? SB.bgActive : 'transparent', borderLeft: filterAccount === null ? `3px solid ${SB.accent}` : '3px solid transparent' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: SB.text }}>All accounts</p>
              <p style={{ margin: 0, fontSize: 10, color: SB.muted }}>{connections.length} connected</p>
            </div>
          </div>

          {/* Platform groups */}
          {platformsWithConns.length === 0 && !loadingConns && !sidebarSearch && (
            <p style={{ fontSize: 11, color: SB.muted, padding: '16px', textAlign: 'center', margin: 0 }}>No connected accounts yet.</p>
          )}
          {platformsWithConns.map(plat => {
            const conns       = sidebarConnections.filter(c => c.platform === plat.id);
            const isCollapsed = collapsedPlatforms.includes(plat.id);
            const toggleCollapse = () => setCollapsedPlatforms(prev => isCollapsed ? prev.filter(x => x !== plat.id) : [...prev, plat.id]);
            return (
              <div key={plat.id}>
                {/* Group header */}
                <div onClick={toggleCollapse} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer', userSelect: 'none' as const }}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, filter: 'brightness(10)' }}>{plat.iconSm}</span>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: SB.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{plat.label}</span>
                  <span style={{ fontSize: 10, color: SB.muted }}>{isCollapsed ? '›' : '▾'}</span>
                </div>
                {/* Connection rows */}
                {!isCollapsed && conns.map(conn => {
                  const active = filterAccount === conn.id;
                  return (
                    <div key={conn.id} onClick={() => setFilterAccount(active ? null : conn.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px 7px 24px', cursor: 'pointer', background: active ? SB.bgActive : 'transparent', borderLeft: active ? `3px solid ${SB.accent}` : '3px solid transparent' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {conn.account_avatar
                          ? <img src={conn.account_avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ filter: 'brightness(10)' }}>{plat.iconXs}</span></div>
                        }
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: '#4ade80', border: `1.5px solid ${SB.bg}` }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: active ? '#fff' : SB.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 148 }}>{conn.account_name ?? plat.label}</p>
                      </div>
                      {active && <span style={{ marginLeft: 'auto', fontSize: 10, color: SB.accent, flexShrink: 0 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${SB.border}` }}>
          <button onClick={() => setShowConnectMenu(v => !v)} style={{ width: '100%', padding: '8px', borderRadius: radius.md, border: `1px solid rgba(155,93,229,0.35)`, background: showConnectMenu ? 'rgba(155,93,229,0.15)' : 'rgba(155,93,229,0.08)', color: '#C084FC', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>+</span> Connect account
          </button>
          {showConnectMenu && unconnectedPlatforms.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {unconnectedPlatforms.map(p => (
                <button key={p.id} onClick={() => { handleConnect(p.id); setShowConnectMenu(false); }} disabled={connecting === p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: radius.md, background: 'rgba(255,255,255,0.05)', border: `1px solid ${SB.border}`, cursor: connecting === p.id ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: connecting === p.id ? 0.5 : 1 }}>
                  <span style={{ filter: 'brightness(10)', display: 'flex' }}>{p.iconSm}</span>
                  <span style={{ fontSize: 12, color: SB.text, fontWeight: 500 }}>{p.label}</span>
                  {connecting === p.id && <span style={{ fontSize: 10, color: SB.muted, marginLeft: 'auto' }}>Opening…</span>}
                </button>
              ))}
              {unconnectedPlatforms.length === 0 && <p style={{ fontSize: 11, color: SB.muted, margin: '4px 0 0', textAlign: 'center' }}>All platforms connected.</p>}
            </div>
          )}
          {showConnectMenu && unconnectedPlatforms.length === 0 && (
            <p style={{ fontSize: 11, color: SB.muted, margin: '8px 0 0', textAlign: 'center' }}>All platforms connected.</p>
          )}
        </div>
      </div>
    );
  };

  // ── Render: calendar header ───────────────────────────────────────────────────

  const renderCalendarHeader = () => {
    const monthLabel = calView === 'month'
      ? new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : calView === 'week'
        ? (() => { const ws = getWeekStart(calRefDate); const we = new Date(ws.getTime() + 6 * 86400000); return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`; })()
        : calView === 'day'
          ? calRefDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : '';

    const selSt: React.CSSProperties = { padding: '6px 10px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: 12, color: colors.onSurface, fontFamily: "'Inter',sans-serif", cursor: 'pointer', height: 32, boxSizing: 'border-box' as const };

    return (
      <div style={{ marginBottom: 14 }}>
        {/* Top row: title + view toggle + schedule button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.onSurface, flexShrink: 0 }}>Schedule</h2>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 1, background: '#F0EDE9', borderRadius: radius.md, padding: 2, border: '1px solid rgba(0,0,0,0.07)', marginLeft: 4 }}>
            {(['month','week','day','sheet','list'] as CalView[]).map(v => (
              <button key={v} onClick={() => setCalView(v)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: calView === v ? '#fff' : 'transparent', color: calView === v ? colors.onSurface : colors.onSurfaceVariant, fontSize: 11, fontWeight: calView === v ? 700 : 500, cursor: 'pointer', fontFamily: "'Inter',sans-serif", boxShadow: calView === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' as const, textTransform: 'capitalize' as const }}>
                {v}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <input
            value={calSearch}
            onChange={e => setCalSearch(e.target.value)}
            placeholder="Search posts…"
            style={{ ...selSt, width: 160, fontSize: 11 }}
          />

          {/* Sort */}
          <select value={sortCol} onChange={e => { setSortCol(e.target.value as 'date' | 'status' | 'platform'); setSortDir('asc'); }} style={{ ...selSt, width: 'auto' }}>
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
            <option value="platform">Sort: Platform</option>
          </select>

          {/* Sort dir toggle */}
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} style={{ ...navBtnSt, fontSize: 12, fontWeight: 700 }} title={sortDir === 'asc' ? 'Ascending' : 'Descending'}>
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>

          {/* Schedule */}
          <button onClick={hasConnections ? () => openModal() : () => setShowConnectMenu(true)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: gradients.primary, border: 'none', padding: '0 16px', height: 32, borderRadius: radius.full, cursor: 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' as const, opacity: loadingConns ? 0.5 : 1, flexShrink: 0 }}>
            + Schedule
          </button>
        </div>

        {/* Bottom row: nav + label + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Nav (only for calendar views) */}
          {(calView === 'month' || calView === 'week' || calView === 'day') && (
            <>
              <button onClick={() => navigateCal(-1)} style={navBtnSt}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.onSurface, minWidth: 180, textAlign: 'center' }}>{monthLabel}</span>
              <button onClick={goToday} style={{ ...navBtnSt, width: 'auto', padding: '0 10px', fontSize: 11, fontWeight: 600, color: '#7C3AED', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>Today</button>
              <button onClick={() => navigateCal(1)} style={navBtnSt}>›</button>
              <div style={{ flex: 1 }} />
            </>
          )}

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selSt, fontSize: 11 }}>
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="publishing">Publishing</option>
            <option value="published">Published</option>
            <option value="not_published">Not Published</option>
          </select>

          {/* Date range */}
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ ...selSt, fontSize: 11 }} />
          <span style={{ fontSize: 11, color: colors.onSurfaceVariant }}>–</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ ...selSt, fontSize: 11 }} />

          {hasFilters && (
            <button onClick={() => { setFilterAccount(null); setFilterPlatform(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setCalSearch(''); }} style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", padding: '4px 2px' }}>
              Clear
            </button>
          )}

          {!hasConnections && !loadingConns && (
            <span style={{ fontSize: 11, color: colors.onSurfaceVariant, marginLeft: 4 }}>Connect an account to schedule posts.</span>
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Scheduler" subtitle="Auto-post your clips to every platform" bg="#E4E2DD" titleColor="#1A1714" subtitleColor="#6B6560">

      {/* Banner */}
      {banner && banner.type === 'success' && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: radius.lg, background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.25)', color: '#059669', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>✓ {banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}
      {banner && banner.type === 'error' && <ErrorBanner message={banner.msg} onClose={() => setBanner(null)} style={{ marginBottom: 16 }} />}

      {/* Mobile account chips */}
      {isMobile && connections.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2, alignItems: 'center' }}>
          <button onClick={() => setFilterAccount(null)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: radius.full, background: filterAccount === null ? '#7C3AED' : '#EFECEA', border: filterAccount === null ? 'none' : '1px solid rgba(0,0,0,0.08)', flexShrink: 0, fontSize: 11, fontWeight: 700, color: filterAccount === null ? '#fff' : colors.onSurface, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
            All
          </button>
          {connections.map(conn => {
            const plat   = PLATFORMS.find(p => p.id === conn.platform);
            const active = filterAccount === conn.id;
            return (
              <button key={conn.id} onClick={() => setFilterAccount(active ? null : conn.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px 5px 8px', borderRadius: radius.full, background: active ? '#7C3AED' : '#EFECEA', border: active ? 'none' : '1px solid rgba(0,0,0,0.08)', flexShrink: 0, fontSize: 11, fontWeight: 600, color: active ? '#fff' : colors.onSurface, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                {conn.account_avatar ? <img src={conn.account_avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} /> : <span style={{ display: 'flex' }}>{plat?.iconSm}</span>}
                {conn.account_name ?? plat?.label ?? conn.platform}
              </button>
            );
          })}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Sidebar — desktop only */}
        {!isMobile && renderSidebar()}

        {/* Main calendar area */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: radius.xl, padding: '20px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {renderCalendarHeader()}

          {/* Calendar / Sheet / List body */}
          {loadingPosts && calView !== 'sheet' && calView !== 'list'
            ? <div style={{ textAlign: 'center', padding: '60px 0', fontSize: 13, color: colors.onSurfaceVariant }}>Loading…</div>
            : calView === 'month'
              ? (isMobile ? renderMobileCalendar() : renderCalendarMonth())
            : calView === 'week'
              ? (isMobile ? renderMobileCalendar() : renderCalendarWeek())
            : calView === 'day'
              ? renderCalendarDay()
            : calView === 'sheet'
              ? renderSheet()
              : renderList()
          }
        </div>
      </div>

      {/* ── Side panel ── */}
      {previewPost && (() => {
        const plat           = PLATFORMS.find(p => p.id === previewPost.platform);
        const effSt          = STATUS_STYLE[getEffectiveStatus(previewPost)] ?? STATUS_STYLE.scheduled;
        const postConn       = connections.find(c => previewPost.social_connection_id ? c.id === previewPost.social_connection_id : c.platform === previewPost.platform);
        const { date, time } = formatScheduledAt(previewPost.scheduled_at);
        const isNotPublished = getEffectiveStatus(previewPost) === 'not_published';
        const canEdit        = previewPost.status === 'scheduled';
        return (
          <div onClick={closePreview} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#F5F3EF', width: '100%', maxWidth: 420, height: '100%', overflowY: 'auto', boxShadow: '-4px 0 32px rgba(0,0,0,0.14)' }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.onSurface }}>Post Detail</h3>
                  <button onClick={closePreview} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.onSurfaceVariant, lineHeight: 1, padding: '4px 6px' }}>×</button>
                </div>
                <div style={{ width: 130, margin: '0 auto 12px', aspectRatio: '9/16', background: '#1A1714', borderRadius: radius.lg, overflow: 'hidden', position: 'relative' }}>
                  {previewPost.clips?.video_url
                    ? <video src={previewPost.clips.video_url} controls muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : previewPost.clips?.thumbnail_url
                      ? <img src={previewPost.clips.thumbnail_url} alt={previewPost.clips.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 28, opacity: 0.25 }}>▶</span></div>
                  }
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: colors.onSurface, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewPost.clips?.title ?? 'Clip'}</p>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: radius.full, background: plat?.bgColor ?? '#eee', border: '1px solid rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600, color: colors.onSurface, flexShrink: 0 }}>
                    {plat?.iconSm}{plat?.label ?? previewPost.platform}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: effSt.color, background: effSt.bg, padding: '4px 10px', borderRadius: radius.full, flexShrink: 0 }}>{effSt.label}</span>
                </div>
                {postConn && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    {postConn.account_avatar ? <img src={postConn.account_avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} /> : <span style={{ display: 'flex' }}>{plat?.iconSm}</span>}
                    <span style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{postConn.account_name ?? plat?.label ?? previewPost.platform}</span>
                  </div>
                )}
                <p style={{ margin: '0 0 16px', fontSize: 12, color: colors.onSurfaceVariant }}>{date} at {time}</p>
                {previewPost.error_message && <ErrorBanner message={previewPost.error_message} style={{ marginBottom: 14 }} />}
                <label style={{ fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  Caption {!canEdit && <span style={{ fontWeight: 400, opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>locked</span>}
                </label>
                {canEdit
                  ? <textarea value={previewCaption} onChange={e => { setPreviewCaption(e.target.value); setPanelErr(null); }} rows={4} placeholder="Write a caption…" style={{ width: '100%', padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif", resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
                  : <div style={{ padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.08)', background: colors.surfaceContainerHighest, fontSize: 13, color: previewPost.caption ? colors.onSurface : colors.onSurfaceVariant, lineHeight: 1.55, marginBottom: 8, whiteSpace: 'pre-wrap', minHeight: 52 }}>
                      {previewPost.caption || <span style={{ opacity: 0.5 }}>No caption</span>}
                    </div>
                }
                <div style={{ margin: '16px 0 0', paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Reschedule</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="date" min={todayStr} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} style={{ flex: '1 1 120px', padding: '8px 10px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 12, color: colors.onSurface, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' as const }} />
                    <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} style={{ flex: '0 0 100px', padding: '8px 10px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 12, color: colors.onSurface, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' as const }} />
                  </div>
                  <button onClick={handleReschedule} disabled={rescheduling || !rescheduleDate || !rescheduleTime} style={{ width: '100%', padding: '9px', borderRadius: radius.md, border: 'none', background: (rescheduling || !rescheduleDate || !rescheduleTime) ? colors.surfaceContainerHighest : gradients.primary, color: (rescheduling || !rescheduleDate || !rescheduleTime) ? colors.onSurfaceVariant : '#fff', fontSize: 12, fontWeight: 700, cursor: (rescheduling || !rescheduleDate || !rescheduleTime) ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif" }}>
                    {rescheduling ? 'Rescheduling…' : 'Reschedule Post'}
                  </button>
                </div>
                {panelErr && <ErrorBanner message={panelErr} onClose={() => setPanelErr(null)} style={{ marginTop: 12 }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  {canEdit && previewCaption !== (previewPost.caption ?? '') && (
                    <button onClick={handleSaveCaption} disabled={savingCaption} style={{ padding: '10px', borderRadius: radius.md, border: 'none', background: savingCaption ? colors.surfaceContainerHighest : gradients.primary, color: savingCaption ? colors.onSurfaceVariant : '#fff', fontSize: 13, fontWeight: 700, cursor: savingCaption ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif" }}>
                      {savingCaption ? 'Saving…' : 'Save Caption'}
                    </button>
                  )}
                  {isNotPublished && (
                    <button onClick={handleRetry} disabled={retrying} style={{ padding: '10px', borderRadius: radius.md, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#D97706', fontSize: 13, fontWeight: 700, cursor: retrying ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: retrying ? 0.6 : 1 }}>
                      {retrying ? 'Retrying…' : 'Retry Now (posts in ~5 min)'}
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={async () => { await handleCancelPost(previewPost.id); closePreview(); }} disabled={cancellingId === previewPost.id} style={{ padding: '10px', borderRadius: radius.md, border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: cancellingId === previewPost.id ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: cancellingId === previewPost.id ? 0.6 : 1 }}>
                      {cancellingId === previewPost.id ? '…' : 'Cancel Post'}
                    </button>
                  )}
                  {previewPost.published_url && (
                    <a href={previewPost.published_url} target="_blank" rel="noopener noreferrer" style={{ padding: '10px', borderRadius: radius.md, border: '1px solid rgba(5,150,105,0.25)', background: 'rgba(5,150,105,0.06)', color: '#059669', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      View Published Post ↗
                    </a>
                  )}
                  <button onClick={closePreview} style={{ padding: '10px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.1)', background: colors.surfaceContainerHighest, color: colors.onSurface, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Compose Modal ── */}
      {showModal && (
        <div onClick={() => { if (!submitting) { setShowModal(false); setSelectedConnIds([]); } }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#F5F3EF', borderRadius: radius.xl, padding: '28px', width: '100%', maxWidth: 480, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: colors.onSurface }}>Schedule a Post</h3>
              <button onClick={() => { setShowModal(false); setSelectedConnIds([]); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.onSurfaceVariant, lineHeight: 1, padding: '4px 6px' }}>×</button>
            </div>
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Clip</label>
            {savedClips.length === 0
              ? <div style={{ padding: '14px 16px', borderRadius: radius.md, background: colors.surfaceContainerHighest, border: '1px solid rgba(0,0,0,0.07)', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20 }}>No saved clips yet. <a href="/import" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Generate clips first →</a></div>
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, maxHeight: 240, overflowY: 'auto', marginBottom: 20, paddingRight: 2 }}>
                  {savedClips.map(c => {
                    const sel = modalClipId === c.id;
                    return (
                      <button key={c.id} onClick={() => handleClipSelect(c.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: 'none', border: sel ? `2px solid #7C3AED` : '2px solid rgba(0,0,0,0.08)', borderRadius: radius.md, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                        <div style={{ width: '100%', aspectRatio: '9/16', background: '#2A2624', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          {c.thumbnail_url ? <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, opacity: 0.4 }}>▶</span>}
                          {c.source === 'upload'
                            ? <span style={{ position: 'absolute', top: 5, right: 5, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(124,58,237,0.75)', padding: '2px 5px', borderRadius: 4 }}>Upload</span>
                            : c.virality_score != null && <span style={{ position: 'absolute', top: 5, right: 5, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 5px', borderRadius: 4 }}>{c.virality_score}</span>
                          }
                          {sel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22, color: '#fff', fontWeight: 800 }}>✓</span></div>}
                        </div>
                        <div style={{ padding: '5px 7px', background: sel ? 'rgba(124,58,237,0.08)' : '#fff' }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: sel ? '#7C3AED' : colors.onSurface, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{c.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            }
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Platforms</label>
            <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: '0 0 8px', opacity: 0.75 }}>Select one or more. A separate post is created for each.</p>
            {connections.length === 0
              ? <div style={{ padding: '14px 16px', borderRadius: radius.md, background: colors.surfaceContainerHighest, border: '1px solid rgba(0,0,0,0.07)', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 20 }}>No connected accounts yet.</div>
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {connections.map(conn => {
                    const plat  = PLATFORMS.find(p => p.id === conn.platform);
                    const sel   = selectedConnIds.includes(conn.id);
                    const label = conn.platform === 'facebook' && conn.account_name ? conn.account_name : (plat?.label ?? conn.platform);
                    return (
                      <button key={conn.id} onClick={() => setSelectedConnIds(prev => sel ? prev.filter(id => id !== conn.id) : [...prev, conn.id])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: radius.full, border: sel ? `2px solid #7C3AED` : '1px solid rgba(0,0,0,0.12)', background: sel ? 'rgba(124,58,237,0.08)' : '#fff', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: sel ? '#7C3AED' : colors.onSurface }}>
                        {plat?.iconSm}{label}{sel && <span style={{ fontSize: 10, marginLeft: 2 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )
            }
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Caption</label>
              <button
                onClick={handleGenerateCaption}
                disabled={!modalClipId || generatingCaption}
                title={!modalClipId ? 'Select a clip first' : ''}
                style={{ fontSize: 11, fontWeight: 700, color: (!modalClipId || generatingCaption) ? colors.onSurfaceVariant : '#7C3AED', background: (!modalClipId || generatingCaption) ? 'transparent' : 'rgba(124,58,237,0.08)', border: `1px solid ${(!modalClipId || generatingCaption) ? 'rgba(0,0,0,0.1)' : 'rgba(124,58,237,0.25)'}`, borderRadius: radius.full, padding: '4px 12px', cursor: (!modalClipId || generatingCaption) ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {generatingCaption ? '✨ Writing…' : modalCaption ? '✨ Regenerate' : '✨ Write with AI'}
              </button>
            </div>
            {captionGenErr && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#DC2626' }}>{captionGenErr}</p>}
            <textarea value={modalCaption} onChange={e => { setModalCaption(e.target.value); setCaptionGenErr(null); }} rows={3} placeholder="Write a caption, or use ✨ Write with AI above…" style={{ width: '100%', padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif", resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Date &amp; Time</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              <input type="date" min={todayStr} value={modalDate} onChange={e => setModalDate(e.target.value)} style={{ flex: '1 1 140px', minWidth: 0, padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' as const }} />
              <input type="time" value={modalTime} onChange={e => setModalTime(e.target.value)} style={{ flex: '1 1 110px', minWidth: 0, padding: '10px 12px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, color: colors.onSurface, fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowModal(false); setSelectedConnIds([]); }} style={{ flex: 1, padding: '11px', borderRadius: radius.md, border: '1px solid rgba(0,0,0,0.1)', background: colors.surfaceContainerHighest, color: colors.onSurface, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
              <button onClick={handleSchedule} disabled={!canSchedule} style={{ flex: 2, padding: '11px', borderRadius: radius.md, border: 'none', background: canSchedule ? gradients.primary : colors.surfaceContainerHighest, color: canSchedule ? '#fff' : colors.onSurfaceVariant, fontSize: 13, fontWeight: 700, cursor: canSchedule ? 'pointer' : 'default', fontFamily: "'Inter',sans-serif" }}>
                {submitting ? 'Scheduling...' : selectedConnIds.length > 1 ? `Schedule to ${selectedConnIds.length} Accounts` : 'Schedule Post'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
