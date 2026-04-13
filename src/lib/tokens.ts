export const colors = {
  surface: '#131313', surfaceDim: '#131313', surfaceContainerLowest: '#0E0E0E',
  surfaceContainerLow: '#1C1B1B', surfaceContainer: '#201F1F',
  surfaceContainerHigh: '#2A2A2A', surfaceContainerHighest: '#353534',
  surfaceBright: '#3A3939', surfaceVariant: '#353534', background: '#0E0E0E',
  primary: '#C0C1FF', primaryDim: '#9c48ea', primaryContainer: '#5D60EB',
  onPrimary: '#1000A9', onPrimaryContainer: '#FAF7FF',
  secondary: '#C3C0FF', secondaryContainer: '#3626CE',
  tertiary: '#89CEFF', tertiaryContainer: '#0079AD',
  error: '#FFB4AB', errorContainer: '#93000A',
  onSurface: '#E5E2E1', onSurfaceVariant: '#C7C4D7', onBackground: '#E5E2E1',
  outline: '#908FA0', outlineVariant: '#464555',
  white: '#FFFFFF', black: '#000000',
} as const;
export const gradients = {
  primary: 'linear-gradient(135deg, #C0C1FF 0%, #5D60EB 100%)',
  primaryHover: 'linear-gradient(135deg, #D0D1FF 0%, #6D70FB 100%)',
  cta: 'linear-gradient(135deg, #9c48ea 0%, #cc97ff 100%)',
} as const;
export const radius = { sm: '0.375rem', md: '0.5rem', lg: '1rem', xl: '1.5rem', full: '9999px' } as const;
export const shadows = {
  ambient: '0 8px 32px rgba(0,0,0,0.06)', float: '0 16px 48px rgba(0,0,0,0.12)',
  glow: '0 0 40px -10px rgba(192,193,255,0.15)', glowStrong: '0 0 30px rgba(192,193,255,0.3)',
} as const;
export const inputField: React.CSSProperties = {
  background: colors.surfaceContainerLowest, color: colors.onSurface,
  border: '1px solid transparent', borderRadius: radius.md,
  padding: '12px 16px', fontSize: '14px', fontFamily: "'Inter', sans-serif",
  outline: 'none', width: '100%', transition: 'border-color 0.2s',
};
