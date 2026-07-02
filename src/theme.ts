import type { CSSProperties } from 'react';

// Light-theme design system for VangelClip's public/marketing pages.
// Dashboard and app pages use src/lib/tokens.ts (dark theme) — keep the two separate.

// ── Primitive tokens ──────────────────────────────────────────────────────────
export const mkt = {
  // Core palette
  bg:         '#FFFFFF',
  surface:    '#EEEBF3',
  surface2:   '#F8F6FB',
  text:       '#0E0307',
  muted:      '#6E6880',
  brand:      '#6E33B1',
  brand2:     '#9B5DE5',
  accent:     '#E4DBFF',
  accentText: '#6E33B1',
  border:     'rgba(14,3,7,0.09)',
  edge:       'rgba(255,255,255,0.75)',
  navBg:      'rgba(255,255,255,0.85)',
  success:    '#1FA774',

  // Gradients
  brandGrad:  'linear-gradient(135deg,#6E33B1,#9B5DE5)',

  // Shadows
  shadow:     '0 1px 3px rgba(14,3,7,0.07),0 8px 24px rgba(14,3,7,0.04)',
  glow:       '0 6px 22px rgba(110,51,177,0.32)',
  cardShadow: 'inset 1px 1px 0 rgba(255,255,255,0.75),0 1px 3px rgba(14,3,7,0.07),0 8px 24px rgba(14,3,7,0.04)',

  // Radius
  r:     '6px',
  rMd:   '10px',
  rPill: '100px',

  // Typography
  fontHead: "'Hanken Grotesk',-apple-system,sans-serif",
  fontBody: "'Figtree',-apple-system,sans-serif",

  // Layout
  maxW: '1160px',
  padX: '28px',
} as const;

// ── Reusable component style presets ─────────────────────────────────────────
export const mktBtn: Record<'primary' | 'ghost', CSSProperties> = {
  primary: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '8px',
    border:         'none',
    background:     'linear-gradient(135deg,#6E33B1,#9B5DE5)',
    color:          '#ffffff',
    fontWeight:     700,
    fontFamily:     "'Figtree',sans-serif",
    fontSize:       '15px',
    padding:        '12px 22px',
    borderRadius:   '6px',
    cursor:         'pointer',
    boxShadow:      'inset 1px 1px 0 rgba(255,255,255,0.25),0 6px 22px rgba(110,51,177,0.32)',
    whiteSpace:     'nowrap',
    textDecoration: 'none',
    lineHeight:     1,
  },
  ghost: {
    display:        'inline-flex',
    alignItems:     'center',
    border:         '1px solid rgba(14,3,7,0.09)',
    background:     'transparent',
    color:          '#0E0307',
    fontWeight:     600,
    fontFamily:     "'Figtree',sans-serif",
    fontSize:       '14px',
    padding:        '9px 16px',
    borderRadius:   '6px',
    cursor:         'pointer',
    textDecoration: 'none',
    lineHeight:     1,
  },
};

export const mktCard: Record<'base' | 'elevated', CSSProperties> = {
  base: {
    background:   '#EEEBF3',
    border:       '1px solid rgba(14,3,7,0.09)',
    borderRadius: '6px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.75),0 1px 3px rgba(14,3,7,0.07),0 8px 24px rgba(14,3,7,0.04)',
  },
  elevated: {
    background:   '#FFFFFF',
    border:       '1px solid rgba(14,3,7,0.09)',
    borderRadius: '10px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.75),0 1px 3px rgba(14,3,7,0.07),0 8px 24px rgba(14,3,7,0.04)',
  },
};

export const mktField: Record<'wrap' | 'input', CSSProperties> = {
  wrap: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   '#FFFFFF',
    border:       '1px solid rgba(14,3,7,0.09)',
    borderRadius: '6px',
    padding:      '6px 6px 6px 16px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.75),0 1px 3px rgba(14,3,7,0.07),0 8px 24px rgba(14,3,7,0.04)',
  },
  input: {
    flex:        1,
    minWidth:    0,
    border:      'none',
    outline:     'none',
    background:  'transparent',
    color:       '#0E0307',
    fontFamily:  "'Figtree',sans-serif",
    fontSize:    '14.5px',
    padding:     '8px 0',
  },
};
