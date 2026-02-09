/**
 * LineChart Component
 * 
 * A premium animated line chart for displaying expense trends.
 * Features: smooth bezier curves, gradient fills, interactive tooltips, and fintech-grade design.
 */

import React, {memo, useMemo, useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions, Pressable} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  G,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import {useTheme, useCurrency} from '@/hooks';
import {DailyExpense} from '@/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {format, parseISO} from 'date-fns';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LineChartProps {
  data: DailyExpense[];
  height?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  animated?: boolean;
  gradientColors?: [string, string];
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CHART_PADDING = 16;
const LABEL_HEIGHT = 28;
const Y_AXIS_WIDTH = 45;

export const LineChart = memo<LineChartProps>(({
  data,
  height = 200,
  showLabels = true,
  showGrid = true,
  showTooltip = true,
  animated = true,
  gradientColors,
}) => {
  const theme = useTheme();
  const {formatCompact} = useCurrency();
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const lineProgress = useSharedValue(0);
  const pointsProgress = useSharedValue(0);
  
  // Animation on data change
  useEffect(() => {
    if (animated) {
      lineProgress.value = 0;
      pointsProgress.value = 0;
      lineProgress.value = withTiming(1, {duration: 1000, easing: Easing.out(Easing.cubic)});
      pointsProgress.value = withDelay(600, withSpring(1, {damping: 12, stiffness: 100}));
    } else {
      lineProgress.value = 1;
      pointsProgress.value = 1;
    }
  }, [data, animated]);
  
  const colors = gradientColors || [theme.colors.chartGradientStart, theme.colors.chartGradientEnd];
  
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return null;
    }
    
    const width = SCREEN_WIDTH - CHART_PADDING * 2 - 32 - Y_AXIS_WIDTH;
    const chartHeight = height - (showLabels ? LABEL_HEIGHT : 0) - CHART_PADDING - 10;
    
    const values = data.map(d => d.total);
    const maxValue = Math.max(...values, 1);
    const minValue = 0; // Always start from 0 for financial data
    const range = maxValue - minValue || 1;
    
    // Calculate nice round numbers for y-axis
    const yAxisSteps = 4;
    const stepValue = Math.ceil(maxValue / yAxisSteps);
    const yAxisValues = Array.from({length: yAxisSteps + 1}, (_, i) => i * stepValue);
    
    const points = data.map((d, i) => ({
      x: Y_AXIS_WIDTH + (i / Math.max(data.length - 1, 1)) * width,
      y: 10 + chartHeight - ((d.total - minValue) / range) * chartHeight,
      value: d.total,
      date: d.date,
    }));
    
    // Create smooth bezier curve path
    let path = '';
    if (points.length === 1) {
      // Single point - just a dot position
      path = `M ${points[0].x} ${points[0].y}`;
    } else {
      path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const tension = 0.3;
        const cpx1 = prev.x + (curr.x - prev.x) * tension;
        const cpx2 = curr.x - (curr.x - prev.x) * tension;
        path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
      }
    }
    
    // Create area path
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const baseY = 10 + chartHeight;
    const areaPath = `${path} L ${lastPoint.x} ${baseY} L ${firstPoint.x} ${baseY} Z`;
    
    return {
      width: width + Y_AXIS_WIDTH,
      chartWidth: width,
      height: chartHeight,
      points,
      path,
      areaPath,
      maxValue,
      yAxisValues,
    };
  }, [data, height, showLabels]);
  
  const handlePointPress = useCallback((index: number) => {
    setSelectedPoint(prev => prev === index ? null : index);
  }, []);
  
  if (!chartData || data.length === 0) {
    return (
      <View style={[styles.container, {height}]}>
        <View style={styles.emptyContainer}>
          <Icon name="chart-line" size={40} color={theme.colors.textMuted} />
          <Text style={[styles.emptyText, {color: theme.colors.textMuted}]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }
  
  // Calculate average and trend
  const values = data.map(d => d.total);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable';
  
  // Get label indices
  const labelCount = Math.min(5, data.length);
  const labelStep = Math.floor((data.length - 1) / (labelCount - 1)) || 1;
  const labelIndices = Array.from({length: labelCount}, (_, i) => 
    Math.min(i * labelStep, data.length - 1)
  );
  
  const selectedData = selectedPoint !== null ? chartData.points[selectedPoint] : null;
  
  return (
    <View style={[styles.container, {height: height + 20}]}>
      {/* Tooltip */}
      {showTooltip && selectedData && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltip,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              left: Math.min(
                Math.max(selectedData.x - 60, 10),
                SCREEN_WIDTH - 140
              ),
              top: Math.max(selectedData.y - 70, 5),
            },
          ]}>
          <Text style={[styles.tooltipDate, {color: theme.colors.textSecondary}]}>
            {format(parseISO(selectedData.date), 'EEE, MMM d')}
          </Text>
          <Text style={[styles.tooltipValue, {color: theme.colors.text}]}>
            {formatCompact(selectedData.value)}
          </Text>
        </Animated.View>
      )}
      
      <Svg
        width={chartData.width}
        height={chartData.height + (showLabels ? LABEL_HEIGHT : 0) + 20}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors[0]} stopOpacity="0.35" />
            <Stop offset="0.5" stopColor={colors[0]} stopOpacity="0.15" />
            <Stop offset="1" stopColor={colors[0]} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        
        {/* Y-axis labels */}
        {chartData.yAxisValues.slice(0, -1).map((value, i) => {
          const y = 10 + chartData.height - (value / chartData.maxValue) * chartData.height;
          return (
            <G key={`y-${i}`}>
              <SvgText
                x={2}
                y={y + 4}
                fill={theme.colors.textMuted}
                fontSize={10}>
                {formatCompact(value)}
              </SvgText>
            </G>
          );
        })}
        
        {/* Grid lines */}
        {showGrid && (
          <G>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Line
                key={`grid-${i}`}
                x1={Y_AXIS_WIDTH}
                y1={10 + ratio * chartData.height}
                x2={chartData.width}
                y2={10 + ratio * chartData.height}
                stroke={theme.colors.border}
                strokeWidth={1}
                strokeDasharray={ratio === 1 ? undefined : '4,6'}
                opacity={ratio === 1 ? 0.5 : 0.3}
              />
            ))}
          </G>
        )}
        
        {/* Average line */}
        {data.length > 1 && (
          <G>
            <Line
              x1={Y_AXIS_WIDTH}
              y1={10 + chartData.height - (average / chartData.maxValue) * chartData.height}
              x2={chartData.width}
              y2={10 + chartData.height - (average / chartData.maxValue) * chartData.height}
              stroke={theme.colors.warning}
              strokeWidth={1.5}
              strokeDasharray="6,4"
              opacity={0.6}
            />
          </G>
        )}
        
        {/* Area fill */}
        <Path
          d={chartData.areaPath}
          fill="url(#areaGradient)"
        />
        
        {/* Main line */}
        <Path
          d={chartData.path}
          stroke="url(#lineGradient)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {chartData.points.map((point, i) => (
          <G key={`point-${i}`} onPress={() => handlePointPress(i)}>
            {/* Larger touch target */}
            <Circle
              cx={point.x}
              cy={point.y}
              r={16}
              fill="transparent"
            />
            {/* Outer glow for selected */}
            {selectedPoint === i && (
              <Circle
                cx={point.x}
                cy={point.y}
                r={10}
                fill={colors[0]}
                opacity={0.2}
              />
            )}
            {/* Visible point */}
            <Circle
              cx={point.x}
              cy={point.y}
              r={selectedPoint === i ? 6 : 4}
              fill={theme.colors.card}
              stroke={colors[0]}
              strokeWidth={selectedPoint === i ? 3 : 2}
            />
          </G>
        ))}
      </Svg>
      
      {/* X-axis labels */}
      {showLabels && (
        <View style={[styles.labelsContainer, {left: Y_AXIS_WIDTH}]}>
          {labelIndices.map((i, idx) => {
            const point = chartData.points[i];
            if (!point) {
              return null;
            }
            const dateObj = parseISO(data[i].date);
            const label = format(dateObj, 'd MMM');
            
            return (
              <Text
                key={`label-${idx}`}
                style={[
                  styles.label,
                  {
                    color: theme.colors.textMuted,
                    left: point.x - Y_AXIS_WIDTH - 20,
                  },
                ]}>
                {label}
              </Text>
            );
          })}
        </View>
      )}
      
      {/* Trend indicator */}
      {data.length > 3 && (
        <View style={styles.trendContainer}>
          <Icon
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'}
            size={14}
            color={trend === 'up' ? theme.colors.error : trend === 'down' ? theme.colors.success : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.trendText,
              {
                color: trend === 'up' ? theme.colors.error : trend === 'down' ? theme.colors.success : theme.colors.textMuted,
              },
            ]}>
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </Text>
        </View>
      )}
    </View>
  );
});

LineChart.displayName = 'LineChart';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  labelsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LABEL_HEIGHT,
  },
  label: {
    position: 'absolute',
    fontSize: 10,
    width: 40,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 100,
  },
  tooltipDate: {
    fontSize: 11,
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default LineChart;
