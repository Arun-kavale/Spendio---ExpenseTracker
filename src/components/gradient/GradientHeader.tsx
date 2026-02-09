/**
 * GradientHeader Component
 * 
 * Premium gradient header with the primary gradient: #00FF87 → #60EFFF
 * Includes safe area support, animations, and flexible content.
 */

import React, {memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeaderAction {
  icon: string;
  onPress: () => void;
  badge?: number;
}

export interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  large?: boolean;
  children?: React.ReactNode;
  height?: number;
}

const HeaderButton = memo<{
  icon: string;
  onPress: () => void;
  badge?: number;
}>(({icon, onPress, badge}) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, {damping: 15, stiffness: 400});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {damping: 15, stiffness: 400});
      }}
      style={[styles.headerButton, animatedStyle]}
      hitSlop={8}>
      <Icon name={icon} size={24} color="#FFFFFF" />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

export const GradientHeader = memo<GradientHeaderProps>(({
  title,
  subtitle,
  showBack,
  onBack,
  leftAction,
  rightActions,
  large,
  children,
  height,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const gradientColors = theme.mode === 'dark'
    ? [theme.colors.gradientStart, theme.colors.gradientEnd]
    : [theme.colors.gradientStart, theme.colors.gradientEnd];
  
  const headerHeight = height || (large ? 180 : 110);
  
  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <Svg width="100%" height={headerHeight + insets.top} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="0.5">
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="1" stopColor={gradientColors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerGradient)" />
      </Svg>
      
      {/* Header Content */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
        {/* Top Row */}
        <View style={styles.topRow}>
          {/* Left Side */}
          <View style={styles.leftSection}>
            {showBack && (
              <HeaderButton icon="arrow-left" onPress={onBack || (() => {})} />
            )}
            {leftAction && !showBack && (
              <HeaderButton {...leftAction} />
            )}
          </View>
          
          {/* Center Title (for non-large headers) */}
          {title && !large && (
            <View style={styles.centerSection}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
          
          {/* Right Side */}
          <View style={styles.rightSection}>
            {rightActions?.map((action, index) => (
              <HeaderButton key={index} {...action} />
            ))}
          </View>
        </View>
        
        {/* Large Title */}
        {title && large && (
          <View style={styles.largeTitleContainer}>
            <Text style={styles.largeTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.largeSubtitle}>{subtitle}</Text>
            )}
          </View>
        )}
        
        {/* Custom Children */}
        {children}
      </Animated.View>
      
      {/* Bottom curve effect */}
      <View style={styles.curveContainer}>
        <View style={[styles.curve, {backgroundColor: theme.colors.background}]} />
      </View>
    </View>
  );
});

GradientHeader.displayName = 'GradientHeader';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginTop: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 48,
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  largeTitleContainer: {
    marginTop: 16,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  largeSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  curveContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
    overflow: 'hidden',
  },
  curve: {
    height: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default GradientHeader;
