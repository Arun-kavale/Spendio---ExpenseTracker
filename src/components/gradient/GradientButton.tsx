/**
 * GradientButton Component
 * 
 * Premium gradient button with animations and haptic feedback.
 * Uses the primary gradient: purple–violet (Spendio theme)
 */

import React, {memo, useCallback, useId, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Vibration,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  iconPosition?: 'left' | 'right';
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const sizeConfig = {
  small: {
    height: 44,
    paddingHorizontal: 20,
    fontSize: 14,
    iconSize: 18,
    borderRadius: 12,
  },
  medium: {
    height: 54,
    paddingHorizontal: 28,
    fontSize: 16,
    iconSize: 20,
    borderRadius: 14,
  },
  large: {
    height: 60,
    paddingHorizontal: 32,
    fontSize: 17,
    iconSize: 22,
    borderRadius: 16,
  },
};

// Generate unique ID for each button instance
let buttonIdCounter = 0;
const generateUniqueId = () => `grad_btn_${++buttonIdCounter}`;

export const GradientButton = memo<GradientButtonProps>(({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  size = 'medium',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const config = sizeConfig[size];
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const [gradientId] = useState(() => generateUniqueId());
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, {damping: 15, stiffness: 400});
    }
  }, [disabled, loading, scale]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {damping: 15, stiffness: 400});
  }, [scale]);
  
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      if (Platform.OS === 'android') {
        Vibration.vibrate(10);
      }
      onPress();
    }
  }, [disabled, loading, onPress]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setDimensions({width, height});
  }, []);
  
  const getGradientColors = () => {
    if (disabled) {
      return [theme.colors.textMuted, theme.colors.textMuted];
    }
    
    switch (variant) {
      case 'primary':
        return [theme.colors.gradientStart, theme.colors.gradientEnd];
      case 'secondary':
        return ['#f5576c', '#f093fb'];
      case 'success':
        return ['#11998e', '#38ef7d'];
      default:
        return [theme.colors.gradientStart, theme.colors.gradientEnd];
    }
  };
  
  const colors = getGradientColors();
  
  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: config.borderRadius,
            borderWidth: 2,
            borderColor: theme.colors.gradientStart,
            backgroundColor: 'transparent',
          },
          fullWidth && styles.fullWidth,
          animatedStyle,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.gradientStart} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Icon
                name={icon}
                size={config.iconSize}
                color={theme.colors.gradientStart}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                {fontSize: config.fontSize, color: theme.colors.gradientStart},
                textStyle,
              ]}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Icon
                name={icon}
                size={config.iconSize}
                color={theme.colors.gradientStart}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </AnimatedPressable>
    );
  }
  
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={handleLayout}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.borderRadius,
          opacity: disabled ? 0.6 : 1,
          ...Platform.select({
            ios: {
              shadowColor: colors[0],
              shadowOffset: {width: 0, height: 6},
              shadowOpacity: disabled ? 0 : 0.4,
              shadowRadius: 12,
            },
            android: {
              elevation: disabled ? 0 : 10,
            },
          }),
        },
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}>
      {/* Gradient Background - Full coverage */}
      <View style={[StyleSheet.absoluteFill, styles.gradientContainer]}>
        <Svg 
          width={dimensions.width || '100%'} 
          height={dimensions.height || config.height}
          style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={dimensions.width || '100%'}
            height={dimensions.height || config.height}
            rx={config.borderRadius}
            ry={config.borderRadius}
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </View>
      
      {/* Content Layer */}
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Icon
                name={icon}
                size={config.iconSize}
                color="#FFFFFF"
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                {fontSize: config.fontSize},
                textStyle,
              ]}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Icon
                name={icon}
                size={config.iconSize}
                color="#FFFFFF"
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
});

GradientButton.displayName = 'GradientButton';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  gradientContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
});

export default GradientButton;
