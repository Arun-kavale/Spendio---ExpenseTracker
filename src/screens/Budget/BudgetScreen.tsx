/**
 * Budget Dashboard Screen
 * 
 * Shows monthly budget overview with category-wise progress bars,
 * over-budget warnings, and visual charts.
 * 
 * Features a collapsible sticky header:
 *  - Back button, title, add button always visible
 *  - Month selector always visible (critical context)
 *  - Compact budget summary fades into sticky header when scrolled
 */

import React, {memo, useMemo, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown, FadeIn, SlideInRight} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useBudgetStore, useExpenseStore} from '@/store';
import {Card, EmptyState, StickyHeader} from '@/components/common';
import {RootStackParamList, BudgetWithProgress} from '@/types';
import {formatMonth} from '@/utils';
import {format, addMonths, subMonths} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

const BudgetProgressBar = memo<{
  budget: BudgetWithProgress;
  index: number;
  onDelete: () => void;
}>(({budget, index, onDelete}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  const percentage = Math.min(budget.percentage, 100);
  const barColor = budget.isOverBudget ? theme.colors.error : budget.percentage > 80 ? theme.colors.warning : budget.categoryColor;

  return (
    <Animated.View entering={SlideInRight.delay(index * 60).duration(300)}>
      <Pressable onLongPress={onDelete} style={[styles.budgetItem, {borderBottomColor: theme.colors.divider}]}>
        <View style={styles.budgetItemHeader}>
          <View style={styles.budgetItemLeft}>
            <View style={[styles.budgetIcon, {backgroundColor: budget.categoryColor + '15'}]}>
              <Icon name={budget.categoryIcon} size={18} color={budget.categoryColor} />
            </View>
            <View>
              <Text style={[styles.budgetCatName, {color: theme.colors.text}]}>{budget.categoryName}</Text>
              <Text style={[styles.budgetSpent, {color: theme.colors.textMuted}]}>
                {formatAmount(budget.spent)} of {formatAmount(budget.amount)}
              </Text>
            </View>
          </View>
          <View style={styles.budgetItemRight}>
            <Text style={[styles.budgetPercentage, {color: barColor}]}>
              {budget.percentage.toFixed(0)}%
            </Text>
            {budget.isOverBudget && <Icon name="alert-circle" size={16} color={theme.colors.error} />}
          </View>
        </View>
        <View style={[styles.progressBarBg, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Animated.View
            entering={FadeIn.delay(index * 60 + 200).duration(500)}
            style={[styles.progressBarFill, {backgroundColor: barColor, width: `${percentage}%`}]}
          />
        </View>
        <View style={styles.budgetItemFooter}>
          <Text style={[styles.budgetRemaining, {color: budget.isOverBudget ? theme.colors.error : theme.colors.income}]}>
            {budget.isOverBudget ? `Over by ${formatAmount(Math.abs(budget.remaining))}` : `${formatAmount(budget.remaining)} remaining`}
          </Text>
          {budget.rollover && (
            <View style={[styles.rolloverBadge, {backgroundColor: theme.colors.info + '15'}]}>
              <Icon name="repeat" size={10} color={theme.colors.info} />
              <Text style={[styles.rolloverText, {color: theme.colors.info}]}>Rollover</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export const BudgetScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount, formatCompact} = useCurrency();

  // Collapsible header — snap after overview card (~200px)
  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 180});

  const budgets = useBudgetStore(state => state.budgets);
  const getBudgetsForMonth = useBudgetStore(state => state.getBudgetsForMonth);
  const deleteBudget = useBudgetStore(state => state.deleteBudget);
  const expenses = useExpenseStore(state => state.expenses);

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthBudgets = useMemo(() => getBudgetsForMonth(currentMonth), [budgets, expenses, currentMonth, getBudgetsForMonth]);

  const totalBudget = useMemo(() => monthBudgets.reduce((s, b) => s + b.amount, 0), [monthBudgets]);
  const totalSpent = useMemo(() => monthBudgets.reduce((s, b) => s + b.spent, 0), [monthBudgets]);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetCount = useMemo(() => monthBudgets.filter(b => b.isOverBudget).length, [monthBudgets]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    setCurrentMonth(format(newDate, 'yyyy-MM'));
  }, [currentMonth]);

  const handleDeleteBudget = useCallback((budget: BudgetWithProgress) => {
    deleteBudget(budget.id);
  }, [deleteBudget]);

  const overallBarColor = overallPercentage > 100 ? theme.colors.error : overallPercentage > 80 ? theme.colors.warning : theme.colors.primary;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Sticky Header: title + month selector + compact summary on scroll */}
      <StickyHeader
        backgroundColor={theme.colors.background}
        paddingTop={insets.top + 6}
        shadowStyle={headerShadowStyle}
        dividerStyle={dividerOpacity}
        dividerColor={theme.colors.divider}
        topBar={
          <View>
            {/* Title row */}
            <View style={styles.headerRow}>
              <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
                <Icon name="arrow-left" size={22} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.title, {color: theme.colors.text}]}>Budgets</Text>
              <Pressable
                style={[styles.addBtn, {backgroundColor: theme.colors.primary}]}
                onPress={() => navigation.navigate('AddBudget', {month: currentMonth})}>
                <Icon name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            {/* Month selector — always visible for context */}
            <View style={styles.monthSelector}>
              <Pressable onPress={() => navigateMonth('prev')} style={styles.monthArrow}>
                <Icon name="chevron-left" size={28} color={theme.colors.text} />
              </Pressable>
              <Text style={[styles.monthText, {color: theme.colors.text}]}>{formatMonth(currentMonth)}</Text>
              <Pressable onPress={() => navigateMonth('next')} style={styles.monthArrow}>
                <Icon name="chevron-right" size={28} color={theme.colors.text} />
              </Pressable>
            </View>
          </View>
        }
        collapsedContent={
          monthBudgets.length > 0 ? (
            <View style={styles.collapsedRow}>
              <View style={styles.collapsedBudgetInfo}>
                <View style={[styles.collapsedProgressBg, {backgroundColor: theme.colors.surfaceVariant}]}>
                  <View style={[styles.collapsedProgressFill, {backgroundColor: overallBarColor, width: `${Math.min(overallPercentage, 100)}%`}]} />
                </View>
              </View>
              <Text style={[styles.collapsedBudgetText, {color: theme.colors.textSecondary}]}>
                {formatCompact(totalSpent)} / {formatCompact(totalBudget)}
              </Text>
              <Text style={[styles.collapsedPercent, {color: overallBarColor}]}>
                {overallPercentage.toFixed(0)}%
              </Text>
            </View>
          ) : undefined
        }
        collapsedStyle={monthBudgets.length > 0 ? collapsedSummaryStyle : undefined}
      />

      {/* Scrollable content with Reanimated scroll handler */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {monthBudgets.length === 0 ? (
          <EmptyState
            icon="chart-arc"
            title="No budgets set"
            description={`Set category budgets for ${formatMonth(currentMonth)} to track your spending`}
            actionLabel="Create Budget"
            onAction={() => navigation.navigate('AddBudget', {month: currentMonth})}
          />
        ) : (
          <>
            {/* Overview Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Card style={styles.overviewCard} padding="large" elevation="medium">
                <Text style={[styles.overviewLabel, {color: theme.colors.textSecondary}]}>Total Budget</Text>
                <Text style={[styles.overviewAmount, {color: theme.colors.text}]}>{formatAmount(totalBudget)}</Text>

                <View style={[styles.overviewProgressBg, {backgroundColor: theme.colors.surfaceVariant}]}>
                  <View style={[styles.overviewProgressFill, {backgroundColor: overallBarColor, width: `${Math.min(overallPercentage, 100)}%`}]} />
                </View>

                <View style={styles.overviewStats}>
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatLabel, {color: theme.colors.textMuted}]}>Spent</Text>
                    <Text style={[styles.overviewStatValue, {color: theme.colors.expense}]}>{formatAmount(totalSpent)}</Text>
                  </View>
                  <View style={styles.overviewStatDivider} />
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatLabel, {color: theme.colors.textMuted}]}>Remaining</Text>
                    <Text style={[styles.overviewStatValue, {color: totalRemaining >= 0 ? theme.colors.income : theme.colors.error}]}>
                      {formatAmount(Math.abs(totalRemaining))}
                    </Text>
                  </View>
                  <View style={styles.overviewStatDivider} />
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatLabel, {color: theme.colors.textMuted}]}>Used</Text>
                    <Text style={[styles.overviewStatValue, {color: overallBarColor}]}>{overallPercentage.toFixed(0)}%</Text>
                  </View>
                </View>

                {overBudgetCount > 0 && (
                  <View style={[styles.warningBanner, {backgroundColor: theme.colors.error + '10'}]}>
                    <Icon name="alert" size={16} color={theme.colors.error} />
                    <Text style={[styles.warningText, {color: theme.colors.error}]}>
                      {overBudgetCount} {overBudgetCount === 1 ? 'category is' : 'categories are'} over budget
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Category Budgets */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>Category Budgets</Text>
              <Card padding="none" elevation="medium">
                {monthBudgets.map((budget, index) => (
                  <BudgetProgressBar
                    key={budget.id}
                    budget={budget}
                    index={index}
                    onDelete={() => handleDeleteBudget(budget)}
                  />
                ))}
              </Card>
            </Animated.View>
          </>
        )}

        <View style={{height: 100}} />
      </Animated.ScrollView>
    </View>
  );
});

BudgetScreen.displayName = 'BudgetScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  title: {fontSize: 18, fontWeight: '700'},
  addBtn: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  monthArrow: {padding: 6},
  monthText: {fontSize: 15, fontWeight: '600', marginHorizontal: 12},
  // Collapsed compact summary
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapsedBudgetInfo: {
    flex: 1,
  },
  collapsedProgressBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  collapsedProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  collapsedBudgetText: {
    fontSize: 12,
    fontWeight: '500',
  },
  collapsedPercent: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  content: {paddingHorizontal: 16},
  overviewCard: {marginBottom: 20},
  overviewLabel: {fontSize: 14, marginBottom: 4},
  overviewAmount: {fontSize: 36, fontWeight: '700', letterSpacing: -0.5, marginBottom: 16},
  overviewProgressBg: {height: 8, borderRadius: 4, marginBottom: 20, overflow: 'hidden'},
  overviewProgressFill: {height: '100%', borderRadius: 4},
  overviewStats: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  overviewStat: {flex: 1, alignItems: 'center'},
  overviewStatDivider: {width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.08)'},
  overviewStatLabel: {fontSize: 12, marginBottom: 4},
  overviewStatValue: {fontSize: 16, fontWeight: '700'},
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  warningText: {fontSize: 13, fontWeight: '500'},
  sectionTitle: {fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4},
  budgetItem: {padding: 16, borderBottomWidth: 0.5},
  budgetItemHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  budgetItemLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  budgetIcon: {width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  budgetCatName: {fontSize: 15, fontWeight: '600'},
  budgetSpent: {fontSize: 12, marginTop: 2},
  budgetItemRight: {flexDirection: 'row', alignItems: 'center', gap: 6},
  budgetPercentage: {fontSize: 15, fontWeight: '700'},
  progressBarBg: {height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8},
  progressBarFill: {height: '100%', borderRadius: 3},
  budgetItemFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  budgetRemaining: {fontSize: 12, fontWeight: '500'},
  rolloverBadge: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4},
  rolloverText: {fontSize: 10, fontWeight: '600'},
});

export default BudgetScreen;
