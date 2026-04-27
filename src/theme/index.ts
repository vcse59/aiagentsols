// ─────────────────────────────────────────────────────────────────────────────
// Design System — AI Agents Solutions
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#5B5BD6',
  primaryDark: '#4338CA',
  primaryLight: '#818CF8',
  accent: '#7C3AED',
  accentLight: '#A78BFA',

  // Gradient stops
  gradientStart: '#4F46E5',
  gradientMid: '#6D28D9',
  gradientEnd: '#7C3AED',

  // Surfaces
  background: '#F5F6FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFF',
  surfaceDim: '#F0F2FF',

  // Text
  textPrimary: '#0D0F1A',
  textSecondary: '#374151',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Borders
  borderLight: '#E8EAFF',
  borderDefault: '#DDD8FF',
  borderMuted: '#E2E8F0',

  // Status
  success: '#059669',
  successBg: '#D1FAE5',
  successBorder: '#6EE7B7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FCD34D',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  errorBorder: '#FCA5A5',
  info: '#2563EB',
  infoBg: '#DBEAFE',
  infoBorder: '#93C5FD',

  // Category palette
  categories: {
    LLMs: '#5B5BD6',
    'Image AI': '#D97706',
    Agents: '#059669',
    Techniques: '#2563EB',
    Ethics: '#DC2626',
    Tools: '#7C3AED',
    All: '#5B5BD6',
  } as Record<string, string>,

  // Overlay / alpha
  overlayLight: 'rgba(255,255,255,0.12)',
  overlayMedium: 'rgba(255,255,255,0.22)',
  overlayDark: 'rgba(0,0,0,0.10)',
  shadowColor: '#3730A3',
} as const;

export const Typography = {
  // Display
  displayLg: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 40 },
  displayMd: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 32 },

  // Headings
  h1: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 28 },
  h2: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 22 },

  // Body
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 26 },
  bodyMd: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyXs: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

  // Labels
  labelLg: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1 },
  labelMd: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.1 },
  labelSm: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2 },
  labelXs: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  // Mono
  mono: { fontSize: 13, fontFamily: 'monospace' as const, lineHeight: 20 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const Shadow = {
  xs: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 14,
  },
} as const;

export const GradientPresets = {
  brand: ['#4F46E5', '#6D28D9', '#7C3AED'] as string[],
  brandDeep: ['#1E3A8A', '#4338CA', '#6D28D9'] as string[],
  brandSoft: ['#EEF2FF', '#F5F3FF', '#FFFFFF'] as string[],
  heroCard: ['#F8F7FF', '#FFFFFF'] as string[],
  overlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)'] as string[],
} as const;
