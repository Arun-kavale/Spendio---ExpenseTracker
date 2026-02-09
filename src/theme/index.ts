import {Theme} from '@/types';
import {lightColors, darkColors} from './colors';
import {typography} from './typography';
import {spacing, borderRadius} from './spacing';

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  typography,
  borderRadius,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  typography,
  borderRadius,
};

export {lightColors, darkColors, gradients, categoryColors} from './colors';
export {typography} from './typography';
export {spacing, borderRadius} from './spacing';
export {lightShadows, darkShadows, getShadowStyle} from './shadows';
export {lightGradients, darkGradients, chartGradients, gradientDirections} from './gradients';
export type {ShadowStyle, ShadowKey} from './shadows';
export type {GradientColors, GradientTheme} from './gradients';
