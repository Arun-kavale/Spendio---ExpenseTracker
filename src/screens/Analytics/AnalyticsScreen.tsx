/**
 * Analytics Screen
 * 
 * Premium analytics dashboard with detailed spending insights,
 * advanced date filtering, interactive charts, and export functionality.
 */

import React, {memo, useMemo, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, useCurrency} from '@/hooks';
import {useExpenseStore, useCategoryStore} from '@/store';
import {
  Card,
  AdvancedHeader,
  DateRangePicker,
  AnimatedAmount,
  useToast,
} from '@/components/common';
import {LineChart, PieChart, BarChart} from '@/components/charts';
import {formatPercentage} from '@/utils';
import {format, subMonths, startOfMonth, endOfMonth, startOfWeek} from 'date-fns';
import type {DailyExpense, CategoryExpense, ComparisonStats} from '@/types';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type AnalyticsData = {
  dailyExpenses: DailyExpense[];
  categoryBreakdown: CategoryExpense[];
  comparisonStats: ComparisonStats;
  total: number;
  average: number;
  max: number;
  maxDay: DailyExpense | undefined;
  activeDays: number;
  totalDays: number;
  velocityChange: number;
};

type PresetFilter = 'today' | 'week' | 'month' | 'lastMonth' | '3months' | 'year' | 'custom';

const InsightCard = memo<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  delay: number;
}>(({title, value, subtitle, icon, color, trend, trendValue, delay}) => {
  const theme = useTheme();
  
  const trendColor = trend === 'up' ? theme.colors.error : trend === 'down' ? theme.colors.success : theme.colors.textMuted;
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
  
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.insightCardWrapper}>
      <Card style={styles.insightCard} padding="medium" variant="glass" elevation="low">
        <View style={styles.insightHeader}>
          <View style={[styles.insightIcon, {backgroundColor: color + '15'}]}>
            <Icon name={icon} size={18} color={color} />
          </View>
          {trend && trendValue && (
            <View style={[styles.trendBadge, {backgroundColor: trendColor + '15'}]}>
              <Icon name={trendIcon} size={12} color={trendColor} />
              <Text style={[styles.trendText, {color: trendColor}]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.insightTitle, {color: theme.colors.textSecondary}]}>
          {title}
        </Text>
        <Text style={[styles.insightValue, {color: theme.colors.text}]}>
          {value}
        </Text>
        <Text style={[styles.insightSubtitle, {color: theme.colors.textMuted}]}>
          {subtitle}
        </Text>
      </Card>
    </Animated.View>
  );
});

const CategoryItem = memo<{
  name: string;
  icon: string;
  color: string;
  amount: string;
  percentage: number;
  count: number;
  index: number;
}>(({name, icon, color, amount, percentage, count, index}) => {
  const theme = useTheme();
  
  return (
    <Animated.View
      entering={SlideInRight.delay(index * 50).duration(300)}
      style={[styles.categoryItem, {borderBottomColor: theme.colors.divider}]}>
      <View style={[styles.categoryIcon, {backgroundColor: color + '15'}]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, {color: theme.colors.text}]}>
          {name}
        </Text>
        <View style={styles.categoryStats}>
          <Text style={[styles.categoryCount, {color: theme.colors.textMuted}]}>
            {count} transactions
          </Text>
        </View>
      </View>
      <View style={styles.categoryValues}>
        <Text style={[styles.categoryAmount, {color: theme.colors.text}]}>
          {amount}
        </Text>
        <View style={[styles.percentageBadge, {backgroundColor: color + '15'}]}>
          <Text style={[styles.percentageText, {color}]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

// Filter chip component
const FilterChip = memo<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: string;
}>(({label, isActive, onPress, icon}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, {damping: 15});
        }}
        onPressOut={() => {
          scale.value = withSpring(1, {damping: 15});
        }}
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
          },
        ]}>
        {icon && (
          <Icon
            name={icon}
            size={14}
            color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
            style={{marginRight: 4}}
          />
        )}
        <Text
          style={[
            styles.filterChipText,
            {color: isActive ? '#FFFFFF' : theme.colors.text},
          ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const AnalyticsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {formatAmount, formatCompact} = useCurrency();
  const {showToast} = useToast();
  
  const [activeFilter, setActiveFilter] = useState<PresetFilter>('month');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customRange, setCustomRange] = useState<{start: Date; end: Date} | null>(null);
  
  // Subscribe to expense changes for reactivity
  const expenses = useExpenseStore(state => state.expenses);
  const isLoadingStore = useExpenseStore(state => state.isLoading);
  const getComparisonStats = useExpenseStore(state => state.getComparisonStats);
  const getDailyExpenses = useExpenseStore(state => state.getDailyExpenses);
  const getCategoryBreakdown = useExpenseStore(state => state.getCategoryBreakdown);
  const {categories} = useCategoryStore();

  // Deferred analytics data so first paint shows loader instead of stuck screen
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  
  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    
    if (activeFilter === 'custom' && customRange) {
      return customRange;
    }
    
    let start: Date;
    
    switch (activeFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = startOfWeek(now, {weekStartsOn: 1});
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {start: startOfMonth(lastMonth), end: endOfMonth(lastMonth)};
      case '3months':
        start = startOfMonth(subMonths(now, 2));
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = startOfMonth(now);
    }
    
    return {start, end: now};
  }, [activeFilter, customRange]);
  
  // Handle filter change
  const handleFilterChange = useCallback((filter: PresetFilter) => {
    if (filter === 'custom') {
      setShowDatePicker(true);
    } else {
      setActiveFilter(filter);
      setCustomRange(null);
    }
  }, []);
  
  // Handle custom date range selection
  const handleDateRangeSelect = useCallback((range: {startDate: Date; endDate: Date}) => {
    setCustomRange({start: range.startDate, end: range.endDate});
    setActiveFilter('custom');
    setShowDatePicker(false);
  }, []);
  
  // Compute analytics in effect so first paint shows loader (avoids "stuck" feel on tab switch)
  useEffect(() => {
    const dailyExpenses = getDailyExpenses(dateRange.start, dateRange.end);
    const categoryBreakdown = getCategoryBreakdown(dateRange.start, dateRange.end);
    const comparisonStats = getComparisonStats();

    const values = dailyExpenses.map(d => d.total);
    const total = values.reduce((a, b) => a + b, 0);
    const nonZeroValues = values.filter(v => v > 0);
    const activeDays = nonZeroValues.length;
    const average = activeDays > 0 ? total / activeDays : 0;
    const max = Math.max(...values, 0);
    const maxDay = dailyExpenses.find(d => d.total === max);

    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    const velocityChange =
      firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    setAnalyticsData({
      dailyExpenses,
      categoryBreakdown,
      comparisonStats,
      total,
      average,
      max,
      maxDay,
      activeDays,
      totalDays: values.length,
      velocityChange,
    });
  }, [expenses, dateRange, getDailyExpenses, getCategoryBreakdown, getComparisonStats]);
  
  const isLoading = isLoadingStore || analyticsData === null;

  // Export analytics as JSON
  const handleExport = useCallback(async () => {
    if (!analyticsData) return;
    const d = analyticsData;
    const exportData = {
      dateRange: {
        start: format(dateRange.start, 'yyyy-MM-dd'),
        end: format(dateRange.end, 'yyyy-MM-dd'),
      },
      summary: {
        totalSpent: d.total,
        averageDaily: d.average,
        highestDay: d.max,
        activeDays: d.activeDays,
        totalDays: d.totalDays,
      },
      categoryBreakdown: d.categoryBreakdown.map(cat => ({
        category: cat.categoryName,
        amount: cat.total,
        percentage: cat.percentage,
        transactions: cat.count,
      })),
      dailyExpenses: d.dailyExpenses,
      generatedAt: new Date().toISOString(),
    };
    
    try {
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: 'Expense Analytics Export',
      });
      
      showToast({
        type: 'success',
        title: 'Export Ready',
        message: 'Analytics data prepared for sharing',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export analytics data',
      });
    }
  }, [dateRange, analyticsData, showToast]);

  const stats = analyticsData?.comparisonStats;

  // Get filter label for display
  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case '3months': return 'Last 3 Months';
      case 'year': return 'This Year';
      case 'custom':
        if (customRange) {
          return `${format(customRange.start, 'MMM d')} - ${format(customRange.end, 'MMM d')}`;
        }
        return 'Custom';
      default: return 'This Month';
    }
  };
  
  // Loader: show while store is loading or analytics are being computed
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.loaderContainer,
          {backgroundColor: theme.colors.background, paddingTop: insets.top},
        ]}>
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loaderText, {color: theme.colors.textSecondary}]}>
            Loading analytics…
          </Text>
          <Text style={[styles.loaderSubtext, {color: theme.colors.textMuted}]}>
            Preparing your insights
          </Text>
        </View>
      </View>
    );
  }

  const data = analyticsData!;

  return (
    <>
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={[styles.content, {paddingTop: insets.top + 16}]}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, {color: theme.colors.text}]}>Analytics</Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Your spending insights
          </Text>
        </View>
        <Pressable
          onPress={handleExport}
          style={[styles.exportButton, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Icon name="export-variant" size={20} color={theme.colors.primary} />
        </Pressable>
      </Animated.View>
      
      {/* Advanced Filter Bar */}
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}>
          <FilterChip
            label="Today"
            isActive={activeFilter === 'today'}
            onPress={() => handleFilterChange('today')}
          />
          <FilterChip
            label="This Week"
            isActive={activeFilter === 'week'}
            onPress={() => handleFilterChange('week')}
          />
          <FilterChip
            label="This Month"
            isActive={activeFilter === 'month'}
            onPress={() => handleFilterChange('month')}
          />
          <FilterChip
            label="Last Month"
            isActive={activeFilter === 'lastMonth'}
            onPress={() => handleFilterChange('lastMonth')}
          />
          <FilterChip
            label="3 Months"
            isActive={activeFilter === '3months'}
            onPress={() => handleFilterChange('3months')}
          />
          <FilterChip
            label="This Year"
            isActive={activeFilter === 'year'}
            onPress={() => handleFilterChange('year')}
          />
          <FilterChip
            label={activeFilter === 'custom' && customRange ? getFilterLabel() : 'Custom...'}
            isActive={activeFilter === 'custom'}
            onPress={() => handleFilterChange('custom')}
            icon="calendar-range"
          />
        </ScrollView>
        
        {/* Active filter display */}
        <View style={styles.activeFilterDisplay}>
          <Icon name="calendar-clock" size={16} color={theme.colors.textMuted} />
          <Text style={[styles.activeFilterText, {color: theme.colors.textSecondary}]}>
            {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
          </Text>
        </View>
      </Animated.View>
      
      {/* Summary Cards */}
      <View style={styles.insightsGrid}>
        <InsightCard
          title="Total Spent"
          value={formatCompact(data.total)}
          subtitle={`${data.activeDays} active days`}
          icon="wallet-outline"
          color={theme.colors.primary}
          delay={150}
        />
        <InsightCard
          title="Daily Average"
          value={formatCompact(data.average)}
          subtitle="per active day"
          icon="calendar-today"
          color={theme.colors.warning}
          trend={data.velocityChange > 5 ? 'up' : data.velocityChange < -5 ? 'down' : 'stable'}
          trendValue={`${Math.abs(data.velocityChange).toFixed(0)}%`}
          delay={200}
        />
        <InsightCard
          title="Highest Day"
          value={formatCompact(data.max)}
          subtitle={data.maxDay ? format(new Date(data.maxDay.date), 'MMM d') : '-'}
          icon="arrow-up-circle"
          color={theme.colors.error}
          delay={250}
        />
        <InsightCard
          title="vs Last Month"
          value={formatPercentage(Math.abs(stats.percentageChange))}
          subtitle={stats.trend === 'up' ? 'more spent' : stats.trend === 'down' ? 'less spent' : 'same'}
          icon="compare-arrows"
          color={theme.colors.info}
          trend={stats.trend}
          delay={300}
        />
      </View>
      
      {/* Spending Trend Chart */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <Card style={styles.chartCard} padding="medium" elevation="medium">
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
              Spending Trend
            </Text>
            <View style={[styles.chartBadge, {backgroundColor: theme.colors.primaryLight + '15'}]}>
              <Text style={[styles.chartBadgeText, {color: theme.colors.primary}]}>
                {getFilterLabel()}
              </Text>
            </View>
          </View>
          <LineChart
            data={data.dailyExpenses}
            height={200}
            showTooltip={true}
            gradientColors={[theme.colors.chartGradientStart, theme.colors.chartGradientEnd]}
          />
        </Card>
      </Animated.View>
      
      {/* Category Breakdown */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Card style={styles.chartCard} padding="medium" elevation="medium">
          <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
            Category Breakdown
          </Text>
          
          <View style={styles.pieContainer}>
            <PieChart
              data={data.categoryBreakdown}
              size={160}
              strokeWidth={22}
              centerValue={formatCompact(data.total)}
            />
          </View>
          
          {/* Category List */}
          <View style={styles.categoryList}>
            {data.categoryBreakdown.slice(0, 6).map((cat, index) => (
              <CategoryItem
                key={cat.categoryId}
                name={cat.categoryName}
                icon={cat.categoryIcon}
                color={cat.categoryColor}
                amount={formatCompact(cat.total)}
                percentage={cat.percentage}
                count={cat.count}
                index={index}
              />
            ))}
          </View>
        </Card>
      </Animated.View>
      
      {/* Daily Spending Pattern */}
      <Animated.View entering={FadeInDown.delay(450).duration(400)}>
        <Card style={styles.chartCard} padding="medium" elevation="medium">
          <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
            Daily Spending Pattern
          </Text>
          <Text style={[styles.chartSubtitle, {color: theme.colors.textSecondary}]}>
            Last {Math.min(14, data.dailyExpenses.length)} days
          </Text>
          <BarChart
            data={data.dailyExpenses.slice(-14)}
            height={200}
            showTooltip={true}
            colorScheme="gradient"
          />
        </Card>
      </Animated.View>
      
      {/* Month Comparison */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Card style={styles.comparisonCard} padding="large" variant="glass" elevation="medium">
          <Text style={[styles.comparisonTitle, {color: theme.colors.text}]}>
            Month Over Month
          </Text>
          
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, {color: theme.colors.textMuted}]}>
                Current Month
              </Text>
              <Text style={[styles.comparisonValue, {color: theme.colors.text}]}>
                {formatAmount(stats.currentMonth.total)}
              </Text>
              <Text style={[styles.comparisonCount, {color: theme.colors.textSecondary}]}>
                {stats.currentMonth.count} transactions
              </Text>
            </View>
            
            <View style={[styles.comparisonDivider, {backgroundColor: theme.colors.border}]} />
            
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, {color: theme.colors.textMuted}]}>
                Last Month
              </Text>
              <Text style={[styles.comparisonValue, {color: theme.colors.textSecondary}]}>
                {formatAmount(stats.previousMonth.total)}
              </Text>
              <Text style={[styles.comparisonCount, {color: theme.colors.textSecondary}]}>
                {stats.previousMonth.count} transactions
              </Text>
            </View>
          </View>
          
          <View
            style={[
              styles.changeIndicator,
              {
                backgroundColor:
                  stats.trend === 'up'
                    ? theme.colors.error + '10'
                    : stats.trend === 'down'
                    ? theme.colors.success + '10'
                    : theme.colors.surfaceVariant,
              },
            ]}>
            <Icon
              name={stats.trend === 'up' ? 'arrow-up' : stats.trend === 'down' ? 'arrow-down' : 'minus'}
              size={16}
              color={
                stats.trend === 'up'
                  ? theme.colors.error
                  : stats.trend === 'down'
                  ? theme.colors.success
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                styles.changeText,
                {
                  color:
                    stats.trend === 'up'
                      ? theme.colors.error
                      : stats.trend === 'down'
                      ? theme.colors.success
                      : theme.colors.textMuted,
                },
              ]}>
              {formatPercentage(Math.abs(stats.percentageChange))}{' '}
              {stats.trend === 'up' ? 'increase' : stats.trend === 'down' ? 'decrease' : 'no change'}
            </Text>
          </View>
        </Card>
      </Animated.View>
      
      <View style={{height: 100}} />
    </ScrollView>
    
    {/* Date Range Picker Modal */}
    <DateRangePicker
      visible={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      onSelect={handleDateRangeSelect}
      title="Select Date Range"
    />
    </>
  );
});

AnalyticsScreen.displayName = 'AnalyticsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 17,
    fontWeight: '600',
  },
  loaderSubtext: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScrollView: {
    marginBottom: 8,
    marginHorizontal: -16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  insightCardWrapper: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  insightCard: {
    minHeight: 120,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  insightTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  insightSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  chartSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  chartBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pieContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryCount: {
    fontSize: 12,
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  comparisonCard: {
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  comparisonValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  comparisonCount: {
    fontSize: 12,
    marginTop: 4,
  },
  comparisonDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 16,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default AnalyticsScreen;
