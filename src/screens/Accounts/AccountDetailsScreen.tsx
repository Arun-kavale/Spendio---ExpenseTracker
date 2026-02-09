/**
 * Account Details Screen
 *
 * Shows detailed account information, transaction history, and analytics.
 */

import React, {memo, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown, FadeInUp} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useAccountStore, useExpenseStore, useIncomeStore, useTransferStore} from '@/store';
import {Card, StickyHeader} from '@/components/common';
import {GradientHeader} from '@/components/gradient';
import {RootStackParamList} from '@/types';
import {getAccountCategoryInfo} from '@/constants';
import {format, parseISO, startOfMonth, endOfMonth} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountDetails'>;
type RouteType = RouteProp<RootStackParamList, 'AccountDetails'>;

export const AccountDetailsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {formatAmount} = useCurrency();

  const {accountId} = route.params;
  const {getAccountById, deleteAccount, toggleAccountActive, setDefaultAccount} =
    useAccountStore();
  const {expenses} = useExpenseStore();
  const {incomes} = useIncomeStore();
  const {transfers} = useTransferStore();

  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 100});

  const account = getAccountById(accountId);
  const categoryInfo = account ? getAccountCategoryInfo(account.category) : null;

  // Calculate account statistics
  const stats = useMemo(() => {
    if (!account) {
      return {
        totalExpenses: 0,
        totalIncome: 0,
        transfersIn: 0,
        transfersOut: 0,
        monthlyExpenses: 0,
        monthlyIncome: 0,
        transactionCount: 0,
      };
    }

    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    // Expenses linked to this account
    const accountExpenses = expenses.filter(e => e.accountId === accountId);
    const monthlyAccountExpenses = accountExpenses.filter(e => {
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Income linked to this account
    const accountIncomes = incomes.filter(i => i.accountId === accountId);
    const monthlyAccountIncomes = accountIncomes.filter(i => {
      const d = parseISO(i.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Transfers involving this account
    const transfersIn = transfers.filter(t => t.toAccountId === accountId);
    const transfersOut = transfers.filter(t => t.fromAccountId === accountId);

    return {
      totalExpenses: accountExpenses.reduce((s, e) => s + e.amount, 0),
      totalIncome: accountIncomes.reduce((s, i) => s + i.amount, 0),
      transfersIn: transfersIn.reduce((s, t) => s + t.amount, 0),
      transfersOut: transfersOut.reduce((s, t) => s + t.amount, 0),
      monthlyExpenses: monthlyAccountExpenses.reduce((s, e) => s + e.amount, 0),
      monthlyIncome: monthlyAccountIncomes.reduce((s, i) => s + i.amount, 0),
      transactionCount:
        accountExpenses.length +
        accountIncomes.length +
        transfersIn.length +
        transfersOut.length,
    };
  }, [account, accountId, expenses, incomes, transfers]);

  const handleEdit = useCallback(() => {
    navigation.navigate('AddAccount', {accountId});
  }, [navigation, accountId]);

  const handleDelete = useCallback(() => {
    if (!account) {
      return;
    }
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This will not delete associated transactions.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount(accountId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [account, accountId, deleteAccount, navigation]);

  const handleToggleActive = useCallback(() => {
    toggleAccountActive(accountId);
  }, [accountId, toggleAccountActive]);

  const handleSetDefault = useCallback(() => {
    setDefaultAccount(account?.isDefault ? '' : accountId);
  }, [account?.isDefault, accountId, setDefaultAccount]);

  if (!account || !categoryInfo) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.centered, {paddingTop: insets.top + 100}]}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.errorText, {color: theme.colors.text}]}>
            Account not found
          </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={[styles.goBackText, {color: theme.colors.primary}]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const topBar = (
    <View style={styles.stickyTopBar}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <Icon name="arrow-left" size={22} color={theme.colors.text} />
      </Pressable>
      <Text style={[styles.stickyTitle, {color: theme.colors.text}]} numberOfLines={1}>
        {account.name}
      </Text>
      <Pressable onPress={handleEdit} hitSlop={8}>
        <Icon name="pencil" size={20} color={theme.colors.primary} />
      </Pressable>
    </View>
  );

  const collapsedContent = (
    <View style={styles.collapsedSummary}>
      <Text style={[styles.collapsedLabel, {color: theme.colors.textSecondary}]}>
        {categoryInfo.label}
      </Text>
      <Text
        style={[
          styles.collapsedValue,
          {
            color:
              account.category === 'credit_card'
                ? theme.colors.expense
                : account.currentBalance >= 0
                ? theme.colors.income
                : theme.colors.expense,
          },
        ]}>
        {account.category === 'credit_card'
          ? formatAmount(account.outstandingBalance || 0)
          : formatAmount(account.currentBalance)}
      </Text>
    </View>
  );

  const dividerStyle = dividerOpacity;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <GradientHeader height={160} />

      <StickyHeader
        topBar={topBar}
        collapsedContent={collapsedContent}
        collapsedStyle={collapsedSummaryStyle}
        dividerStyle={dividerStyle}
        shadowStyle={headerShadowStyle}
        backgroundColor={theme.colors.background}
        paddingTop={insets.top + 4}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 100}]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Account Header Card */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          <Card style={styles.headerCard} padding="large">
            <View style={styles.accountHeader}>
              <View
                style={[styles.accountIcon, {backgroundColor: account.color + '20'}]}>
                <Icon name={account.icon} size={36} color={account.color} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, {color: theme.colors.text}]}>
                  {account.name}
                </Text>
                <Text style={[styles.accountType, {color: theme.colors.textSecondary}]}>
                  {categoryInfo.label}
                  {account.bankName ? ` • ${account.bankName}` : ''}
                </Text>
                {account.lastFourDigits && (
                  <Text style={[styles.accountNumber, {color: theme.colors.textMuted}]}>
                    ••••{account.lastFourDigits}
                  </Text>
                )}
              </View>
              <View style={styles.badges}>
                {account.isDefault && (
                  <View style={[styles.badge, {backgroundColor: theme.colors.primary + '20'}]}>
                    <Icon name="star" size={12} color={theme.colors.primary} />
                    <Text style={[styles.badgeText, {color: theme.colors.primary}]}>
                      Default
                    </Text>
                  </View>
                )}
                {!account.isActive && (
                  <View style={[styles.badge, {backgroundColor: theme.colors.textMuted + '20'}]}>
                    <Icon name="eye-off" size={12} color={theme.colors.textMuted} />
                    <Text style={[styles.badgeText, {color: theme.colors.textMuted}]}>
                      Hidden
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.divider, {backgroundColor: theme.colors.border}]} />

            {/* Balance */}
            <View style={styles.balanceSection}>
              <Text style={[styles.balanceLabel, {color: theme.colors.textSecondary}]}>
                {account.category === 'credit_card' ? 'Outstanding' : 'Current Balance'}
              </Text>
              <Text
                style={[
                  styles.balanceAmount,
                  {
                    color:
                      account.category === 'credit_card'
                        ? theme.colors.expense
                        : account.currentBalance >= 0
                        ? theme.colors.income
                        : theme.colors.expense,
                  },
                ]}>
                {account.category === 'credit_card'
                  ? formatAmount(account.outstandingBalance || 0)
                  : formatAmount(account.currentBalance)}
              </Text>
              {account.category === 'credit_card' && account.creditLimit && (
                <View style={styles.creditInfo}>
                  <Text style={[styles.creditLabel, {color: theme.colors.textMuted}]}>
                    Credit Limit: {formatAmount(account.creditLimit)}
                  </Text>
                  <View style={[styles.creditBar, {backgroundColor: theme.colors.surfaceVariant}]}>
                    <View
                      style={[
                        styles.creditUsed,
                        {
                          backgroundColor: theme.colors.expense,
                          width: `${Math.min(
                            ((account.outstandingBalance || 0) / account.creditLimit) * 100,
                            100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} padding="medium">
              <Icon name="arrow-down" size={20} color={theme.colors.income} />
              <Text style={[styles.statValue, {color: theme.colors.income}]}>
                {formatAmount(stats.totalIncome)}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                Total Income
              </Text>
            </Card>
            <Card style={styles.statCard} padding="medium">
              <Icon name="arrow-up" size={20} color={theme.colors.expense} />
              <Text style={[styles.statValue, {color: theme.colors.expense}]}>
                {formatAmount(stats.totalExpenses)}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                Total Expenses
              </Text>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} padding="medium">
              <Icon name="swap-horizontal" size={20} color={theme.colors.transfer} />
              <Text style={[styles.statValue, {color: theme.colors.transfer}]}>
                {formatAmount(stats.transfersIn)}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                Transfers In
              </Text>
            </Card>
            <Card style={styles.statCard} padding="medium">
              <Icon name="swap-horizontal" size={20} color={theme.colors.transfer} />
              <Text style={[styles.statValue, {color: theme.colors.transfer}]}>
                {formatAmount(stats.transfersOut)}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                Transfers Out
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* This Month */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.monthCard} padding="medium">
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              This Month ({format(new Date(), 'MMM yyyy')})
            </Text>
            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Icon name="trending-up" size={18} color={theme.colors.income} />
                <Text style={[styles.monthValue, {color: theme.colors.text}]}>
                  {formatAmount(stats.monthlyIncome)}
                </Text>
                <Text style={[styles.monthLabel, {color: theme.colors.textMuted}]}>
                  Income
                </Text>
              </View>
              <View style={[styles.monthDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.monthStat}>
                <Icon name="trending-down" size={18} color={theme.colors.expense} />
                <Text style={[styles.monthValue, {color: theme.colors.text}]}>
                  {formatAmount(stats.monthlyExpenses)}
                </Text>
                <Text style={[styles.monthLabel, {color: theme.colors.textMuted}]}>
                  Expenses
                </Text>
              </View>
              <View style={[styles.monthDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.monthStat}>
                <Icon name="file-document-outline" size={18} color={theme.colors.info} />
                <Text style={[styles.monthValue, {color: theme.colors.text}]}>
                  {stats.transactionCount}
                </Text>
                <Text style={[styles.monthLabel, {color: theme.colors.textMuted}]}>
                  Transactions
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Credit Card Details */}
        {account.category === 'credit_card' && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={styles.detailsCard} padding="medium">
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Card Details
              </Text>
              {account.billDueDate && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                    Bill Due Date
                  </Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                    {account.billDueDate}th of every month
                  </Text>
                </View>
              )}
              {account.statementDate && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                    Statement Date
                  </Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                    {account.statementDate}th of every month
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Bank Details */}
        {(account.ifscCode || account.branchName) && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={styles.detailsCard} padding="medium">
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Bank Details
              </Text>
              {account.ifscCode && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                    IFSC Code
                  </Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                    {account.ifscCode}
                  </Text>
                </View>
              )}
              {account.branchName && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                    Branch
                  </Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                    {account.branchName}
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card style={styles.actionsCard} padding="medium">
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Actions
            </Text>
            <Pressable onPress={handleSetDefault} style={styles.actionRow}>
              <Icon
                name={account.isDefault ? 'star' : 'star-outline'}
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.actionText, {color: theme.colors.text}]}>
                {account.isDefault ? 'Remove as Default' : 'Set as Default'}
              </Text>
              <Icon name="chevron-right" size={22} color={theme.colors.textMuted} />
            </Pressable>
            <View style={[styles.actionDivider, {backgroundColor: theme.colors.border}]} />
            <Pressable onPress={handleToggleActive} style={styles.actionRow}>
              <Icon
                name={account.isActive ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.colors.info}
              />
              <Text style={[styles.actionText, {color: theme.colors.text}]}>
                {account.isActive ? 'Hide Account' : 'Show Account'}
              </Text>
              <Icon name="chevron-right" size={22} color={theme.colors.textMuted} />
            </Pressable>
            <View style={[styles.actionDivider, {backgroundColor: theme.colors.border}]} />
            <Pressable onPress={handleDelete} style={styles.actionRow}>
              <Icon name="delete-outline" size={22} color={theme.colors.error} />
              <Text style={[styles.actionText, {color: theme.colors.error}]}>
                Delete Account
              </Text>
              <Icon name="chevron-right" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </Card>
        </Animated.View>

        {/* Created Info */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View style={styles.footer}>
            <Text style={[styles.footerText, {color: theme.colors.textMuted}]}>
              Created {format(new Date(account.createdAt), 'MMM d, yyyy')}
            </Text>
            <Text style={[styles.footerText, {color: theme.colors.textMuted}]}>
              Last updated {format(new Date(account.updatedAt), 'MMM d, yyyy')}
            </Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
});

AccountDetailsScreen.displayName = 'AccountDetailsScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  errorText: {fontSize: 18, fontWeight: '600', marginTop: 16},
  goBackText: {fontSize: 16, fontWeight: '500', marginTop: 12},
  stickyTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stickyTitle: {flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center', marginHorizontal: 8},
  collapsedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedLabel: {fontSize: 13, fontWeight: '500'},
  collapsedValue: {fontSize: 13, fontWeight: '700'},
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  headerCard: {marginBottom: 16},
  accountHeader: {flexDirection: 'row', alignItems: 'flex-start'},
  accountIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {flex: 1, marginLeft: 16},
  accountName: {fontSize: 20, fontWeight: '700'},
  accountType: {fontSize: 14, marginTop: 2},
  accountNumber: {fontSize: 13, marginTop: 4},
  badges: {alignItems: 'flex-end', gap: 4},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {fontSize: 11, fontWeight: '600'},
  divider: {height: 1, marginVertical: 16},
  balanceSection: {alignItems: 'center'},
  balanceLabel: {fontSize: 14},
  balanceAmount: {fontSize: 36, fontWeight: '700', marginTop: 4},
  creditInfo: {width: '100%', marginTop: 12},
  creditLabel: {fontSize: 12, textAlign: 'center', marginBottom: 6},
  creditBar: {height: 6, borderRadius: 3, overflow: 'hidden'},
  creditUsed: {height: '100%', borderRadius: 3},
  statsGrid: {flexDirection: 'row', gap: 12, marginBottom: 12},
  statCard: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: 18, fontWeight: '700', marginTop: 6},
  statLabel: {fontSize: 11, marginTop: 2},
  monthCard: {marginBottom: 12},
  sectionTitle: {fontSize: 15, fontWeight: '600', marginBottom: 12},
  monthStats: {flexDirection: 'row', alignItems: 'center'},
  monthStat: {flex: 1, alignItems: 'center'},
  monthValue: {fontSize: 16, fontWeight: '700', marginTop: 4},
  monthLabel: {fontSize: 11, marginTop: 2},
  monthDivider: {width: 1, height: 40},
  detailsCard: {marginBottom: 12},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {fontSize: 14},
  detailValue: {fontSize: 14, fontWeight: '600'},
  actionsCard: {marginBottom: 16},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionText: {flex: 1, fontSize: 15, fontWeight: '500'},
  actionDivider: {height: 1},
  footer: {alignItems: 'center', paddingVertical: 16},
  footerText: {fontSize: 12, marginTop: 4},
});

export default AccountDetailsScreen;
