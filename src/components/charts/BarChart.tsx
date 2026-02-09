/**
 * BarChart Component
 * 
 * A premium animated bar chart for displaying daily spending patterns.
 * Features: smooth animations, gradient bars, tooltips, and fintech-grade design.
 */

import React, {memo, useMemo, useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Dimensions, Pressable} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import {useTheme, useCurrency} from '@/hooks';
import {DailyExpense} from '@/types';
import {format, parseISO, isWeekend as checkIsWeekend, isToday} from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface BarChartProps {
  data: DailyExpense[];
  height?: number;
  barWidth?: number;
  showLabels?: boolean;
  maxBars?: number;
  showTooltip?: boolean;
  animated?: boolean;
  colorScheme?: 'primary' | 'gradient' | 'category';
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface AnimatedBarProps {
  height: number;
  maxHeight: number;
  color: string;
  gradientId?: string;
  width: number;
  delay: number;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
}

const AnimatedBar = memo<AnimatedBarProps>(({
  height,
  maxHeight,
  color,
  gradientId,
  width,
  delay,
  isSelected,
  isToday: isTodayBar,
  onPress,
}) => {
  const theme = useTheme();
  const animatedHeight = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    animatedHeight.value = withDelay(
      delay,
      withSpring(height, {damping: 14, stiffness: 90})
    );
  }, [height, delay]);
  
  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.1 : 1, {damping: 12, stiffness: 150});
  }, [isSelected]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    transform: [{scaleX: scale.value}],
  }));
  
  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.bar,
          {
            width,
            backgroundColor: color,
            borderTopLeftRadius: width / 3,
            borderTopRightRadius: width / 3,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          },
          isSelected && {
            shadowColor: color,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          },
          animatedStyle,
        ]}>
        {/* Today indicator */}
        {isTodayBar && (
          <View
            style={[
              styles.todayIndicator,
              {backgroundColor: theme.colors.warning},
            ]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
});

export const BarChart = memo<BarChartProps>(({
  data,
  height = 180,
  barWidth,
  showLabels = true,
  maxBars = 14,
  showTooltip = true,
  animated = true,
  colorScheme = 'gradient',
}) => {
  const theme = useTheme();
  const {formatCompact} = useCurrency();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const chartData = useMemo(() => {
    // Take last N days
    const limitedData = data.slice(-maxBars);
    const values = limitedData.map(d => d.total);
    const maxValue = Math.max(...values, 1);
    const average = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const total = values.reduce((a, b) => a + b, 0);
    
    return {
      bars: limitedData,
      maxValue,
      average,
      total,
    };
  }, [data, maxBars]);
  
  const availableWidth = SCREEN_WIDTH - 80;
  const barCount = chartData.bars.length || 1;
  const gap = 6;
  const calculatedBarWidth = barWidth || Math.min(20, (availableWidth - (barCount - 1) * gap) / barCount);
  const chartHeight = height - (showLabels ? 36 : 12);
  
  const getBarColor = useCallback((value: number, index: number) => {
    if (colorScheme === 'category') {
      // Color intensity based on value using primary gradient
      const intensity = Math.min(value / chartData.maxValue, 1);
      // Interpolate between gradient colors
      return intensity > 0.5 ? theme.colors.gradientEnd : theme.colors.gradientStart;
    }
    if (colorScheme === 'gradient') {
      // Use gradient colors based on spending level
      const ratio = value / chartData.maxValue;
      if (ratio > 0.7) {
        return theme.colors.gradientEnd; // High spending - cyan
      }
      if (ratio > 0.3) {
        return theme.colors.gradientStart; // Medium - mint
      }
      return theme.colors.gradientStart + '80'; // Low - semi-transparent mint
    }
    return theme.colors.gradientStart;
  }, [colorScheme, chartData.maxValue, theme.colors]);
  
  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  }, []);
  
  const selectedBar = selectedIndex !== null ? chartData.bars[selectedIndex] : null;
  
  if (data.length === 0) {
    return (
      <View style={[styles.container, {height}]}>
        <View style={styles.emptyContainer}>
          <Icon name="chart-bar" size={40} color={theme.colors.textMuted} />
          <Text style={[styles.emptyText, {color: theme.colors.textMuted}]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, {height: height + (showTooltip ? 50 : 0)}]}>
      {/* Tooltip */}
      {showTooltip && selectedBar && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltip,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <Text style={[styles.tooltipDate, {color: theme.colors.textSecondary}]}>
            {format(parseISO(selectedBar.date), 'EEE, MMM d')}
          </Text>
          <Text style={[styles.tooltipValue, {color: theme.colors.text}]}>
            {formatCompact(selectedBar.total)}
          </Text>
          <View style={styles.tooltipComparison}>
            {selectedBar.total > chartData.average ? (
              <>
                <Icon name="arrow-up" size={12} color={theme.colors.error} />
                <Text style={[styles.tooltipCompText, {color: theme.colors.error}]}>
                  {((selectedBar.total / chartData.average - 1) * 100).toFixed(0)}% above avg
                </Text>
              </>
            ) : (
              <>
                <Icon name="arrow-down" size={12} color={theme.colors.success} />
                <Text style={[styles.tooltipCompText, {color: theme.colors.success}]}>
                  {((1 - selectedBar.total / chartData.average) * 100).toFixed(0)}% below avg
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      )}
      
      {/* Average line */}
      <View
        style={[
          styles.averageLine,
          {
            bottom: (showLabels ? 36 : 12) + (chartData.average / chartData.maxValue) * chartHeight,
            backgroundColor: theme.colors.warning,
          },
        ]}>
        <Text style={[styles.averageLabel, {color: theme.colors.warning}]}>
          avg
        </Text>
      </View>
      
      <View style={styles.chartContainer}>
        {chartData.bars.map((bar, index) => {
          const barHeight = Math.max((bar.total / chartData.maxValue) * chartHeight, 4);
          const dateObj = parseISO(bar.date);
          const dayLabel = format(dateObj, 'd');
          const isWeekendDay = checkIsWeekend(dateObj);
          const isTodayBar = isToday(dateObj);
          const color = bar.total > 0 ? getBarColor(bar.total, index) : theme.colors.border;
          
          return (
            <View key={bar.date} style={[styles.barContainer, {marginHorizontal: gap / 2}]}>
              <View style={[styles.barWrapper, {height: chartHeight}]}>
                <AnimatedBar
                  height={barHeight}
                  maxHeight={chartHeight}
                  color={color}
                  width={calculatedBarWidth}
                  delay={animated ? index * 25 : 0}
                  isSelected={selectedIndex === index}
                  isToday={isTodayBar}
                  onPress={() => handleBarPress(index)}
                />
              </View>
              
              {showLabels && (
                <Text
                  style={[
                    styles.label,
                    {
                      color: isTodayBar
                        ? theme.colors.primary
                        : isWeekendDay
                        ? theme.colors.error
                        : theme.colors.textMuted,
                      fontWeight: isTodayBar ? '700' : '400',
                      width: calculatedBarWidth + gap,
                    },
                  ]}>
                  {dayLabel}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      
      {/* Summary stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: theme.colors.textMuted}]}>
            Total
          </Text>
          <Text style={[styles.summaryValue, {color: theme.colors.text}]}>
            {formatCompact(chartData.total)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, {backgroundColor: theme.colors.border}]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: theme.colors.textMuted}]}>
            Daily Avg
          </Text>
          <Text style={[styles.summaryValue, {color: theme.colors.text}]}>
            {formatCompact(chartData.average)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, {backgroundColor: theme.colors.border}]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: theme.colors.textMuted}]}>
            Peak
          </Text>
          <Text style={[styles.summaryValue, {color: theme.colors.chartTertiary}]}>
            {formatCompact(chartData.maxValue)}
          </Text>
        </View>
      </View>
    </View>
  );
});

BarChart.displayName = 'BarChart';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
  },
  bar: {
    minHeight: 4,
    position: 'relative',
  },
  todayIndicator: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: 11,
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tooltipComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tooltipCompText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 5,
  },
  averageLabel: {
    position: 'absolute',
    right: 4,
    top: -14,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  summaryItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 24,
  },
});

export default BarChart;
