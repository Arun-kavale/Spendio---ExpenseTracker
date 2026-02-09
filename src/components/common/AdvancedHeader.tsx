/**
 * AdvancedHeader Component
 * 
 * Premium fintech-grade header with gradient background, blur effects,
 * and professional styling. Used across all screens for consistency.
 */

import React, {memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {useSettingsStore} from '@/store';
import {SpendioLogo} from '@/assets';

type HeaderVariant = 'default' | 'gradient' | 'transparent' | 'elevated';

interface HeaderAction {
  icon: string;
  onPress: () => void;
  badge?: number;
  color?: string;
}

interface AdvancedHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  variant?: HeaderVariant;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  showLogo?: boolean;
  showProfile?: boolean;
  large?: boolean;
  scrollOffset?: Animated.SharedValue<number>;
  children?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ProfileAvatar = memo<{size?: number}>(({size = 36}) => {
  const theme = useTheme();
  const {settings} = useSettingsStore();
  
  const initials = settings.googleUserName
    ? settings.googleUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primary,
        },
      ]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.4}]}>
        {initials}
      </Text>
    </View>
  );
});

const HeaderButton = memo<{
  icon: string;
  onPress: () => void;
  badge?: number;
  color?: string;
  size?: number;
}>(({icon, onPress, badge, color, size = 24}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, {damping: 15, stiffness: 300});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {damping: 15, stiffness: 300});
      }}
      style={[styles.headerButton, animatedStyle]}
      hitSlop={8}>
      <Icon name={icon} size={size} color={color || theme.colors.text} />
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, {backgroundColor: theme.colors.error}]}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

export const AdvancedHeader = memo<AdvancedHeaderProps>(({
  title,
  subtitle,
  showBack,
  onBack,
  variant = 'default',
  leftAction,
  rightActions,
  showLogo,
  showProfile,
  large,
  scrollOffset,
  children,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animated header for scroll effects
  const headerStyle = useAnimatedStyle(() => {
    if (!scrollOffset) {
      return {};
    }
    
    const opacity = interpolate(
      scrollOffset.value,
      [0, 50],
      [0, 1],
      Extrapolation.CLAMP,
    );
    
    const translateY = interpolate(
      scrollOffset.value,
      [0, 50],
      [-10, 0],
      Extrapolation.CLAMP,
    );
    
    return {
      opacity,
      transform: [{translateY}],
    };
  });
  
  const getBackgroundStyle = (): ViewStyle => {
    switch (variant) {
      case 'gradient':
        return {backgroundColor: 'transparent'};
      case 'transparent':
        return {backgroundColor: 'transparent'};
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.shadow,
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 1,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        };
      default:
        return {backgroundColor: theme.colors.background};
    }
  };
  
  const gradientStartColor = theme.mode === 'dark'
    ? theme.colors.primary + '30'
    : theme.colors.primary + '15';
  const gradientEndColor = theme.colors.background;
  
  const renderGradientBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="headerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientStartColor} />
            <Stop offset="1" stopColor={gradientEndColor} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerGradient)" />
      </Svg>
    </View>
  );
  
  const renderContent = () => (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={[styles.content, large && styles.contentLarge]}>
        {/* Left Side */}
        <View style={styles.leftSection}>
          {showBack && (
            <HeaderButton icon="arrow-left" onPress={onBack || (() => {})} />
          )}
          {leftAction && !showBack && (
            <HeaderButton {...leftAction} />
          )}
          {showLogo && !showBack && !leftAction && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.logoContainer}>
              <Image
                source={SpendioLogo}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="Spendio"
              />
            </Animated.View>
          )}
        </View>
        
        {/* Center - Title */}
        {title && !large && (
          <View style={styles.centerSection}>
            <Text
              style={[styles.title, {color: theme.colors.text}]}
              numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, {color: theme.colors.textSecondary}]}
                numberOfLines={1}>
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
          {showProfile && <ProfileAvatar />}
        </View>
      </View>
      
      {/* Large Title */}
      {title && large && (
        <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.largeTitleContainer}>
          <Text style={[styles.largeTitle, {color: theme.colors.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.largeSubtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </Animated.View>
      )}
      
      {/* Custom Content */}
      {children}
    </View>
  );
  
  if (variant === 'gradient') {
    return (
      <Animated.View style={[styles.wrapper, getBackgroundStyle(), headerStyle]}>
        {renderGradientBackground()}
        {renderContent()}
      </Animated.View>
    );
  }
  
  return (
    <Animated.View style={[styles.wrapper, getBackgroundStyle(), headerStyle]}>
      {renderContent()}
    </Animated.View>
  );
});

AdvancedHeader.displayName = 'AdvancedHeader';

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  contentLarge: {
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
    textAlign: 'center',
  },
  largeTitleContainer: {
    paddingTop: 8,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  largeSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    height: 28,
    width: 100,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AdvancedHeader;
