/**
 * Add/Edit Transfer Screen
 *
 * Form for creating or editing a money transfer between accounts.
 * Transfers are NOT counted as income or expense.
 * Supports both legacy account types and user-defined accounts.
 * 
 * When editing:
 * - Previous balance changes are reversed
 * - New balance changes are applied
 * - Account integrity is maintained
 */

import React, {memo, useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Vibration,
  Modal,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTheme, useCurrency} from '@/hooks';
import {useTransferStore, useAccountStore} from '@/store';
import {Card, useToast} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {RootStackParamList, AccountType, UserAccount} from '@/types';
import {validateAmount, formatDate} from '@/utils';
import {ACCOUNT_TYPES} from '@/constants';
import {format, parseISO} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTransfer'>;
type RouteType = RouteProp<RootStackParamList, 'AddTransfer'>;

export const AddTransferScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {symbol, formatAmount} = useCurrency();
  const {showToast} = useToast();
  const {addTransfer, updateTransfer, getTransferById} = useTransferStore();
  const {accounts, getActiveAccounts, updateAccountBalance, getAccountById} = useAccountStore();

  // Check if we're editing an existing transfer
  const editingTransferId = route.params?.transferId;
  const isEditing = Boolean(editingTransferId);

  // Get active user accounts
  const activeAccounts = useMemo(() => getActiveAccounts(), [accounts, getActiveAccounts]);
  const hasUserAccounts = activeAccounts.length >= 2;

  // State for user-defined accounts mode
  const [fromUserAccount, setFromUserAccount] = useState<UserAccount | null>(null);
  const [toUserAccount, setToUserAccount] = useState<UserAccount | null>(null);

  // State for legacy mode (when no user accounts)
  const [fromLegacyAccount, setFromLegacyAccount] = useState<AccountType>('cash');
  const [toLegacyAccount, setToLegacyAccount] = useState<AccountType>('bank');

  // Original values for edit mode (to calculate balance differences)
  const [originalTransfer, setOriginalTransfer] = useState<{
    amount: number;
    fromAccountId?: string;
    toAccountId?: string;
  } | null>(null);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [errors, setErrors] = useState<{amount?: string; accounts?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load existing transfer if editing
  useEffect(() => {
    if (editingTransferId) {
      const existingTransfer = getTransferById(editingTransferId);
      if (existingTransfer) {
        setAmount(existingTransfer.amount.toString());
        setNote(existingTransfer.note || '');
        setDate(parseISO(existingTransfer.date));
        
        // Store original values for balance reversal
        setOriginalTransfer({
          amount: existingTransfer.amount,
          fromAccountId: existingTransfer.fromAccountId,
          toAccountId: existingTransfer.toAccountId,
        });

        // Set accounts
        if (existingTransfer.fromAccountId) {
          const fromAcc = getAccountById(existingTransfer.fromAccountId);
          if (fromAcc) {
            setFromUserAccount(fromAcc);
          }
        } else {
          setFromLegacyAccount(existingTransfer.fromAccount);
        }

        if (existingTransfer.toAccountId) {
          const toAcc = getAccountById(existingTransfer.toAccountId);
          if (toAcc) {
            setToUserAccount(toAcc);
          }
        } else {
          setToLegacyAccount(existingTransfer.toAccount);
        }
      }
    } else if (hasUserAccounts) {
      // Set initial accounts from route params or defaults for new transfer
      const fromId = route.params?.fromAccountId;
      const toId = route.params?.toAccountId;

      if (fromId) {
        const acc = activeAccounts.find(a => a.id === fromId);
        if (acc) {
          setFromUserAccount(acc);
        }
      } else if (activeAccounts.length > 0) {
        setFromUserAccount(activeAccounts[0]);
      }

      if (toId) {
        const acc = activeAccounts.find(a => a.id === toId);
        if (acc) {
          setToUserAccount(acc);
        }
      } else if (activeAccounts.length > 1) {
        setToUserAccount(activeAccounts[1]);
      }
    }
  }, [editingTransferId, hasUserAccounts, activeAccounts, route.params, getTransferById, getAccountById]);

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(cleaned);
    setErrors(prev => ({...prev, amount: undefined}));
  }, []);

  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  const swapAccounts = useCallback(() => {
    if (hasUserAccounts || fromUserAccount || toUserAccount) {
      const temp = fromUserAccount;
      setFromUserAccount(toUserAccount);
      setToUserAccount(temp);
    } else {
      const temp = fromLegacyAccount;
      setFromLegacyAccount(toLegacyAccount);
      setToLegacyAccount(temp);
    }
    Vibration.vibrate(30);
  }, [hasUserAccounts, fromUserAccount, toUserAccount, fromLegacyAccount, toLegacyAccount]);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error;
    }

    if (hasUserAccounts || fromUserAccount || toUserAccount) {
      if (!fromUserAccount || !toUserAccount) {
        newErrors.accounts = 'Please select both accounts';
      } else if (fromUserAccount.id === toUserAccount.id) {
        newErrors.accounts = 'From and To accounts must be different';
      }
    } else {
      if (fromLegacyAccount === toLegacyAccount) {
        newErrors.accounts = 'From and To accounts must be different';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, hasUserAccounts, fromUserAccount, toUserAccount, fromLegacyAccount, toLegacyAccount]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Vibration.vibrate(50);
      return;
    }
    setIsSaving(true);
    try {
      const transferAmount = parseFloat(amount);
      const useUserAccounts = hasUserAccounts || fromUserAccount || toUserAccount;

      if (isEditing && editingTransferId && originalTransfer) {
        // EDITING: First reverse the original balance changes
        if (originalTransfer.fromAccountId) {
          updateAccountBalance(originalTransfer.fromAccountId, originalTransfer.amount, 'add');
        }
        if (originalTransfer.toAccountId) {
          updateAccountBalance(originalTransfer.toAccountId, originalTransfer.amount, 'subtract');
        }

        // Update the transfer record
        if (useUserAccounts && fromUserAccount && toUserAccount) {
          updateTransfer(editingTransferId, {
            amount: transferAmount,
            fromAccount: fromUserAccount.category as AccountType,
            toAccount: toUserAccount.category as AccountType,
            fromAccountId: fromUserAccount.id,
            toAccountId: toUserAccount.id,
            note: note.trim(),
            date: format(date, 'yyyy-MM-dd'),
          });

          // Apply new balance changes
          updateAccountBalance(fromUserAccount.id, transferAmount, 'subtract');
          updateAccountBalance(toUserAccount.id, transferAmount, 'add');

          showToast({
            type: 'success',
            title: 'Transfer Updated',
            message: `${formatAmount(transferAmount)} from ${fromUserAccount.name} to ${toUserAccount.name}`,
            duration: 2500,
          });
        } else {
          updateTransfer(editingTransferId, {
            amount: transferAmount,
            fromAccount: fromLegacyAccount,
            toAccount: toLegacyAccount,
            fromAccountId: undefined,
            toAccountId: undefined,
            note: note.trim(),
            date: format(date, 'yyyy-MM-dd'),
          });

          const from = ACCOUNT_TYPES.find(a => a.id === fromLegacyAccount);
          const to = ACCOUNT_TYPES.find(a => a.id === toLegacyAccount);
          showToast({
            type: 'success',
            title: 'Transfer Updated',
            message: `${formatAmount(transferAmount)} from ${from?.label} to ${to?.label}`,
            duration: 2500,
          });
        }
      } else {
        // CREATING NEW TRANSFER
        if (useUserAccounts && fromUserAccount && toUserAccount) {
          addTransfer({
            amount: transferAmount,
            fromAccount: fromUserAccount.category as AccountType,
            toAccount: toUserAccount.category as AccountType,
            fromAccountId: fromUserAccount.id,
            toAccountId: toUserAccount.id,
            note: note.trim(),
            date: format(date, 'yyyy-MM-dd'),
          });

          // Update account balances
          updateAccountBalance(fromUserAccount.id, transferAmount, 'subtract');
          updateAccountBalance(toUserAccount.id, transferAmount, 'add');

          showToast({
            type: 'success',
            title: 'Transfer Complete',
            message: `${formatAmount(transferAmount)} from ${fromUserAccount.name} to ${toUserAccount.name}`,
            duration: 2500,
          });
        } else {
          // Legacy mode - use account types
          addTransfer({
            amount: transferAmount,
            fromAccount: fromLegacyAccount,
            toAccount: toLegacyAccount,
            note: note.trim(),
            date: format(date, 'yyyy-MM-dd'),
          });

          const from = ACCOUNT_TYPES.find(a => a.id === fromLegacyAccount);
          const to = ACCOUNT_TYPES.find(a => a.id === toLegacyAccount);
          showToast({
            type: 'success',
            title: 'Transfer Complete',
            message: `${formatAmount(transferAmount)} from ${from?.label} to ${to?.label}`,
            duration: 2500,
          });
        }
      }

      Vibration.vibrate(100);
      navigation.goBack();
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: `Failed to ${isEditing ? 'update' : 'create'} transfer.`,
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    amount,
    hasUserAccounts,
    fromUserAccount,
    toUserAccount,
    fromLegacyAccount,
    toLegacyAccount,
    note,
    date,
    isEditing,
    editingTransferId,
    originalTransfer,
    addTransfer,
    updateTransfer,
    updateAccountBalance,
    navigation,
    showToast,
    formatAmount,
  ]);

  // Legacy account selector
  const renderLegacyAccountSelector = (
    label: string,
    selected: AccountType,
    onSelect: (id: AccountType) => void,
  ) => (
    <View style={styles.accountSection}>
      <Text style={[styles.accountLabel, {color: theme.colors.textSecondary}]}>
        {label}
      </Text>
      <View style={styles.accountGrid}>
        {ACCOUNT_TYPES.map(account => (
          <Pressable
            key={account.id}
            onPress={() => {
              onSelect(account.id);
              setErrors(prev => ({...prev, accounts: undefined}));
            }}
            style={[
              styles.accountChip,
              {
                backgroundColor:
                  selected === account.id
                    ? account.color + '15'
                    : theme.colors.surfaceVariant,
                borderColor: selected === account.id ? account.color : 'transparent',
                borderWidth: 1.5,
              },
            ]}>
            <Icon
              name={account.icon}
              size={20}
              color={selected === account.id ? account.color : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.accountChipText,
                {
                  color:
                    selected === account.id ? account.color : theme.colors.textSecondary,
                },
              ]}>
              {account.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // User account card for selection
  const renderUserAccountCard = (
    label: string,
    account: UserAccount | null,
    onPress: () => void,
  ) => (
    <Pressable onPress={onPress}>
      <View style={styles.accountSection}>
        <Text style={[styles.accountLabel, {color: theme.colors.textSecondary}]}>
          {label}
        </Text>
        <View
          style={[
            styles.userAccountCard,
            {
              backgroundColor: account ? account.color + '10' : theme.colors.surfaceVariant,
              borderColor: account ? account.color : theme.colors.border,
            },
          ]}>
          {account ? (
            <>
              <View style={[styles.userAccountIcon, {backgroundColor: account.color + '20'}]}>
                <Icon name={account.icon} size={24} color={account.color} />
              </View>
              <View style={styles.userAccountInfo}>
                <Text style={[styles.userAccountName, {color: theme.colors.text}]}>
                  {account.name}
                </Text>
                <Text style={[styles.userAccountBalance, {color: theme.colors.textSecondary}]}>
                  Balance: {formatAmount(account.currentBalance)}
                </Text>
              </View>
              <Icon name="chevron-down" size={20} color={theme.colors.textMuted} />
            </>
          ) : (
            <>
              <View
                style={[styles.userAccountIcon, {backgroundColor: theme.colors.surfaceVariant}]}>
                <Icon name="wallet-outline" size={24} color={theme.colors.textMuted} />
              </View>
              <Text style={[styles.selectAccountText, {color: theme.colors.textMuted}]}>
                Select Account
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.textMuted} />
            </>
          )}
        </View>
      </View>
    </Pressable>
  );

  const showUserAccountMode = hasUserAccounts || fromUserAccount || toUserAccount;

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior="padding"
      keyboardVerticalOffset={0}>
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {isEditing ? 'Edit Transfer' : 'New Transfer'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {paddingBottom: 24 + insets.bottom},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <Text style={[styles.amountLabel, {color: theme.colors.textSecondary}]}>
              Transfer Amount
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, {color: theme.colors.transfer}]}>
                {symbol}
              </Text>
              <TextInput
                style={[styles.amountInput, {color: theme.colors.transfer}]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus={!isEditing}
              />
            </View>
            {errors.amount && (
              <Text style={[styles.errorText, {color: theme.colors.error}]}>
                {errors.amount}
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Accounts */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.accountsCard} padding="medium">
            {showUserAccountMode ? (
              <>
                {renderUserAccountCard('From', fromUserAccount, () => setShowFromPicker(true))}
                <Pressable
                  onPress={swapAccounts}
                  style={[styles.swapButton, {backgroundColor: theme.colors.transfer + '15'}]}>
                  <Icon name="swap-vertical" size={22} color={theme.colors.transfer} />
                </Pressable>
                {renderUserAccountCard('To', toUserAccount, () => setShowToPicker(true))}
              </>
            ) : (
              <>
                {renderLegacyAccountSelector('From', fromLegacyAccount, setFromLegacyAccount)}
                <Pressable
                  onPress={swapAccounts}
                  style={[styles.swapButton, {backgroundColor: theme.colors.transfer + '15'}]}>
                  <Icon name="swap-vertical" size={22} color={theme.colors.transfer} />
                </Pressable>
                {renderLegacyAccountSelector('To', toLegacyAccount, setToLegacyAccount)}
              </>
            )}

            {errors.accounts && (
              <Text style={[styles.errorText, {color: theme.colors.error, marginTop: 8}]}>
                {errors.accounts}
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Prompt to add accounts */}
        {!hasUserAccounts && !isEditing && (
          <Animated.View entering={FadeInDown.delay(175).duration(400)}>
            <Pressable
              onPress={() => navigation.navigate('AccountsList')}
              style={[styles.addAccountsHint, {backgroundColor: theme.colors.info + '10'}]}>
              <Icon name="information-outline" size={18} color={theme.colors.info} />
              <Text style={[styles.addAccountsHintText, {color: theme.colors.info}]}>
                Add accounts to track balances automatically
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Date */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Card style={styles.selectorCard} padding="medium">
              <View style={styles.selectorRow}>
                <View style={[styles.selectorIcon, {backgroundColor: theme.colors.transfer + '15'}]}>
                  <Icon name="calendar" size={20} color={theme.colors.transfer} />
                </View>
                <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                  {formatDate(format(date, 'yyyy-MM-dd'), 'EEEE, MMM d, yyyy')}
                </Text>
                <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Card style={styles.noteCard} padding="medium">
            <Text style={[styles.noteLabel, {color: theme.colors.textSecondary}]}>
              Note (optional)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant},
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({animated: true});
                }, 300);
              }}
            />
          </Card>
        </Animated.View>

        <View style={{height: 24}} />

        {/* Save Button - inside ScrollView so it stays above keyboard */}
        <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
          <GradientButton
            title={isEditing ? 'Update Transfer' : 'Complete Transfer'}
            onPress={handleSave}
            loading={isSaving}
            fullWidth
            icon="swap-horizontal"
            iconPosition="left"
            size="large"
          />
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* From Account Picker */}
      <Modal visible={showFromPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Transfer From
              </Text>
              <Pressable onPress={() => setShowFromPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={activeAccounts.filter(a => a.id !== toUserAccount?.id)}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => {
                    setFromUserAccount(item);
                    setShowFromPicker(false);
                    setErrors(prev => ({...prev, accounts: undefined}));
                  }}
                  style={[
                    styles.accountPickerItem,
                    {
                      backgroundColor:
                        fromUserAccount?.id === item.id ? item.color + '10' : 'transparent',
                    },
                  ]}>
                  <View style={[styles.accountPickerIcon, {backgroundColor: item.color + '15'}]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.accountPickerInfo}>
                    <Text style={[styles.accountPickerName, {color: theme.colors.text}]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.accountPickerBalance, {color: theme.colors.textMuted}]}>
                      {formatAmount(item.currentBalance)}
                    </Text>
                  </View>
                  {fromUserAccount?.id === item.id && (
                    <Icon name="check-circle" size={22} color={item.color} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* To Account Picker */}
      <Modal visible={showToPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Transfer To
              </Text>
              <Pressable onPress={() => setShowToPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={activeAccounts.filter(a => a.id !== fromUserAccount?.id)}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => {
                    setToUserAccount(item);
                    setShowToPicker(false);
                    setErrors(prev => ({...prev, accounts: undefined}));
                  }}
                  style={[
                    styles.accountPickerItem,
                    {
                      backgroundColor:
                        toUserAccount?.id === item.id ? item.color + '10' : 'transparent',
                    },
                  ]}>
                  <View style={[styles.accountPickerIcon, {backgroundColor: item.color + '15'}]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.accountPickerInfo}>
                    <Text style={[styles.accountPickerName, {color: theme.colors.text}]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.accountPickerBalance, {color: theme.colors.textMuted}]}>
                      {formatAmount(item.currentBalance)}
                    </Text>
                  </View>
                  {toUserAccount?.id === item.id && (
                    <Icon name="check-circle" size={22} color={item.color} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
});

AddTransferScreen.displayName = 'AddTransferScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {fontSize: 18, fontWeight: '600'},
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  amountCard: {marginBottom: 16, alignItems: 'center'},
  amountLabel: {fontSize: 14, marginBottom: 12},
  amountInputContainer: {flexDirection: 'row', alignItems: 'center'},
  currencySymbol: {fontSize: 32, fontWeight: '600', marginRight: 4},
  amountInput: {fontSize: 48, fontWeight: '700', minWidth: 100, textAlign: 'center'},
  errorText: {fontSize: 12, marginTop: 8},
  accountsCard: {marginBottom: 12},
  accountSection: {marginBottom: 8},
  accountLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  accountGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  accountChipText: {fontSize: 13, fontWeight: '500'},
  userAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  userAccountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAccountInfo: {flex: 1, marginLeft: 12},
  userAccountName: {fontSize: 15, fontWeight: '600'},
  userAccountBalance: {fontSize: 13, marginTop: 2},
  selectAccountText: {flex: 1, fontSize: 15, marginLeft: 12},
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  addAccountsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  addAccountsHintText: {flex: 1, fontSize: 13},
  selectorCard: {marginBottom: 12},
  selectorRow: {flexDirection: 'row', alignItems: 'center'},
  selectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  noteCard: {marginTop: 4},
  noteLabel: {fontSize: 14, marginBottom: 12},
  noteInput: {fontSize: 16, padding: 12, minHeight: 60, borderRadius: 12},
  footer: {paddingHorizontal: 20, paddingTop: 20, backgroundColor: 'transparent'},
  modalOverlay: {flex: 1, justifyContent: 'flex-end'},
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 20, fontWeight: '700'},
  accountPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  accountPickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountPickerInfo: {flex: 1, marginLeft: 12},
  accountPickerName: {fontSize: 16, fontWeight: '500'},
  accountPickerBalance: {fontSize: 13, marginTop: 2},
});

export default AddTransferScreen;
