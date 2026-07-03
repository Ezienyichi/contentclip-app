export const colors = {
  // Surface scale — pure black base, lifted surfaces for cards/panels
  surface:                 '#0D0D0D',
  surfaceDim:              '#0D0D0D',
  surfaceContainerLowest:  '#0A0A0A',
  surfaceContainerLow:     '#111113',
  surfaceContainer:        '#141414',
  surfaceContainerHigh:    '#1A1A1F',
  surfaceContainerHighest: '#222228',
  surfaceBright:           '#2A2A35',
  surfaceVariant:          '#222228',
  background:              '#000000',

  // Purple accent — matches the homepage
  primary:            '#9B5DE5',
  primaryDim:         '#7A3BC0',
  primaryContainer:   '#6D3BA0',
  onPrimary:          '#FFFFFF',
  onPrimaryContainer: '#F3E6FF',

  secondary:          '#B47DF0',
  secondaryContainer: '#4A2380',
  tertiary:           '#89CEFF',
  tertiaryContainer:  '#0079AD',

  error:           '#FFB4AB',
  errorContainer:  '#93000A',

  onSurface:        '#FFFFFF',
  onSurfaceVariant: '#9A96A6',
  onBackground:     '#FFFFFF',

  outline:        '#6E6880',
  outlineVariant: '#2A2A35',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const gradients = {
  primary:      'linear-gradient(135deg, #9B5DE5 0%, #B47DF0 100%)',
  primaryHover: 'linear-gradient(135deg, #A96DF0 0%, #C487FF 100%)',
  cta:          'linear-gradient(135deg, #9B5DE5 0%, #B47DF0 100%)',
} as const;

export const radius = {
  sm:   '0.375rem',
  md:   '0.5rem',
  lg:   '1rem',
  xl:   '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  ambient:   '0 8px 32px rgba(0,0,0,0.4)',
  float:     '0 16px 48px rgba(0,0,0,0.6)',
  glow:      '0 0 40px -10px rgba(155,93,229,0.3)',
  glowStrong:'0 0 30px rgba(155,93,229,0.5)',
} as const;

export const inputField: React.CSSProperties = {
  background:   colors.surfaceContainerLow,
  color:        colors.onSurface,
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: radius.md,
  padding:      '12px 16px',
  fontSize:     '14px',
  fontFamily:   "'Inter', sans-serif",
  outline:      'none',
  width:        '100%',
  transition:   'border-color 0.2s',
};
