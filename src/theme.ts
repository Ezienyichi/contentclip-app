import type { CSSProperties } from 'react';

// Dark-theme design system for VangelClip's public/marketing pages.
// Dashboard and app pages use src/lib/tokens.ts (separate dark tokens) — keep the two separate.

// ── Primitive tokens ──────────────────────────────────────────────────────────
export const mkt = {
  // Core palette — deliberate dark theme
  bg:         '#000000',
  surface:    '#111113',
  surface2:   '#0A0A0A',
  text:       '#FFFFFF',
  muted:      '#9A96A6',
  brand:      '#9B5DE5',
  brand2:     '#B47DF0',
  accent:     '#241B33',
  accentText: '#CDB6F2',
  border:     'rgba(255,255,255,0.10)',
  edge:       'rgba(255,255,255,0.06)',
  navBg:      'rgba(0,0,0,0.85)',
  success:    '#38E6A2',

  // Gradients
  brandGrad:  'linear-gradient(135deg,#9B5DE5,#B47DF0)',

  // Shadows
  shadow:     '0 1px 3px rgba(0,0,0,0.5),0 10px 30px rgba(0,0,0,0.4)',
  glow:       '0 6px 26px rgba(155,93,229,0.4)',
  cardShadow: 'inset 1px 1px 0 rgba(255,255,255,0.06),0 1px 3px rgba(0,0,0,0.5),0 10px 30px rgba(0,0,0,0.4)',

  // Radius
  r:     '6px',
  rMd:   '10px',
  rPill: '100px',

  // Typography
  fontHead: "var(--font-bodoni), Georgia, serif",
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
    background:     'linear-gradient(135deg,#9B5DE5,#B47DF0)',
    color:          '#ffffff',
    fontWeight:     700,
    fontFamily:     "'Figtree',sans-serif",
    fontSize:       '15px',
    padding:        '12px 22px',
    borderRadius:   '6px',
    cursor:         'pointer',
    boxShadow:      'inset 1px 1px 0 rgba(255,255,255,0.20),0 6px 26px rgba(155,93,229,0.4)',
    whiteSpace:     'nowrap',
    textDecoration: 'none',
    lineHeight:     1,
  },
  ghost: {
    display:        'inline-flex',
    alignItems:     'center',
    border:         '1px solid rgba(255,255,255,0.15)',
    background:     'transparent',
    color:          '#FFFFFF',
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
    background:   '#111113',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.06),0 1px 3px rgba(0,0,0,0.5),0 10px 30px rgba(0,0,0,0.4)',
  },
  elevated: {
    background:   '#141414',
    border:       '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.06),0 1px 3px rgba(0,0,0,0.5),0 10px 30px rgba(0,0,0,0.4)',
  },
};

export const mktField: Record<'wrap' | 'input', CSSProperties> = {
  wrap: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   'rgba(255,255,255,0.07)',
    border:       '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    padding:      '6px 6px 6px 16px',
    boxShadow:    'inset 1px 1px 0 rgba(255,255,255,0.06)',
  },
  input: {
    flex:        1,
    minWidth:    0,
    border:      'none',
    outline:     'none',
    background:  'transparent',
    color:       '#FFFFFF',
    fontFamily:  "'Figtree',sans-serif",
    fontSize:    '14.5px',
    padding:     '8px 0',
  },
};
