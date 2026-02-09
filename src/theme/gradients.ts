/**
 * Gradient Theme Definitions
 *
 * Purple–violet gradients matching the Spendio logo.
 * Primary: #6D28D9 → #8B5CF6 (Violet-700 to Violet-500).
 */

export interface GradientColors {
  start: string;
  end: string;
  colors: string[];
  locations?: number[];
}

export interface GradientTheme {
  primary: GradientColors;
  primarySubtle: GradientColors;
  secondary: GradientColors;
  success: GradientColors;
  warning: GradientColors;
  error: GradientColors;
  dark: GradientColors;
  glass: GradientColors;
}

/**
 * Light Mode Gradients
 */
export const lightGradients: GradientTheme = {
  // Primary - Purple to violet (Spendio logo)
  primary: {
    start: '#6D28D9',
    end: '#8B5CF6',
    colors: ['#6D28D9', '#8B5CF6'],
    locations: [0, 1],
  },

  // Subtle version for backgrounds
  primarySubtle: {
    start: 'rgba(109, 40, 217, 0.12)',
    end: 'rgba(139, 92, 246, 0.12)',
    colors: ['rgba(109, 40, 217, 0.12)', 'rgba(139, 92, 246, 0.12)'],
    locations: [0, 1],
  },

  // Secondary - Violet to pink
  secondary: {
    start: '#A855F7',
    end: '#EC4899',
    colors: ['#A855F7', '#EC4899'],
    locations: [0, 1],
  },
  
  // Success gradient - Green shades
  success: {
    start: '#10B981',
    end: '#34D399',
    colors: ['#10B981', '#34D399'],
    locations: [0, 1],
  },
  
  // Warning gradient - Orange to Yellow
  warning: {
    start: '#F59E0B',
    end: '#FBBF24',
    colors: ['#F59E0B', '#FBBF24'],
    locations: [0, 1],
  },
  
  // Error gradient - Red shades
  error: {
    start: '#EF4444',
    end: '#F87171',
    colors: ['#EF4444', '#F87171'],
    locations: [0, 1],
  },
  
  // Dark gradient for cards/surfaces
  dark: {
    start: '#1E293B',
    end: '#334155',
    colors: ['#1E293B', '#334155'],
    locations: [0, 1],
  },
  
  // Glassmorphism gradient
  glass: {
    start: 'rgba(255, 255, 255, 0.9)',
    end: 'rgba(255, 255, 255, 0.7)',
    colors: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'],
    locations: [0, 1],
  },
};

/**
 * Dark Mode Gradients - Slightly brighter for dark mode visibility
 */
export const darkGradients: GradientTheme = {
  // Primary - Purple violet, brighter for dark mode
  primary: {
    start: '#8B5CF6',
    end: '#A78BFA',
    colors: ['#8B5CF6', '#A78BFA'],
    locations: [0, 1],
  },

  // Subtle version for backgrounds
  primarySubtle: {
    start: 'rgba(139, 92, 246, 0.2)',
    end: 'rgba(167, 139, 250, 0.2)',
    colors: ['rgba(139, 92, 246, 0.2)', 'rgba(167, 139, 250, 0.2)'],
    locations: [0, 1],
  },

  // Secondary gradient
  secondary: {
    start: '#9333EA',
    end: '#DB2777',
    colors: ['#9333EA', '#DB2777'],
    locations: [0, 1],
  },
  
  // Success gradient
  success: {
    start: '#059669',
    end: '#10B981',
    colors: ['#059669', '#10B981'],
    locations: [0, 1],
  },
  
  // Warning gradient
  warning: {
    start: '#D97706',
    end: '#F59E0B',
    colors: ['#D97706', '#F59E0B'],
    locations: [0, 1],
  },
  
  // Error gradient
  error: {
    start: '#DC2626',
    end: '#EF4444',
    colors: ['#DC2626', '#EF4444'],
    locations: [0, 1],
  },
  
  // Dark gradient for cards/surfaces
  dark: {
    start: '#0F172A',
    end: '#1E293B',
    colors: ['#0F172A', '#1E293B'],
    locations: [0, 1],
  },
  
  // Glassmorphism gradient - darker for dark mode
  glass: {
    start: 'rgba(30, 41, 59, 0.9)',
    end: 'rgba(30, 41, 59, 0.7)',
    colors: ['rgba(30, 41, 59, 0.9)', 'rgba(30, 41, 59, 0.7)'],
    locations: [0, 1],
  },
};

/**
 * Chart gradient colors derived from primary
 */
export const chartGradients = {
  light: {
    primary: ['#6D28D9', '#8B5CF6'],
    secondary: ['#f093fb', '#f5576c'],
    tertiary: ['#4facfe', '#00f2fe'],
    area: ['rgba(109, 40, 217, 0.4)', 'rgba(139, 92, 246, 0.05)'],
    bar: ['#6D28D9', '#8B5CF6'],
  },
  dark: {
    primary: ['#8B5CF6', '#A78BFA'],
    secondary: ['#f5a8d0', '#f88a9a'],
    tertiary: ['#6eb8fe', '#4ff8fe'],
    area: ['rgba(139, 92, 246, 0.4)', 'rgba(167, 139, 250, 0.05)'],
    bar: ['#8B5CF6', '#A78BFA'],
  },
};

/**
 * Get gradient direction vectors
 */
export const gradientDirections = {
  horizontal: {start: {x: 0, y: 0.5}, end: {x: 1, y: 0.5}},
  vertical: {start: {x: 0.5, y: 0}, end: {x: 0.5, y: 1}},
  diagonal: {start: {x: 0, y: 0}, end: {x: 1, y: 1}},
  diagonalReverse: {start: {x: 1, y: 0}, end: {x: 0, y: 1}},
};
