/**
 * Card Component
 * 
 * A reusable card component with shadow, theming, and glassmorphism support.
 * Premium fintech-grade design with smooth animations.
 */

import React, {memo} from 'react';
import {View, StyleSheet, ViewStyle, Pressable, Platform} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {useTheme} from '@/hooks';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass' | 'gradient';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  animated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card = memo<CardProps>(({
  children,
  style,
  onPress,
  padding = 'medium',
  variant = 'elevated',
  elevation = 'low',
  animated = true,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  
  const paddingValue = {
    none: 0,
    small: theme.spacing.sm,
    medium: theme.spacing.md,
    large: theme.spacing.lg,
  }[padding];
  
  // Lighter shadows for light mode, more visible for dark mode
  const isLightMode = theme.mode === 'light';
  const shadowConfig = {
    none: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: {width: 0, height: 0},
      elevation: 0,
    },
    low: {
      shadowOpacity: isLightMode ? 0.04 : 0.25,
      shadowRadius: isLightMode ? 4 : 8,
      shadowOffset: {width: 0, height: isLightMode ? 1 : 2},
      elevation: isLightMode ? 1 : 3,
    },
    medium: {
      shadowOpacity: isLightMode ? 0.06 : 0.3,
      shadowRadius: isLightMode ? 8 : 12,
      shadowOffset: {width: 0, height: isLightMode ? 2 : 4},
      elevation: isLightMode ? 2 : 6,
    },
    high: {
      shadowOpacity: isLightMode ? 0.08 : 0.35,
      shadowRadius: isLightMode ? 12 : 20,
      shadowOffset: {width: 0, height: isLightMode ? 4 : 8},
      elevation: isLightMode ? 4 : 12,
    },
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) {
      return {};
    }
    return {
      transform: [
        {scale: scale.value},
        {
          translateY: interpolate(
            pressed.value,
            [0, 1],
            [0, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });
  
  const handlePressIn = () => {
    if (onPress && animated) {
      scale.value = withSpring(0.98, {damping: 15, stiffness: 400});
      pressed.value = withSpring(1, {damping: 15, stiffness: 400});
    }
  };
  
  const handlePressOut = () => {
    if (animated) {
      scale.value = withSpring(1, {damping: 15, stiffness: 400});
      pressed.value = withSpring(0, {damping: 15, stiffness: 400});
    }
  };
  
  const getVariantStyles = (): ViewStyle => {
    const shadowProps = shadowConfig[elevation];
    
    // Platform-specific shadow styles
    const platformShadow: ViewStyle = Platform.OS === 'ios'
      ? {
          shadowColor: theme.colors.shadow,
          shadowOffset: shadowProps.shadowOffset,
          shadowOpacity: shadowProps.shadowOpacity,
          shadowRadius: shadowProps.shadowRadius,
        }
      : {elevation: shadowProps.elevation};
    
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: theme.colors.glass,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          ...platformShadow,
        };
      case 'gradient':
        return {
          backgroundColor: theme.colors.glassBackground,
          borderWidth: 1,
          borderColor: theme.colors.glassBorder,
          overflow: 'hidden',
          ...platformShadow,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          ...platformShadow,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceVariant,
        };
      default:
        return {
          backgroundColor: theme.colors.card,
        };
    }
  };
  
  const cardStyle: ViewStyle = {
    borderRadius: theme.borderRadius.lg,
    padding: paddingValue,
    ...getVariantStyles(),
  };
  
  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle, style]}>
        {children}
      </AnimatedPressable>
    );
  }
  
  return (
    <Animated.View style={[cardStyle, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
});

Card.displayName = 'Card';

const styles = StyleSheet.create({});

export default Card;
