"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import DashboardLayout from "@/components/DashboardLayout";
import { colors, gradients, radius } from "@/lib/tokens";

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
    id: 'church',
    label: 'Church / Christian',
    description: 'Optimised for gospel, worship, and faith content',
    defaultTs: ['testimony', 'truth', 'team', 'transcendence'],
  },
  {
    id: 'podcast',
    label: 'Podcaster',
    description: 'Optimised for interviews, insights, and hot takes',
    defaultTs: ['truth', 'testimony'],
  },
  {
    id: 'marketing',
    label: 'Marketing / Brand',
    description: 'Optimised for testimonials, BTS, and brand moments',
    defaultTs: ['testimony', 'team'],
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Optimised for teaching moments and key insights',
    defaultTs: ['truth'],
  },
];

function buildSmartPrompt(
  category: string,
  selectedTs: string[],
  mode: string,
): string {
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

type AspectRatio = "9:16" | "16:9" | "1:1";
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
                🔒 Upgrade to Pro for longer video windows
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
          <span style={{ fontSize: 32 }}>🎬</span>
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
            {clip.caption}
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
          onClick={() => router.push(
            '/editor?videoUrl=' +
            encodeURIComponent(clip.video_url || '') +
            '&title=' +
            encodeURIComponent(clip.title || '')
          )}
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
  const [category, setCategory] = useState('gospel');
  const [contentMode, setContentMode] = useState('auto');
  const [selectedTs, setSelectedTs] = useState<string[]>([]);
  const [dualMode] = useState(false);
  const [videoUrl2] = useState('');
  const [scheduleModal, setScheduleModal] = useState<any | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [inputTab, setInputTab] = useState<'youtube' | 'upload'>('youtube');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const planLimit = PLAN_LIMITS[userPlan] ?? 300;
  const creditCost = timeRangeEnabled ? Math.ceil((timeEnd - timeStart) / 60) : numClips * 10;
  const insufficientCredits = userCredits > 0 && userCredits < creditCost;

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

    setLoading(true);
    setStatus("processing");
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          videoUrl,
          videoUrl2: dualMode ? videoUrl2 : '',
          dualMode,
          numClips,
          timeStart,
          timeEnd,
          category,
          contentMode,
          contentTypes: selectedTs,
          prompt: buildSmartPrompt(category, selectedTs, contentMode),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setError(
            `Not enough credits. Need ${data.credits_required}, have ${data.credits_remaining}.`
          );
        } else {
          setError(data.error || "Processing failed.");
        }
        return;
      }

      if (data.clips && data.clips.length > 0) {
        setResult({
          success: true,
          jobId: "",
          clips: data.clips,
          creditsUsed: data.credits_used,
          creditsRemaining: data.credits_remaining,
        });
        setClips(data.clips);
        setUserCredits(data.credits_remaining);
        localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify({
          clips: data.clips,
          videoUrl: videoUrl,
          generatedAt: new Date().toISOString(),
        }));
      } else {
        setError("No clips found. Try a different video or time range.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
      setStatus("idle");
    }
  }, [
    isValidUrl,
    videoUrl,
    videoUrl2,
    dualMode,
    numClips,
    timeRangeEnabled,
    timeStart,
    timeEnd,
    planLimit,
    userPlan,
    category,
    contentMode,
    selectedTs,
  ]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStatus('processing');
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please sign in.'); setLoading(false); return; }

      const creditsNeeded = Math.ceil((timeEnd - timeStart) / 60);
      const creditsRemaining = userCredits - creditsNeeded;

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);
      formData.append('numClips', String(numClips));
      formData.append('category', category);
      formData.append('prompt', buildSmartPrompt(category, selectedTs, contentMode));
      formData.append('creditsNeeded', String(creditsNeeded));
      formData.append('creditsRemaining', String(creditsRemaining));

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://137.184.75.47:8000/api/process-upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.clips?.length > 0) {
              setResult({ success: true, jobId: '', clips: data.clips, creditsUsed: data.credits_used ?? creditsNeeded, creditsRemaining: data.credits_remaining ?? creditsRemaining });
              setClips(data.clips);
              setUserCredits(data.credits_remaining ?? creditsRemaining);
              localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify({ clips: data.clips, videoUrl: selectedFile.name, generatedAt: new Date().toISOString() }));
            } else {
              setError(data.error || 'No clips found. Try a different video.');
            }
          } catch { setError('Failed to parse server response.'); }
          resolve();
        };
        xhr.onerror = () => { setError('Upload failed. Check your connection and try again.'); resolve(); };
        xhr.send(formData);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload error');
    } finally {
      setLoading(false);
      setStatus('idle');
      setUploadProgress(0);
    }
  }, [selectedFile, numClips, category, selectedTs, contentMode, timeStart, timeEnd, userCredits]);

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
                    {tab === 'youtube' ? '🔗 YouTube Link' : '📁 Upload Video'}
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
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (!file) return;
                      if (!file.type.startsWith('video/')) { setError('Please select a video file.'); return; }
                      if (file.size > 1024 * 1024 * 1024) { setError('File exceeds 1 GB limit.'); return; }
                      setError(null);
                      setSelectedFile(file);
                    }}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                    style={{ border: `2px dashed ${isDragOver ? '#7c3aed' : 'rgba(124,58,237,0.35)'}`, borderRadius: radius.lg, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: isDragOver ? 'rgba(124,58,237,0.08)' : colors.surfaceContainerLowest, transition: 'all 0.2s' }}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-matroska"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1024 * 1024 * 1024) { setError('File exceeds 1 GB limit.'); return; }
                        setError(null);
                        setSelectedFile(file);
                      }}
                    />
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎬</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                      {isDragOver ? 'Drop your video here' : 'Drag & drop or click to upload'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>MP4 · MOV · MKV · Max 1 GB</div>
                  </div>

                  {selectedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px', marginTop: '10px' }}>
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setSelectedFile(null); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '11px', padding: '4px 8px', cursor: 'pointer' }}>✕ Remove</button>
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    Content intelligence
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    Based on 12-month church social media study
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
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
              </div>

              {/* Audience presets */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {AUDIENCE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setCategory(preset.id);
                      setSelectedTs(preset.defaultTs);
                      setContentMode('manual');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: category === preset.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)',
                      background: category === preset.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: category === preset.id ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
                      {preset.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* 4T Content Type Cards */}
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

              {/* Tips for selected types */}
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
              disabled={(inputTab === 'youtube' ? !isValidUrl : !selectedFile) || loading}
              style={{
                height: 52,
                borderRadius: radius.lg,
                border: "none",
                background:
                  ((inputTab === 'youtube' ? !isValidUrl : !selectedFile) || loading)
                    ? colors.surfaceContainerHigh
                    : gradients.primary,
                color:
                  ((inputTab === 'youtube' ? !isValidUrl : !selectedFile) || loading)
                    ? colors.onSurfaceVariant
                    : colors.onPrimary,
                fontSize: 15,
                fontWeight: 700,
                cursor: ((inputTab === 'youtube' ? !isValidUrl : !selectedFile) || loading) ? "not-allowed" : "pointer",
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
                    ? "⚡ Preparing your video..."
                    : Status === "preprocessing"
                    ? "🎬  AI is analysing your video..."
                    : Status === "processing"
                    ? "🧠 Finding your best viral moments..."
                    : Status === "completed"
                    ? "✅ Your clips are ready!"
                    : "⏳ Processing... this takes 2-4 minutes. Please wait."}
                </>
              ) : (
                `⚡ Generate ${numClips} Clips`
              )}
            </button>
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
                {(["9:16", "16:9", "1:1"] as AspectRatio[]).map((ar) => (
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
                value={numClips}
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
                  value={minDuration}
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
                  value={maxDuration}
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
            <div
              style={{
                borderRadius: radius.md,
                background: insufficientCredits ? `${colors.error}10` : `${colors.primaryContainer}20`,
                border: `1px solid ${insufficientCredits ? colors.error : colors.primary}30`,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: insufficientCredits ? colors.error : colors.primary,
                  fontWeight: 600,
                }}
              >
                Cost estimate
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 20,
                  fontWeight: 800,
                  color: colors.onSurface,
                }}
              >
                {creditCost}{" "}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  credits
                </span>
              </p>
              {userCredits > 0 && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: insufficientCredits ? colors.error : colors.onSurfaceVariant }}>
                  {insufficientCredits
                    ? <><span>Not enough credits — </span><a href="/pricing" style={{ color: colors.primary, fontWeight: 700 }}>upgrade to continue</a></>
                    : `This will use ${creditCost} credits — you have ${userCredits} remaining this month`}
                </p>
              )}
            </div>
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
                  {/* Video Preview */}
                  {videoId ? (
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
                  ) : clip.video_url ? (
                    <video
                      src={clip.video_url}
                      style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                      controls
                      preload="metadata"
                    />
                  ) : null}

                  {/* Clip Info */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', padding: '3px 10px', borderRadius: '100px' }}>
                        Clip {index + 1}
                      </span>
                      {clip.ai_score !== undefined && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: clip.ai_score >= 90 ? '#10b981' : clip.ai_score >= 80 ? '#f59e0b' : '#ef4444' }}>
                          🔥 {clip.ai_score}/100
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
                          ⏱ {Math.floor((clip.start_time || 0) / 60)}:{String(Math.floor((clip.start_time || 0) % 60)).padStart(2, '0')}
                          {' → '}
                          {Math.floor((clip.end_time || 60) / 60)}:{String(Math.floor((clip.end_time || 60) % 60)).padStart(2, '0')}
                        </span>
                        <span>📏 {clip.duration || (endSeconds - startSeconds)}s</span>
                      </div>
                    )}

                    {clip.hook_text && (
                      <div style={{ fontSize: '12px', color: '#fcd34d', fontStyle: 'italic', marginBottom: '8px', padding: '6px 10px', background: 'rgba(252,211,77,0.08)', borderRadius: '6px' }}>
                        🎣 Hook: &ldquo;{clip.hook_text}&rdquo;
                      </div>
                    )}

                    {clip.caption && (
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {clip.caption}
                      </p>
                    )}

                    {clip.reason && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 12px', fontStyle: 'italic' }}>
                        💡 {clip.reason}
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
                        onClick={() => router.push(
                          '/editor?videoUrl=' + encodeURIComponent(clip.video_url || '') +
                          '&title=' + encodeURIComponent(clip.title || '')
                        )}
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
                        ✂ Open in Editor
                      </button>
                      <button
                        onClick={() => {
                          const text = (clip.caption || '') + (clip.hashtags?.length ? '\n\n' + clip.hashtags.join(' ') : '');
                          navigator.clipboard.writeText(text);
                          alert('Caption and hashtags copied!');
                        }}
                        style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        📋 Copy Caption
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
                        💾 Save Clip
                      </button>
                      <button
                        onClick={() => {
                          setScheduleModal(clip);
                          setSelectedPlatforms([]);
                          const now = new Date();
                          setScheduleDate(now.toISOString().split('T')[0]);
                          setScheduleTime('10:00');
                        }}
                        style={{ padding: '10px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#a78bfa', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        📅 Schedule
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
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>Schedule Clip</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>{scheduleModal.title}</div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Select platforms:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {[
                { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                { id: 'instagram', label: 'Instagram Reels', icon: '📸' },
                { id: 'youtube', label: 'YouTube Shorts', icon: '▶' },
                { id: 'facebook', label: 'Facebook', icon: '📘' },
                { id: 'twitter', label: 'X (Twitter)', icon: '𝕏' },
              ].map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: selectedPlatforms.includes(p.id) ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid', borderColor: selectedPlatforms.includes(p.id) ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.id)}
                    onChange={e => setSelectedPlatforms(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '18px' }}>{p.icon}</span>
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
                        caption: scheduleModal.caption,
                        hashtags: scheduleModal.hashtags,
                        scheduleTime: scheduledAt,
                        videoUrl: scheduleModal.video_url || videoUrl,
                        title: scheduleModal.title,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
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
                {scheduling ? 'Scheduling...' : '📅 Schedule Post'}
              </button>
              <button onClick={() => setScheduleModal(null)} style={{ padding: '13px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
