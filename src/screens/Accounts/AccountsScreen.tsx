/**
 * Accounts List Screen
 *
 * Displays all user accounts with balance info and quick actions.
 * Features: Add/Edit/Delete accounts, set default, view transactions.
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useAccountStore} from '@/store';
import {Card, StickyHeader} from '@/components/common';
import {GradientHeader} from '@/components/gradient';
import {RootStackParamList, UserAccount} from '@/types';
import {getAccountCategoryInfo} from '@/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountsList'>;

const AccountCard = memo<{
  account: UserAccount;
  onPress: () => void;
  onLongPress: () => void;
  formatAmount: (amount: number) => string;
  colors: ReturnType<typeof useTheme>['colors'];
}>(({account, onPress, onLongPress, formatAmount, colors}) => {
  const categoryInfo = getAccountCategoryInfo(account.category);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <Card style={styles.accountCard} padding="medium">
        <View style={styles.accountRow}>
          <View
            style={[
              styles.accountIcon,
              {backgroundColor: account.color + '15'},
            ]}>
            <Icon name={account.icon} size={24} color={account.color} />
          </View>
          <View style={styles.accountInfo}>
            <View style={styles.accountNameRow}>
              <Text
                style={[styles.accountName, {color: colors.text}]}
                numberOfLines={1}>
                {account.name}
              </Text>
              {account.isDefault && (
                <View
                  style={[
                    styles.defaultBadge,
                    {backgroundColor: colors.primary + '20'},
                  ]}>
                  <Text style={[styles.defaultText, {color: colors.primary}]}>
                    Default
                  </Text>
                </View>
              )}
              {!account.isActive && (
                <View
                  style={[
                    styles.inactiveBadge,
                    {backgroundColor: colors.textMuted + '20'},
                  ]}>
                  <Text style={[styles.inactiveText, {color: colors.textMuted}]}>
                    Hidden
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.accountType, {color: colors.textSecondary}]}>
              {categoryInfo.label}
              {account.bankName ? ` • ${account.bankName}` : ''}
              {account.lastFourDigits ? ` ••••${account.lastFourDigits}` : ''}
            </Text>
          </View>
          <View style={styles.balanceContainer}>
            <Text
              style={[
                styles.balanceAmount,
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
            {account.category === 'credit_card' && account.creditLimit && (
              <Text style={[styles.creditLimit, {color: colors.textMuted}]}>
                of {formatAmount(account.creditLimit)}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

AccountCard.displayName = 'AccountCard';

export const AccountsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount} = useCurrency();

  const {accounts, deleteAccount, getTotalBalance, setDefaultAccount} =
    useAccountStore();

  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 100});

  // Group accounts by category
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, UserAccount[]> = {};
    const sortedAccounts = [...accounts].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    sortedAccounts.forEach(acc => {
      if (!groups[acc.category]) {
        groups[acc.category] = [];
      }
      groups[acc.category].push(acc);
    });

    return groups;
  }, [accounts]);

  const totalBalance = useMemo(() => getTotalBalance(), [accounts, getTotalBalance]);

  const handleAccountPress = useCallback(
    (accountId: string) => {
      navigation.navigate('AccountDetails', {accountId});
    },
    [navigation],
  );

  const handleAccountLongPress = useCallback(
    (account: UserAccount) => {
      Alert.alert(account.name, 'Choose an action', [
        {
          text: 'Edit',
          onPress: () => navigation.navigate('AddAccount', {accountId: account.id}),
        },
        {
          text: account.isDefault ? 'Remove Default' : 'Set as Default',
          onPress: () => setDefaultAccount(account.isDefault ? '' : account.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Account',
              `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteAccount(account.id),
                },
              ],
            );
          },
        },
        {text: 'Cancel', style: 'cancel'},
      ]);
    },
    [navigation, deleteAccount, setDefaultAccount],
  );

  const handleAddAccount = useCallback(() => {
    navigation.navigate('AddAccount', {});
  }, [navigation]);

  // Compact header content
  const topBar = (
    <View style={styles.stickyTopBar}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <Icon name="arrow-left" size={22} color={theme.colors.text} />
      </Pressable>
      <Text style={[styles.stickyTitle, {color: theme.colors.text}]}>
        My Accounts
      </Text>
      <Pressable onPress={handleAddAccount} hitSlop={8}>
        <Icon name="plus" size={22} color={theme.colors.primary} />
      </Pressable>
    </View>
  );

  const collapsedContent = (
    <View style={styles.collapsedSummary}>
      <Text style={[styles.collapsedLabel, {color: theme.colors.textSecondary}]}>
        {accounts.length} Accounts
      </Text>
      <Text style={[styles.collapsedValue, {color: theme.colors.text}]}>
        Total: {formatAmount(totalBalance)}
      </Text>
    </View>
  );

  const dividerStyle = dividerOpacity;

  const renderSection = (category: string, accountList: UserAccount[]) => {
    const categoryInfo = getAccountCategoryInfo(category as never);
    return (
      <Animated.View
        key={category}
        entering={FadeInDown.delay(100).duration(400)}>
        <View style={styles.sectionHeader}>
          <Icon name={categoryInfo.icon} size={18} color={categoryInfo.color} />
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            {categoryInfo.label}s
          </Text>
          <Text style={[styles.sectionCount, {color: theme.colors.textMuted}]}>
            ({accountList.length})
          </Text>
        </View>
        {accountList.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            onPress={() => handleAccountPress(account.id)}
            onLongPress={() => handleAccountLongPress(account)}
            formatAmount={formatAmount}
            colors={theme.colors}
          />
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <GradientHeader height={140} />

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
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + 100},
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Total Balance Card */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          <Card style={styles.balanceCard} padding="large">
            <Text
              style={[styles.balanceLabel, {color: theme.colors.textSecondary}]}>
              Total Net Balance
            </Text>
            <Text
              style={[
                styles.totalBalance,
                {color: totalBalance >= 0 ? theme.colors.income : theme.colors.expense},
              ]}>
              {formatAmount(totalBalance)}
            </Text>
            <View style={styles.balanceStats}>
              <View style={styles.statItem}>
                <Icon name="bank" size={16} color={theme.colors.primary} />
                <Text style={[styles.statValue, {color: theme.colors.text}]}>
                  {accounts.filter(a => a.isActive).length}
                </Text>
                <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                  Active
                </Text>
              </View>
              <View style={[styles.statDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.statItem}>
                <Icon name="credit-card" size={16} color={theme.colors.warning} />
                <Text style={[styles.statValue, {color: theme.colors.text}]}>
                  {accounts.filter(a => a.category === 'credit_card').length}
                </Text>
                <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                  Cards
                </Text>
              </View>
              <View style={[styles.statDivider, {backgroundColor: theme.colors.border}]} />
              <View style={styles.statItem}>
                <Icon name="wallet" size={16} color={theme.colors.info} />
                <Text style={[styles.statValue, {color: theme.colors.text}]}>
                  {accounts.filter(a => a.category === 'upi' || a.category === 'wallet').length}
                </Text>
                <Text style={[styles.statLabel, {color: theme.colors.textMuted}]}>
                  Digital
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Account List by Category */}
        {accounts.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.emptyState}>
            <Icon name="wallet-plus-outline" size={64} color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
              No Accounts Yet
            </Text>
            <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
              Add your first account to start tracking your finances
            </Text>
            <Pressable
              onPress={handleAddAccount}
              style={[styles.addButton, {backgroundColor: theme.colors.primary}]}>
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Account</Text>
            </Pressable>
          </Animated.View>
        ) : (
          Object.entries(groupedAccounts).map(([category, accountList]) =>
            renderSection(category, accountList),
          )
        )}
      </Animated.ScrollView>
    </View>
  );
});

AccountsScreen.displayName = 'AccountsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  collapsedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  collapsedValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 13,
    marginLeft: 4,
  },
  accountCard: {
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  accountType: {
    fontSize: 13,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  creditLimit: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AccountsScreen;
