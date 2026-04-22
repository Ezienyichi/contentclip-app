'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField, shadows } from '@/lib/tokens';

// ═══════════════════════════════════════════════════════════════
// IMPORT PAGE — Real Video Processing Pipeline
// Pastes URL → calls /api/process → shows progress → shows clips
// ═══════════════════════════════════════════════════════════════

type ClipResult = {
  title: string;
  hook_text: string;
  start_time: number;
  end_time: number;
  virality_score: number;
  suggested_caption: string;
  hashtags: string;
  platform: string;
  clip_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  status: string;
  selected?: boolean;
};

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'transcribing' | 'detecting' | 'cutting' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Timer for elapsed time display
  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (loading) {
      iv = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(iv);
  }, [loading]);

  // Simulated progress (real processing happens server-side)
  useEffect(() => {
    let iv: NodeJS.Timeout;
    if (loading) {
      iv = setInterval(() => {
        setProgress(p => {
          if (p < 30) return p + 0.5;       // transcribing phase
          if (p < 70) return p + 0.3;        // detecting phase
          if (p < 90) return p + 0.1;        // cutting phase
          return p;
        });
      }, 1000);

      // Update step labels based on progress
      const stepIv = setInterval(() => {
        setProgress(p => {
          if (p < 30) setStep('transcribing');
          else if (p < 70) setStep('detecting');
          else if (p < 90) setStep('cutting');
          return p;
        });
      }, 2000);

      return () => { clearInterval(iv); clearInterval(stepIv); };
    }
    return () => clearInterval(iv);
  }, [loading]);

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setStep('transcribing');
    setProgress(0);
    setElapsed(0);
    setError('');
    setClips([]);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      if (data.clips && data.clips.length > 0) {
        setClips(data.clips.map((c: any) => ({ ...c, selected: c.virality_score >= 70 })));
        setStep('done');
        setProgress(100);
      } else {
        setError('No viral clips detected in this video. Try a longer or more engaging video.');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  function toggleClip(idx: number) {
    setClips(prev => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c));
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  function getScoreColor(score: number) {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#ff6b6b';
  }

  const selectedCount = clips.filter(c => c.selected).length;

  const stepLabels: Record<string, string> = {
    idle: 'Ready',
    transcribing: 'Transcribing audio with AssemblyAI...',
    detecting: 'AI detecting viral hooks...',
    cutting: 'Cutting clips with FFmpeg...',
    done: 'Done!',
    error: 'Error',
  };

  return (
    <DashboardLayout title="Import Video" subtitle="Paste a video link to start generating clips.">

      {/* ═══ URL INPUT ═══ */}
      {step === 'idle' || step === 'error' || step === 'done' ? (
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '48px', maxWidth: '720px', margin: '0 auto 32px', textAlign: 'center', boxShadow: shadows.glow }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(192,193,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="link" size={32} style={{ color: colors.primary }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Paste a Video Link</h2>
          <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, marginBottom: '28px' }}>
            Supports YouTube, Vimeo, and TikTok. No file uploads needed.
          </p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '560px', margin: '0 auto' }}>
            <input
              type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              style={{ ...inputField, flex: 1, padding: '14px 18px', fontSize: '15px', borderRadius: radius.lg }}
            />
            <button
              onClick={handleImport}
              disabled={loading || !url.trim()}
              style={{
                background: gradients.primary, color: '#FAF7FF', fontWeight: 700,
                padding: '14px 28px', borderRadius: radius.lg, border: 'none',
                cursor: url.trim() ? 'pointer' : 'not-allowed', fontSize: '14px',
                opacity: !url.trim() ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: "'Inter',sans-serif",
              }}
            >
              {loading ? 'Processing...' : 'Generate Clips'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
            {['YouTube', 'Vimeo', 'TikTok'].map(p => (
              <span key={p} style={{ fontSize: '12px', color: colors.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="check_circle" size={14} style={{ color: colors.primary }} filled /> {p}
              </span>
            ))}
          </div>

          {/* Error message */}
          {step === 'error' && error && (
            <div style={{ marginTop: '24px', padding: '16px 20px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: radius.lg, textAlign: 'left' }}>
              <p style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: 500 }}>{error}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* ═══ PROCESSING PROGRESS ═══ */}
      {loading && (
        <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '48px', maxWidth: '600px', margin: '0 auto 32px', textAlign: 'center' }}>
          {/* Animated ring */}
          <div style={{ width: 100, height: 100, margin: '0 auto 28px', position: 'relative' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke={colors.surfaceContainer} strokeWidth="4" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={colors.primary} strokeWidth="4"
                strokeDasharray={`${progress * 2.76} 276`} strokeLinecap="round"
                transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.5s' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary, fontSize: 18, fontWeight: 700 }}>
              {Math.round(progress)}%
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{stepLabels[step]}</h2>
          <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginBottom: '8px' }}>
            This usually takes 2-5 minutes depending on video length.
          </p>
          <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>
            Elapsed: {formatElapsed(elapsed)}
          </p>

          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px', maxWidth: '300px', margin: '32px auto 0' }}>
            {[
              { key: 'transcribing', label: 'Transcribing audio', icon: 'mic' },
              { key: 'detecting', label: 'Detecting viral hooks', icon: 'auto_awesome' },
              { key: 'cutting', label: 'Cutting clips', icon: 'content_cut' },
            ].map((s, i) => {
              const steps = ['transcribing', 'detecting', 'cutting'];
              const currentIdx = steps.indexOf(step);
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: done ? 0.5 : active ? 1 : 0.3 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'rgba(74,222,128,0.15)' : active ? 'rgba(192,193,255,0.15)' : colors.surfaceContainer,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done
                      ? <Icon name="check" size={14} style={{ color: '#4ade80' }} />
                      : <Icon name={s.icon} size={14} style={{ color: active ? colors.primary : colors.onSurfaceVariant }} />
                    }
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? colors.onSurface : colors.onSurfaceVariant }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CLIPS RESULTS (Opus Clip style) ═══ */}
      {step === 'done' && clips.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{clips.length} Clips Detected</h2>
              <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginTop: '4px' }}>
                {selectedCount} selected — Ranked by virality score
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setClips(prev => prev.map(c => ({ ...c, selected: true })))}
                style={{ padding: '7px 14px', borderRadius: radius.md, border: `1px solid ${colors.surfaceContainer}`, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Select All
              </button>
              <button onClick={() => setClips(prev => prev.map(c => ({ ...c, selected: false })))}
                style={{ padding: '7px 14px', borderRadius: radius.md, border: `1px solid ${colors.surfaceContainer}`, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                Deselect All
              </button>
            </div>
          </div>

          {/* Clip cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clips.map((clip, idx) => (
              <div
                key={idx}
                onClick={() => toggleClip(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
                  borderRadius: radius.lg, cursor: 'pointer', transition: 'all 0.2s',
                  background: clip.selected ? 'rgba(192,193,255,0.06)' : colors.surfaceContainerHigh,
                  border: clip.selected ? '1px solid rgba(192,193,255,0.2)' : '1px solid transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
                  border: `2px solid ${clip.selected ? colors.primary : colors.onSurfaceVariant}`,
                  background: clip.selected ? colors.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {clip.selected && <Icon name="check" size={14} style={{ color: '#fff' }} />}
                </div>

                {/* Rank */}
                <div style={{
                  width: 28, height: 28, borderRadius: radius.md,
                  background: colors.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.onSurfaceVariant, fontSize: '11px', fontWeight: 700, flexShrink: 0,
                }}>
                  #{idx + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {clip.title}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    &ldquo;{clip.hook_text}&rdquo;
                  </p>
                </div>

                {/* Duration */}
                <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 8px' }}>
                  <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, fontWeight: 500 }}>
                    {formatTime(clip.start_time)} – {formatTime(clip.end_time)}
                  </p>
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>{clip.duration}s</p>
                </div>

                {/* Virality score */}
                <div style={{
                  padding: '4px 12px', borderRadius: radius.full, flexShrink: 0,
                  background: `${getScoreColor(clip.virality_score)}15`,
                  border: `1px solid ${getScoreColor(clip.virality_score)}30`,
                }}>
                  <span style={{ color: getScoreColor(clip.virality_score), fontSize: '13px', fontWeight: 700 }}>
                    {clip.virality_score}
                  </span>
                </div>

                {/* Platform */}
                <div style={{ padding: '4px 10px', borderRadius: radius.md, background: colors.surfaceContainer, flexShrink: 0 }}>
                  <span style={{ color: colors.onSurfaceVariant, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {clip.platform === 'youtube_shorts' ? 'YT' : clip.platform === 'instagram_reels' ? 'IG' : 'TT'}
                  </span>
                </div>

                {/* Download */}
                {clip.clip_url && (
                  <a href={clip.clip_url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ padding: '6px', borderRadius: radius.md, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="download" size={16} style={{ color: '#4ade80' }} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${colors.surfaceContainer}` }}>
            <p style={{ fontSize: '13px', color: colors.onSurfaceVariant }}>
              {selectedCount} clip{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setStep('idle'); setClips([]); setUrl(''); }}
                style={{ padding: '10px 20px', borderRadius: radius.md, border: `1px solid ${colors.surfaceContainer}`, background: 'transparent', color: colors.onSurfaceVariant, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
              >
                Process Another
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => {
                  const selected = clips.filter(c => c.selected);
                  sessionStorage.setItem('hookclip_clips', JSON.stringify(selected));
                  router.push('/clips');
                }}
                style={{
                  padding: '10px 28px', borderRadius: radius.md, border: 'none',
                  background: gradients.primary, color: '#FAF7FF', fontSize: '14px', fontWeight: 600,
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                  opacity: selectedCount > 0 ? 1 : 0.5, fontFamily: "'Inter',sans-serif",
                }}
              >
                View Selected Clips →
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
