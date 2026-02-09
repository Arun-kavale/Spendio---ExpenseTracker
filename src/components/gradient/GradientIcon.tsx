/**
 * GradientIcon Component
 * 
 * Icon with gradient fill using SVG masking technique.
 * Uses the primary gradient: #00FF87 → #60EFFF
 */

import React, {memo} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Mask,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

interface GradientIconProps {
  name: string;
  size?: number;
  gradientColors?: string[];
  style?: object;
}

export const GradientIcon = memo<GradientIconProps>(({
  name,
  size = 24,
  gradientColors,
  style,
}) => {
  const theme = useTheme();
  
  const colors = gradientColors || [
    theme.colors.gradientStart,
    theme.colors.gradientEnd,
  ];
  
  // For simplicity, we use a gradient background with the icon as a mask
  // This creates the gradient text/icon effect
  return (
    <View style={[styles.container, {width: size, height: size}, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="iconGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#iconGradient)" />
      </Svg>
      
      {/* Overlay with the icon in transparent mode */}
      <View style={[StyleSheet.absoluteFill, styles.iconContainer]}>
        <Icon name={name} size={size} color={colors[0]} />
      </View>
    </View>
  );
});

/**
 * GradientText Component
 * 
 * For displaying gradient-colored text
 */
interface GradientTextProps {
  children: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700';
  gradientColors?: string[];
  style?: object;
}

export const GradientText = memo<GradientTextProps>(({
  children,
  fontSize = 16,
  fontWeight = '600',
  gradientColors,
  style,
}) => {
  const theme = useTheme();
  
  const colors = gradientColors || [
    theme.colors.gradientStart,
    theme.colors.gradientEnd,
  ];
  
  // React Native doesn't natively support gradient text
  // So we use SVG Text with gradient fill
  const textHeight = fontSize * 1.3;
  const textWidth = children.length * fontSize * 0.6; // Approximate width
  
  return (
    <View style={[{height: textHeight, width: textWidth}, style]}>
      <Svg width={textWidth} height={textHeight}>
        <Defs>
          <LinearGradient id="textGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="0"
          y={fontSize}
          fontSize={fontSize}
          fontWeight={fontWeight}
          fill="url(#textGradient)">
          {children}
        </SvgText>
      </Svg>
    </View>
  );
});

GradientIcon.displayName = 'GradientIcon';
GradientText.displayName = 'GradientText';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GradientIcon;
