/**
 * Skeleton Component
 * 
 * Animated skeleton loaders for premium loading states.
 * Provides visual feedback during data loading.
 */

import React, {memo, useEffect} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {useTheme} from '@/hooks';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = memo<SkeletonProps>(({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useTheme();
  const shimmer = useSharedValue(0);
  
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {duration: 1500, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [shimmer]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));
  
  return (
    <Animated.View
      style={[
        {
          width: typeof width === 'number' ? width : undefined,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
        },
        typeof width === 'string' && {width},
        animatedStyle,
        style,
      ]}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Preset skeleton components for common use cases

interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard = memo<SkeletonCardProps>(({style}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}>
      <View style={styles.cardRow}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardContent}>
          <Skeleton width="60%" height={16} style={styles.mb8} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={80} height={20} />
      </View>
    </View>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonExpenseCard = memo<SkeletonCardProps>(({style}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        styles.expenseCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}>
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={styles.expenseContent}>
        <Skeleton width="50%" height={14} style={styles.mb6} />
        <Skeleton width="30%" height={12} />
      </View>
      <View style={styles.expenseRight}>
        <Skeleton width={70} height={16} style={styles.mb6} />
        <Skeleton width={50} height={10} />
      </View>
    </View>
  );
});

SkeletonExpenseCard.displayName = 'SkeletonExpenseCard';

export const SkeletonChart = memo<{height?: number; style?: ViewStyle}>(({
  height = 200,
  style,
}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        styles.chartContainer,
        {
          height,
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}>
      <Skeleton width="40%" height={16} style={styles.mb16} />
      <View style={styles.chartBars}>
        {[0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3].map((h, i) => (
          <Skeleton
            key={i}
            width={24}
            height={h * (height - 80)}
            borderRadius={4}
          />
        ))}
      </View>
    </View>
  );
});

SkeletonChart.displayName = 'SkeletonChart';

export const SkeletonStatCard = memo<SkeletonCardProps>(({style}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}>
      <Skeleton width={36} height={36} borderRadius={10} style={styles.mb12} />
      <Skeleton width="60%" height={12} style={styles.mb8} />
      <Skeleton width="80%" height={20} />
    </View>
  );
});

SkeletonStatCard.displayName = 'SkeletonStatCard';

// Dashboard skeleton
export const SkeletonDashboard = memo(() => {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Skeleton width={80} height={14} style={styles.mb8} />
          <Skeleton width={150} height={24} />
        </View>
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
      
      {/* Total card */}
      <View style={styles.totalCard}>
        <Skeleton width="50%" height={14} style={styles.mb12} />
        <Skeleton width="70%" height={36} style={styles.mb12} />
        <Skeleton width="40%" height={20} borderRadius={12} />
      </View>
      
      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <SkeletonStatCard style={styles.statCardHalf} />
        <SkeletonStatCard style={styles.statCardHalf} />
      </View>
      
      {/* Chart */}
      <SkeletonChart height={200} style={styles.chartCard} />
    </View>
  );
});

SkeletonDashboard.displayName = 'SkeletonDashboard';

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  expenseContent: {
    flex: 1,
    marginLeft: 12,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  chartContainer: {
    padding: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
    paddingHorizontal: 16,
  },
  statCard: {
    padding: 16,
  },
  dashboard: {
    padding: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalCard: {
    padding: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCardHalf: {
    flex: 1,
  },
  chartCard: {
    marginBottom: 16,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
});

export default Skeleton;
