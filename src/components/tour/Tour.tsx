'use client';
import React, { useEffect, useState } from 'react';
import type { TourStep } from './tourSteps';

interface Pos {
  top:    number;
  left:   number;
  arrow:  'up' | 'down' | 'none';
  hlRect: { top: number; left: number; width: number; height: number } | null;
}

interface Props {
  steps:  TourStep[];
  isOpen: boolean;
  step:   number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const TOOLTIP_W = 320;
const TOOLTIP_H = 172; // conservative estimate for positioning

export default function Tour({ steps, isOpen, step, onNext, onBack, onSkip }: Props) {
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0, arrow: 'none', hlRect: null });

  useEffect(() => {
    if (!isOpen) return;
    const current = steps[step];
    if (!current) return;

    // Scroll target into view, then measure
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const measure = () => {
      const el2 = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const GAP = 14;

      if (!el2) {
        // Target not in DOM — show centered tooltip
        setPos({
          top:    Math.max(12, vh / 2 - TOOLTIP_H / 2),
          left:   Math.max(12, vw / 2 - TOOLTIP_W / 2),
          arrow:  'none',
          hlRect: null,
        });
        return;
      }

      const r = el2.getBoundingClientRect();

      // Prefer below, then above, then centered
      let top: number;
      let arrow: Pos['arrow'];
      if (r.bottom + GAP + TOOLTIP_H < vh) {
        top   = r.bottom + GAP;
        arrow = 'up';
      } else if (r.top - GAP - TOOLTIP_H > 0) {
        top   = r.top - GAP - TOOLTIP_H;
        arrow = 'down';
      } else {
        top   = Math.max(12, vh / 2 - TOOLTIP_H / 2);
        arrow = 'none';
      }

      // Center tooltip horizontally over target, clamped to viewport
      let left = r.left + r.width / 2 - TOOLTIP_W / 2;
      left = Math.max(12, Math.min(left, vw - TOOLTIP_W - 12));

      setPos({ top, left, arrow, hlRect: { top: r.top, left: r.left, width: r.width, height: r.height } });
    };

    // Small delay to let scroll settle before measuring
    const t = setTimeout(measure, 160);
    return () => clearTimeout(t);
  }, [isOpen, step, steps]);

  if (!isOpen) return null;
  const current = steps[step];
  if (!current) return null;

  const { top, left, arrow, hlRect } = pos;

  return (
    <>
      {/* Backdrop — visual dim only, pointer-events:none so it never intercepts clicks */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', zIndex: 9000, pointerEvents: 'none' }}
      />

      {/* Purple highlight ring around target element */}
      {hlRect && (
        <div
          style={{
            position:      'fixed',
            top:           hlRect.top    - 4,
            left:          hlRect.left   - 4,
            width:         hlRect.width  + 8,
            height:        hlRect.height + 8,
            borderRadius:  10,
            border:        '2px solid #9B5DE5',
            boxShadow:     '0 0 0 3px rgba(155,93,229,0.22)',
            zIndex:        9001,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position:     'fixed',
          top,
          left,
          width:        TOOLTIP_W,
          zIndex:       9002,
          background:   '#EFECEA',
          borderRadius: 14,
          padding:      '20px 22px 18px',
          boxShadow:    '0 8px 40px rgba(0,0,0,0.24)',
          border:       '1px solid rgba(0,0,0,0.08)',
          boxSizing:    'border-box',
        }}
      >
        {/* Arrow pointing up (tooltip is below target) */}
        {arrow === 'up' && (
          <div style={{ position: 'absolute', top: -7, left: 22 }}>
            <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid #EFECEA', filter: 'drop-shadow(0 -1px 0 rgba(0,0,0,0.08))' }} />
          </div>
        )}
        {/* Arrow pointing down (tooltip is above target) */}
        {arrow === 'down' && (
          <div style={{ position: 'absolute', bottom: -7, left: 22 }}>
            <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid #EFECEA', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.08))' }} />
          </div>
        )}

        {/* Step pill */}
        <p style={{ margin: '0 0 9px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B5DE5' }}>
          Step {step + 1} of {steps.length}
        </p>

        <h3 style={{ margin: '0 0 7px', fontSize: 15, fontWeight: 800, color: '#1A1714', lineHeight: 1.3 }}>
          {current.title}
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#4A4540', lineHeight: 1.6 }}>
          {current.body}
        </p>

        {/* Navigation row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', color: '#6B6560', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={onBack}
                style={{ padding: '7px 15px', borderRadius: 100, border: '1.5px solid rgba(0,0,0,0.15)', background: 'transparent', color: '#1A1714', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={onNext}
              style={{ padding: '7px 18px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#9B5DE5,#7C3AED)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {step === steps.length - 1 ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
