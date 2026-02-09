/**
 * GradientCard Component
 * 
 * Card with gradient border or background accent.
 * Uses the primary gradient: #00FF87 → #60EFFF
 */

import React, {memo} from 'react';
import {View, StyleSheet, ViewStyle, Platform} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useTheme} from '@/hooks';

type CardVariant = 'border' | 'accent' | 'filled' | 'subtle';

interface GradientCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const paddingValues = {
  none: 0,
  small: 12,
  medium: 16,
  large: 24,
};

export const GradientCard = memo<GradientCardProps>(({
  children,
  variant = 'border',
  style,
  padding = 'medium',
}) => {
  const theme = useTheme();
  
  const gradientColors = [theme.colors.gradientStart, theme.colors.gradientEnd];
  const paddingValue = paddingValues[padding];
  
  if (variant === 'filled') {
    return (
      <View style={[styles.card, styles.filledCard, style]}>
        {/* Full gradient background */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="cardGradient" x1="0" y1="0" x2="1" y2="0.5">
              <Stop offset="0" stopColor={gradientColors[0]} />
              <Stop offset="1" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={16} fill="url(#cardGradient)" />
        </Svg>
        
        <View style={{padding: paddingValue}}>{children}</View>
      </View>
    );
  }
  
  if (variant === 'subtle') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            padding: paddingValue,
            ...Platform.select({
              ios: {
                shadowColor: gradientColors[0],
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.15,
                shadowRadius: 12,
              },
              android: {
                elevation: 4,
              },
            }),
          },
          style,
        ]}>
        {/* Subtle gradient overlay at top */}
        <View style={styles.subtleAccent}>
          <Svg width="100%" height={4}>
            <Defs>
              <LinearGradient id="subtleGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={gradientColors[0]} />
                <Stop offset="1" stopColor={gradientColors[1]} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="4" fill="url(#subtleGrad)" />
          </Svg>
        </View>
        
        {children}
      </View>
    );
  }
  
  if (variant === 'accent') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            padding: paddingValue,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.shadow,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 1,
                shadowRadius: 12,
              },
              android: {
                elevation: 4,
              },
            }),
          },
          style,
        ]}>
        {/* Left accent strip */}
        <View style={styles.accentStrip}>
          <Svg width={4} height="100%">
            <Defs>
              <LinearGradient id="stripGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradientColors[0]} />
                <Stop offset="1" stopColor={gradientColors[1]} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="4" height="100%" fill="url(#stripGrad)" />
          </Svg>
        </View>
        
        {children}
      </View>
    );
  }
  
  // Default: border variant
  return (
    <View style={[styles.borderCardOuter, style]}>
      {/* Gradient border using outer container */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="1" stopColor={gradientColors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={16} fill="url(#borderGrad)" />
      </Svg>
      
      {/* Inner card with slight inset for border effect */}
      <View
        style={[
          styles.borderCardInner,
          {backgroundColor: theme.colors.card, padding: paddingValue},
        ]}>
        {children}
      </View>
    </View>
  );
});

GradientCard.displayName = 'GradientCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  filledCard: {
    position: 'relative',
  },
  subtleAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  borderCardOuter: {
    borderRadius: 16,
    padding: 2,
    overflow: 'hidden',
  },
  borderCardInner: {
    borderRadius: 14,
    overflow: 'hidden',
  },
});

export default GradientCard;
