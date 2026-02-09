/**
 * Shadow Tokens
 * 
 * Premium shadow system for fintech-grade elevation effects.
 * Provides consistent depth and visual hierarchy.
 */

import {Platform, ViewStyle} from 'react-native';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {width: number; height: number};
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Light mode shadows
 * 
 * Optimized for a clean, minimal look like Google Pay and Cred.
 * Uses very subtle shadows to avoid heavy/dated appearance.
 */
export const lightShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ShadowStyle,
  
  xs: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  } as ShadowStyle,
  
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  } as ShadowStyle,
  
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  } as ShadowStyle,
  
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  } as ShadowStyle,
  
  xl: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  } as ShadowStyle,
  
  // Special shadows for colored elements - more subtle
  primary: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  } as ShadowStyle,
  
  success: {
    shadowColor: '#059669',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  } as ShadowStyle,
  
  error: {
    shadowColor: '#DC2626',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  } as ShadowStyle,
  
  // Floating action button shadow
  fab: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  } as ShadowStyle,
  
  // Header shadow - very subtle
  header: {
    shadowColor: '#1A1D29',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  } as ShadowStyle,
  
  // Card hover/press shadow
  cardHover: {
    shadowColor: '#7C3AED',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } as ShadowStyle,
};

/**
 * Dark mode shadows (more subtle)
 */
export const darkShadows = {
  none: lightShadows.none,
  
  xs: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  } as ShadowStyle,
  
  sm: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ShadowStyle,
  
  md: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ShadowStyle,
  
  lg: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  } as ShadowStyle,
  
  xl: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  } as ShadowStyle,
  
  primary: {
    shadowColor: '#7C8AE8',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  } as ShadowStyle,
  
  success: {
    shadowColor: '#34D399',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  } as ShadowStyle,
  
  error: {
    shadowColor: '#F87171',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  } as ShadowStyle,
  
  fab: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  } as ShadowStyle,
  
  header: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  } as ShadowStyle,
  
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  } as ShadowStyle,
};

export type ShadowKey = keyof typeof lightShadows;

/**
 * Get platform-specific shadow styles
 */
export const getShadowStyle = (shadow: ShadowStyle): ViewStyle => {
  if (Platform.OS === 'android') {
    return {elevation: shadow.elevation};
  }
  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
  };
};
