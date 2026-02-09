/**
 * Statistics Screen
 *
 * Shows app-wide data counts, all-time totals, and month-over-month comparison.
 */

import React, {memo, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme, useCurrency} from '@/hooks';
import {Card, AdvancedHeader} from '@/components/common';
import {useExpenseStore, useIncomeStore, useAccountStore, useTransferStore, useBudgetStore, useCategoryStore} from '@/store';
import {formatMonth} from '@/utils';

export const StatisticsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {formatAmount} = useCurrency();

  const expenses = useExpenseStore(state => state.expenses);
  const incomes = useIncomeStore(state => state.incomes);
  const accounts = useAccountStore(state => state.accounts);
  const transfers = useTransferStore(state => state.transfers);
  const budgets = useBudgetStore(state => state.budgets);
  const categories = useCategoryStore(state => state.categories);

  const getTotalExpenses = useExpenseStore(state => state.getTotalExpenses);
  const getTotalIncome = useIncomeStore(state => state.getTotalIncome);
  const getComparisonStats = useExpenseStore(state => state.getComparisonStats);

  const comparisonStats = useMemo(() => getComparisonStats(), [getComparisonStats, expenses]);
  const allTimeExpenses = useMemo(() => getTotalExpenses(), [getTotalExpenses, expenses]);
  const allTimeIncome = useMemo(() => getTotalIncome(), [getTotalIncome, incomes]);

  const formatPercentage = (value: number) =>
    value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;

  const statRows = [
    {icon: 'cash-minus' as const, label: 'Expenses', value: expenses.length, color: theme.colors.expense},
    {icon: 'cash-plus' as const, label: 'Income entries', value: incomes.length, color: theme.colors.income},
    {icon: 'wallet' as const, label: 'Accounts', value: accounts.length, color: theme.colors.primary},
    {icon: 'swap-horizontal' as const, label: 'Transfers', value: transfers.length, color: theme.colors.transfer},
    {icon: 'chart-pie' as const, label: 'Budgets', value: budgets.length, color: theme.colors.primary},
    {icon: 'shape-outline' as const, label: 'Categories', value: categories.length, color: theme.colors.primary},
  ];

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="Statistics"
        showBack
        onBack={() => navigation.goBack()}
        variant="elevated"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}
        showsVerticalScrollIndicator={false}>
        {/* Data counts */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Data overview
            </Text>
            <Text style={[styles.sectionSubtitle, {color: theme.colors.textSecondary}]}>
              Total records in your app
            </Text>
            {statRows.map((row, index) => (
              <View key={row.label} style={[styles.statRow, index < statRows.length - 1 && styles.statRowBorder, {borderBottomColor: theme.colors.border}]}>
                <View style={[styles.statIconWrap, {backgroundColor: row.color + '18'}]}>
                  <Icon name={row.icon} size={20} color={row.color} />
                </View>
                <Text style={[styles.statLabel, {color: theme.colors.text}]}>{row.label}</Text>
                <Text style={[styles.statValue, {color: theme.colors.text}]}>{row.value}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* All-time totals */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              All-time totals
            </Text>
            <View style={styles.totalsRow}>
              <View style={[styles.totalItem, {borderColor: theme.colors.border}]}>
                <Icon name="cash-minus" size={24} color={theme.colors.expense} />
                <Text style={[styles.totalLabel, {color: theme.colors.textSecondary}]}>Total expenses</Text>
                <Text style={[styles.totalAmount, {color: theme.colors.expense}]}>
                  {formatAmount(allTimeExpenses)}
                </Text>
              </View>
              <View style={[styles.totalItem, {borderColor: theme.colors.border}]}>
                <Icon name="cash-plus" size={24} color={theme.colors.income} />
                <Text style={[styles.totalLabel, {color: theme.colors.textSecondary}]}>Total income</Text>
                <Text style={[styles.totalAmount, {color: theme.colors.income}]}>
                  {formatAmount(allTimeIncome)}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Month comparison */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card padding="large" style={styles.card}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Expense comparison
            </Text>
            <Text style={[styles.sectionSubtitle, {color: theme.colors.textSecondary}]}>
              This month vs last month
            </Text>

            <View style={[styles.monthCard, {backgroundColor: theme.colors.surfaceVariant}]}>
              <Text style={[styles.monthLabel, {color: theme.colors.textSecondary}]}>
                {formatMonth(comparisonStats.currentMonth.month)}
              </Text>
              <Text style={[styles.monthAmount, {color: theme.colors.text}]}>
                {formatAmount(comparisonStats.currentMonth.total)}
              </Text>
              <Text style={[styles.monthCount, {color: theme.colors.textMuted}]}>
                {comparisonStats.currentMonth.count} transactions
              </Text>
            </View>

            <View style={[styles.monthCard, {backgroundColor: theme.colors.surfaceVariant}]}>
              <Text style={[styles.monthLabel, {color: theme.colors.textSecondary}]}>
                {formatMonth(comparisonStats.previousMonth.month)}
              </Text>
              <Text style={[styles.monthAmount, {color: theme.colors.text}]}>
                {formatAmount(comparisonStats.previousMonth.total)}
              </Text>
              <Text style={[styles.monthCount, {color: theme.colors.textMuted}]}>
                {comparisonStats.previousMonth.count} transactions
              </Text>
            </View>

            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor:
                    comparisonStats.trend === 'down'
                      ? theme.colors.income + '20'
                      : comparisonStats.trend === 'up'
                        ? theme.colors.expense + '20'
                        : theme.colors.textMuted + '20',
                },
              ]}>
              <Icon
                name={
                  comparisonStats.trend === 'up'
                    ? 'trending-up'
                    : comparisonStats.trend === 'down'
                      ? 'trending-down'
                      : 'minus'
                }
                size={20}
                color={
                  comparisonStats.trend === 'down'
                    ? theme.colors.income
                    : comparisonStats.trend === 'up'
                      ? theme.colors.expense
                      : theme.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      comparisonStats.trend === 'down'
                        ? theme.colors.income
                        : comparisonStats.trend === 'up'
                          ? theme.colors.expense
                          : theme.colors.textMuted,
                  },
                ]}>
                {formatPercentage(comparisonStats.percentageChange)}{' '}
                {comparisonStats.trend === 'up'
                  ? 'more'
                  : comparisonStats.trend === 'down'
                    ? 'less'
                    : 'same'}{' '}
                than last month
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
});

StatisticsScreen.displayName = 'StatisticsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  totalItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  monthAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  monthCount: {
    fontSize: 12,
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StatisticsScreen;
