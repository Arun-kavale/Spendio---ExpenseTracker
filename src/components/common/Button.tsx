/**
 * Button Component
 * 
 * A customizable button component with multiple variants.
 */

import React, {memo} from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = memo<ButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.96, {damping: 15});
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15});
  };
  
  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: 14,
      iconSize: 16,
    },
    medium: {
      paddingVertical: theme.spacing.md - 4,
      paddingHorizontal: theme.spacing.lg,
      fontSize: 16,
      iconSize: 20,
    },
    large: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      fontSize: 18,
      iconSize: 24,
    },
  };
  
  const getVariantStyles = (): {container: ViewStyle; text: TextStyle; iconColor: string} => {
    const isDisabled = disabled || loading;
    
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? theme.colors.textMuted : theme.colors.primary,
          },
          text: {color: '#FFFFFF'},
          iconColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled
              ? theme.colors.surfaceVariant
              : theme.colors.primaryLight + '20',
          },
          text: {color: isDisabled ? theme.colors.textMuted : theme.colors.primary},
          iconColor: isDisabled ? theme.colors.textMuted : theme.colors.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? theme.colors.textMuted : theme.colors.primary,
          },
          text: {color: isDisabled ? theme.colors.textMuted : theme.colors.primary},
          iconColor: isDisabled ? theme.colors.textMuted : theme.colors.primary,
        };
      case 'ghost':
        return {
          container: {backgroundColor: 'transparent'},
          text: {color: isDisabled ? theme.colors.textMuted : theme.colors.primary},
          iconColor: isDisabled ? theme.colors.textMuted : theme.colors.primary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDisabled ? theme.colors.textMuted : theme.colors.error,
          },
          text: {color: '#FFFFFF'},
          iconColor: '#FFFFFF',
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  const currentSize = sizeStyles[size];
  
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: currentSize.paddingVertical,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderRadius: theme.borderRadius.md,
    ...variantStyles.container,
    ...(fullWidth && {width: '100%'}),
  };
  
  const textStyle: TextStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    ...variantStyles.text,
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.iconColor}
        />
      );
    }
    
    const iconElement = icon && (
      <Icon
        name={icon}
        size={currentSize.iconSize}
        color={variantStyles.iconColor}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );
    
    return (
      <>
        {iconPosition === 'left' && iconElement}
        <Text style={textStyle}>{title}</Text>
        {iconPosition === 'right' && iconElement}
      </>
    );
  };
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[containerStyle, animatedStyle, style]}>
      {renderContent()}
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
