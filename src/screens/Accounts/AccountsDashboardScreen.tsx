/**
 * Accounts Dashboard Screen
 *
 * Provides a comprehensive overview of all accounts with charts,
 * balance trends, and account-wise transaction breakdown.
 */

import React, {memo, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useAccountStore, useExpenseStore, useIncomeStore, useTransferStore} from '@/store';
import {Card} from '@/components/common';
import {RootStackParamList, UserAccount, AccountCategory} from '@/types';
import {getAccountCategoryInfo, ACCOUNT_CATEGORIES} from '@/constants';
import {startOfMonth, endOfMonth, parseISO, isWithinInterval} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountsDashboard'>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const CategoryBalanceCard = memo<{
  category: AccountCategory;
  accounts: UserAccount[];
  totalBalance: number;
  colors: ReturnType<typeof useTheme>['colors'];
  formatAmount: (amount: number) => string;
  onPress: () => void;
}>(({category, accounts, totalBalance, colors, formatAmount, onPress}) => {
  const categoryInfo = getAccountCategoryInfo(category);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.categoryCard} padding="medium">
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, {backgroundColor: categoryInfo.color + '15'}]}>
            <Icon name={categoryInfo.icon} size={20} color={categoryInfo.color} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryLabel, {color: colors.text}]}>
              {categoryInfo.label}
            </Text>
            <Text style={[styles.categoryCount, {color: colors.textMuted}]}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text
            style={[
              styles.categoryBalance,
              {
                color:
                  category === 'credit_card'
                    ? colors.expense
                    : totalBalance >= 0
                    ? colors.income
                    : colors.expense,
              },
            ]}>
            {formatAmount(Math.abs(totalBalance))}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
});

CategoryBalanceCard.displayName = 'CategoryBalanceCard';

const QuickAccountCard = memo<{
  account: UserAccount;
  colors: ReturnType<typeof useTheme>['colors'];
  formatAmount: (amount: number) => string;
  onPress: () => void;
}>(({account, colors, formatAmount, onPress}) => {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.quickCard} padding="small">
        <View style={[styles.quickIcon, {backgroundColor: account.color + '15'}]}>
          <Icon name={account.icon} size={18} color={account.color} />
        </View>
        <Text style={[styles.quickName, {color: colors.text}]} numberOfLines={1}>
          {account.name}
        </Text>
        <Text
          style={[
            styles.quickBalance,
            {
              color:
                account.category === 'credit_card'
                  ? colors.expense
                  : account.currentBalance >= 0
                  ? colors.income
                  : colors.expense,
            },
          ]}>
          {account.category === 'credit_card'
            ? formatAmount(account.outstandingBalance || 0)
            : formatAmount(account.currentBalance)}
        </Text>
      </Card>
    </Pressable>
  );
});

QuickAccountCard.displayName = 'QuickAccountCard';

export const AccountsDashboardScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount} = useCurrency();

  const {accounts, getTotalBalance} = useAccountStore();
  const {expenses} = useExpenseStore();
  const {incomes} = useIncomeStore();
  const {transfers} = useTransferStore();

  // Calculate balances by category
  const categoryBalances = useMemo(() => {
    const balances: Record<AccountCategory, {accounts: UserAccount[]; total: number}> = {
      cash: {accounts: [], total: 0},
      bank: {accounts: [], total: 0},
      credit_card: {accounts: [], total: 0},
      debit_card: {accounts: [], total: 0},
      upi: {accounts: [], total: 0},
      wallet: {accounts: [], total: 0},
      other: {accounts: [], total: 0},
    };

    accounts.filter(a => a.isActive).forEach(acc => {
      balances[acc.category].accounts.push(acc);
      if (acc.category === 'credit_card') {
        balances[acc.category].total -= acc.outstandingBalance || 0;
      } else {
        balances[acc.category].total += acc.currentBalance;
      }
    });

    return balances;
  }, [accounts]);

  // This month's transaction summary
  const monthlyStats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const monthExpenses = expenses.filter(e =>
      isWithinInterval(parseISO(e.date), {start: monthStart, end: monthEnd}),
    );
    const monthIncomes = incomes.filter(i =>
      isWithinInterval(parseISO(i.date), {start: monthStart, end: monthEnd}),
    );
    const monthTransfers = transfers.filter(t =>
      isWithinInterval(parseISO(t.date), {start: monthStart, end: monthEnd}),
    );

    return {
      totalExpenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
      totalIncome: monthIncomes.reduce((s, i) => s + i.amount, 0),
      totalTransfers: monthTransfers.reduce((s, t) => s + t.amount, 0),
      expenseCount: monthExpenses.length,
      incomeCount: monthIncomes.length,
      transferCount: monthTransfers.length,
    };
  }, [expenses, incomes, transfers]);

  const totalBalance = useMemo(() => getTotalBalance(), [accounts, getTotalBalance]);

  const handleAccountPress = useCallback(
    (accountId: string) => {
      navigation.navigate('AccountDetails', {accountId});
    },
    [navigation],
  );

  const handleViewAllAccounts = useCallback(() => {
    navigation.navigate('AccountsList');
  }, [navigation]);

  const handleAddAccount = useCallback(() => {
    navigation.navigate('AddAccount', {});
  }, [navigation]);

  // Top 5 accounts by balance
  const topAccounts = useMemo(() => {
    return [...accounts]
      .filter(a => a.isActive)
      .sort((a, b) => {
        const aBalance =
          a.category === 'credit_card' ? -(a.outstandingBalance || 0) : a.currentBalance;
        const bBalance =
          b.category === 'credit_card' ? -(b.outstandingBalance || 0) : b.currentBalance;
        return Math.abs(bBalance) - Math.abs(aBalance);
      })
      .slice(0, 5);
  }, [accounts]);

  // Categories with accounts
  const activeCategories = ACCOUNT_CATEGORIES.filter(
    cat => categoryBalances[cat.id].accounts.length > 0,
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Simple Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Accounts
        </Text>
        <Pressable onPress={handleAddAccount} hitSlop={8}>
          <Icon name="plus" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 100}]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Net Worth Card */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          <Card style={styles.netWorthCard} padding="large">
            <Text style={[styles.netWorthLabel, {color: theme.colors.textSecondary}]}>
              Total Net Worth
            </Text>
            <Text
              style={[
                styles.netWorthAmount,
                {color: totalBalance >= 0 ? theme.colors.income : theme.colors.expense},
              ]}>
              {formatAmount(totalBalance)}
            </Text>
            <View style={styles.netWorthStats}>
              <View style={styles.netStat}>
                <Icon name="bank-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.netStatValue, {color: theme.colors.text}]}>
                  {accounts.filter(a => a.isActive).length}
                </Text>
                <Text style={[styles.netStatLabel, {color: theme.colors.textMuted}]}>
                  Accounts
                </Text>
              </View>
              <View style={[styles.netStatDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.netStat}>
                <Icon name="arrow-down" size={18} color={theme.colors.income} />
                <Text style={[styles.netStatValue, {color: theme.colors.text}]}>
                  {formatAmount(monthlyStats.totalIncome)}
                </Text>
                <Text style={[styles.netStatLabel, {color: theme.colors.textMuted}]}>
                  Income
                </Text>
              </View>
              <View style={[styles.netStatDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.netStat}>
                <Icon name="arrow-up" size={18} color={theme.colors.expense} />
                <Text style={[styles.netStatValue, {color: theme.colors.text}]}>
                  {formatAmount(monthlyStats.totalExpenses)}
                </Text>
                <Text style={[styles.netStatLabel, {color: theme.colors.textMuted}]}>
                  Expenses
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Access - Top Accounts */}
        {topAccounts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Quick Access
              </Text>
              <Pressable onPress={handleViewAllAccounts}>
                <Text style={[styles.viewAllText, {color: theme.colors.primary}]}>
                  View All
                </Text>
              </Pressable>
            </View>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickScroll}>
              {topAccounts.map(account => (
                <QuickAccountCard
                  key={account.id}
                  account={account}
                  colors={theme.colors}
                  formatAmount={formatAmount}
                  onPress={() => handleAccountPress(account.id)}
                />
              ))}
            </Animated.ScrollView>
          </Animated.View>
        )}

        {/* Balance by Category */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text, marginTop: 16}]}>
            Balance by Category
          </Text>
          {activeCategories.length === 0 ? (
            <Card style={styles.emptyCard} padding="large">
              <Icon name="wallet-plus-outline" size={48} color={theme.colors.textMuted} />
              <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
                No Accounts Yet
              </Text>
              <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
                Add accounts to see your balance breakdown
              </Text>
              <Pressable
                onPress={handleAddAccount}
                style={[styles.addButton, {backgroundColor: theme.colors.primary}]}>
                <Icon name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Account</Text>
              </Pressable>
            </Card>
          ) : (
            activeCategories.map(cat => (
              <CategoryBalanceCard
                key={cat.id}
                category={cat.id}
                accounts={categoryBalances[cat.id].accounts}
                totalBalance={categoryBalances[cat.id].total}
                colors={theme.colors}
                formatAmount={formatAmount}
                onPress={handleViewAllAccounts}
              />
            ))
          )}
        </Animated.View>

        {/* Monthly Summary */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text, marginTop: 16}]}>
            This Month's Activity
          </Text>
          <View style={styles.activityGrid}>
            <Card style={styles.activityCard} padding="medium">
              <Icon name="arrow-down-circle" size={28} color={theme.colors.income} />
              <Text style={[styles.activityValue, {color: theme.colors.income}]}>
                {formatAmount(monthlyStats.totalIncome)}
              </Text>
              <Text style={[styles.activityLabel, {color: theme.colors.textMuted}]}>
                {monthlyStats.incomeCount} income entries
              </Text>
            </Card>
            <Card style={styles.activityCard} padding="medium">
              <Icon name="arrow-up-circle" size={28} color={theme.colors.expense} />
              <Text style={[styles.activityValue, {color: theme.colors.expense}]}>
                {formatAmount(monthlyStats.totalExpenses)}
              </Text>
              <Text style={[styles.activityLabel, {color: theme.colors.textMuted}]}>
                {monthlyStats.expenseCount} expenses
              </Text>
            </Card>
          </View>
          <Card style={styles.transferCard} padding="medium">
            <View style={styles.transferRow}>
              <Icon name="swap-horizontal" size={24} color={theme.colors.transfer} />
              <View style={styles.transferInfo}>
                <Text style={[styles.transferValue, {color: theme.colors.text}]}>
                  {formatAmount(monthlyStats.totalTransfers)}
                </Text>
                <Text style={[styles.transferLabel, {color: theme.colors.textMuted}]}>
                  {monthlyStats.transferCount} transfers this month
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('TransferList')}
                style={[styles.viewButton, {backgroundColor: theme.colors.transfer + '15'}]}>
                <Text style={[styles.viewButtonText, {color: theme.colors.transfer}]}>
                  View
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text, marginTop: 16}]}>
            Quick Actions
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleAddAccount}
              style={[styles.actionButton, {backgroundColor: theme.colors.primary + '15'}]}>
              <Icon name="plus-circle" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionLabel, {color: theme.colors.primary}]}>
                Add Account
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('AddTransfer', {})}
              style={[styles.actionButton, {backgroundColor: theme.colors.transfer + '15'}]}>
              <Icon name="swap-horizontal" size={24} color={theme.colors.transfer} />
              <Text style={[styles.actionLabel, {color: theme.colors.transfer}]}>
                Transfer
              </Text>
            </Pressable>
            <Pressable
              onPress={handleViewAllAccounts}
              style={[styles.actionButton, {backgroundColor: theme.colors.info + '15'}]}>
              <Icon name="format-list-bulleted" size={24} color={theme.colors.info} />
              <Text style={[styles.actionLabel, {color: theme.colors.info}]}>
                All Accounts
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
});

AccountsDashboardScreen.displayName = 'AccountsDashboardScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  netWorthCard: {marginBottom: 20, alignItems: 'center'},
  netWorthLabel: {fontSize: 14},
  netWorthAmount: {fontSize: 40, fontWeight: '700', marginTop: 4},
  netWorthStats: {flexDirection: 'row', alignItems: 'center', marginTop: 20},
  netStat: {flex: 1, alignItems: 'center'},
  netStatValue: {fontSize: 14, fontWeight: '600', marginTop: 4},
  netStatLabel: {fontSize: 11, marginTop: 2},
  netStatDivider: {width: 1, height: 36},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {fontSize: 16, fontWeight: '600', marginBottom: 8},
  viewAllText: {fontSize: 14, fontWeight: '500'},
  quickScroll: {paddingRight: 16, gap: 12},
  quickCard: {width: 120, alignItems: 'center'},
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickName: {fontSize: 13, fontWeight: '500', textAlign: 'center'},
  quickBalance: {fontSize: 14, fontWeight: '700', marginTop: 2},
  categoryCard: {marginBottom: 8},
  categoryHeader: {flexDirection: 'row', alignItems: 'center'},
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {flex: 1, marginLeft: 12},
  categoryLabel: {fontSize: 15, fontWeight: '600'},
  categoryCount: {fontSize: 12, marginTop: 2},
  categoryBalance: {fontSize: 16, fontWeight: '700'},
  emptyCard: {alignItems: 'center', paddingVertical: 40},
  emptyTitle: {fontSize: 18, fontWeight: '600', marginTop: 12},
  emptySubtitle: {fontSize: 14, marginTop: 4, textAlign: 'center'},
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    gap: 6,
  },
  addButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  activityGrid: {flexDirection: 'row', gap: 12, marginBottom: 12},
  activityCard: {flex: 1, alignItems: 'center'},
  activityValue: {fontSize: 20, fontWeight: '700', marginTop: 8},
  activityLabel: {fontSize: 11, marginTop: 4},
  transferCard: {},
  transferRow: {flexDirection: 'row', alignItems: 'center'},
  transferInfo: {flex: 1, marginLeft: 12},
  transferValue: {fontSize: 18, fontWeight: '700'},
  transferLabel: {fontSize: 12, marginTop: 2},
  viewButton: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16},
  viewButtonText: {fontSize: 13, fontWeight: '600'},
  actionsRow: {flexDirection: 'row', gap: 12},
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionLabel: {fontSize: 12, fontWeight: '500', marginTop: 6},
});

export default AccountsDashboardScreen;
