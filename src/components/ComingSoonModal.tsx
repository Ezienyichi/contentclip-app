'use client';
import { useState } from 'react';
import { colors, gradients, radius } from '@/lib/tokens';
import Icon from '@/components/Icon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  clipTitle?: string;
}

export default function ComingSoonModal({ isOpen, onClose, videoUrl, clipTitle }: Props) {
  const [notified, setNotified] = useState(false);
  if (!isOpen) return null;

  function handleDownload() {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = (clipTitle || 'clip').replace(/\s+/g, '_') + '.mp4';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.surfaceContainerHigh, borderRadius: radius.xl,
          padding: '36px 32px', width: '100%', maxWidth: '420px', textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: colors.primary + '15', border: '1px solid ' + colors.primary + '30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Icon name="calendar_clock" size={28} style={{ color: colors.primary }} />
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px', color: colors.onSurface }}>
          Social scheduling is on its way
        </h3>
        <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, lineHeight: 1.7, margin: '0 0 28px' }}>
          Your clips are ready to share right now. Download them and post directly to
          your platforms. It takes seconds. Auto-scheduling is coming soon and
          you&apos;ll be the first to know.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {videoUrl && (
            <button
              onClick={handleDownload}
              style={{
                background: gradients.primary, color: '#FAF7FF', fontWeight: 700,
                padding: '13px', borderRadius: radius.md, border: 'none', cursor: 'pointer',
                fontSize: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', fontFamily: "'Inter',sans-serif",
              }}
            >
              <Icon name="download" size={18} /> Download Clip
            </button>
          )}

          {!notified ? (
            <button
              onClick={() => setNotified(true)}
              style={{
                background: colors.surfaceContainer, color: colors.onSurface,
                border: '1px solid ' + colors.outlineVariant, fontWeight: 600,
                padding: '12px', borderRadius: radius.md, cursor: 'pointer',
                fontSize: '13px', fontFamily: "'Inter',sans-serif",
              }}
            >
              Notify me when it&apos;s ready
            </button>
          ) : (
            <div style={{
              padding: '12px', borderRadius: radius.md,
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
              color: '#4ade80', fontSize: '13px', fontWeight: 600,
            }}>
              You&apos;re on the list. We&apos;ll let you know!
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: colors.onSurfaceVariant,
              fontSize: '13px', cursor: 'pointer', padding: '8px',
              fontFamily: "'Inter',sans-serif",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
