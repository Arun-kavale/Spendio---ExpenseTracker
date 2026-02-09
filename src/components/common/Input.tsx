/**
 * Input Component
 * 
 * A styled text input component with label and error support.
 */

import React, {memo, useState, forwardRef} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const Input = memo(
  forwardRef<TextInput, InputProps>(
    (
      {
        label,
        error,
        hint,
        leftIcon,
        rightIcon,
        onRightIconPress,
        containerStyle,
        ...textInputProps
      },
      ref
    ) => {
      const theme = useTheme();
      const [isFocused, setIsFocused] = useState(false);
      const focusAnim = useSharedValue(0);
      
      const handleFocus = () => {
        setIsFocused(true);
        focusAnim.value = withTiming(1, {duration: 200});
      };
      
      const handleBlur = () => {
        setIsFocused(false);
        focusAnim.value = withTiming(0, {duration: 200});
      };
      
      const animatedInputStyle = useAnimatedStyle(() => {
        const borderColor = error
          ? theme.colors.error
          : interpolateColor(
              focusAnim.value,
              [0, 1],
              [theme.colors.border, theme.colors.primary]
            );
        
        return {
          borderColor,
          borderWidth: focusAnim.value > 0.5 ? 2 : 1,
        };
      });
      
      const inputContainerStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        minHeight: 52,
      };
      
      return (
        <View style={[styles.container, containerStyle]}>
          {label && (
            <Text
              style={[
                styles.label,
                {
                  color: error
                    ? theme.colors.error
                    : isFocused
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                  marginBottom: theme.spacing.xs,
                },
              ]}>
              {label}
            </Text>
          )}
          
          <Animated.View style={[inputContainerStyle, animatedInputStyle]}>
            {leftIcon && (
              <Icon
                name={leftIcon}
                size={20}
                color={theme.colors.textMuted}
                style={styles.leftIcon}
              />
            )}
            
            <AnimatedTextInput
              ref={ref}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  flex: 1,
                },
              ]}
              placeholderTextColor={theme.colors.textMuted}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...textInputProps}
            />
            
            {rightIcon && (
              <Pressable onPress={onRightIconPress} hitSlop={8}>
                <Icon
                  name={rightIcon}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </Pressable>
            )}
          </Animated.View>
          
          {(error || hint) && (
            <Text
              style={[
                styles.helperText,
                {
                  color: error ? theme.colors.error : theme.colors.textMuted,
                  marginTop: theme.spacing.xs,
                },
              ]}>
              {error || hint}
            </Text>
          )}
        </View>
      );
    }
  )
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 12,
  },
  helperText: {
    fontSize: 12,
  },
});

export default Input;
