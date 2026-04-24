'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField, shadows } from '@/lib/tokens';

type ClipResult = {
  title: string; hook_text: string; start_time: number; end_time: number;
  virality_score: number; suggested_caption: string; hashtags: string;
  platform: string; clip_url: string | null; thumbnail_url: string | null;
  duration: number; status: string; selected?: boolean;
};

type VideoInfo = { title: string; duration: number; thumbnail: string | null; uploader?: string };

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<'idle' | 'loading_info' | 'select_range' | 'processing' | 'done' | 'error'>('idle');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processStep, setProcessStep] = useState('');
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (step === 'processing') { iv = setInterval(() => setElapsed(e => e + 1), 1000); }
    return () => clearInterval(iv);
  }, [step]);

  // Progress simulation
  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (step === 'processing') {
      iv = setInterval(() => {
        setProgress(p => {
          if (p < 20) { setProcessStep('Downloading video...'); return p + 0.4; }
          if (p < 40) { setProcessStep('Extracting audio...'); return p + 0.3; }
          if (p < 65) { setProcessStep('Transcribing with AI...'); return p + 0.2; }
          if (p < 80) { setProcessStep('Detecting viral hooks...'); return p + 0.15; }
          if (p < 95) { setProcessStep('Cutting video clips...'); return p + 0.1; }
          return p;
        });
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [step]);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  function parseTimeInput(val: string): number {
    const parts = val.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(val) || 0;
  }

  // ── Step 1: Fetch video info ──
  async function handleFetchInfo() {
    if (!url.trim()) return;
    setStep('loading_info');
    setError('');
    setVideoInfo(null);

    try {
      const res = await fetch(`/api/process?url=${encodeURIComponent(url.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const info: VideoInfo = {
          title: data.title || 'Video',
          duration: data.duration || 600,
          thumbnail: data.thumbnail || null,
          uploader: data.uploader || '',
        };
        setVideoInfo(info);
        setRangeStart(0);
        setRangeEnd(Math.min(info.duration, 600)); // Default: first 10 min or full video
        setStep('select_range');
      } else {
        // If video-info fails, still let user set a range manually
        setVideoInfo({ title: 'Video', duration: 600, thumbnail: null });
        setRangeStart(0);
        setRangeEnd(300);
        setStep('select_range');
      }
    } catch {
      setVideoInfo({ title: 'Video', duration: 600, thumbnail: null });
      setRangeStart(0);
      setRangeEnd(300);
      setStep('select_range');
    }
  }

  // ── Step 2: Process selected range ──
  async function handleProcess() {
    setStep('processing');
    setProgress(0);
    setElapsed(0);
    setClips([]);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          startTime: rangeStart,
          endTime: rangeEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Processing failed');

      if (data.clips && data.clips.length > 0) {
        setClips(data.clips.map((c: any) => ({ ...c, selected: c.virality_score >= 70 })));
        setStep('done');
        setProgress(100);
      } else {
        setError('No viral clips detected in the selected range. Try selecting a different portion of the video.');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    }
  }

  function toggleClip(idx: number) { setClips(prev => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c)); }
  function getScoreColor(s: number) { return s >= 80 ? '#4ade80' : s >= 60 ? '#fbbf24' : '#ff6b6b'; }
  const selectedCount = clips.filter(c => c.selected).length;
  const rangeDuration = rangeEnd - rangeStart;

  return (
    <DashboardLayout title="Import Video" subtitle="Paste a video link, select the part you want to clip.">

      {/* ═══ STEP 1: URL INPUT ═══ */}
      {(step === 'idle' || step === 'error') && (
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '48px', maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center', boxShadow: shadows.glow }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(192,193,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="link" size={32} style={{ color: colors.primary }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Paste a Video Link</h2>
          <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, marginBottom: '28px' }}>
            Supports YouTube, Vimeo, TikTok, Instagram, and direct video/audio links.
          </p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '560px', margin: '0 auto' }}>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
              onKeyDown={e => e.key === 'Enter' && handleFetchInfo()}
              style={{ ...inputField, flex: 1, padding: '14px 18px', fontSize: '15px', borderRadius: radius.lg }} />
            <button onClick={handleFetchInfo} disabled={!url.trim()}
              style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '14px 28px', borderRadius: radius.lg, border: 'none', cursor: url.trim() ? 'pointer' : 'not-allowed', fontSize: '14px', opacity: !url.trim() ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif" }}>
              Next →
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
            {['YouTube', 'Vimeo', 'TikTok', 'Instagram', 'MP4/MP3'].map(p => (
              <span key={p} style={{ fontSize: '12px', color: colors.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="check_circle" size={14} style={{ color: colors.primary }} filled /> {p}
              </span>
            ))}
          </div>
          {step === 'error' && error && (
            <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: radius.lg, textAlign: 'left' }}>
              <p style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 1.5: LOADING INFO ═══ */}
      {step === 'loading_info' && (
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 20px', border: '3px solid ' + colors.surfaceContainer, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: colors.onSurfaceVariant, fontSize: '14px' }}>Fetching video info...</p>
        </div>
      )}

      {/* ═══ STEP 2: SELECT RANGE ═══ */}
      {step === 'select_range' && videoInfo && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          {/* Video info card */}
          <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {videoInfo.thumbnail ? (
                <img src={videoInfo.thumbnail} alt="" style={{ width: 160, height: 90, borderRadius: radius.md, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 160, height: 90, borderRadius: radius.md, background: colors.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="smart_display" size={32} style={{ color: colors.onSurfaceVariant }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.3 }}>{videoInfo.title}</p>
                {videoInfo.uploader && <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>{videoInfo.uploader}</p>}
                <p style={{ fontSize: '13px', color: colors.primary, fontWeight: 600, marginTop: '4px' }}>
                  Duration: {formatTime(videoInfo.duration)}
                </p>
              </div>
              <button onClick={() => { setStep('idle'); setVideoInfo(null); }}
                style={{ background: colors.surfaceContainer, border: 'none', borderRadius: radius.md, padding: '8px 14px', color: colors.onSurfaceVariant, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Change
              </button>
            </div>
          </div>

          {/* Range selector */}
          <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Select the part you want to clip</h3>
            <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginBottom: '24px' }}>
              Drag the sliders or type exact times. AI will find viral moments only within this range.
            </p>

            {/* Visual timeline */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative', height: '48px', background: colors.surfaceContainer, borderRadius: radius.md, overflow: 'hidden' }}>
                {/* Selected range highlight */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(rangeStart / videoInfo.duration) * 100}%`,
                  width: `${((rangeEnd - rangeStart) / videoInfo.duration) * 100}%`,
                  background: 'rgba(192,193,255,0.15)',
                  borderLeft: '2px solid ' + colors.primary,
                  borderRight: '2px solid ' + colors.primary,
                }} />
                {/* Time labels */}
                <div style={{ position: 'absolute', bottom: 4, left: `${(rangeStart / videoInfo.duration) * 100}%`, transform: 'translateX(-50%)', fontSize: '10px', color: colors.primary, fontWeight: 700 }}>
                  {formatTime(rangeStart)}
                </div>
                <div style={{ position: 'absolute', bottom: 4, right: `${100 - (rangeEnd / videoInfo.duration) * 100}%`, transform: 'translateX(50%)', fontSize: '10px', color: colors.primary, fontWeight: 700 }}>
                  {formatTime(rangeEnd)}
                </div>
              </div>

              {/* Dual range slider */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, width: 40 }}>Start</span>
                <input type="range" min={0} max={videoInfo.duration} value={rangeStart}
                  onChange={e => { const v = Number(e.target.value); if (v < rangeEnd - 15) setRangeStart(v); }}
                  style={{ flex: 1, accentColor: colors.primary }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, width: 40 }}>End</span>
                <input type="range" min={0} max={videoInfo.duration} value={rangeEnd}
                  onChange={e => { const v = Number(e.target.value); if (v > rangeStart + 15) setRangeEnd(v); }}
                  style={{ flex: 1, accentColor: colors.primary }} />
              </div>
            </div>

            {/* Manual time inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>Start Time</label>
                <input value={formatTime(rangeStart)}
                  onChange={e => { const v = parseTimeInput(e.target.value); if (v < rangeEnd - 15) setRangeStart(v); }}
                  placeholder="0:00" style={{ ...inputField, fontSize: '14px', fontWeight: 600, textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>End Time</label>
                <input value={formatTime(rangeEnd)}
                  onChange={e => { const v = parseTimeInput(e.target.value); if (v > rangeStart + 15 && v <= videoInfo.duration) setRangeEnd(v); }}
                  placeholder="5:00" style={{ ...inputField, fontSize: '14px', fontWeight: 600, textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>Selected Duration</label>
                <div style={{ ...inputField, fontSize: '14px', fontWeight: 700, textAlign: 'center', color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {formatTime(rangeDuration)}
                </div>
              </div>
            </div>

            {/* Quick range buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { label: 'First 5 min', s: 0, e: 300 },
                { label: 'First 10 min', s: 0, e: 600 },
                { label: 'Middle section', s: Math.floor(videoInfo.duration * 0.3), e: Math.floor(videoInfo.duration * 0.7) },
                { label: 'Last 5 min', s: Math.max(0, videoInfo.duration - 300), e: videoInfo.duration },
                { label: 'Full video', s: 0, e: videoInfo.duration },
              ].map(q => (
                <button key={q.label} onClick={() => { setRangeStart(q.s); setRangeEnd(Math.min(q.e, videoInfo.duration)); }}
                  style={{ padding: '6px 14px', borderRadius: radius.full, background: colors.surfaceContainer, border: '1px solid ' + colors.outlineVariant, color: colors.onSurfaceVariant, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                  {q.label}
                </button>
              ))}
            </div>

            {/* Process button */}
            <button onClick={handleProcess}
              style={{ width: '100%', background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px', borderRadius: radius.lg, border: 'none', cursor: 'pointer', fontSize: '16px', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Icon name="auto_awesome" size={20} /> Generate Clips from {formatTime(rangeStart)} to {formatTime(rangeEnd)}
            </button>

            <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: '12px' }}>
              AI will analyze this {formatTime(rangeDuration)} segment and find the best viral clips with video + audio
            </p>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: PROCESSING ═══ */}
      {step === 'processing' && (
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, margin: '0 auto 28px', position: 'relative' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke={colors.surfaceContainer} strokeWidth="4" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={colors.primary} strokeWidth="4"
                strokeDasharray={`${progress * 2.76} 276`} strokeLinecap="round"
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.5s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary, fontSize: 18, fontWeight: 700 }}>
              {Math.round(progress)}%
            </div>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{processStep}</h2>
          <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginBottom: '6px' }}>
            Processing {formatTime(rangeStart)} to {formatTime(rangeEnd)} ({formatTime(rangeDuration)})
          </p>
          <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>Elapsed: {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px', maxWidth: '300px', margin: '32px auto 0' }}>
            {[
              { label: 'Downloading video', threshold: 10 },
              { label: 'Extracting audio', threshold: 25 },
              { label: 'Transcribing with AI', threshold: 45 },
              { label: 'Detecting viral hooks', threshold: 70 },
              { label: 'Cutting video clips', threshold: 85 },
            ].map((s, i) => {
              const done = progress > s.threshold + 15;
              const active = progress >= s.threshold && progress <= s.threshold + 15;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: done ? 0.5 : active ? 1 : 0.3 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? 'rgba(74,222,128,0.15)' : active ? 'rgba(192,193,255,0.15)' : colors.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done ? <Icon name="check" size={14} style={{ color: '#4ade80' }} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? colors.primary : colors.onSurfaceVariant }} />}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? colors.onSurface : colors.onSurfaceVariant }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ STEP 4: RESULTS ═══ */}
      {step === 'done' && clips.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{clips.length} Clips Generated</h2>
              <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginTop: '4px' }}>
                From {formatTime(rangeStart)} to {formatTime(rangeEnd)} · {selectedCount} selected
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setClips(prev => prev.map(c => ({ ...c, selected: true })))}
                style={{ padding: '7px 14px', borderRadius: radius.md, border: '1px solid ' + colors.outlineVariant, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Select All</button>
              <button onClick={() => setClips(prev => prev.map(c => ({ ...c, selected: false })))}
                style={{ padding: '7px 14px', borderRadius: radius.md, border: '1px solid ' + colors.outlineVariant, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Deselect All</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clips.map((clip, idx) => (
              <div key={idx} onClick={() => toggleClip(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
                  borderRadius: radius.lg, cursor: 'pointer', transition: 'all 0.2s',
                  background: clip.selected ? 'rgba(192,193,255,0.06)' : colors.surfaceContainerHigh,
                  border: clip.selected ? '1px solid rgba(192,193,255,0.2)' : '1px solid transparent',
                }}>
                {/* Checkbox */}
                <div style={{ width: 22, height: 22, borderRadius: '6px', flexShrink: 0, border: `2px solid ${clip.selected ? colors.primary : colors.onSurfaceVariant}`, background: clip.selected ? colors.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {clip.selected && <Icon name="check" size={14} style={{ color: '#fff' }} />}
                </div>
                {/* Rank */}
                <div style={{ width: 28, height: 28, borderRadius: radius.md, background: colors.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurfaceVariant, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>#{idx + 1}</div>
                {/* Thumbnail */}
                {clip.thumbnail_url && (
                  <img src={clip.thumbnail_url} alt="" style={{ width: 48, height: 64, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                )}
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.title}</p>
                  <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&ldquo;{clip.hook_text}&rdquo;</p>
                </div>
                {/* Time */}
                <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 8px' }}>
                  <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, fontWeight: 500 }}>{formatTime(clip.start_time)} – {formatTime(clip.end_time)}</p>
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>{clip.duration}s</p>
                </div>
                {/* Score */}
                <div style={{ padding: '4px 12px', borderRadius: radius.full, flexShrink: 0, background: `${getScoreColor(clip.virality_score)}15`, border: `1px solid ${getScoreColor(clip.virality_score)}30` }}>
                  <span style={{ color: getScoreColor(clip.virality_score), fontSize: '13px', fontWeight: 700 }}>{clip.virality_score}</span>
                </div>
                {/* Status badge */}
                <div style={{ padding: '4px 10px', borderRadius: radius.md, background: clip.clip_url ? 'rgba(74,222,128,0.1)' : colors.surfaceContainer, flexShrink: 0 }}>
                  <span style={{ color: clip.clip_url ? '#4ade80' : colors.onSurfaceVariant, fontSize: '10px', fontWeight: 600 }}>
                    {clip.clip_url ? 'VIDEO' : 'TEXT'}
                  </span>
                </div>
                {/* Download */}
                {clip.clip_url && (
                  <a href={clip.clip_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ padding: '6px', borderRadius: radius.md, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="download" size={16} style={{ color: '#4ade80' }} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid ' + colors.surfaceContainer }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setStep('select_range'); setClips([]); }}
                style={{ padding: '10px 20px', borderRadius: radius.md, border: '1px solid ' + colors.outlineVariant, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                ← Select Different Range
              </button>
              <button onClick={() => { setStep('idle'); setClips([]); setUrl(''); setVideoInfo(null); }}
                style={{ padding: '10px 20px', borderRadius: radius.md, border: '1px solid ' + colors.outlineVariant, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                New Video
              </button>
            </div>
            <button disabled={selectedCount === 0}
              onClick={() => { sessionStorage.setItem('hookclip_clips', JSON.stringify(clips.filter(c => c.selected))); router.push('/clips'); }}
              style={{ padding: '10px 28px', borderRadius: radius.md, border: 'none', background: gradients.primary, color: '#FAF7FF', fontSize: '14px', fontWeight: 600, cursor: selectedCount > 0 ? 'pointer' : 'not-allowed', opacity: selectedCount > 0 ? 1 : 0.5, fontFamily: "'Inter',sans-serif" }}>
              View {selectedCount} Selected Clips →
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );
}
