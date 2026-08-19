'use client';
import React, { useState, useMemo } from 'react';

const TIPS: Record<string, string[]> = {
  'Sermons & Faith': [
    "Clip the moment of your key scripture reveal. It's your natural hook.",
    "Testimonies make powerful standalone shorts; look for the turning-point sentence.",
    "A single convicting question from your message works great as a caption.",
    "Worship-to-word transitions are emotional peaks worth clipping.",
  ],
  'Music': [
    "The chorus drop is your most shareable 15 seconds.",
    "Clip the build-up right before the beat drops for suspense.",
    "Behind-the-lyric moments (why you wrote it) connect with fans.",
    "A cappella or stripped-back sections stand out in a feed.",
  ],
  'Podcasts': [
    "The boldest opinion or hot take is your scroll-stopper.",
    "Look for the 'wait, say that again' moment. That's your clip.",
    "Guest surprise reactions make great short-form hooks.",
    "A surprising stat or story beats a slow intro every time.",
  ],
  'Education': [
    "Lead with the 'you've been doing this wrong' myth-buster.",
    "One clear tip per clip performs better than a full lesson.",
    "Before/after or problem/solution framing hooks learners fast.",
    "The 'aha' moment is your most clippable second.",
  ],
  'Marketing/Business': [
    "A contrarian take on your industry stops the scroll.",
    "Turn one insight into a punchy 20-second value clip.",
    "Client results or a mini case study builds instant credibility.",
    "Lead with the outcome, then explain how.",
  ],
};

const GENERAL_TIPS = [
  "Your most emotional or surprising moment is usually your best clip.",
  "Strong first 3 seconds matter more than anything else.",
  "One idea per clip: resist cramming.",
  "End on a question to drive comments.",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  contentCategory?: string | null;
  onDismiss: () => void;
}

export default function ContentTips({ contentCategory, onDismiss }: Props) {
  const tips = useMemo(() => {
    const base = (contentCategory && TIPS[contentCategory]) ? TIPS[contentCategory] : GENERAL_TIPS;
    return shuffle(base);
  }, [contentCategory]);

  const [idx, setIdx] = useState(0);

  const next = () => setIdx(i => (i + 1) % tips.length);

  const label = contentCategory && TIPS[contentCategory]
    ? `${contentCategory} tips`
    : 'Creator tips';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(155,93,229,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          💡
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9B5DE5' }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6B6560' }}>While you wait: a tip to make your clips land harder</p>
        </div>
      </div>

      {/* Tip card */}
      <div style={{
        background:   '#F5F3EF',
        borderRadius: 12,
        padding:      '20px 22px',
        border:       '1px solid rgba(0,0,0,0.08)',
        position:     'relative',
        minHeight:    80,
      }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1A1714', lineHeight: 1.6 }}>
          &ldquo;{tips[idx]}&rdquo;
        </p>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: '#6B6560' }}>
          {idx + 1} of {tips.length}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={next}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '9px 18px',
            borderRadius: 100,
            border:       '1.5px solid rgba(155,93,229,0.35)',
            background:   'rgba(155,93,229,0.08)',
            color:        '#7C3AED',
            fontSize:     13,
            fontWeight:   700,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          Next tip →
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none',
            color: '#6B6560', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            padding: '4px 8px',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
