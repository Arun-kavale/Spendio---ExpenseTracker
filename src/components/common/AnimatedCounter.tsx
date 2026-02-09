/**
 * AnimatedCounter Component
 * 
 * Premium animated number counter with smooth transitions.
 * Used for displaying monetary values and statistics.
 */

import React, {memo, useEffect, useRef} from 'react';
import {Text, TextStyle, StyleSheet, View} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {useTheme, useCurrency} from '@/hooks';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  style?: TextStyle;
  compact?: boolean;
  showSign?: boolean;
  colorize?: boolean;
  animated?: boolean;
}

export const AnimatedCounter = memo<AnimatedCounterProps>(({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  decimals = 0,
  style,
  compact = false,
  showSign = false,
  colorize = false,
  animated = true,
}) => {
  const theme = useTheme();
  const {formatAmount, formatCompact} = useCurrency();
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedValue = useSharedValue(0);
  const prevValue = useRef(0);
  
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    
    // Animate from previous value to new value
    animatedValue.value = prevValue.current;
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    
    // Update display value during animation
    const interval = setInterval(() => {
      // Get approximate current value
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const current = prevValue.current + (value - prevValue.current) * eased;
      setDisplayValue(current);
      
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, 16);
    
    const startTime = Date.now();
    prevValue.current = value;
    
    return () => clearInterval(interval);
  }, [value, animated, duration, animatedValue]);
  
  const getFormattedValue = () => {
    if (compact) {
      return formatCompact(displayValue);
    }
    
    if (decimals > 0) {
      return displayValue.toFixed(decimals);
    }
    
    return Math.round(displayValue).toLocaleString();
  };
  
  const getColor = () => {
    if (!colorize) {
      return undefined;
    }
    
    if (value > 0) {
      return theme.colors.success;
    }
    if (value < 0) {
      return theme.colors.error;
    }
    return theme.colors.textMuted;
  };
  
  const getSign = () => {
    if (!showSign) {
      return '';
    }
    
    if (value > 0) {
      return '+';
    }
    if (value < 0) {
      return '-';
    }
    return '';
  };
  
  return (
    <Text style={[styles.text, {color: getColor()}, style]}>
      {prefix}
      {getSign()}
      {getFormattedValue()}
      {suffix}
    </Text>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';

/**
 * AnimatedAmount - Specifically for currency amounts
 */
interface AnimatedAmountProps {
  amount: number;
  style?: TextStyle;
  compact?: boolean;
  animated?: boolean;
  showSign?: boolean;
  type?: 'expense' | 'income' | 'neutral';
}

export const AnimatedAmount = memo<AnimatedAmountProps>(({
  amount,
  style,
  compact = false,
  animated = true,
  showSign = false,
  type = 'neutral',
}) => {
  const theme = useTheme();
  const {symbol} = useCurrency();
  const [displayAmount, setDisplayAmount] = React.useState(amount);
  const prevAmount = useRef(amount);
  
  useEffect(() => {
    if (!animated) {
      setDisplayAmount(amount);
      return;
    }
    
    const startAmount = prevAmount.current;
    const startTime = Date.now();
    const duration = 800;
    
    const interval = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startAmount + (amount - startAmount) * eased;
      setDisplayAmount(current);
      
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayAmount(amount);
      }
    }, 16);
    
    prevAmount.current = amount;
    
    return () => clearInterval(interval);
  }, [amount, animated]);
  
  const getColor = () => {
    switch (type) {
      case 'expense':
        return theme.colors.expense;
      case 'income':
        return theme.colors.income;
      default:
        return undefined;
    }
  };
  
  const formatValue = () => {
    if (compact) {
      // Compact formatting
      if (displayAmount >= 1000000) {
        return `${(displayAmount / 1000000).toFixed(1)}M`;
      }
      if (displayAmount >= 1000) {
        return `${(displayAmount / 1000).toFixed(1)}K`;
      }
    }
    
    return displayAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  const sign = showSign && type === 'expense' ? '-' : showSign && type === 'income' ? '+' : '';
  
  return (
    <Text style={[styles.amount, {color: getColor()}, style]}>
      {sign}
      {symbol}
      {formatValue()}
    </Text>
  );
});

AnimatedAmount.displayName = 'AnimatedAmount';

/**
 * AnimatedPercentage - For displaying percentages with animation
 */
interface AnimatedPercentageProps {
  value: number;
  style?: TextStyle;
  animated?: boolean;
  colorize?: boolean;
  showArrow?: boolean;
}

export const AnimatedPercentage = memo<AnimatedPercentageProps>(({
  value,
  style,
  animated = true,
  colorize = true,
  showArrow = true,
}) => {
  const theme = useTheme();
  const [displayValue, setDisplayValue] = React.useState(value);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }
    
    const startValue = prevValue.current;
    const startTime = Date.now();
    const duration = 600;
    
    const interval = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;
      setDisplayValue(current);
      
      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, 16);
    
    prevValue.current = value;
    
    return () => clearInterval(interval);
  }, [value, animated]);
  
  const getColor = () => {
    if (!colorize) {
      return undefined;
    }
    
    if (displayValue > 0) {
      return theme.colors.error; // More spending = bad
    }
    if (displayValue < 0) {
      return theme.colors.success; // Less spending = good
    }
    return theme.colors.textMuted;
  };
  
  const arrow = showArrow
    ? displayValue > 0
      ? '↑'
      : displayValue < 0
      ? '↓'
      : ''
    : '';
  
  return (
    <Text style={[styles.percentage, {color: getColor()}, style]}>
      {arrow}
      {Math.abs(displayValue).toFixed(1)}%
    </Text>
  );
});

AnimatedPercentage.displayName = 'AnimatedPercentage';

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
  amount: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  percentage: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default AnimatedCounter;
