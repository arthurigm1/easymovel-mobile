import '@/global.css';
import { Platform } from 'react-native';

// ─── Easymovel Design System ─────────────────────────────────────────────────

export const Palette = {
  // Primary — Indigo 700 (confiança, tecnologia, premium)
  primary:        '#4338CA',
  primaryHover:   '#3730A3',
  primaryDark:    '#312E81',
  primaryLight:   '#EEF2FF',
  primaryMid:     '#C7D2FE',
  primarySubtle:  '#E0E7FF',

  // Accent — Violet (diferenciação)
  accent:         '#7C3AED',
  accentLight:    '#F5F3FF',
  accentMid:      '#DDD6FE',

  // Status da obra
  statusPreLancamento:    '#7C3AED',
  statusPreLancamentoBg:  '#F5F3FF',
  statusLancamento:       '#4338CA',
  statusLancamentoBg:     '#EEF2FF',
  statusEmConstrucao:     '#D97706',
  statusEmConstrucaoBg:   '#FFFBEB',
  statusPronto:           '#16A34A',
  statusProntoBg:         '#F0FDF4',

  // Status de unidades
  unitDisponivel:  '#16A34A',
  unitDecorado:    '#7C3AED',
  unitPromocao:    '#2563EB',
  unitModelo:      '#D97706',

  // Semânticas
  success:         '#16A34A',
  successBg:       '#F0FDF4',
  successMid:      '#BBF7D0',
  warning:         '#D97706',
  warningBg:       '#FFFBEB',
  error:           '#DC2626',
  errorBg:         '#FEF2F2',
  info:            '#0284C7',
  infoBg:          '#F0F9FF',

  // Neutros
  bg:              '#F7F8FF',
  bgAlt:           '#F1F4FE',
  surface:         '#FFFFFF',
  surfaceVariant:  '#F1F4FE',
  surfaceOverlay:  '#FAFBFF',

  border:          '#E4E7F2',
  borderLight:     '#EEF1FB',
  borderStrong:    '#CBD0E8',
  borderFocus:     '#4338CA',

  text:            '#0F172A',
  textSecondary:   '#475569',
  textTertiary:    '#94A3B8',
  textDisabled:    '#CBD5E1',
  textInverse:     '#FFFFFF',
  textBrand:       '#4338CA',

  white:           '#FFFFFF',
  black:           '#000000',
  overlay:         'rgba(15, 23, 42, 0.6)',
  overlayLight:    'rgba(15, 23, 42, 0.3)',
} as const;

export const Shadow = {
  none: {},
  xs: {
    shadowColor: '#1E2A5C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1E2A5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E2A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1E2A5C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 14,
  },
} as const;

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  full: 9999,
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  // legacy
  half: 2,
  one:  4,
  two:  8,
  three: 16,
  four: 24,
  five: 32,
  six:  64,
} as const;

export const Typography = {
  display:  { fontSize: 36, fontWeight: '900' as const, letterSpacing: -1 },
  h1:       { fontSize: 30, fontWeight: '900' as const, letterSpacing: -0.8 },
  h2:       { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  h3:       { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h4:       { fontSize: 17, fontWeight: '700' as const },
  h5:       { fontSize: 15, fontWeight: '600' as const },
  body1:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body2:    { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label:    { fontSize: 13, fontWeight: '600' as const },
  caption:  { fontSize: 12, fontWeight: '500' as const },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.8 },
} as const;

// Legacy exports for backwards compatibility
export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.bg,
    backgroundElement: Palette.primaryLight,
    backgroundSelected: Palette.primaryMid,
    textSecondary: Palette.textSecondary,
  },
  dark: {
    text: '#F8FAFF',
    background: '#0A0E1A',
    backgroundElement: '#141929',
    backgroundSelected: '#1E2640',
    textSecondary: '#94A3B8',
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export type ThemeColor = keyof typeof Palette;
