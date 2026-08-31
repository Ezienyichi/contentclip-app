"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import DashboardLayout from "@/components/DashboardLayout";
import { colors as _colors, gradients, radius } from "@/lib/tokens";
import EngagementPanel, { EngagementProfile } from "@/components/engagement/EngagementPanel";
import { useTour } from '@/lib/useTour';
import Tour from '@/components/tour/Tour';
import TourInfoIcon from '@/components/tour/TourInfoIcon';
import { IMPORT_STEPS } from '@/components/tour/tourSteps';
import UpgradeModal from '@/components/UpgradeModal';

const colors = {
  ..._colors,
  background: '#E4E2DD',
  surfaceContainer: '#EFECEA',
  surfaceContainerLow: '#EFECEA',
  surfaceContainerHigh: '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest: '#F5F3EF',
  onSurface: '#1A1714',
  onSurfaceVariant: '#6B6560',
  outlineVariant: 'rgba(0,0,0,0.12)',
};
import ComingSoonModal from "@/components/ComingSoonModal";

const RATIO_ENUM_MAP: Record<string, string> = {
  '9:16': 'RATIO_9_16',
  '16:9': 'RATIO_16_9',
  '1:1': 'RATIO_1_1',
  '4:5': 'RATIO_4_5',
};

function resolutionForPlan(plan: string): string {
  return plan === 'free' ? 'HD_720' : 'FHD_1080';
}

const supabase = createClient();

const CLIPS_STORAGE_KEY = 'vangelclip_cached_clips';

const SAMPLE_CLIPS: { url: string; label?: string }[] = [
  // Add sample clip URLs here to show the "See it in action" teaser.
  // Example: { url: 'https://your-cdn.com/clip1.mp4', label: 'Sermon' },
];

function extractVideoId(url: string): string {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];
  if (longMatch) return longMatch[1];
  if (embedMatch) return embedMatch[1];
  return '';
}

function stripEmoji(s: string): string {
  return s.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim();
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';

      let settled = false;
      const finish = (result: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { URL.revokeObjectURL(url); } catch {}
        video.src = '';
        resolve(result);
      };

      const timer = setTimeout(() => finish(null), 4000);
      video.onloadedmetadata = () => {
        const d = video.duration;
        finish(isFinite(d) && d > 0 ? d : null);
      };
      video.onerror = () => finish(null);
      video.src = url;
    } catch {
      resolve(null);
    }
  });
}

const CONTENT_TYPES = [
  {
    id: 'testimony',
    label: 'Testimony',
    emoji: 'T1',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.4)',
    stat: '1,200% more shares',
    description: 'Real stories of transformation. One person sharing what God did in their life.',
    prompt: 'Find moments where someone shares a personal testimony, transformation story, life-changing experience, or before-and-after moment. Look for emotional peaks, vulnerability, breakthrough declarations, and specific details about what changed. These clips generate 1200% more shares than text and image content.',
    tips: [
      'Works best with 1-3 real people telling their story',
      'Emotional peaks get the most saves',
      'Specific details beat vague statements',
    ],
  },
  {
    id: 'truth',
    label: 'Truth',
    emoji: 'T2',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.12)',
    borderColor: 'rgba(14,165,233,0.4)',
    stat: 'Highest comment rate',
    description: 'Short biblical insight delivered fast. One pastor answering one honest question. No graphics, no announcements, just truth.',
    prompt: 'Find moments of clear, powerful biblical teaching. Look for when the speaker delivers a sharp insight, answers a real question, breaks down a scripture in a fresh way, or says something that makes the listener rethink what they believed. Short punchy truth statements that feel like a revelation. No announcements, no church logistics, just raw truth delivered with conviction.',
    tips: [
      'Under 60 seconds works best',
      'One question one answer format',
      'Bold statements that challenge assumptions',
    ],
  },
  {
    id: 'team',
    label: 'Team',
    emoji: 'T3',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.4)',
    stat: 'Kills fear of the unknown',
    description: 'Behind-the-scenes content featuring real people. The number one reason people do not try a new church is fear of the unknown.',
    prompt: 'Find behind-the-scenes moments showing real people being authentic. Look for laughter, casual conversations, team interactions, setup moments, candid reactions, or any moment that shows the human side of the church or organisation. These clips make viewers feel like they already know the people and reduce the fear barrier that stops people from engaging.',
    tips: [
      'Candid moments beat staged content',
      'Show real personality and laughter',
      'Makes strangers feel welcome before they arrive',
    ],
  },
  {
    id: 'transcendence',
    label: 'Transcendence',
    emoji: 'T4',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.4)',
    stat: 'Reaches most non-Christians',
    description: 'A worship moment. A baptism. The second a song breaks the room open. Worship clips reach more non-Christians than sermon clips.',
    prompt: 'Find transcendent worship moments, baptisms, powerful prayer moments, or any point where the atmosphere shifts. Look for the exact second the room breaks open emotionally. Musical peaks, congregational responses, moments of visible emotion, hands raised, tears, breakthrough worship. These clips reach more non-Christians than any sermon clip because they capture something words cannot explain.',
    tips: [
      'Capture the exact moment the atmosphere shifts',
      'Baptism moments get massive engagement',
      'Music peaks with congregational response',
    ],
  },
];

const AUDIENCE_PRESETS = [
  {
    id: 'faith',
    icon: '✝',
    label: 'Sermons & Faith',
    description: 'Gospel, worship, testimony, and church content',
    defaultTs: ['testimony', 'truth', 'team', 'transcendence'],
  },
  {
    id: 'podcast',
    icon: '🎙',
    label: 'Podcasts',
    description: 'Hooks, hot takes, stories, and quotable moments',
    defaultTs: [],
  },
  {
    id: 'music',
    icon: '🎵',
    label: 'Music',
    description: 'Hook, chorus drop, emotive verse, sing-along moments',
    defaultTs: [],
  },
  {
    id: 'film',
    icon: '🎬',
    label: 'Film & Media Marketing',
    description: 'Trailer-style promos for your own content',
    defaultTs: [],
    requiresRights: true,
  },
];

function buildSmartPrompt(
  category: string,
  selectedTs: string[],
  mode: string,
): string {
  if (category === 'podcast') {
    return 'Find the most engaging conversational moments: strong hooks, hot takes, surprising stories, debate moments, quotable one-liners, emotional peaks. Prioritise clips that feel punchy and shareable as short-form vertical video. Each clip should be able to stand alone without context from the rest of the episode.';
  }

  if (category === 'music') {
    return 'Find the most shareable musical moments: the hook or chorus, the beat drop, the most emotive verse, sing-along moments, standout instrumental sections. Prioritise the exact moments that create a strong emotional or physical response in the listener. Clips should capture the peak energy of the performance.';
  }

  if (category === 'film') {
    return 'Find the most compelling trailer-style moments for promotional use: character introductions, tension and cliffhanger beats, emotional highs, quotable lines, and visual spectacle moments. These clips should work as promo reels that make audiences want to watch the full piece. Avoid spoilers — tease, do not reveal.';
  }

  // faith / gospel — 4T framework
  if (mode === 'auto') {
    return 'Automatically detect and categorise every clip as one of: Testimony (personal transformation stories), Truth (biblical insight or teaching moment), Team (behind-the-scenes authentic moments), or Transcendence (worship, baptism, or atmosphere-shifting moments). Prioritise clips with the highest emotional impact and viral potential. For each clip indicate which of the 4T categories it falls into.';
  }

  const typeMap: Record<string, string> = {
    testimony: 'Find moments where someone shares a personal testimony, transformation story, life-changing experience, or before-and-after moment. Look for emotional peaks, vulnerability, breakthrough declarations, and specific details about what changed. These clips generate 1200% more shares than text and image content.',
    truth: 'Find moments of clear powerful biblical teaching or insight. Look for when the speaker delivers a sharp insight, answers a real question, breaks down a scripture in a fresh way, or says something that makes the listener rethink what they believed. Short punchy truth statements that feel like a revelation.',
    team: 'Find behind-the-scenes moments showing real people being authentic. Look for laughter, casual conversations, team interactions, setup moments, candid reactions, or any moment that shows the human side of the people. These clips make viewers feel like they already know the people and reduce the fear barrier.',
    transcendence: 'Find transcendent worship moments, baptisms, powerful prayer moments, or any point where the atmosphere shifts. Look for the exact second the room breaks open emotionally. Musical peaks, congregational responses, moments of visible emotion. These clips reach more non-Christians than any sermon clip.',
  };

  const prompts: string[] = [];
  selectedTs.forEach(id => {
    if (typeMap[id]) prompts.push(typeMap[id]);
  });

  if (prompts.length === 0) {
    return 'Find the most engaging hook-worthy moments with high energy and emotional impact.';
  }

  return prompts.join('\n\n') + '\n\nFor each clip indicate which category it belongs to: Testimony, Truth, Team, or Transcendence. Rank clips by viral potential with testimony moments weighted highest as they generate 1200% more shares.';
}

interface Clip {
  video_url: string;
  download_url?: string;
  title: string;
  caption: string;
  hashtags?: string[];
  ai_score?: number;
  duration?: number;
  thumbnail_url?: string;
}

interface ProcessResult {
  success: boolean;
  jobId: string;
  clips: Clip[];
  creditsUsed: number;
  creditsRemaining: number;
}

type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

function ClipCard({
  clip,
  index,
  onDownload,
  onPost,
}: {
  clip: Clip;
  index: number;
  onDownload: () => void;
  onPost: () => void;
}) {
  const router = useRouter();
  const thumbUrl = clip.thumbnail_url;

  return (
    <div
      style={{
        borderRadius: radius.xl,
        border: `1px solid ${colors.outlineVariant}`,
        overflow: "hidden",
        background: colors.surfaceContainerLow,
        display: "flex",
        flexDirection: "column",
        padding: "14px",
      }}
    >
      {/* Video preview — direct video element with exact requested styles */}
      {clip.video_url ? (
        <video
          src={clip.video_url}
          style={{
            width: "100%",
            aspectRatio: "9/16",
            borderRadius: "12px",
            objectFit: "cover",
            background: "#0a0014",
            display: "block",
            marginBottom: "8px",
          }}
          controls
          preload="metadata"
        />
      ) : thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbUrl}
          alt={clip.title}
          style={{
            width: "100%",
            aspectRatio: "9/16",
            borderRadius: "12px",
            objectFit: "cover",
            display: "block",
            marginBottom: "8px",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "9/16",
            borderRadius: "12px",
            background: gradients.primary,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: "8px",
          }}
        >
          <span style={{ color: colors.onPrimary, fontSize: 12, opacity: 0.8 }}>
            Clip {index + 1}
          </span>
        </div>
      )}

      {/* Duration badge */}
      {clip.duration && (
        <span
          style={{
            display: "inline-block",
            marginBottom: 8,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: radius.sm,
            }}
          >
            {clip.duration}s
          </span>
        )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: colors.onSurface,
          }}
        >
          {clip.title}
        </h4>
        {clip.caption && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: colors.onSurfaceVariant,
              lineHeight: 1.5,
            }}
          >
            {stripEmoji(clip.caption)}
          </p>
        )}
        {clip.hashtags && clip.hashtags.length > 0 && (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: colors.primary,
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {clip.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
          </p>
        )}
        {clip.ai_score !== undefined && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: `${colors.primaryContainer}30`,
              border: `1px solid ${colors.primary}40`,
              borderRadius: 6,
              padding: "2px 8px",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 10, color: colors.primary, fontWeight: 700 }}>
              AI Score
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: colors.onSurface }}>
              {clip.ai_score}
            </span>
            <span style={{ fontSize: 10, color: colors.onSurfaceVariant }}>/100</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onDownload}
          style={{
            flex: 1,
            minWidth: 80,
            height: 34,
            borderRadius: radius.md,
            border: `1px solid ${colors.outlineVariant}`,
            background: "transparent",
            color: colors.onSurface,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ↓ Download
        </button>
        <button
          onClick={onPost}
          style={{
            flex: 1,
            minWidth: 80,
            height: 34,
            borderRadius: radius.md,
            border: "none",
            background: gradients.primary,
            color: colors.onPrimary,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          → Save to Clips
        </button>
        <button
          onClick={() => {
            sessionStorage.setItem('editor_clip', JSON.stringify({
              video_url: clip.video_url || '',
              thumbnail_url: clip.thumbnail_url || '',
              title: clip.title || '',
              caption: clip.caption || '',
              hashtags: clip.hashtags || [],
            }));
            router.push('/editor');
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '8px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Open in Editor →
        </button>
      </div>
    </div>
  );
}

function LazyVideo({ url, label }: { url: string; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoaded(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (loaded && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [loaded]);

  return (
    <div ref={containerRef} style={{ flexShrink: 0, width: 130, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: '#0e0e14', scrollSnapAlign: 'start' }}>
      {loaded ? (
        <video
          ref={videoRef}
          src={url}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', aspectRatio: '9/16', background: 'rgba(155,93,229,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 15 15" fill="rgba(155,93,229,0.4)"><path d="M3 1.5l10 6-10 6V1.5z"/></svg>
        </div>
      )}
      {label && (
        <div style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      )}
    </div>
  );
}

export default function ImportPage() {
  const router = useRouter();

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [prompt, setPrompt] = useState(
    "Find the most engaging, hook-worthy moments with high energy and emotional impact."
  );
  const [numClips, setNumClips] = useState(3);
  const [minDuration, setMinDuration] = useState(15);
  const [maxDuration, setMaxDuration] = useState(60);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [subtitles, setSubtitles] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [Status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [videoPreview, setVideoPreview] = useState<{
    title: string;
    thumbnail: string;
    videoId: string;
  } | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [category, setCategory] = useState('faith');
  const [contentMode, setContentMode] = useState('auto');
  const [selectedTs, setSelectedTs] = useState<string[]>([]);
  const [dualMode] = useState(false);
  const [videoUrl2] = useState('');
  const [scheduleModal, setScheduleModal] = useState<any | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [importSchedCaption, setImportSchedCaption] = useState('');
  const [importSchedHashtags, setImportSchedHashtags] = useState('');
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [playingClip, setPlayingClip] = useState<number | null>(null);
  const [csmClip, setCsmClip] = useState<{ url: string; title: string } | null>(null);
  const POLL_INTERVAL_MS = 5000;
  const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef<number>(0);
  const [inputTab, setInputTab] = useState<'youtube' | 'upload'>('youtube');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadDuration, setUploadDuration] = useState<number | null>(null);
  const [durationLoading, setDurationLoading] = useState(false);
  const [durationUnknown, setDurationUnknown] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [engagementProfile, setEngagementProfile] = useState<EngagementProfile | null>(null);
  const [engagementDismissed, setEngagementDismissed] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const CLIPPING_MESSAGES = [
    'Analyzing your video...',
    'Finding the best moments...',
    'Selecting the most shareable clips...',
    'Adding captions...',
    'Optimizing for social...',
    'Almost ready...',
  ];

  const isClipping = Status === 'queued' || Status === 'preprocessing' || Status === 'processing';
  const tour = useTour('import', IMPORT_STEPS.length);

  const PLAN_MAX: Record<string, number> = { free: 30, starter: 150, pro: 400, agency: 1200 };
  const minutesRemaining = Math.max(0, (PLAN_MAX[userPlan] ?? 30) - userCredits);
  const insufficientCredits = userCredits > 0 && minutesRemaining <= 0;
  const uploadInsufficientCredits = userCredits > 0 && minutesRemaining <= 0;

  // Fetch user's plan, credits, and engagement profile on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("profiles")
        .select("plan, minutes_used, acquisition_source, content_category")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.plan) {
            setUserPlan(data.plan);
          }
          if (typeof data?.minutes_used === "number") {
            setUserCredits(data.minutes_used);
          }
          setEngagementProfile({
            acquisition_source: data?.acquisition_source ?? null,
            content_category:   data?.content_category   ?? null,
          });
        });
    });
  }, []);

  // Load cached clips from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CLIPS_STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.clips && data.clips.length > 0) {
          setClips(data.clips);
          if (data.videoUrl) {
            setVideoUrl(data.videoUrl);
            const vid = extractVideoId(data.videoUrl);
            if (vid) {
              setVideoPreview({
                title: '',
                thumbnail: `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
                videoId: vid,
              });
            }
          }
        }
      }
    } catch(e) {}
  }, []);

  const isValidUrl = videoUrl.startsWith("http");
  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const isGenerateDisabled =
    (inputTab === 'youtube' ? !isValidUrl : !selectedFile) ||
    loading ||
    (inputTab === 'upload' && durationLoading) ||
    (inputTab === 'upload' && uploadInsufficientCredits);

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    const videoId = extractVideoId(url);
    if (videoId) {
      setVideoPreview({
        title: '',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId: videoId,
      });
    } else {
      setVideoPreview(null);
    }
  };

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (Status !== 'processing') { setMsgIdx(0); return; }
    const id = setInterval(() => setMsgIdx(i => (i + 1) % CLIPPING_MESSAGES.length), 3500);
    return () => clearInterval(id);
  }, [Status]);

  const pollClipStatus = useCallback((taskId: string) => {
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() > pollDeadlineRef.current) {
        stopPolling();
        setLoading(false);
        setStatus("idle");
        setError("Processing timed out. Please try again.");
        return;
      }

      try {
        const res = await fetch(`/api/clip-status/${taskId}`, { credentials: "include" });
        const data = await res.json();

        if (!res.ok || data.success === false) {
          stopPolling();
          setLoading(false);
          setStatus("idle");
          setError(data.error || "Processing failed.");
          return;
        }

        if (data.status === "SUCCEEDED") {
          stopPolling();
          console.log('[clip-status] raw SUCCEEDED response:', JSON.stringify(data, null, 2));
          const rawClips: any[] = data.clips ?? [];
          const normalizedClips = rawClips.map((c: any) => ({
            video_url:     c.video_url     || '',
            download_url:  c.download_url  || '',
            title:         c.title         || 'Clip',
            caption:       c.desc          || '',
            ai_score:      c.score,
            thumbnail_url: c.thumbnail     || '',
            hashtags:      c.tags          || [],
            start_time:    c.start_time    ?? 0,
            end_time:      c.end_time      ?? 60,
            id:            c.id,
            duration:      c.duration,
          }));
          setStatus("completed");
          setResult({
            success: true,
            jobId: taskId,
            clips: normalizedClips,
            creditsUsed: data.cost_usage ?? 0,
            creditsRemaining: userCredits,
          });
          setClips(normalizedClips);
          setGenerationSuccess(true);
          localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify({
            clips: normalizedClips,
            videoUrl,
            generatedAt: new Date().toISOString(),
          }));

          // Non-blocking batch save to DB — clips still show if this fails
          console.log('[clips/save] firing save for', normalizedClips.length, 'clips');
          fetch('/api/clips/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clips: normalizedClips, source_video_name: videoUrl }),
          })
            .then(async r => {
              const text = await r.text();
              console.log('[clips/save] response status:', r.status, 'body:', text);
              if (!r.ok) return null;
              try { return JSON.parse(text); } catch { return null; }
            })
            .then((saved: any) => {
              if (!saved?.savedClips?.length) {
                console.warn('[clips/save] no savedClips in response:', saved);
                return;
              }
              console.log('[clips/save] saved', saved.savedClips.length, 'clips to DB');
              const withDbIds = normalizedClips.map((c: any, i: number) => ({
                ...c,
                db_id: saved.savedClips[i]?.id ?? null,
              }));
              setClips(withDbIds);
              localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify({
                clips: withDbIds,
                videoUrl,
                generatedAt: new Date().toISOString(),
              }));
            })
            .catch((err) => console.error('[clips/save] fetch error:', err));

          setTimeout(() => {
            setLoading(false);
            setStatus("idle");
          }, 900);
        } else {
          setStatus("processing");
        }
      } catch (err) {
        stopPolling();
        setLoading(false);
        setStatus("idle");
        setError(err instanceof Error ? err.message : "Network error while checking status.");
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, userCredits, videoUrl]);

  const handleProcess = useCallback(async () => {
    if (!isValidUrl) return;

    stopPolling();
    setGenerationSuccess(false);
    setEngagementDismissed(false);
    setLoading(true);
    setStatus("queued");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/process-youtube-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          videoUrl,
          limit: numClips,
          ratio: RATIO_ENUM_MAP[aspectRatio] || "RATIO_9_16",
          enableCaption: subtitles,
          enableReframe: aspectRatio !== "16:9",
          resolution: resolutionForPlan(userPlan),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setError(data.error || "Processing failed.");
        setLoading(false);
        setStatus("idle");
        return;
      }

      if (typeof data.credits_remaining === "number") {
        setUserCredits(data.credits_remaining);
      }

      if (!data.task_id) {
        setError("No task ID returned from server.");
        setLoading(false);
        setStatus("idle");
        return;
      }

      setStatus("processing");
      pollClipStatus(data.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
      setStatus("idle");
    }
  }, [
    isValidUrl,
    videoUrl,
    userPlan,
    numClips,
    aspectRatio,
    subtitles,
    pollClipStatus,
    stopPolling,
  ]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || durationLoading) return;

    setGenerationSuccess(false);
    setEngagementDismissed(false);
    setLoading(true);
    setStatus('processing');
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please sign in.'); setLoading(false); return; }

      // Guard: check balance upfront
      if (userCredits > 0 && userCredits < numClips) {
        setError('Not enough credits. Upgrade or buy more.');
        setLoading(false);
        return;
      }

      // ── UPLOAD TO PROCESSING SERVER ──
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);
      formData.append('numClips', String(numClips));
      formData.append('category', category);
      formData.append('prompt', buildSmartPrompt(category, selectedTs, contentMode));
      formData.append('plan', userPlan);

      let uploadSucceeded = false;
      let serverCreditsUsed = 0;

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.vangelclip.app/api/process-upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.clips?.length > 0) {
              uploadSucceeded = true;
              serverCreditsUsed = typeof data.credits_used === 'number' ? data.credits_used : numClips;
              setResult({
                success: true,
                jobId: '',
                clips: data.clips,
                creditsUsed: serverCreditsUsed,
                creditsRemaining: userCredits, // updated after deduction below
              });
              setClips(data.clips);
              setGenerationSuccess(true);
              localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify({ clips: data.clips, videoUrl: selectedFile.name, generatedAt: new Date().toISOString() }));
            } else if (xhr.status === 402 || data.plan_limit_exceeded) {
              setError(data.error || 'This range exceeds your plan limit. Upgrade to process longer videos.');
            } else {
              setError(data.error || 'No clips found. Try a different video.');
            }
          } catch { setError('Failed to parse server response.'); }
          resolve();
        };
        xhr.onerror = () => { setError('Upload failed. Check your connection and try again.'); resolve(); };
        xhr.send(formData);
      });

      // ── DEDUCT CREDITS AFTER SUCCESSFUL PROCESSING ──
      if (uploadSucceeded && serverCreditsUsed > 0) {
        const deductRes = await fetch('/api/upload-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ creditsNeeded: serverCreditsUsed }),
        });
        const deductData = await deductRes.json();
        if (deductData.credits_remaining !== undefined) {
          setUserCredits(deductData.credits_remaining);
          setResult(prev => prev ? { ...prev, creditsRemaining: deductData.credits_remaining } : prev);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setLoading(false);
      setStatus('idle');
      setUploadProgress(0);
    }
  }, [selectedFile, durationLoading, numClips, category, selectedTs, contentMode, userCredits, userPlan]);

  const handleDownload = (clip: Clip) => {
    const a = document.createElement('a');
    a.href = clip.video_url;
    a.target = '_blank';
    a.download = clip.title.replace(/\s+/g, '_') + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePost = (clip: Clip, index: number) => {
    // Save all clips to sessionStorage for clips page
    const clipsToSave = result?.clips.map((c, i) => ({
      title: c.title,
      hook_text: c.caption,
      start_time: 0,
      end_time: c.duration ?? 60,
      virality_score: c.ai_score ?? 85,
      suggested_caption: c.caption,
      hashtags: c.hashtags?.join(' ') ?? '',
      platform: 'tiktok',
      clip_url: c.video_url,
      download_url: c.download_url ?? '',
      thumbnail_url: c.thumbnail_url ?? '',
      duration: c.duration ?? 60,
      status: 'ready',
    })) ?? [];
    sessionStorage.setItem('hookclip_clips', JSON.stringify(clipsToSave));
    router.push('/clips');
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: radius.md,
    border: `1px solid ${colors.outlineVariant}`,
    background: colors.surfaceContainerLowest,
    color: colors.onSurface,
    fontSize: 14,
    padding: "0 16px",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <>
    {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    <DashboardLayout
      title="Import Video"
      subtitle="Paste a YouTube URL and AI will extract your best moments."
      bg="#E4E2DD"
      titleColor="#1A1714"
      subtitleColor="#6B6560"
      actions={<TourInfoIcon onClick={tour.restart} />}
    >
      <div style={{ maxWidth: 900 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 20 }}
        >
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Input tab switcher */}
            <div data-tour="url-input">
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: colors.surfaceContainerHigh, borderRadius: radius.md, padding: '4px' }}>
                {(['youtube', 'upload'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setInputTab(tab)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: inputTab === tab ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'transparent', color: inputTab === tab ? '#ffffff' : colors.onSurfaceVariant }}
                  >
                    {tab === 'youtube' ? 'YouTube Link' : 'Upload Video'}
                  </button>
                ))}
              </div>

              {inputTab === 'youtube' ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl || ''}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      style={inputStyle}
                    />
                    {isYouTube && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: colors.primary, fontWeight: 600 }}>
                        ✓ YouTube
                      </span>
                    )}
                  </div>
                  {videoPreview && (
                    <div style={{ display: 'flex', gap: '14px', padding: '14px', background: '#EFECEA', border: '1px solid rgba(124,58,237,0.20)', borderRadius: '12px', marginTop: '12px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={videoPreview.thumbnail} alt="Video preview" style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoPreview.videoId}/hqdefault.jpg`; }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1714', marginBottom: '4px' }}>Video detected</div>
                        <div style={{ fontSize: '12px', color: '#6B6560' }}>ID: {videoPreview.videoId}</div>
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ Ready to clip</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={async e => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (!file) return;
                      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) { setError('Please select a video or audio file.'); return; }
                      if (file.size > 1024 * 1024 * 1024) { setError('File exceeds 1 GB limit.'); return; }
                      setError(null);
                      setSelectedFile(file);
                      setUploadDuration(null);
                      setDurationLoading(true);
                      setDurationUnknown(false);
                      const dur = await getVideoDuration(file);
                      setDurationLoading(false);
                      if (dur === null) { setDurationUnknown(true); } else { setUploadDuration(dur); }
                    }}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                    style={{ border: `2px dashed ${isDragOver ? '#7c3aed' : 'rgba(124,58,237,0.35)'}`, borderRadius: radius.lg, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: isDragOver ? 'rgba(124,58,237,0.08)' : colors.surfaceContainerLowest, transition: 'all 0.2s' }}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-matroska,video/webm,video/x-msvideo,audio/mpeg,audio/wav,audio/x-m4a,audio/aac"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1024 * 1024 * 1024) { setError('File exceeds 1 GB limit.'); return; }
                        setError(null);
                        setSelectedFile(file);
                        setUploadDuration(null);
                        setDurationLoading(true);
                        setDurationUnknown(false);
                        const dur = await getVideoDuration(file);
                        setDurationLoading(false);
                        if (dur === null) { setDurationUnknown(true); } else { setUploadDuration(dur); }
                      }}
                    />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1714', marginBottom: '6px' }}>
                      {isDragOver ? 'Drop your video here' : 'Drag & drop or click to upload'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B6560' }}>MP4 · MOV · MKV · WebM · AVI · MP3 · WAV · M4A · AAC · Max 1 GB</div>
                  </div>

                  {/* Upload speed tip */}
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#8B8580', lineHeight: 1.5 }}>
                    Tip: 720p exports upload faster and look great as clips.
                  </div>

                  {selectedFile && (
                    <div style={{ padding: '12px 14px', background: uploadInsufficientCredits ? 'rgba(239,68,68,0.06)' : 'rgba(124,58,237,0.08)', border: `1px solid ${uploadInsufficientCredits ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.25)'}`, borderRadius: '10px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                          <div style={{ fontSize: '11px', color: '#6B6560', marginTop: '2px' }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                            {uploadDuration !== null && uploadDuration > 0 && ` · ${Math.ceil(uploadDuration / 60)} min`}
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadDuration(null); setDurationLoading(false); setDurationUnknown(false); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>✕ Remove</button>
                      </div>
                      {durationLoading && (
                        <div style={{ fontSize: '11px', color: '#6B6560', marginTop: '8px' }}>Estimating cost...</div>
                      )}
                      {uploadInsufficientCredits && (
                        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#fca5a5' }}>
                          Not enough credits. Upgrade or buy more.
                        </div>
                      )}
                    </div>
                  )}

                  {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B4540', marginBottom: '6px' }}>
                        <span>Uploading...</span><span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg,#7c3aed,#5b21b6)', borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Uploading... {uploadProgress}%. Please keep this tab open.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.onSurface,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Clip Instruction
              </label>
              <textarea
                value={prompt || ''}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "10px 16px",
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* ── CONTENT INTELLIGENCE ── */}
            <div data-tour="content-category" style={{
              marginTop: '20px',
              padding: '18px',
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: '14px',
            }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1714' }}>
                  Content type
                </div>
                <div style={{ fontSize: '11px', color: '#6B6560', marginTop: '2px' }}>
                  Select what you are clipping so the AI knows what to look for
                </div>
              </div>

              {/* Audience presets — 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {AUDIENCE_PRESETS.map(preset => {
                  const isActive = category === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCategory(preset.id);
                        setSelectedTs(preset.defaultTs);
                        if (preset.id === 'faith') setContentMode('auto');

                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: isActive ? '#7c3aed' : 'rgba(0,0,0,0.10)',
                        background: isActive ? 'rgba(124,58,237,0.10)' : 'rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#1A1714' : '#6B6560' }}>
                          {preset.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: isActive ? '#7C3AED' : '#8B8580', lineHeight: 1.4 }}>
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>


              {/* 4T Content Type Cards — faith only */}
              {category === 'faith' && (
                <>
                  <div data-tour="content-mode" style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    <button
                      onClick={() => setContentMode('auto')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: contentMode === 'auto' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.10)',
                        background: contentMode === 'auto' ? 'rgba(124,58,237,0.12)' : 'rgba(0,0,0,0.03)',
                        color: contentMode === 'auto' ? '#7C3AED' : '#6B6560',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Auto detect
                    </button>
                    <button
                      onClick={() => setContentMode('manual')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: contentMode === 'manual' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.10)',
                        background: contentMode === 'manual' ? 'rgba(124,58,237,0.12)' : 'rgba(0,0,0,0.03)',
                        color: contentMode === 'manual' ? '#7C3AED' : '#6B6560',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Choose types
                    </button>
                  </div>

                  {contentMode === 'manual' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {CONTENT_TYPES.map(type => {
                        const isSelected = selectedTs.includes(type.id);
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSelectedTs(prev =>
                                prev.includes(type.id)
                                  ? prev.filter(t => t !== type.id)
                                  : [...prev, type.id]
                              );
                            }}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid',
                              borderColor: isSelected ? type.borderColor : 'rgba(0,0,0,0.08)',
                              background: isSelected ? type.bgColor : 'rgba(0,0,0,0.02)',
                              cursor: 'pointer',
                              textAlign: 'left' as const,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? type.color : '#6B6560' }}>
                                {type.label}
                              </span>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: type.color, opacity: isSelected ? 1 : 0.5 }}>
                                {isSelected ? 'Selected' : type.emoji}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B6560', lineHeight: 1.4, marginBottom: '6px' }}>
                              {type.description}
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: type.color, opacity: 0.8 }}>
                              {type.stat}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {contentMode === 'manual' && selectedTs.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: 'rgba(124,58,237,0.06)',
                      border: '1px solid rgba(124,58,237,0.15)',
                      borderRadius: '8px',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', marginBottom: '6px' }}>
                        VangelClip will prioritise finding:
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        {selectedTs.map(id => {
                          const type = CONTENT_TYPES.find(t => t.id === id);
                          return type ? `${type.label} moments` : '';
                        }).filter(Boolean).join(' + ')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Clip Settings */}
            <div
              data-tour="clip-settings"
              style={{
                borderRadius: radius.xl,
                border: `1px solid ${colors.outlineVariant}`,
                background: colors.surfaceContainerLow,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.onSurface,
                }}
              >
                Clip Settings
              </h3>

              {/* Aspect Ratio */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Aspect Ratio
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["9:16", "16:9", "1:1", "4:5"] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: radius.md,
                        border: `1.5px solid ${
                          aspectRatio === ar
                            ? colors.primary
                            : colors.outlineVariant
                        }`,
                        background:
                          aspectRatio === ar
                            ? `${colors.primaryContainer}30`
                            : "transparent",
                        color:
                          aspectRatio === ar
                            ? colors.primary
                            : colors.onSurfaceVariant,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Num Clips */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Number of Clips:{" "}
                  <strong style={{ color: colors.onSurface }}>{numClips}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={numClips ?? 3}
                  onChange={(e) => setNumClips(Number(e.target.value))}
                  style={{ width: "100%", accentColor: colors.primary }}
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Duration Range (seconds)
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    min={5}
                    value={minDuration ?? 15}
                    onChange={(e) => setMinDuration(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 36,
                      borderRadius: radius.md,
                      border: `1px solid ${colors.outlineVariant}`,
                      background: colors.surfaceContainerLowest,
                      color: colors.onSurface,
                      fontSize: 13,
                      textAlign: "center",
                      outline: "none",
                    }}
                  />
                  <span style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                    to
                  </span>
                  <input
                    type="number"
                    max={150}
                    value={maxDuration ?? 60}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 36,
                      borderRadius: radius.md,
                      border: `1px solid ${colors.outlineVariant}`,
                      background: colors.surfaceContainerLowest,
                      color: colors.onSurface,
                      fontSize: 13,
                      textAlign: "center",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Subtitles */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.onSurface }}>
                    Subtitles
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: colors.onSurfaceVariant }}>
                    Auto captions
                  </p>
                </div>
                <button
                  onClick={() => setSubtitles((p) => !p)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: subtitles
                      ? colors.primaryContainer
                      : colors.surfaceContainerHighest,
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: subtitles ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: subtitles
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant,
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>

              {/* Minutes cost */}
              {(() => {
                const isUpload = inputTab === 'upload';
                const notEnough = isUpload ? uploadInsufficientCredits : insufficientCredits;
                const uploadMins = uploadDuration != null ? Math.ceil(uploadDuration / 60) : null;
                return (
                  <div
                    data-tour="minutes-indicator"
                    style={{
                      borderRadius: radius.md,
                      background: notEnough ? `${colors.error}10` : `${colors.primaryContainer}20`,
                      border: `1px solid ${notEnough ? colors.error : colors.primary}30`,
                      padding: "10px 14px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: notEnough ? colors.error : colors.primary, fontWeight: 600 }}>
                      Minutes used
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: colors.onSurface }}>
                      {isUpload && uploadMins != null
                        ? <>{uploadMins} <span style={{ fontSize: 13, fontWeight: 500, color: colors.onSurfaceVariant }}>min estimated</span></>
                        : <span style={{ fontSize: 13, fontWeight: 500, color: colors.onSurfaceVariant }}>Charged by video length</span>
                      }
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: notEnough ? colors.error : colors.onSurfaceVariant }}>
                      {notEnough
                        ? <><span>Not enough minutes. </span><button onClick={() => setShowUpgrade(true)} style={{ color: colors.primary, fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>Upgrade to continue</button></>
                        : `You have ${minutesRemaining} min remaining`}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: radius.lg,
                  background: `${colors.errorContainer}30`,
                  border: `1px solid ${colors.error}40`,
                  color: colors.error,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              data-tour="generate-btn"
              onClick={inputTab === 'upload' ? handleUpload : handleProcess}
              disabled={isGenerateDisabled}
              style={{
                height: 52,
                borderRadius: radius.lg,
                border: "none",
                background: isGenerateDisabled ? colors.surfaceContainerHigh : gradients.primary,
                color: isGenerateDisabled ? colors.onSurfaceVariant : colors.onPrimary,
                fontSize: 15,
                fontWeight: 700,
                cursor: isGenerateDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${colors.onSurfaceVariant}`,
                      borderTopColor: colors.primary,
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {Status === "queued"
                    ? "Preparing your video..."
                    : Status === "preprocessing"
                    ? "AI is analysing your video..."
                    : Status === "processing"
                    ? CLIPPING_MESSAGES[msgIdx]
                    : Status === "completed"
                    ? "Your clips are ready!"
                    : "Processing... this takes 2-4 minutes. Please wait."}
                </>
              ) : (
                `Generate ${numClips} Clips`
              )}
            </button>

            {generationSuccess && !loading && (
              <div style={{ padding: '12px 16px', borderRadius: radius.md, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Your clips are ready. Scroll down to view them.
              </div>
            )}
          </div>
        </div>

        {/* Sample clips teaser — hidden until SAMPLE_CLIPS has entries */}
        {SAMPLE_CLIPS.length > 0 && clips.length === 0 && (
          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(155,93,229,0.7)', marginBottom: 14 }}>
              See it in action
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
              {SAMPLE_CLIPS.map((clip, i) => (
                <LazyVideo key={i} url={clip.url} label={clip.label} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {clips.length > 0 && (
          <div style={{ marginTop: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.onSurface }}>
                  {clips.length} Clips Ready ✓
                </h2>
                {result && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.onSurfaceVariant }}>
                    Used ~{Math.round((result.creditsUsed ?? 0) / 2)} min · {minutesRemaining} min remaining
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setClips([]);
                  setResult(null);
                  setVideoUrl('');
                  setVideoPreview(null);
                  localStorage.removeItem(CLIPS_STORAGE_KEY);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Clear & Start New
              </button>
            </div>

            {/* Clip cards — responsive grid */}
            <div className="vc-clip-grid">
              {clips.map((clip: any, index: number) => (
                <div key={clip.id || index} className="vc-clip-card">

                  {/* Media — thumbnail by default, video on click */}
                  <div
                    style={{ position: 'relative', aspectRatio: '9/16', background: '#111', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => setPlayingClip(playingClip === index ? null : index)}
                  >
                    {playingClip === index && clip.video_url ? (
                      <video
                        src={clip.video_url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        controls
                        autoPlay
                        preload="auto"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        {clip.thumbnail_url ? (
                          <img
                            src={clip.thumbnail_url}
                            alt={clip.title}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,58,237,0.08)' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="5" width="14" height="14" rx="2" fill="rgba(124,58,237,0.2)" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5"/>
                              <path d="M17 9l4 3-4 3V9z" fill="rgba(124,58,237,0.5)"/>
                            </svg>
                          </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="white"><path d="M3 1.5l10 6-10 6V1.5z"/></svg>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Clip # — top left */}
                    <span style={{ position: 'absolute', top: 7, left: 7, fontSize: '10px', fontWeight: 700, background: 'rgba(124,58,237,0.85)', color: '#fff', padding: '2px 7px', borderRadius: '100px', pointerEvents: 'none' }}>
                      #{index + 1}
                    </span>
                    {/* Score — top right */}
                    {clip.ai_score !== undefined && (
                      <span style={{ position: 'absolute', top: 7, right: 7, fontSize: '11px', fontWeight: 700, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: clip.ai_score >= 90 ? '#10b981' : clip.ai_score >= 80 ? '#f59e0b' : '#ef4444', padding: '2px 7px', borderRadius: '100px', pointerEvents: 'none' }}>
                        {clip.ai_score}
                      </span>
                    )}
                  </div>

                  {/* Card info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1714', margin: '0 0 4px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {clip.title}
                    </h3>
                    {clip.caption && (
                      <p style={{ fontSize: '11px', color: '#6B6560', margin: '0 0 10px', lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {stripEmoji(clip.caption)}
                      </p>
                    )}

                    {/* 3-button row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('editor_clip', JSON.stringify({
                            id: clip.id,
                            video_url: clip.video_url || '',
                            clip_url: clip.video_url || '',
                            thumbnail_url: clip.thumbnail_url || '',
                            title: clip.title || '',
                            hook_text: clip.hook_text || '',
                            ai_score: clip.ai_score,
                            virality_score: clip.ai_score,
                            caption: clip.caption || '',
                            hashtags: clip.hashtags || [],
                            start_time: clip.start_time,
                            end_time: clip.end_time,
                          }));
                          router.push('/editor');
                        }}
                        style={{ padding: '8px 4px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const text = (clip.caption || '') + (clip.hashtags?.length ? '\n\n' + clip.hashtags.join(' ') : '');
                          navigator.clipboard.writeText(text);
                        }}
                        style={{ padding: '8px 4px', background: '#EFECEA', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '7px', color: '#1A1714', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Copy
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/clips/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ ...clip, video_url: clip.video_url || videoUrl }),
                            });
                          } catch {}
                        }}
                        style={{ padding: '8px 4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '7px', color: '#6ee7b7', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) { .import-settings-panel { display: none !important; } }
  .vc-clip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .vc-clip-card { background: #EFECEA; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
  .vc-clip-card:hover { border-color: rgba(124,58,237,0.4); }
  @media (max-width: 480px) { .vc-clip-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
`}</style>

      {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0d0021', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>Schedule Clip</div>

            {/* Preview */}
            {(scheduleModal.thumbnail_url || scheduleModal.video_url) ? (
              <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '16/9', background: 'rgba(255,255,255,0.04)' }}>
                {scheduleModal.thumbnail_url ? (
                  <img src={scheduleModal.thumbnail_url} alt={scheduleModal.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <video src={scheduleModal.video_url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>{scheduleModal.title}</div>
            )}

            {/* Caption */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Caption</div>
              <textarea
                rows={3}
                value={importSchedCaption}
                onChange={e => setImportSchedCaption(e.target.value)}
                placeholder="Write your post caption..."
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {/* Hashtags */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Hashtags</div>
              <input
                value={importSchedHashtags}
                onChange={e => setImportSchedHashtags(e.target.value)}
                placeholder="#faith #sermon #viral"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Select platforms:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'tiktok', label: 'TikTok' },
                { id: 'instagram', label: 'Instagram Reels' },
                { id: 'youtube', label: 'YouTube Shorts' },
                { id: 'facebook', label: 'Facebook' },
                { id: 'twitter', label: 'X (Twitter)' },
              ].map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: selectedPlatforms.includes(p.id) ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid', borderColor: selectedPlatforms.includes(p.id) ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.id)}
                    onChange={e => setSelectedPlatforms(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{p.label}</span>
                </label>
              ))}
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Schedule date and time:</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="date" value={scheduleDate || ''} onChange={e => setScheduleDate(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }} />
              <input type="time" value={scheduleTime || ''} onChange={e => setScheduleTime(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={async () => {
                  if (selectedPlatforms.length === 0) { alert('Select at least one platform'); return; }
                  setScheduling(true);
                  try {
                    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
                    const res = await fetch('/api/social/schedule', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        clipId: scheduleModal.id,
                        platforms: selectedPlatforms,
                        caption: importSchedCaption,
                        hashtags: importSchedHashtags,
                        scheduleTime: scheduledAt,
                        videoUrl: scheduleModal.video_url || videoUrl,
                        title: scheduleModal.title,
                        thumbnailUrl: scheduleModal.thumbnail_url || '',
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      const existingSched = JSON.parse(sessionStorage.getItem('hookclip_scheduled') || '[]');
                      existingSched.push({
                        id: Date.now().toString(),
                        clip_title: scheduleModal.title,
                        hook_text: scheduleModal.hook_text || scheduleModal.caption || '',
                        virality_score: scheduleModal.ai_score || 0,
                        caption: importSchedCaption,
                        hashtags: importSchedHashtags,
                        platforms: selectedPlatforms,
                        scheduled_date: scheduleDate,
                        scheduled_time: scheduleTime,
                        status: 'scheduled',
                        video_url: scheduleModal.video_url || '',
                        thumbnail_url: scheduleModal.thumbnail_url || '',
                      });
                      sessionStorage.setItem('hookclip_scheduled', JSON.stringify(existingSched));
                      alert(`Clip scheduled for ${scheduleDate} at ${scheduleTime} on ${selectedPlatforms.join(', ')}`);
                      setScheduleModal(null);
                    } else {
                      alert(data.error || 'Scheduling failed');
                    }
                  } catch (e) {
                    alert('Scheduling failed');
                  } finally {
                    setScheduling(false);
                  }
                }}
                disabled={scheduling}
                style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: 700, cursor: scheduling ? 'not-allowed' : 'pointer', opacity: scheduling ? 0.7 : 1 }}
              >
                {scheduling ? 'Scheduling...' : 'Schedule Post'}
              </button>
              <button onClick={() => setScheduleModal(null)} style={{ padding: '13px 20px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ComingSoonModal isOpen={!!csmClip} onClose={() => setCsmClip(null)} videoUrl={csmClip?.url} clipTitle={csmClip?.title} />
      <Tour steps={IMPORT_STEPS} isOpen={tour.isOpen} step={tour.step} onNext={tour.next} onBack={tour.back} onSkip={tour.skip} />
      {userId && engagementProfile !== null && (
        <EngagementPanel
          isClipping={isClipping && !engagementDismissed}
          userId={userId}
          profile={engagementProfile}
          onDismiss={() => setEngagementDismissed(true)}
        />
      )}
    </DashboardLayout>
    </>
  );
}
