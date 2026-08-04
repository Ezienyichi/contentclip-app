'use client';
import React, { useState, useRef, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSearchParams } from 'next/navigation';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

function fmt(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function persistClipPatch(patch: Record<string, any>) {
  try {
    const raw = sessionStorage.getItem('editor_clip');
    const obj = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem('editor_clip', JSON.stringify({ ...obj, ...patch }));
  } catch {}
}

function EditorPageInner() {
  const searchParams = useSearchParams();

  const [editorClip] = useState<Record<string, any> | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const r = sessionStorage.getItem('editor_clip');
      return r ? JSON.parse(r) : null;
    } catch { return null; }
  });

  const videoUrl     = editorClip?.video_url    || editorClip?.clip_url || searchParams.get('videoUrl') || '';
  const downloadUrl  = editorClip?.download_url || videoUrl;
  const thumbnailUrl = editorClip?.thumbnail_url || '';
  const hashtags     = Array.isArray(editorClip?.hashtags) ? (editorClip.hashtags as string[]) : [];
  const aiScore      = Number(editorClip?.virality_score ?? editorClip?.ai_score ?? 0);

  const [editTitle,   setEditTitle]   = useState<string>(editorClip?.title   || searchParams.get('title') || 'Clip');
  const [editCaption, setEditCaption] = useState<string>(editorClip?.caption || '');
  const [playing,     setPlaying]     = useState(false);
  const [time,        setTime]        = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }

  function handleTitleChange(val: string) {
    setEditTitle(val);
    persistClipPatch({ title: val });
  }

  function handleCaptionChange(val: string) {
    setEditCaption(val);
    persistClipPatch({ caption: val });
  }

  async function handleDownload() {
    if (!downloadUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = (editTitle || 'clip') + '.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    const text = editTitle + '\n\n' + editCaption + (hashtags.length ? '\n\n' + hashtags.join(' ') : '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const scoreColor =
    aiScore >= 90 ? '#10b981' :
    aiScore >= 80 ? '#f59e0b' :
    aiScore >= 70 ? '#a78bfa' : '#ef4444';

  const panelStyle: React.CSSProperties = {
    background: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: '16px 18px',
  };

  return (
    <DashboardLayout title="Review & Refine">
      <div
        className="editor-layout"
        style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}
      >

        {/* ═══ LEFT — Video player ═══ */}
        <div>
          {/* Video */}
          <div style={{ maxWidth: 320, margin: '0 auto 14px', borderRadius: radius.xl, overflow: 'hidden', background: colors.surfaceContainerHigh, position: 'relative' }}>
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={videoUrl}
                  poster={thumbnailUrl || undefined}
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  onPlay={()  => setPlaying(true)}
                  onPause={()  => setPlaying(false)}
                  onTimeUpdate={() => setTime(videoRef.current?.currentTime ?? 0)}
                  onLoadedMetadata={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    setDuration(v.duration);
                    if (!v.poster) v.currentTime = 0.001;
                  }}
                  preload="metadata"
                />
                {!playing && (
                  <button
                    onClick={togglePlay}
                    aria-label="Play"
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M5 3l13 7-13 7V3z"/></svg>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div style={{ aspectRatio: '9/16', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.surfaceContainerLow, color: colors.onSurfaceVariant, fontSize: 13 }}>
                No video available
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.onSurface, padding: 0, display: 'flex', flexShrink: 0 }}
            >
              {playing
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: colors.onSurface, minWidth: 34, flexShrink: 0 }}>
              {fmt(time)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={time}
              onChange={e => {
                const t = Number(e.target.value);
                setTime(t);
                if (videoRef.current) videoRef.current.currentTime = t;
              }}
              style={{ flex: 1, accentColor: colors.primary }}
            />
            <span style={{ fontSize: 12, color: colors.onSurfaceVariant, minWidth: 34, textAlign: 'right', flexShrink: 0 }}>
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* ═══ RIGHT — Review & Refine ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Virality score */}
          <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Virality Score
            </p>
            {aiScore > 0 ? (
              <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {aiScore}
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant }}>/100</span>
              </span>
            ) : (
              <span style={{ fontSize: 13, color: colors.onSurfaceVariant }}>—</span>
            )}
          </div>

          {/* Title */}
          <div style={panelStyle}>
            <label
              htmlFor="editor-title"
              style={{ display: 'block', fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}
            >
              Title
            </label>
            <input
              id="editor-title"
              type="text"
              value={editTitle}
              onChange={e => handleTitleChange(e.target.value)}
              style={{ ...(inputField as React.CSSProperties), fontWeight: 600, fontSize: 14 }}
            />
          </div>

          {/* Caption */}
          <div style={panelStyle}>
            <label
              htmlFor="editor-caption"
              style={{ display: 'block', fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}
            >
              Caption
            </label>
            <textarea
              id="editor-caption"
              value={editCaption}
              onChange={e => handleCaptionChange(e.target.value)}
              rows={5}
              style={{
                ...(inputField as React.CSSProperties),
                resize: 'vertical',
                minHeight: 100,
                lineHeight: 1.6,
                fontSize: 13,
                height: 'auto',
              }}
            />
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div style={panelStyle}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hashtags
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    style={{ fontSize: 12, color: '#a78bfa', background: 'rgba(124,58,237,0.12)', padding: '3px 10px', borderRadius: 100 }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Copy caption + hashtags */}
          <button
            onClick={handleCopy}
            style={{
              padding: '12px 16px',
              borderRadius: radius.md,
              background:  copied ? 'rgba(16,185,129,0.12)' : colors.surfaceContainerHigh,
              border:      `1px solid ${copied ? 'rgba(16,185,129,0.3)' : colors.outlineVariant}`,
              color:       copied ? '#6ee7b7' : colors.onSurface,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {copied
                ? <polyline points="20 6 9 17 4 12"/>
                : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
              }
            </svg>
            {copied ? 'Copied!' : 'Copy post text'}
          </button>

          {/* Download — primary action */}
          <button
            onClick={handleDownload}
            disabled={!downloadUrl || downloading}
            style={{
              padding: '14px 16px',
              borderRadius: radius.md,
              background: downloadUrl && !downloading ? gradients.primary : colors.surfaceContainerHigh,
              color: '#FAF7FF',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: "'Inter',sans-serif",
              opacity: downloadUrl && !downloading ? 1 : 0.4,
              cursor: downloadUrl && !downloading ? 'pointer' : 'default',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {downloading ? 'Downloading…' : 'Download Clip'}
          </button>

        </div>
      </div>

      <style>{'@media(max-width:768px){.editor-layout{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0E0E0E', minHeight: '100vh' }} />}>
      <EditorPageInner />
    </Suspense>
  );
}
