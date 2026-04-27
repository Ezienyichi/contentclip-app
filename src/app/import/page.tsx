"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DashboardLayout from "@/components/DashboardLayout";
import { colors, gradients, radius } from "@/lib/tokens";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  duration?: number;
  thumbnail_url?: string;
}

interface ProcessResult {
  success: boolean;
  jobId: string;
  clips: RekaClip[];
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
}: {
  enabled: boolean;
  onToggle: () => void;
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
}) {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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
              color: colors.onSurfaceVariant,
              background: colors.surfaceContainerHigh,
              borderRadius: radius.sm,
              padding: "2px 8px",
            }}
          >
            Optional
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  color: colors.onSurfaceVariant,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                End —{" "}
                <strong style={{ color: colors.primary }}>{fmt(end)}</strong>
              </label>
              <input
                type="range"
                min={start + 5}
                max={600}
                value={end}
                onChange={(e) => onEndChange(Number(e.target.value))}
                style={{ width: "100%", accentColor: colors.primary }}
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
  clip: RekaClip;
  index: number;
  onDownload: () => void;
  onPost: () => void;
}) {
  const videoUrl = clip.video_url;
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
      }}
    >
      <div
        style={{
          aspectRatio: "9/16",
          maxHeight: 280,
          background: colors.surfaceContainer,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={clip.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: gradients.primary,
            }}
          >
            <span style={{ fontSize: 32 }}>🎬</span>
            <span style={{ color: colors.onPrimary, fontSize: 12, opacity: 0.8 }}>
              Clip {index + 1}
            </span>
          </div>
        )}
        {clip.duration && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
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
      </div>

      <div
        style={{
          padding: 14,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
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
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: colors.primary,
              wordBreak: "break-all",
            }}
          >
            View clip →
          </a>
        )}
      </div>

      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          borderTop: `1px solid ${colors.outlineVariant}`,
        }}
      >
        <button
          onClick={onDownload}
          style={{
            flex: 1,
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
          → Post
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
  const [timeRangeEnabled, setTimeRangeEnabled] = useState(false);
  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);

  const isValidUrl = videoUrl.startsWith("http");
  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  const handleProcess = useCallback(async () => {
    if (!isValidUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to generate clips. Please sign in.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          userId: user.id,
          prompt,
          numClips,
          minDuration,
          maxDuration,
          aspectRatio,
          subtitles,
          template,
          timeRange: timeRangeEnabled
            ? { start: timeStart, end: timeEnd }
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `Not enough credits. Need ${data.required}, have ${data.available}.`
          );
        } else {
          setError(data.error ?? "Failed to process video");
        }
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [
    isValidUrl,
    videoUrl,
    prompt,
    numClips,
    minDuration,
    maxDuration,
    aspectRatio,
    subtitles,
    template,
    timeRangeEnabled,
    timeStart,
    timeEnd,
  ]);

  const handleDownload = (clip: RekaClip) => {
    const clipUrl = clip.video_url;
    const a = document.createElement("a");
    a.href = clipUrl;
    a.download = `${clip.title.replace(/\s+/g, "_")}.mp4`;
    a.click();
  };

  const handlePost = (clip: RekaClip) => {
    const clipUrl = encodeURIComponent(clip.video_url);
    const clipTitle = encodeURIComponent(clip.title);
    const clipCaption = encodeURIComponent(clip.caption);
    router.push(
      `/social/post?clipUrl=${clipUrl}&title=${clipTitle}&caption=${clipCaption}`
    );
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
      subtitle="Paste a YouTube URL and Reka AI will extract your best moments."
    >
      <div style={{ maxWidth: 900 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}
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
                  onChange={(e) => setVideoUrl(e.target.value)}
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
                      color: "#4ade80",
                      fontWeight: 600,
                    }}
                  >
                    ✓ YouTube
                  </span>
                )}
              </div>
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
                    }}
                  />
                  Generating with Reka AI… (may take 2-4 min)
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
                background: `${colors.primaryContainer}20`,
                border: `1px solid ${colors.primary}30`,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: colors.primary,
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
                {numClips * 10}{" "}
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
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ marginTop: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: colors.onSurface,
                  }}
                >
                  {result.clips.length} Clips Ready ✓
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  Used {result.creditsUsed} credits ·{" "}
                  {result.creditsRemaining} remaining
                </p>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setVideoUrl("");
                }}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: radius.md,
                  border: `1px solid ${colors.outlineVariant}`,
                  background: "transparent",
                  color: colors.onSurface,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                New Import
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(
                  result.clips.length,
                  3
                )}, 1fr)`,
                gap: 16,
              }}
            >
              {result.clips.map((clip, i) => (
                <ClipCard
                  key={i}
                  clip={clip}
                  index={i}
                  onDownload={() => handleDownload(clip)}
                  onPost={() => handlePost(clip)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
