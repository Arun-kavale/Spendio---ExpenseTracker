import {ThemeColors} from '@/types';

/**
 * Spendio Color Palette
 *
 * Purple–violet tint matching the Spendio logo.
 * Primary and accents use violet (#7C3AED, #8B5CF6) for buttons, tabs, and highlights.
 */

export const lightColors: ThemeColors = {
  // Primary - Purple violet (Spendio logo)
  primary: '#7C3AED', // Violet-600
  primaryLight: '#8B5CF6', // Violet-500
  primaryDark: '#6D28D9', // Violet-700

  // Gradient colors - Purple to violet (logo match)
  gradientStart: '#6D28D9',
  gradientEnd: '#8B5CF6',

  // Secondary - Violet-pink accent
  secondary: '#A855F7', // Purple-500

  // Backgrounds - Clean with subtle warmth
  background: '#FAFAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F3FF', // Subtle violet tint
  card: '#FFFFFF',

  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(124, 58, 237, 0.12)',
  glassBackground: 'rgba(255, 255, 255, 0.95)',

  // Typography
  text: '#1A1D29',
  textSecondary: '#5A6178',
  textMuted: '#9CA3B8',

  // UI Elements
  border: '#E9E7EF',
  divider: '#F0EEF5',

  // Status colors
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Financial semantics
  income: '#059669',
  expense: '#DC2626',
  transfer: '#2563EB',

  // Overlay and shadows - violet tint
  overlay: 'rgba(26, 29, 41, 0.4)',
  shadow: 'rgba(124, 58, 237, 0.06)',
  shadowMedium: 'rgba(124, 58, 237, 0.08)',
  shadowLarge: 'rgba(124, 58, 237, 0.1)',

  // Chart colors - purple violet
  chartPrimary: '#7C3AED',
  chartSecondary: '#8B5CF6',
  chartTertiary: '#A855F7',
  chartGradientStart: '#6D28D9',
  chartGradientEnd: '#8B5CF6',
};

export const darkColors: ThemeColors = {
  // Primary - Purple violet, brighter for dark mode
  primary: '#A78BFA', // Violet-400
  primaryLight: '#C4B5FD', // Violet-300
  primaryDark: '#8B5CF6', // Violet-500

  // Gradient - Purple to violet (Spendio)
  gradientStart: '#8B5CF6',
  gradientEnd: '#A78BFA',

  // Secondary
  secondary: '#C084FC', // Purple-400

  // Backgrounds - Deep slate
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  card: '#1E293B',

  // Glass morphism
  glass: 'rgba(30, 41, 59, 0.8)',
  glassBorder: 'rgba(167, 139, 250, 0.15)',
  glassBackground: 'rgba(30, 41, 59, 0.9)',

  // Typography
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',

  // UI Elements
  border: '#334155',
  divider: '#1E293B',

  // Status colors
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',

  // Financial semantics
  income: '#34D399',
  expense: '#F87171',
  transfer: '#60A5FA',

  // Overlay and shadows
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowLarge: 'rgba(0, 0, 0, 0.5)',

  // Chart colors - purple violet
  chartPrimary: '#A78BFA',
  chartSecondary: '#8B5CF6',
  chartTertiary: '#C084FC',
  chartGradientStart: '#8B5CF6',
  chartGradientEnd: '#A78BFA',
};

/**
 * Category color palette - Premium fintech colors
 */
export const categoryColors = [
  '#5C6BC0', // Indigo
  '#26A69A', // Teal
  '#EF5350', // Red
  '#AB47BC', // Purple
  '#42A5F5', // Blue
  '#66BB6A', // Green
  '#FFA726', // Orange
  '#EC407A', // Pink
  '#7E57C2', // Deep Purple
  '#26C6DA', // Cyan
  '#8D6E63', // Brown
  '#78909C', // Blue Grey
  '#D4E157', // Lime
  '#FF7043', // Deep Orange
  '#5C6BC0', // Indigo variant
  '#29B6F6', // Light Blue
];

/**
 * Gradient presets - Purple violet (Spendio)
 */
export const gradients = {
  primary: ['#6D28D9', '#8B5CF6'],
  primaryDark: ['#8B5CF6', '#A78BFA'],
  secondary: ['#A855F7', '#C084FC'],
  success: ['#11998e', '#38ef7d'],
  warning: ['#F2994A', '#F2C94C'],
  error: ['#eb3349', '#f45c43'],
  premium: ['#6D28D9', '#8B5CF6'],
  sunset: ['#fa709a', '#fee140'],
  ocean: ['#4facfe', '#00f2fe'],
};
