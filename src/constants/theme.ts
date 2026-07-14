import '@/global.css';
import { Platform } from 'react-native';

// ─── Blow Design System ───────────────────────────────────────────────────────

export const Palette = {
  // Primary — Indigo/violeta editorial (paleta oficial Blow)
  primary:        '#5457F0',
  primaryHover:   '#4548D6',
  primaryDark:    '#3A3DBF',
  primaryLight:   '#EEEEFC',
  primaryMid:     '#C7C8F5',
  primarySubtle:  '#E4E4FB',

  // Accent — Violeta (diferenciação, reservado a status)
  accent:         '#7C3AED',
  accentLight:    '#F5F3FF',
  accentMid:      '#DDD6FE',

  // Status da obra
  statusPreLancamento:    '#7C3AED',
  statusPreLancamentoBg:  '#F5F3FF',
  statusLancamento:       '#5457F0',
  statusLancamentoBg:     '#EEEEFC',
  statusEmConstrucao:     '#B45309',
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

  // Neutros — base editorial (quase-branco, texto quase-preto)
  bg:              '#FDFDFE',
  bgAlt:           '#F7F7FA',
  surface:         '#FFFFFF',
  surfaceVariant:  '#F4F4FA',
  surfaceOverlay:  '#FAFBFF',

  border:          '#E7E7EF',
  borderLight:     '#EDEDF3',
  borderStrong:    '#D5D5E0',
  borderFocus:     '#5457F0',

  text:            '#16161D',
  textSecondary:   '#4A4A57',
  textTertiary:    '#87878F',
  textDisabled:    '#B8B8C2',
  textInverse:     '#FFFFFF',
  textBrand:       '#5457F0',

  white:           '#FFFFFF',
  black:           '#000000',
  overlay:         'rgba(22, 22, 29, 0.6)',
  overlayLight:    'rgba(22, 22, 29, 0.3)',
} as const;

export const Shadow = {
  none: {},
  xs: {
    shadowColor: '#16161D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#16161D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#16161D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5457F0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  xl: {
    shadowColor: '#16161D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
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

// Fontes de destaque — usadas só em momentos de maior peso visual (título de
// tela, preço, nome do app) pra fugir da fonte padrão do sistema. Texto
// utilitário/pequeno continua na fonte nativa.
// "serif" é a assinatura visual do app: nome do empreendimento em Source
// Serif 4, dando o tom editorial/premium — igual à referência de design.
export const DisplayFont = {
  bold: 'InstrumentSans_700Bold',
  extraBold: 'InstrumentSans_700Bold', // Instrument Sans só vai até 700
  semiBold: 'InstrumentSans_600SemiBold',
  serif: 'SourceSerif4_500Medium',
  serifSemiBold: 'SourceSerif4_600SemiBold',
} as const;

export type ThemeColor = keyof typeof Palette;
