/**
 * PieChart Component
 * 
 * A premium animated donut chart for displaying category breakdown.
 * Features: smooth animations, clickable segments, tooltips, and fintech-grade design.
 */

import React, {memo, useMemo, useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import Svg, {G, Path, Circle} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {useTheme} from '@/hooks';
import {CategoryExpense} from '@/types';
import {useCurrency} from '@/hooks';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PieChartProps {
  data: CategoryExpense[];
  size?: number;
  strokeWidth?: number;
  showCenter?: boolean;
  centerLabel?: string;
  centerValue?: string;
  onSegmentPress?: (segment: CategoryExpense) => void;
  animated?: boolean;
}

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const createArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
};

// Individual animated segment
const AnimatedSegment = memo<{
  segment: {
    categoryId: string;
    categoryColor: string;
    categoryName: string;
    categoryIcon: string;
    startAngle: number;
    endAngle: number;
    total: number;
    percentage: number;
  };
  center: number;
  radius: number;
  strokeWidth: number;
  index: number;
  isSelected: boolean;
  onPress?: () => void;
}>(({segment, center, radius, strokeWidth, index, isSelected, onPress}) => {
  const theme = useTheme();
  const animProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    animProgress.value = withDelay(
      index * 80,
      withTiming(1, {duration: 800, easing: Easing.out(Easing.cubic)})
    );
  }, [index, segment.endAngle]);
  
  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.08 : 1, {damping: 15, stiffness: 200});
  }, [isSelected]);
  
  // Calculate animated angle
  const animatedEndAngle = animProgress.value * (segment.endAngle - segment.startAngle) + segment.startAngle;
  
  // Ensure minimum arc for very small segments
  const minAngle = 3;
  const adjustedEndAngle = Math.max(segment.startAngle + minAngle, animatedEndAngle);
  
  const path = createArc(
    center,
    center,
    radius,
    segment.startAngle,
    adjustedEndAngle
  );
  
  // Calculate segment offset for selection effect
  const midAngle = (segment.startAngle + segment.endAngle) / 2;
  const offsetX = isSelected ? Math.cos((midAngle - 90) * Math.PI / 180) * 4 : 0;
  const offsetY = isSelected ? Math.sin((midAngle - 90) * Math.PI / 180) * 4 : 0;
  
  return (
    <G
      translateX={offsetX}
      translateY={offsetY}
      onPress={onPress}>
      <Path
        d={path}
        stroke={segment.categoryColor}
        strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
        strokeLinecap="round"
        fill="none"
        opacity={isSelected ? 1 : 0.9}
      />
    </G>
  );
});

export const PieChart = memo<PieChartProps>(({
  data,
  size = 200,
  strokeWidth = 24,
  showCenter = true,
  centerLabel,
  centerValue,
  onSegmentPress,
  animated = true,
}) => {
  const theme = useTheme();
  const {formatCompact, formatAmount} = useCurrency();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const centerScale = useSharedValue(0);
  
  useEffect(() => {
    centerScale.value = withSpring(1, {damping: 12, stiffness: 120});
  }, [data]);
  
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [];
    }
    
    const total = data.reduce((sum, d) => sum + d.total, 0);
    let currentAngle = 0;
    const gap = data.length > 1 ? 2 : 0; // Gap between segments
    
    return data.map((item, index) => {
      const rawAngle = (item.total / total) * 360;
      const angle = rawAngle - gap;
      const startAngle = currentAngle + (index > 0 ? gap / 2 : 0);
      const endAngle = startAngle + angle;
      currentAngle = endAngle + gap / 2;
      
      return {
        ...item,
        startAngle,
        endAngle: Math.min(endAngle, 359), // Prevent full circle overlap
        angle,
      };
    });
  }, [data]);
  
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  const handleSegmentPress = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
    if (onSegmentPress && chartData[index]) {
      onSegmentPress(chartData[index]);
    }
  }, [onSegmentPress, chartData]);
  
  const centerAnimStyle = useAnimatedStyle(() => ({
    transform: [{scale: centerScale.value}],
    opacity: centerScale.value,
  }));
  
  const selectedSegment = selectedIndex !== null ? chartData[selectedIndex] : null;
  const total = data.reduce((sum, d) => sum + d.total, 0);
  
  if (data.length === 0) {
    return (
      <View style={[styles.container, {width: size, height: size}]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            strokeDasharray="8,8"
            fill="none"
            opacity={0.5}
          />
        </Svg>
        {showCenter && (
          <View style={styles.centerContainer}>
            <Icon name="chart-pie" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyLabel, {color: theme.colors.textMuted}]}>
              No expenses
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        <G>
          {/* Background circle for depth */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={strokeWidth - 4}
            fill="none"
            opacity={0.3}
          />
          
          {/* Segments */}
          {chartData.map((segment, index) => (
            <AnimatedSegment
              key={segment.categoryId}
              segment={segment}
              center={center}
              radius={radius}
              strokeWidth={strokeWidth}
              index={index}
              isSelected={selectedIndex === index}
              onPress={() => handleSegmentPress(index)}
            />
          ))}
        </G>
      </Svg>
      
      {showCenter && (
        <Animated.View style={[styles.centerContainer, centerAnimStyle]}>
          {selectedSegment ? (
            // Show selected category info
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.selectedInfo}>
              <View
                style={[
                  styles.selectedIcon,
                  {backgroundColor: selectedSegment.categoryColor + '20'},
                ]}>
                <Icon
                  name={selectedSegment.categoryIcon}
                  size={18}
                  color={selectedSegment.categoryColor}
                />
              </View>
              <Text
                style={[styles.selectedName, {color: theme.colors.text}]}
                numberOfLines={1}>
                {selectedSegment.categoryName}
              </Text>
              <Text style={[styles.selectedValue, {color: theme.colors.text}]}>
                {formatCompact(selectedSegment.total)}
              </Text>
              <Text style={[styles.selectedPercent, {color: selectedSegment.categoryColor}]}>
                {selectedSegment.percentage.toFixed(1)}%
              </Text>
            </Animated.View>
          ) : (
            // Show total
            <>
              <Text style={[styles.centerLabel, {color: theme.colors.textSecondary}]}>
                {centerLabel || 'Total'}
              </Text>
              <Text style={[styles.centerValue, {color: theme.colors.text}]}>
                {centerValue || formatCompact(total)}
              </Text>
              <Text style={[styles.centerCount, {color: theme.colors.textMuted}]}>
                {data.length} {data.length === 1 ? 'category' : 'categories'}
              </Text>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
});

PieChart.displayName = 'PieChart';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  centerCount: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  selectedInfo: {
    alignItems: 'center',
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default PieChart;
