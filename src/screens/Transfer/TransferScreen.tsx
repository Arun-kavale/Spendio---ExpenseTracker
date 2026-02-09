/**
 * Transfer List Screen
 * 
 * Displays all account-to-account transfers with professional UI.
 * Features:
 * - Clear from → to visualization
 * - Account icons and colors
 * - Edit and Delete functionality
 * - Balance restoration on delete
 */

import React, {memo, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeInDown, SlideInRight} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useTransferStore, useAccountStore} from '@/store';
import {EmptyState, StickyHeader, useToast, Card} from '@/components/common';
import {RootStackParamList, Transfer} from '@/types';
import {formatRelativeDate} from '@/utils';
import {getAccountInfo} from '@/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TransferItem = memo<{
  transfer: Transfer;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  fromAccountName?: string;
  toAccountName?: string;
  fromColor?: string;
  toColor?: string;
  fromIcon?: string;
  toIcon?: string;
}>(({
  transfer,
  index,
  onEdit,
  onDelete,
  fromAccountName,
  toAccountName,
  fromColor,
  toColor,
  fromIcon,
  toIcon,
}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  
  // Use provided account info or fallback to legacy
  const from = fromAccountName 
    ? {label: fromAccountName, color: fromColor || theme.colors.transfer, icon: fromIcon || 'wallet'}
    : getAccountInfo(transfer.fromAccount);
  const to = toAccountName 
    ? {label: toAccountName, color: toColor || theme.colors.transfer, icon: toIcon || 'wallet'}
    : getAccountInfo(transfer.toAccount);

  return (
    <Animated.View entering={SlideInRight.delay(index * 40).duration(300)}>
      <Card style={styles.transferCard} padding="medium">
        <View style={styles.transferRow}>
          {/* From Account */}
          <View style={styles.accountColumn}>
            <View style={[styles.accountIconCircle, {backgroundColor: from.color + '15'}]}>
              <Icon name={from.icon} size={20} color={from.color} />
            </View>
            <Text style={[styles.accountName, {color: theme.colors.text}]} numberOfLines={1}>
              {from.label}
            </Text>
          </View>

          {/* Arrow and Amount */}
          <View style={styles.centerColumn}>
            <View style={[styles.arrowContainer, {backgroundColor: theme.colors.transfer + '10'}]}>
              <Icon name="arrow-right" size={16} color={theme.colors.transfer} />
            </View>
            <Text style={[styles.transferAmount, {color: theme.colors.transfer}]}>
              {formatAmount(transfer.amount)}
            </Text>
          </View>

          {/* To Account */}
          <View style={styles.accountColumn}>
            <View style={[styles.accountIconCircle, {backgroundColor: to.color + '15'}]}>
              <Icon name={to.icon} size={20} color={to.color} />
            </View>
            <Text style={[styles.accountName, {color: theme.colors.text}]} numberOfLines={1}>
              {to.label}
            </Text>
          </View>
        </View>

        {/* Date and Note */}
        <View style={styles.transferMeta}>
          <Text style={[styles.transferDate, {color: theme.colors.textMuted}]}>
            {formatRelativeDate(transfer.date)}
          </Text>
          {transfer.note ? (
            <Text style={[styles.transferNote, {color: theme.colors.textSecondary}]} numberOfLines={1}>
              {transfer.note}
            </Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onEdit}
            style={[styles.actionButton, {backgroundColor: theme.colors.primary + '10'}]}>
            <Icon name="pencil-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.actionText, {color: theme.colors.primary}]}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={[styles.actionButton, {backgroundColor: theme.colors.error + '10'}]}>
            <Icon name="delete-outline" size={16} color={theme.colors.error} />
            <Text style={[styles.actionText, {color: theme.colors.error}]}>Delete</Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
});

export const TransferScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount} = useCurrency();
  const {showToast} = useToast();

  // Collapsible header
  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 60});

  const transfers = useTransferStore(state => state.transfers);
  const deleteTransfer = useTransferStore(state => state.deleteTransfer);
  const {accounts, getAccountById, updateAccountBalance} = useAccountStore();

  const sortedTransfers = useMemo(
    () => [...transfers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transfers],
  );

  const totalTransferred = useMemo(
    () => transfers.reduce((sum, t) => sum + t.amount, 0),
    [transfers],
  );

  // Get account info for a transfer
  const getTransferAccountInfo = useCallback((transfer: Transfer) => {
    let fromName, toName, fromColor, toColor, fromIcon, toIcon;
    
    if (transfer.fromAccountId) {
      const fromAcc = getAccountById(transfer.fromAccountId);
      if (fromAcc) {
        fromName = fromAcc.name;
        fromColor = fromAcc.color;
        fromIcon = fromAcc.icon;
      }
    }
    
    if (transfer.toAccountId) {
      const toAcc = getAccountById(transfer.toAccountId);
      if (toAcc) {
        toName = toAcc.name;
        toColor = toAcc.color;
        toIcon = toAcc.icon;
      }
    }
    
    return {fromName, toName, fromColor, toColor, fromIcon, toIcon};
  }, [getAccountById]);

  const handleEdit = useCallback((transfer: Transfer) => {
    navigation.navigate('AddTransfer', {transferId: transfer.id});
  }, [navigation]);

  const handleDelete = useCallback((transfer: Transfer) => {
    const {fromName, toName} = getTransferAccountInfo(transfer);
    const fromLabel = fromName || getAccountInfo(transfer.fromAccount).label;
    const toLabel = toName || getAccountInfo(transfer.toAccount).label;

    Alert.alert(
      'Delete Transfer',
      `Delete transfer of ${formatAmount(transfer.amount)} from ${fromLabel} to ${toLabel}?\n\nThis will restore the original balances.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete and get the deleted transfer
            const deleted = deleteTransfer(transfer.id);
            
            if (deleted) {
              // Reverse the balance changes
              if (deleted.fromAccountId) {
                updateAccountBalance(deleted.fromAccountId, deleted.amount, 'add');
              }
              if (deleted.toAccountId) {
                updateAccountBalance(deleted.toAccountId, deleted.amount, 'subtract');
              }
              
              showToast({
                type: 'success',
                title: 'Transfer Deleted',
                message: 'Balances have been restored',
                duration: 2500,
              });
            }
          },
        },
      ],
    );
  }, [deleteTransfer, updateAccountBalance, formatAmount, getTransferAccountInfo, showToast]);

  // List header: summary bar (scrolls with content)
  const ListHeader = useMemo(() => (
    <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.summaryContainer}>
      <Card style={styles.summaryCard} padding="medium">
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, {color: theme.colors.textSecondary}]}>
              Total Transfers
            </Text>
            <Text style={[styles.summaryValue, {color: theme.colors.transfer}]}>
              {formatAmount(totalTransferred)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, {backgroundColor: theme.colors.divider}]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, {color: theme.colors.textSecondary}]}>
              Count
            </Text>
            <Text style={[styles.summaryValue, {color: theme.colors.text}]}>
              {transfers.length}
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  ), [transfers.length, totalTransferred, theme, formatAmount]);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Sticky Header */}
      <StickyHeader
        backgroundColor={theme.colors.background}
        paddingTop={insets.top + 6}
        shadowStyle={headerShadowStyle}
        dividerStyle={dividerOpacity}
        dividerColor={theme.colors.divider}
        topBar={
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Icon name="arrow-left" size={22} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, {color: theme.colors.text}]}>Transfers</Text>
            <Pressable
              style={[styles.addBtn, {backgroundColor: theme.colors.transfer}]}
              onPress={() => navigation.navigate('AddTransfer')}>
              <Icon name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        }
        collapsedContent={
          <View style={styles.collapsedRow}>
            <Text style={[styles.collapsedCount, {color: theme.colors.textSecondary}]}>
              {transfers.length} transfers
            </Text>
            <Text style={[styles.collapsedTotal, {color: theme.colors.transfer}]}>
              {formatAmount(totalTransferred)}
            </Text>
          </View>
        }
        collapsedStyle={collapsedSummaryStyle}
      />

      {sortedTransfers.length === 0 ? (
        <EmptyState
          icon="swap-horizontal"
          title="No transfers yet"
          description="Move money between your accounts"
          actionLabel="New Transfer"
          onAction={() => navigation.navigate('AddTransfer')}
        />
      ) : (
        <Animated.FlatList
          data={sortedTransfers}
          renderItem={({item, index}) => {
            const {fromName, toName, fromColor, toColor, fromIcon, toIcon} = getTransferAccountInfo(item);
            return (
              <TransferItem
                transfer={item}
                index={index}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
                fromAccountName={fromName}
                toAccountName={toName}
                fromColor={fromColor}
                toColor={toColor}
                fromIcon={fromIcon}
                toIcon={toIcon}
              />
            );
          }}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={ListHeader}
        />
      )}
    </View>
  );
});

TransferScreen.displayName = 'TransferScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  title: {fontSize: 18, fontWeight: '700'},
  addBtn: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  // Collapsed compact summary
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedCount: {fontSize: 13, fontWeight: '500'},
  collapsedTotal: {fontSize: 15, fontWeight: '700'},
  // Summary
  summaryContainer: {marginBottom: 12},
  summaryCard: {},
  summaryRow: {flexDirection: 'row', alignItems: 'center'},
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryLabel: {fontSize: 12, marginBottom: 4},
  summaryValue: {fontSize: 18, fontWeight: '700'},
  summaryDivider: {width: 1, height: 40},
  // List
  list: {paddingHorizontal: 16, paddingBottom: 100},
  // Transfer Card
  transferCard: {marginBottom: 12},
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountColumn: {
    flex: 1,
    alignItems: 'center',
  },
  accountIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  centerColumn: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transferMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  transferDate: {fontSize: 12},
  transferNote: {fontSize: 12, flex: 1, textAlign: 'center'},
  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {fontSize: 13, fontWeight: '500'},
});

export default TransferScreen;
