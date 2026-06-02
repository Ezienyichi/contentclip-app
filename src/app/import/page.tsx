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
          numClips,
          timeStart,
          timeEnd,
          category: "gospel",
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
    numClips,
    timeRangeEnabled,
    timeStart,
    timeEnd,
    planLimit,
    userPlan,
  ]);

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
            {/* URL */}
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
                Video URL
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  style={inputStyle}
                />
                {isYouTube && (
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: 600,
                    }}
                  >
                    ✓ YouTube
                  </span>
                )}
              </div>
              {videoPreview && (
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: '12px',
                  marginTop: '12px',
                  alignItems: 'center',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoPreview.thumbnail}
                    alt="Video preview"
                    style={{
                      width: '160px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://img.youtube.com/vi/${videoPreview.videoId}/hqdefault.jpg`;
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                      Video detected
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      ID: {videoPreview.videoId}
                    </div>
                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ✓ Ready to clip
                    </div>
                  </div>
                </div>
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
                value={prompt}
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
              onClick={handleProcess}
              disabled={!isValidUrl || loading}
              style={{
                height: 52,
                borderRadius: radius.lg,
                border: "none",
                background:
                  !isValidUrl || loading
                    ? colors.surfaceContainerHigh
                    : gradients.primary,
                color:
                  !isValidUrl || loading
                    ? colors.onSurfaceVariant
                    : colors.onPrimary,
                fontSize: 15,
                fontWeight: 700,
                cursor: !isValidUrl || loading ? "not-allowed" : "pointer",
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

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={`/editor?videoUrl=${encodeURIComponent(videoUrl)}&start=${startSeconds}&end=${endSeconds}&title=${encodeURIComponent(clip.title || '')}`}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      >
                        ✂ Open in Editor
                      </a>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 768px) { .import-settings-panel { display: none !important; } }`}</style>
    </DashboardLayout>
  );
}
