/**
 * Dashboard Screen
 * 
 * Premium fintech-grade dashboard with:
 * - Collapsible sticky header (logo + month chip, compact balance on scroll)
 * - Net balance overview (income - expenses)
 * - Income, Expense, Budget summary cards
 * - Quick access to all modules
 * - Recent transactions (expenses + income)
 * - Spending trend chart
 * - Category breakdown
 * 
 * REACTIVE: Automatically updates when any store changes via Zustand subscription.
 */

import React, {memo, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useExpenseStore, useCategoryStore, useSettingsStore, useIncomeStore, useBudgetStore, useTransferStore} from '@/store';
import {
  Card,
  SkeletonDashboard,
  AnimatedAmount,
  AnimatedPercentage,
  StickyHeader,
} from '@/components/common';
import {LineChart, PieChart, BarChart} from '@/components/charts';
import {RootStackParamList, Expense, Income} from '@/types';
import {formatMonth, formatRelativeDate} from '@/utils';
import {INCOME_CATEGORIES, getAccountInfo} from '@/constants';
import {SpendioLogo} from '@/assets';
import {subDays, startOfMonth, endOfMonth, format} from 'date-fns';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Finance summary card (Income / Expense / Balance)
const FinanceCard = memo<{
  label: string;
  value: number;
  icon: string;
  color: string;
  delay: number;
  onPress?: () => void;
}>(({label, value, icon, color, delay, onPress}) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()} style={styles.financeCardWrapper}>
      <Card style={styles.financeCard} padding="medium" variant="glass" elevation="low" onPress={onPress}>
        <View style={[styles.financeIcon, {backgroundColor: color + '15'}]}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.financeLabel, {color: theme.colors.textSecondary}]}>{label}</Text>
        <AnimatedAmount amount={value} style={{...styles.financeValue, color}} compact />
      </Card>
    </Animated.View>
  );
});

// Quick action button
const QuickAction = memo<{
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
}>(({icon, label, color, onPress, delay}) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <Pressable onPress={onPress} style={styles.quickAction}>
        <View style={[styles.quickActionIcon, {backgroundColor: color + '15'}]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.quickActionLabel, {color: theme.colors.textSecondary}]} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// Unified transaction item (expense or income)
const TransactionItem = memo<{
  type: 'expense' | 'income';
  amount: number;
  label: string;
  date: string;
  icon: string;
  color: string;
  index: number;
  onPress: () => void;
}>(({type, amount, label, date, icon, color, index, onPress}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  return (
    <Animated.View entering={SlideInRight.delay(index * 40).duration(300)}>
      <Pressable onPress={onPress} style={[styles.transactionItem, {borderBottomColor: theme.colors.divider}]}>
        <View style={[styles.transactionIcon, {backgroundColor: color + '15'}]}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <View style={styles.transactionContent}>
          <Text style={[styles.transactionLabel, {color: theme.colors.text}]} numberOfLines={1}>{label}</Text>
          <Text style={[styles.transactionDate, {color: theme.colors.textMuted}]}>{formatRelativeDate(date)}</Text>
        </View>
        <Text style={[styles.transactionAmount, {color: type === 'income' ? theme.colors.income : theme.colors.expense}]}>
          {type === 'income' ? '+' : '-'}{formatAmount(amount)}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

// Category legend item
const CategoryLegend = memo<{
  name: string;
  color: string;
  percentage: number;
  amount: number;
  icon: string;
  index: number;
}>(({name, color, percentage, amount, icon, index}) => {
  const theme = useTheme();
  const {formatCompact} = useCurrency();
  
  return (
    <Animated.View
      entering={SlideInRight.delay(index * 50).duration(300)}
      style={styles.legendItem}>
      <View style={[styles.legendIcon, {backgroundColor: color + '15'}]}>
        <Icon name={icon} size={14} color={color} />
      </View>
      <View style={styles.legendContent}>
        <Text style={[styles.legendName, {color: theme.colors.text}]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.legendBar}>
          <Animated.View
            entering={FadeIn.delay(index * 50 + 200).duration(400)}
            style={[
              styles.legendBarFill,
              {backgroundColor: color, width: `${Math.min(percentage, 100)}%`},
            ]}
          />
        </View>
      </View>
      <View style={styles.legendValues}>
        <Text style={[styles.legendPercent, {color}]}>
          {percentage.toFixed(0)}%
        </Text>
        <Text style={[styles.legendAmount, {color: theme.colors.textMuted}]}>
          {formatCompact(amount)}
        </Text>
      </View>
    </Animated.View>
  );
});

export const DashboardScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount, formatCompact} = useCurrency();
  const {settings} = useSettingsStore();
  
  // Collapsible header hook — compact balance shows after scrolling ~130px
  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 130});
  
  // Subscribe to all stores for reactivity
  const expenses = useExpenseStore(state => state.expenses);
  const isLoading = useExpenseStore(state => state.isLoading);
  const getComparisonStats = useExpenseStore(state => state.getComparisonStats);
  const getDailyExpenses = useExpenseStore(state => state.getDailyExpenses);
  const {categories} = useCategoryStore();
  const incomes = useIncomeStore(state => state.incomes);
  const getMonthlyIncome = useIncomeStore(state => state.getMonthlyIncome);
  const budgets = useBudgetStore(state => state.budgets);
  const getBudgetsForMonth = useBudgetStore(state => state.getBudgetsForMonth);
  const transfers = useTransferStore(state => state.transfers);
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  // Compute expense stats
  const stats = useMemo(() => getComparisonStats(), [expenses, getComparisonStats]);
  const currentMonth = stats.currentMonth;
  
  // Monthly income
  const monthlyIncome = useMemo(() => getMonthlyIncome(), [incomes, getMonthlyIncome]);
  
  // Net balance
  const netBalance = useMemo(() => monthlyIncome - currentMonth.total, [monthlyIncome, currentMonth.total]);
  
  // Budget overview
  const monthBudgets = useMemo(() => getBudgetsForMonth(), [budgets, expenses, getBudgetsForMonth]);
  const totalBudget = useMemo(() => monthBudgets.reduce((s, b) => s + b.amount, 0), [monthBudgets]);
  const totalBudgetSpent = useMemo(() => monthBudgets.reduce((s, b) => s + b.spent, 0), [monthBudgets]);
  const budgetPercentage = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;
  const overBudgetCount = useMemo(() => monthBudgets.filter(b => b.isOverBudget).length, [monthBudgets]);
  
  // Monthly transfers
  const monthlyTransferTotal = useMemo(() => {
    const now = new Date();
    const mStart = startOfMonth(now);
    const mEnd = endOfMonth(now);
    return transfers
      .filter(t => {
        const d = new Date(t.date);
        return d >= mStart && d <= mEnd;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transfers]);
  
  // Last 7 days data for chart
  const last7DaysData = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 6);
    return getDailyExpenses(start, end);
  }, [expenses, getDailyExpenses]);
  
  // Recent transactions (combined expenses + incomes, sorted by date, last 7)
  const recentTransactions = useMemo(() => {
    const expItems = expenses.map(e => ({
      type: 'expense' as const,
      id: e.id,
      amount: e.amount,
      date: e.date,
      label: e.note || categories.find(c => c.id === e.categoryId)?.name || 'Expense',
      icon: categories.find(c => c.id === e.categoryId)?.icon || 'help-circle',
      color: categories.find(c => c.id === e.categoryId)?.color || theme.colors.textMuted,
      createdAt: e.createdAt,
    }));
    const incItems = incomes.map(i => ({
      type: 'income' as const,
      id: i.id,
      amount: i.amount,
      date: i.date,
      label: i.note || INCOME_CATEGORIES.find(c => c.id === i.categoryId)?.name || 'Income',
      icon: INCOME_CATEGORIES.find(c => c.id === i.categoryId)?.icon || 'cash',
      color: INCOME_CATEGORIES.find(c => c.id === i.categoryId)?.color || theme.colors.income,
      createdAt: i.createdAt,
    }));
    return [...expItems, ...incItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
      .slice(0, 7);
  }, [expenses, incomes, categories, theme]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);
  const userName = settings.googleUserName?.split(' ')[0] || 'there';

  if (isLoading) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background, paddingTop: insets.top}]}>
        <SkeletonDashboard />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Sticky Header: logo + month chip, compact balance on scroll */}
      <StickyHeader
        backgroundColor={theme.colors.background}
        paddingTop={insets.top + 8}
        shadowStyle={headerShadowStyle}
        dividerStyle={dividerOpacity}
        dividerColor={theme.colors.divider}
        topBar={
          <View style={styles.stickyTopBar}>
            <View style={styles.headerRow}>
              <View style={styles.headerLogoWrap}>
                <Image
                  source={SpendioLogo}
                  style={styles.headerLogo}
                  resizeMode="contain"
                  accessibilityLabel="Spendio"
                />
              </View>
              <View style={styles.headerSpacer} />
              <Pressable
                onPress={() => navigation.navigate('Settings' as any)}
                style={({pressed}) => [
                  styles.headerButton,
                  {backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent'},
                ]}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <Icon name="cog-outline" size={22} color={theme.colors.text} />
              </Pressable>
            </View>
            <View style={[styles.monthChip, {backgroundColor: theme.colors.surfaceVariant}]}>
              <Icon name="calendar-month-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.monthChipText, {color: theme.colors.text}]}>
                {formatMonth(currentMonth.month)}
              </Text>
            </View>
          </View>
        }
        collapsedContent={
          <View style={styles.collapsedRow}>
            <View style={styles.collapsedBalanceRow}>
              <View style={[styles.collapsedDot, {backgroundColor: netBalance >= 0 ? theme.colors.income : theme.colors.expense}]} />
              <Text style={[styles.collapsedLabel, {color: theme.colors.textSecondary}]}>Balance</Text>
              <Text style={[styles.collapsedValue, {color: netBalance >= 0 ? theme.colors.income : theme.colors.expense}]}>
                {netBalance >= 0 ? '+' : '-'}{formatCompact(Math.abs(netBalance))}
              </Text>
            </View>
            <View style={styles.collapsedMiniStats}>
              <View style={styles.collapsedMiniStat}>
                <Icon name="arrow-down-circle" size={12} color={theme.colors.income} />
                <Text style={[styles.collapsedMiniValue, {color: theme.colors.income}]}>{formatCompact(monthlyIncome)}</Text>
              </View>
              <View style={styles.collapsedMiniStat}>
                <Icon name="arrow-up-circle" size={12} color={theme.colors.expense} />
                <Text style={[styles.collapsedMiniValue, {color: theme.colors.expense}]}>{formatCompact(currentMonth.total)}</Text>
              </View>
            </View>
          </View>
        }
        collapsedStyle={collapsedSummaryStyle}
      />

      {/* Scrollable content with Reanimated scroll handler */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }>
        
        {/* Welcome line - greeting moved here so header stays minimal */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.welcomeRow}>
          <Text style={[styles.welcomeText, {color: theme.colors.textSecondary}]}>
            {greeting}, {userName}
          </Text>
        </Animated.View>

        {/* Net Balance Hero Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <Card style={styles.heroCard} padding="large" variant="elevated" elevation="high">
            <View style={styles.heroHeader}>
              <Text style={[styles.heroLabel, {color: theme.colors.textSecondary}]}>Net Balance</Text>
              <View style={[styles.heroBadge, {backgroundColor: (netBalance >= 0 ? theme.colors.income : theme.colors.expense) + '15'}]}>
                <Icon name={netBalance >= 0 ? 'trending-up' : 'trending-down'} size={14} color={netBalance >= 0 ? theme.colors.income : theme.colors.expense} />
                <Text style={[styles.heroBadgeText, {color: netBalance >= 0 ? theme.colors.income : theme.colors.expense}]}>
                  {netBalance >= 0 ? 'Surplus' : 'Deficit'}
                </Text>
              </View>
            </View>
            
            <AnimatedAmount
              amount={Math.abs(netBalance)}
              style={{...styles.heroAmount, color: netBalance >= 0 ? theme.colors.income : theme.colors.expense}}
            />
            
            <View style={styles.heroFooter}>
              <View style={[styles.trendBadge, {backgroundColor: (stats.trend === 'down' ? theme.colors.income : stats.trend === 'up' ? theme.colors.expense : theme.colors.textMuted) + '15'}]}>
                <Icon
                  name={stats.trend === 'up' ? 'trending-up' : stats.trend === 'down' ? 'trending-down' : 'minus'}
                  size={16}
                  color={stats.trend === 'down' ? theme.colors.income : stats.trend === 'up' ? theme.colors.expense : theme.colors.textMuted}
                />
                <AnimatedPercentage value={stats.percentageChange} style={styles.trendText} showArrow={false} />
              </View>
              <Text style={[styles.comparisonText, {color: theme.colors.textMuted}]}>
                expenses vs last month
              </Text>
            </View>
          </Card>
        </Animated.View>
        
        {/* Income / Expense / Transfer Cards */}
        <View style={styles.financeRow}>
          <FinanceCard label="Income" value={monthlyIncome} icon="arrow-down-circle" color={theme.colors.income} delay={150} onPress={() => navigation.navigate('IncomeList')} />
          <FinanceCard label="Expenses" value={currentMonth.total} icon="arrow-up-circle" color={theme.colors.expense} delay={200} onPress={() => navigation.navigate('Expenses' as any)} />
          <FinanceCard label="Transfers" value={monthlyTransferTotal} icon="swap-horizontal" color={theme.colors.transfer} delay={250} onPress={() => navigation.navigate('TransferList')} />
        </View>
        
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="cash-plus" label="Income" color={theme.colors.income} onPress={() => navigation.navigate('IncomeList')} delay={280} />
            <QuickAction icon="chart-arc" label="Budgets" color={theme.colors.primary} onPress={() => navigation.navigate('BudgetDashboard')} delay={310} />
            <QuickAction icon="swap-horizontal" label="Transfers" color={theme.colors.transfer} onPress={() => navigation.navigate('TransferList')} delay={340} />
            <QuickAction icon="shape-outline" label="Categories" color={theme.colors.secondary} onPress={() => navigation.navigate('Categories')} delay={370} />
          </View>
        </Animated.View>
        
        {/* Budget Overview */}
        {monthBudgets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).duration(400)}>
            <Card style={styles.budgetCard} padding="medium" elevation="medium" onPress={() => navigation.navigate('BudgetDashboard')}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Budget Overview</Text>
                <View style={styles.sectionAction}>
                  <Text style={[styles.sectionActionText, {color: theme.colors.primary}]}>Details</Text>
                  <Icon name="chevron-right" size={16} color={theme.colors.primary} />
                </View>
              </View>
              
              <View style={styles.budgetProgress}>
                <View style={[styles.budgetProgressBg, {backgroundColor: theme.colors.surfaceVariant}]}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        backgroundColor: budgetPercentage > 100 ? theme.colors.error : budgetPercentage > 80 ? theme.colors.warning : theme.colors.primary,
                        width: `${Math.min(budgetPercentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.budgetStats}>
                  <Text style={[styles.budgetStatText, {color: theme.colors.textSecondary}]}>
                    {formatCompact(totalBudgetSpent)} / {formatCompact(totalBudget)}
                  </Text>
                  <Text
                    style={[
                      styles.budgetPercentText,
                      {color: budgetPercentage > 100 ? theme.colors.error : budgetPercentage > 80 ? theme.colors.warning : theme.colors.primary},
                    ]}>
                    {budgetPercentage.toFixed(0)}% used
                  </Text>
                </View>
              </View>
              
              {overBudgetCount > 0 && (
                <View style={[styles.overBudgetBanner, {backgroundColor: theme.colors.error + '10'}]}>
                  <Icon name="alert" size={14} color={theme.colors.error} />
                  <Text style={[styles.overBudgetText, {color: theme.colors.error}]}>
                    {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>
        )}
        
        {/* Spending Trend Chart */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Card style={styles.chartCard} padding="medium" elevation="medium">
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleRow}>
                <Text style={[styles.chartTitle, {color: theme.colors.text}]}>Spending Trend</Text>
                <View style={[styles.chartBadge, {backgroundColor: theme.colors.primaryLight + '18'}]}>
                  <Text style={[styles.chartBadgeText, {color: theme.colors.primary}]}>This month</Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate('Analytics' as any)} style={styles.sectionAction}>
                <Text style={[styles.sectionActionText, {color: theme.colors.primary}]}>See Details</Text>
                <Icon name="chevron-right" size={16} color={theme.colors.primary} />
              </Pressable>
            </View>
            <LineChart
              data={currentMonth.dailyExpenses}
              height={180}
              showTooltip
              gradientColors={[theme.colors.chartGradientStart, theme.colors.chartGradientEnd]}
            />
          </Card>
        </Animated.View>
        
        {/* Category Breakdown */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card style={styles.chartCard} padding="medium" elevation="medium">
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>By Category</Text>
              <Pressable onPress={() => navigation.navigate('Categories')} style={styles.sectionAction}>
                <Text style={[styles.sectionActionText, {color: theme.colors.primary}]}>All</Text>
                <Icon name="chevron-right" size={16} color={theme.colors.primary} />
              </Pressable>
            </View>
            
            {currentMonth.categoryBreakdown.length > 0 ? (
              <View style={styles.categorySection}>
                <View style={styles.pieWrapper}>
                  <PieChart
                    data={currentMonth.categoryBreakdown}
                    size={140}
                    strokeWidth={18}
                    centerValue={formatCompact(currentMonth.total)}
                  />
                </View>
                <View style={styles.legendList}>
                  {currentMonth.categoryBreakdown.slice(0, 4).map((cat, index) => (
                    <CategoryLegend
                      key={cat.categoryId}
                      name={cat.categoryName}
                      color={cat.categoryColor}
                      percentage={cat.percentage}
                      amount={cat.total}
                      icon={cat.categoryIcon}
                      index={index}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Icon name="chart-donut" size={40} color={theme.colors.textMuted} />
                <Text style={[styles.emptyChartText, {color: theme.colors.textMuted}]}>No expense data yet</Text>
              </View>
            )}
          </Card>
        </Animated.View>
        
        {/* Last 7 Days Bar Chart */}
        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <Card style={styles.chartCard} padding="medium" elevation="medium">
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Last 7 Days</Text>
            <BarChart data={last7DaysData} height={180} maxBars={7} colorScheme="gradient" />
          </Card>
        </Animated.View>
        
        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Card style={styles.recentCard} padding="none" elevation="medium">
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Recent Transactions</Text>
              <Pressable onPress={() => navigation.navigate('Expenses' as any)} style={styles.sectionAction}>
                <Text style={[styles.sectionActionText, {color: theme.colors.primary}]}>View All</Text>
                <Icon name="chevron-right" size={16} color={theme.colors.primary} />
              </Pressable>
            </View>
            
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyRecent}>
                <Icon name="receipt" size={40} color={theme.colors.textMuted} />
                <Text style={[styles.emptyText, {color: theme.colors.textMuted}]}>No transactions yet</Text>
              </View>
            ) : (
              <View style={styles.recentList}>
                {recentTransactions.map((tx, index) => (
                  <TransactionItem
                    key={`${tx.type}-${tx.id}`}
                    type={tx.type}
                    amount={tx.amount}
                    label={tx.label}
                    date={tx.date}
                    icon={tx.icon}
                    color={tx.color}
                    index={index}
                    onPress={() => {
                      if (tx.type === 'expense') {
                        navigation.navigate('ExpenseDetails', {expenseId: tx.id});
                      } else {
                        navigation.navigate('IncomeDetails', {incomeId: tx.id});
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
        
        <View style={{height: 100}} />
      </Animated.ScrollView>
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  welcomeRow: {
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Sticky header: one row [Logo | Settings], then month chip
  stickyTopBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLogoWrap: {
    width: 108,
    height: 34,
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 12,
    flexShrink: 0,
  },
  headerLogo: {
    width: 108,
    height: 34,
  },
  headerSpacer: {
    flex: 1,
  },
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Collapsed compact summary
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  collapsedBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collapsedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  collapsedLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  collapsedValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  collapsedMiniStats: {
    flexDirection: 'row',
    gap: 12,
  },
  collapsedMiniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  collapsedMiniValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Hero Card
  heroCard: {marginBottom: 16},
  heroHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
  heroLabel: {fontSize: 14},
  heroBadge: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4},
  heroBadgeText: {fontSize: 12, fontWeight: '600'},
  heroAmount: {fontSize: 42, fontWeight: '700', letterSpacing: -1, marginBottom: 16},
  heroFooter: {flexDirection: 'row', alignItems: 'center'},
  trendBadge: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 10, gap: 4},
  trendText: {fontSize: 13, fontWeight: '600'},
  comparisonText: {fontSize: 13},
  // Finance cards
  financeRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  financeCardWrapper: {flex: 1},
  financeCard: {flex: 1, alignItems: 'center'},
  financeIcon: {width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8},
  financeLabel: {fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4},
  financeValue: {fontSize: 16, fontWeight: '700'},
  // Quick actions
  quickActionsRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4},
  quickAction: {alignItems: 'center', width: 72},
  quickActionIcon: {width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6},
  quickActionLabel: {fontSize: 11, fontWeight: '500'},
  // Budget
  budgetCard: {marginBottom: 16},
  budgetProgress: {},
  budgetProgressBg: {height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10},
  budgetProgressFill: {height: '100%', borderRadius: 4},
  budgetStats: {flexDirection: 'row', justifyContent: 'space-between'},
  budgetStatText: {fontSize: 13},
  budgetPercentText: {fontSize: 13, fontWeight: '600'},
  overBudgetBanner: {flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginTop: 12, gap: 6},
  overBudgetText: {fontSize: 12, fontWeight: '500'},
  // Charts
  chartCard: {marginBottom: 16},
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  chartTitle: {fontSize: 17, fontWeight: '600'},
  chartBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chartBadgeText: {fontSize: 11, fontWeight: '600'},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  sectionTitle: {fontSize: 17, fontWeight: '600'},
  sectionAction: {flexDirection: 'row', alignItems: 'center'},
  sectionActionText: {fontSize: 13, fontWeight: '600'},
  categorySection: {flexDirection: 'row', alignItems: 'center'},
  pieWrapper: {marginRight: 16},
  legendList: {flex: 1},
  legendItem: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  legendIcon: {width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10},
  legendContent: {flex: 1},
  legendName: {fontSize: 12, fontWeight: '500', marginBottom: 4},
  legendBar: {height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2},
  legendBarFill: {height: '100%', borderRadius: 2},
  legendValues: {alignItems: 'flex-end', marginLeft: 8},
  legendPercent: {fontSize: 12, fontWeight: '700'},
  legendAmount: {fontSize: 10, marginTop: 2},
  emptyChart: {alignItems: 'center', paddingVertical: 24},
  emptyChartText: {fontSize: 14, marginTop: 8},
  // Recent transactions
  recentCard: {marginBottom: 16},
  recentHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12},
  recentList: {},
  transactionItem: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1},
  transactionIcon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  transactionContent: {flex: 1, marginLeft: 12},
  transactionLabel: {fontSize: 14, fontWeight: '500'},
  transactionDate: {fontSize: 12, marginTop: 2},
  transactionAmount: {fontSize: 15, fontWeight: '700'},
  emptyRecent: {alignItems: 'center', paddingVertical: 32},
  emptyText: {fontSize: 14, marginTop: 8},
});

export default DashboardScreen;
