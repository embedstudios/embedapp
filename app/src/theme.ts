// Embed client app — light theme tokens (from the prototype's [data-th="light"] scope
// and the Embed Studios design system).

export const C = {
  bg: '#FAFAFA',
  sf: '#FFFFFF',
  sf2: '#F1F1F1',
  tx: '#0B0F0E',
  mu: '#5A5A5A',
  ln: '#DADADA',
  mint: '#0E7A45',
  mi: '#FFFFFF',
  mintsoft: 'rgba(14,122,69,0.1)',
  warn: '#8A5A00',
  warnsoft: 'rgba(255,196,80,0.22)',
  pulse: 'rgba(175,252,206,0.6)',
  scrim: 'rgba(0,0,0,0.5)',
} as const;

export const F = {
  display: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'DMMono_400Regular',
} as const;

export const R = { sm: 6, md: 10, lg: 20, pill: 999 } as const;

// CSS letter-spacing in em → React Native points.
export const em = (size: number, e: number) => size * e;
