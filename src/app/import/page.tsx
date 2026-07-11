"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import DashboardLayout from "@/components/DashboardLayout";
import { colors, gradients, radius } from "@/lib/tokens";
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

const PLAN_LIMITS: Record<string, number> = {
  free: 300,          // 5 min
  starter: 900,       // 15 min
  solo: 900,          // legacy DB name → same as starter
  pro: 2700,          // 45 min
  professional: 2700, // legacy DB name → same as pro
  agency: 5400,       // 90 min
};

const supabase = createClient();

const CLIPS_STORAGE_KEY = 'vangelclip_cached_clips';

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
type Template = "moments" | "highlights" | "tutorial" | "promo";

function TimeRangeSelector({
  enabled,
  onToggle,
  start,
  end,
  onStartChange,
  onEndChange,
  maxAllowed,
  upgradeable,
}: {
  enabled: boolean;
  onToggle: () => void;
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  maxAllowed: number;
  upgradeable: boolean;
}) {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const atLimit = end >= maxAllowed;

  return (
    <div
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${enabled ? colors.primary : colors.outlineVariant}`,
        padding: "16px 20px",
        background: enabled ? `${colors.primaryContainer}18` : colors.surfaceContainerLow,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: enabled ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.onSurface }}>
            Time Range
          </span>
          <span
            style={{
              fontSize: 11,
              color: colors.primary,
              background: `${colors.primary}18`,
              borderRadius: radius.sm,
              padding: "2px 8px",
              fontWeight: 600,
            }}
          >
            {Math.floor(maxAllowed / 60)} min max
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: enabled ? colors.primaryContainer : colors.surfaceContainerHighest,
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: enabled ? colors.onPrimaryContainer : colors.onSurfaceVariant,
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: colors.onSurfaceVariant,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Start —{" "}
                <strong style={{ color: colors.primary }}>{fmt(start)}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={end - 5}
                value={start}
                onChange={(e) => onStartChange(Number(e.target.value))}
                style={{ width: "100%", accentColor: colors.primary }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: atLimit ? colors.onSurfaceVariant : colors.onSurfaceVariant,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                End —{" "}
                <strong style={{ color: atLimit ? "#FF9500" : colors.primary }}>
                  {fmt(end)}
                </strong>
                {atLimit && (
                  <span style={{ fontSize: 10, color: "#FF9500", marginLeft: 6 }}>
                    (plan limit)
                  </span>
                )}
              </label>
              <input
                type="range"
                min={start + 5}
                max={maxAllowed}
                value={end}
                onChange={(e) => onEndChange(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: atLimit ? "#FF9500" : colors.primary,
                  opacity: atLimit ? 0.7 : 1,
                }}
              />
            </div>
          </div>

          <p style={{ fontSize: 12, color: colors.onSurfaceVariant, margin: 0 }}>
            Clips from{" "}
            <strong style={{ color: colors.onSurface }}>
              {fmt(start)} → {fmt(end)}
            </strong>{" "}
            ({Math.round((end - start) / 60)} min window)
          </p>

          {/* Helper text */}
          <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: 0, opacity: 0.8 }}>
            5 min window ≈ 25 seconds processing · extend range for more clips
          </p>

          {/* Upgrade nudge */}
          {atLimit && upgradeable && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: radius.md,
                background: "rgba(255,149,0,0.08)",
                border: "1px solid rgba(255,149,0,0.25)",
              }}
            >
              <span style={{ fontSize: 12, color: "#FF9500", fontWeight: 600 }}>
                Upgrade to Pro for longer video windows
              </span>
              <a
                href="/pricing"
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontWeight: 700,
                  marginLeft: "auto",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                View plans →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

export default function ImportPage() {
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const [prompt, setPrompt] = useState(
    "Find the most engaging, hook-worthy moments with high energy and emotional impact."
  );
  const [numClips, setNumClips] = useState(3);
  const [minDuration, setMinDuration] = useState(15);
  const [maxDuration, setMaxDuration] = useState(60);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [subtitles, setSubtitles] = useState(true);
  const [template, setTemplate] = useState<Template>("moments");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userCredits, setUserCredits] = useState<number>(0);
  const [timeRangeEnabled, setTimeRangeEnabled] = useState(true);
  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(300);
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

  const planLimit = PLAN_LIMITS[userPlan] ?? 300;
  const creditCost = timeRangeEnabled ? Math.ceil((timeEnd - timeStart) / 60) : numClips * 10;
  const insufficientCredits = userCredits > 0 && userCredits < creditCost;
  const uploadInsufficientCredits = userCredits > 0 && userCredits < numClips;

  // Fetch user's plan and credits on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan, credits")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.plan) {
            setUserPlan(data.plan);
            const limit = PLAN_LIMITS[data.plan] ?? 300;
            setTimeEnd((prev) => Math.min(prev, limit));
          }
          if (typeof data?.credits === "number") {
            setUserCredits(data.credits);
          }
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

    // Client-side plan window check
    if (timeRangeEnabled) {
      const window = timeEnd - timeStart;
      if (window > planLimit) {
        setError(
          `Your ${userPlan} plan allows a maximum ${Math.floor(planLimit / 60)}-minute window. Upgrade to process longer segments.`
        );
        return;
      }
    }

    stopPolling();
    setGenerationSuccess(false);
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
    timeRangeEnabled,
    timeStart,
    timeEnd,
    planLimit,
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
        setError('Not enough credits — upgrade or buy more.');
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
      formData.append('timeStart', String(timeStart));
      formData.append('timeEnd', String(timeEnd));
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
  }, [selectedFile, durationLoading, numClips, category, selectedTs, contentMode, userCredits, timeStart, timeEnd, userPlan]);

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
    <DashboardLayout
      title="Import Video"
      subtitle="Paste a YouTube URL and AI will extract your best moments."
    >
      <div style={{ maxWidth: 900 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 20 }}
        >
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Input tab switcher */}
            <div>
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
                    <div style={{ display: 'flex', gap: '14px', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', marginTop: '12px', alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={videoPreview.thumbnail} alt="Video preview" style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoPreview.videoId}/hqdefault.jpg`; }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Video detected</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>ID: {videoPreview.videoId}</div>
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
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                      {isDragOver ? 'Drop your video here' : 'Drag & drop or click to upload'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>MP4 · MOV · MKV · WebM · AVI · MP3 · WAV · M4A · AAC · Max 1 GB</div>
                  </div>

                  {/* Upload speed tip */}
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Tip: 720p exports upload faster and look great as clips.
                  </div>

                  {selectedFile && (
                    <div style={{ padding: '12px 14px', background: uploadInsufficientCredits ? 'rgba(239,68,68,0.06)' : 'rgba(124,58,237,0.08)', border: `1px solid ${uploadInsufficientCredits ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.25)'}`, borderRadius: '10px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                            {uploadDuration !== null && uploadDuration > 0 && ` · ${Math.ceil(uploadDuration / 60)} min`}
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadDuration(null); setDurationLoading(false); setDurationUnknown(false); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>✕ Remove</button>
                      </div>
                      {durationLoading && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>Estimating cost...</div>
                      )}
                      {uploadInsufficientCredits && (
                        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#fca5a5' }}>
                          Not enough credits — upgrade or buy more
                        </div>
                      )}
                    </div>
                  )}

                  {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                        <span>Uploading...</span><span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg,#7c3aed,#5b21b6)', borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        Uploading... {uploadProgress}% — please keep this tab open.
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

            {/* Template */}
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
                Template
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                }}
              >
                {(
                  ["moments", "highlights", "tutorial", "promo"] as Template[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    style={{
                      height: 38,
                      borderRadius: radius.md,
                      border: `1.5px solid ${
                        template === t
                          ? colors.primary
                          : colors.outlineVariant
                      }`,
                      background:
                        template === t
                          ? `${colors.primaryContainer}30`
                          : "transparent",
                      color:
                        template === t
                          ? colors.primary
                          : colors.onSurfaceVariant,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <TimeRangeSelector
              enabled={timeRangeEnabled}
              onToggle={() => setTimeRangeEnabled((p) => !p)}
              start={timeStart}
              end={timeEnd}
              onStartChange={setTimeStart}
              onEndChange={setTimeEnd}
              maxAllowed={planLimit}
              upgradeable={userPlan !== "agency"}
            />

            {/* ── CONTENT INTELLIGENCE ── */}
            <div style={{
              marginTop: '20px',
              padding: '18px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
            }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  Content type
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
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
                        borderColor: isActive ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left' as const,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)' }}>
                          {preset.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: isActive ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>


              {/* 4T Content Type Cards — faith only */}
              {category === 'faith' && (
                <>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    <button
                      onClick={() => setContentMode('auto')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: contentMode === 'auto' ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)',
                        background: contentMode === 'auto' ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: contentMode === 'auto' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
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
                        borderColor: contentMode === 'manual' ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)',
                        background: contentMode === 'manual' ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: contentMode === 'manual' ? '#a78bfa' : 'rgba(255,255,255,0.4)',
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
                              borderColor: isSelected ? type.borderColor : 'rgba(255,255,255,0.08)',
                              background: isSelected ? type.bgColor : 'rgba(255,255,255,0.02)',
                              cursor: 'pointer',
                              textAlign: 'left' as const,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? type.color : 'rgba(255,255,255,0.6)' }}>
                                {type.label}
                              </span>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: type.color, opacity: isSelected ? 1 : 0.5 }}>
                                {isSelected ? 'Selected' : type.emoji}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginBottom: '6px' }}>
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
                    ? "Finding your best viral moments..."
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
                ✓ Your clips are ready — scroll down to view them
              </div>
            )}
          </div>

          {/* Right: Settings */}
          <div
            style={{
              borderRadius: radius.xl,
              border: `1px solid ${colors.outlineVariant}`,
              background: colors.surfaceContainerLow,
              padding: 20,
              height: "fit-content",
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
                Number of Clips —{" "}
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
              <div
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
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
                <span
                  style={{ color: colors.onSurfaceVariant, fontSize: 12 }}
                >
                  to
                </span>
                <input
                  type="number"
                  max={180}
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
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.onSurface,
                  }}
                >
                  Subtitles
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: colors.onSurfaceVariant,
                  }}
                >
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

            {/* Credit cost */}
            {(() => {
              const isUpload = inputTab === 'upload';
              const cost = isUpload ? numClips : creditCost;
              const notEnough = isUpload ? uploadInsufficientCredits : insufficientCredits;
              return (
                <div
                  style={{
                    borderRadius: radius.md,
                    background: notEnough ? `${colors.error}10` : `${colors.primaryContainer}20`,
                    border: `1px solid ${notEnough ? colors.error : colors.primary}30`,
                    padding: "10px 14px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: notEnough ? colors.error : colors.primary, fontWeight: 600 }}>
                    Cost estimate
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: colors.onSurface }}>
                    {cost}{" "}
                    <span style={{ fontSize: 13, fontWeight: 500, color: colors.onSurfaceVariant }}>credits</span>
                  </p>
                  {isUpload && (
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.onSurfaceVariant }}>1 per clip generated</p>
                  )}
                  {userCredits > 0 && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: notEnough ? colors.error : colors.onSurfaceVariant }}>
                      {notEnough
                        ? <><span>Not enough credits — </span><a href="/pricing" style={{ color: colors.primary, fontWeight: 700 }}>upgrade to continue</a></>
                        : `You have ${userCredits} remaining`}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

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
                    Used {result.creditsUsed} credits · {result.creditsRemaining} remaining
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

            {/* Clip cards */}
            {clips.map((clip: any, index: number) => {
              const videoId = extractVideoId(videoUrl);
              const startSeconds = Math.floor(clip.start_time || 0);
              const endSeconds = Math.floor(clip.end_time || 60);

              return (
                <div
                  key={clip.id || index}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                  }}
                >
                  {/* Video Preview — rendered clip first, YouTube embed as fallback */}
                  {clip.video_url ? (
                    <video
                      src={clip.video_url}
                      style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                      controls
                      preload="metadata"
                    />
                  ) : videoId ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?start=${startSeconds}&end=${endSeconds}&autoplay=0&rel=0&modestbranding=1`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        title={clip.title}
                      />
                    </div>
                  ) : null}

                  {/* Clip Info */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', padding: '3px 10px', borderRadius: '100px' }}>
                        Clip {index + 1}
                      </span>
                      {clip.ai_score !== undefined && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: clip.ai_score >= 90 ? '#10b981' : clip.ai_score >= 80 ? '#f59e0b' : '#ef4444' }}>
                          {clip.ai_score}/100
                        </span>
                      )}
                    </div>

                    {clip.category && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '100px',
                        display: 'inline-block',
                        marginBottom: '8px',
                        background:
                          clip.category === 'testimony' || clip.category === 'Testimony'
                            ? 'rgba(124,58,237,0.15)'
                          : clip.category === 'truth' || clip.category === 'Truth'
                            ? 'rgba(14,165,233,0.15)'
                          : clip.category === 'team' || clip.category === 'Team'
                            ? 'rgba(16,185,129,0.15)'
                          : clip.category === 'transcendence' || clip.category === 'Transcendence'
                            ? 'rgba(245,158,11,0.15)'
                          : 'rgba(255,255,255,0.08)',
                        color:
                          clip.category === 'testimony' || clip.category === 'Testimony'
                            ? '#a78bfa'
                          : clip.category === 'truth' || clip.category === 'Truth'
                            ? '#38bdf8'
                          : clip.category === 'team' || clip.category === 'Team'
                            ? '#6ee7b7'
                          : clip.category === 'transcendence' || clip.category === 'Transcendence'
                            ? '#fcd34d'
                          : 'rgba(255,255,255,0.5)',
                      }}>
                        {clip.category}
                      </span>
                    )}

                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px', lineHeight: 1.3 }}>
                      {clip.title}
                    </h3>

                    {(clip.start_time !== undefined || clip.end_time !== undefined) && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'flex', gap: '12px' }}>
                        <span>
                          {Math.floor((clip.start_time || 0) / 60)}:{String(Math.floor((clip.start_time || 0) % 60)).padStart(2, '0')}
                          {' → '}
                          {Math.floor((clip.end_time || 60) / 60)}:{String(Math.floor((clip.end_time || 60) % 60)).padStart(2, '0')}
                        </span>
                        <span>{clip.duration || (endSeconds - startSeconds)}s</span>
                      </div>
                    )}

                    {clip.hook_text && (
                      <div style={{ fontSize: '12px', color: '#fcd34d', fontStyle: 'italic', marginBottom: '8px', padding: '6px 10px', background: 'rgba(252,211,77,0.08)', borderRadius: '6px' }}>
                        Hook: &ldquo;{stripEmoji(clip.hook_text)}&rdquo;
                      </div>
                    )}

                    {clip.caption && (
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {stripEmoji(clip.caption)}
                      </p>
                    )}

                    {clip.reason && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 12px', fontStyle: 'italic' }}>
                        {stripEmoji(clip.reason)}
                      </p>
                    )}

                    {clip.hashtags && clip.hashtags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {clip.hashtags.map((tag: string, i: number) => (
                          <span key={i} style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(124,58,237,0.12)', padding: '2px 8px', borderRadius: '100px' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {clip.category && (
                      <div style={{
                        marginTop: '8px',
                        marginBottom: '12px',
                        padding: '8px 12px',
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.12)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5,
                      }}>
                        {(clip.category === 'testimony' || clip.category === 'Testimony')
                          ? 'Testimony clips generate 1,200% more shares than text and image content combined. Share this on all platforms.'
                        : (clip.category === 'truth' || clip.category === 'Truth')
                          ? 'Truth clips get the highest comment rates. Post this as a question to drive discussion.'
                        : (clip.category === 'team' || clip.category === 'Team')
                          ? 'Team content kills the fear of the unknown. This makes new people feel welcome before they arrive.'
                        : (clip.category === 'transcendence' || clip.category === 'Transcendence')
                          ? 'Worship and transcendence clips reach more non-Christians than sermon clips. Let this speak for itself.'
                        : 'Share this clip across all your platforms for maximum reach.'
                        }
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      >
                        Open in Editor
                      </button>
                      <button
                        onClick={() => {
                          const text = (clip.caption || '') + (clip.hashtags?.length ? '\n\n' + clip.hashtags.join(' ') : '');
                          navigator.clipboard.writeText(text);
                          alert('Caption and hashtags copied!');
                        }}
                        style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Copy Caption
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/clips/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ ...clip, video_url: videoUrl }),
                            });
                            alert('Saved to your clips!');
                          } catch(e) {
                            alert('Failed to save');
                          }
                        }}
                        style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Save Clip
                      </button>
                      <button
                        onClick={() => setCsmClip({ url: clip.video_url || '', title: clip.title || '' })}
                        style={{ padding: '10px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#a78bfa', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 768px) { .import-settings-panel { display: none !important; } }`}</style>

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
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {/* Hashtags */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Hashtags</div>
              <input
                value={importSchedHashtags}
                onChange={e => setImportSchedHashtags(e.target.value)}
                placeholder="#faith #sermon #viral"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
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
              <input type="date" value={scheduleDate || ''} onChange={e => setScheduleDate(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }} />
              <input type="time" value={scheduleTime || ''} onChange={e => setScheduleTime(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }} />
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
              <button onClick={() => setScheduleModal(null)} style={{ padding: '13px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <ComingSoonModal isOpen={!!csmClip} onClose={() => setCsmClip(null)} videoUrl={csmClip?.url} clipTitle={csmClip?.title} />
    </DashboardLayout>
  );
}
