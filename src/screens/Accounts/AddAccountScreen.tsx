/**
 * Add/Edit Account Screen
 *
 * Premium form for creating or editing a user account.
 * Supports all account types with specific fields for credit cards and banks.
 */

import React, {memo, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Modal,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useAccountStore} from '@/store';
import {Card, useToast} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {
  RootStackParamList,
  AccountCategory,
  AccountSubType,
  AccountTypeInfo,
} from '@/types';
import {ACCOUNT_CATEGORIES, ACCOUNT_COLORS, ACCOUNT_ICONS} from '@/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddAccount'>;
type RouteType = RouteProp<RootStackParamList, 'AddAccount'>;

export const AddAccountScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {symbol} = useCurrency();
  const {showToast} = useToast();

  const {addAccount, updateAccount, getAccountById} = useAccountStore();

  const accountId = route.params?.accountId;
  const isEditing = Boolean(accountId);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('bank');
  const [subType, setSubType] = useState<AccountSubType | undefined>();
  const [openingBalance, setOpeningBalance] = useState('');
  const [bankName, setBankName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[1]);
  const [selectedIcon, setSelectedIcon] = useState('bank');
  const [isDefault, setIsDefault] = useState(false);

  // UI state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [errors, setErrors] = useState<{name?: string; balance?: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing account data if editing
  useEffect(() => {
    if (accountId) {
      const account = getAccountById(accountId);
      if (account) {
        setName(account.name);
        setCategory(account.category);
        setSubType(account.subType);
        setOpeningBalance(account.openingBalance.toString());
        setBankName(account.bankName || '');
        setLastFourDigits(account.lastFourDigits || '');
        setAccountNumber(account.accountNumber || '');
        setIfscCode(account.ifscCode || '');
        setBranchName(account.branchName || '');
        setCreditLimit(account.creditLimit?.toString() || '');
        setBillDueDate(account.billDueDate?.toString() || '');
        setStatementDate(account.statementDate?.toString() || '');
        setSelectedColor(account.color);
        setSelectedIcon(account.icon);
        setIsDefault(account.isDefault);
      }
    }
  }, [accountId, getAccountById]);

  // Update icon when category changes
  useEffect(() => {
    const categoryInfo = ACCOUNT_CATEGORIES.find(c => c.id === category);
    if (categoryInfo && !isEditing) {
      setSelectedIcon(categoryInfo.icon);
      setSelectedColor(categoryInfo.color);
    }
  }, [category, isEditing]);

  const handleCategorySelect = useCallback((cat: AccountTypeInfo) => {
    setCategory(cat.id);
    setSubType(undefined);
    setShowCategoryPicker(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (openingBalance && isNaN(parseFloat(openingBalance))) {
      newErrors.balance = 'Invalid balance amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, openingBalance]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Vibration.vibrate(50);
      return;
    }

    setIsSaving(true);

    try {
      const balance = parseFloat(openingBalance) || 0;
      const accountData = {
        name: name.trim(),
        category,
        subType,
        openingBalance: balance,
        currentBalance: balance,
        currency: 'INR',
        bankName: bankName.trim() || undefined,
        lastFourDigits: lastFourDigits.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        branchName: branchName.trim() || undefined,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        outstandingBalance: category === 'credit_card' ? 0 : undefined,
        billDueDate: billDueDate ? parseInt(billDueDate, 10) : undefined,
        statementDate: statementDate ? parseInt(statementDate, 10) : undefined,
        icon: selectedIcon,
        color: selectedColor,
        isActive: true,
        isDefault,
      };

      if (isEditing && accountId) {
        updateAccount(accountId, accountData);
        showToast({
          type: 'success',
          title: 'Account Updated',
          message: `${name} has been updated`,
          duration: 2500,
        });
      } else {
        addAccount(accountData);
        Vibration.vibrate(100);
        showToast({
          type: 'success',
          title: 'Account Added',
          message: `${name} has been created`,
          duration: 2500,
        });
      }

      navigation.goBack();
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save account',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    name,
    category,
    subType,
    openingBalance,
    bankName,
    lastFourDigits,
    accountNumber,
    ifscCode,
    branchName,
    creditLimit,
    billDueDate,
    statementDate,
    selectedIcon,
    selectedColor,
    isDefault,
    isEditing,
    accountId,
    updateAccount,
    addAccount,
    navigation,
    showToast,
  ]);

  const selectedCategoryInfo = ACCOUNT_CATEGORIES.find(c => c.id === category);

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {isEditing ? 'Edit Account' : 'Add Account'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Account Preview */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Card style={styles.previewCard} padding="large">
            <View style={styles.previewRow}>
              <View
                style={[styles.previewIcon, {backgroundColor: selectedColor + '20'}]}>
                <Icon name={selectedIcon} size={32} color={selectedColor} />
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, {color: theme.colors.text}]}>
                  {name || 'Account Name'}
                </Text>
                <Text style={[styles.previewType, {color: theme.colors.textSecondary}]}>
                  {selectedCategoryInfo?.label || 'Account Type'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Account Name */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card
            style={{
              ...styles.inputCard,
              ...(errors.name && {borderColor: theme.colors.error, borderWidth: 1}),
            }}
            padding="medium">
            <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
              Account Name *
            </Text>
            <TextInput
              style={[styles.textInput, {color: theme.colors.text}]}
              value={name}
              onChangeText={text => {
                setName(text);
                setErrors(prev => ({...prev, name: undefined}));
              }}
              placeholder="e.g., HDFC Savings"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus={!isEditing}
            />
          </Card>
          {errors.name && (
            <Text style={[styles.errorText, {color: theme.colors.error}]}>
              {errors.name}
            </Text>
          )}
        </Animated.View>

        {/* Account Type */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Pressable onPress={() => setShowCategoryPicker(true)}>
            <Card style={styles.inputCard} padding="medium">
              <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                Account Type
              </Text>
              <View style={styles.selectorRow}>
                <View
                  style={[
                    styles.typeIcon,
                    {backgroundColor: selectedCategoryInfo?.color + '15'},
                  ]}>
                  <Icon
                    name={selectedCategoryInfo?.icon || 'bank'}
                    size={20}
                    color={selectedCategoryInfo?.color}
                  />
                </View>
                <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                  {selectedCategoryInfo?.label}
                </Text>
                <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        {/* Sub-type for UPI/Wallet */}
        {selectedCategoryInfo?.subTypes && (
          <Animated.View entering={FadeInDown.delay(175).duration(400)}>
            <Card style={styles.inputCard} padding="medium">
              <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                App / Wallet
              </Text>
              <View style={styles.subTypeGrid}>
                {selectedCategoryInfo.subTypes.map(st => (
                  <Pressable
                    key={st.id}
                    onPress={() => setSubType(st.id)}
                    style={[
                      styles.subTypeChip,
                      {
                        backgroundColor:
                          subType === st.id
                            ? selectedCategoryInfo.color + '20'
                            : theme.colors.surfaceVariant,
                        borderColor:
                          subType === st.id
                            ? selectedCategoryInfo.color
                            : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}>
                    <Icon
                      name={st.icon}
                      size={16}
                      color={
                        subType === st.id
                          ? selectedCategoryInfo.color
                          : theme.colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.subTypeText,
                        {
                          color:
                            subType === st.id
                              ? selectedCategoryInfo.color
                              : theme.colors.textSecondary,
                        },
                      ]}>
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Opening Balance */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.inputCard} padding="medium">
            <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
              Opening Balance
            </Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, {color: theme.colors.text}]}>
                {symbol}
              </Text>
              <TextInput
                style={[styles.amountInput, {color: theme.colors.text}]}
                value={openingBalance}
                onChangeText={setOpeningBalance}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </Card>
        </Animated.View>

        {/* Bank Details (for bank/card) */}
        {(category === 'bank' || category === 'credit_card' || category === 'debit_card') && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={styles.inputCard} padding="medium">
              <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                Bank Details (Optional)
              </Text>
              <TextInput
                style={[styles.textInput, {color: theme.colors.text}]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Bank Name (e.g., HDFC)"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TextInput
                style={[styles.textInput, {color: theme.colors.text, marginTop: 12}]}
                value={lastFourDigits}
                onChangeText={setLastFourDigits}
                placeholder="Last 4 digits"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
              {category === 'bank' && (
                <>
                  <TextInput
                    style={[styles.textInput, {color: theme.colors.text, marginTop: 12}]}
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    placeholder="IFSC Code"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="characters"
                  />
                  <TextInput
                    style={[styles.textInput, {color: theme.colors.text, marginTop: 12}]}
                    value={branchName}
                    onChangeText={setBranchName}
                    placeholder="Branch Name"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Credit Card Specific */}
        {category === 'credit_card' && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Card style={styles.inputCard} padding="medium">
              <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                Credit Card Details
              </Text>
              <View style={styles.amountRow}>
                <Text style={[styles.currencySymbol, {color: theme.colors.text}]}>
                  {symbol}
                </Text>
                <TextInput
                  style={[styles.amountInput, {color: theme.colors.text}]}
                  value={creditLimit}
                  onChangeText={setCreditLimit}
                  placeholder="Credit Limit"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, {color: theme.colors.textMuted}]}>
                    Bill Due Date
                  </Text>
                  <TextInput
                    style={[styles.dateInput, {color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant}]}
                    value={billDueDate}
                    onChangeText={setBillDueDate}
                    placeholder="1-31"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, {color: theme.colors.textMuted}]}>
                    Statement Date
                  </Text>
                  <TextInput
                    style={[styles.dateInput, {color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant}]}
                    value={statementDate}
                    onChangeText={setStatementDate}
                    placeholder="1-31"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Customization */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Card style={styles.inputCard} padding="medium">
            <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
              Customization
            </Text>
            <View style={styles.customRow}>
              <Pressable
                onPress={() => setShowColorPicker(true)}
                style={styles.customButton}>
                <View
                  style={[styles.colorPreview, {backgroundColor: selectedColor}]}
                />
                <Text style={[styles.customLabel, {color: theme.colors.text}]}>
                  Color
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowIconPicker(true)}
                style={styles.customButton}>
                <View
                  style={[
                    styles.iconPreview,
                    {backgroundColor: theme.colors.surfaceVariant},
                  ]}>
                  <Icon name={selectedIcon} size={20} color={selectedColor} />
                </View>
                <Text style={[styles.customLabel, {color: theme.colors.text}]}>
                  Icon
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Default Toggle */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card style={styles.inputCard} padding="medium">
            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleLabel, {color: theme.colors.text}]}>
                  Set as Default
                </Text>
                <Text style={[styles.toggleHint, {color: theme.colors.textMuted}]}>
                  Pre-select this account for transactions
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  {backgroundColor: isDefault ? theme.colors.primary : theme.colors.surfaceVariant},
                ]}>
                <View
                  style={[
                    styles.toggleKnob,
                    {transform: [{translateX: isDefault ? 18 : 2}]},
                  ]}
                />
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        <View style={{height: 24}} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
        <GradientButton
          title={isEditing ? 'Update Account' : 'Create Account'}
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          icon="content-save"
          iconPosition="left"
          size="large"
        />
      </View>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Account Type
              </Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={ACCOUNT_CATEGORIES}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => handleCategorySelect(item)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor:
                        category === item.id ? item.color + '10' : 'transparent',
                    },
                  ]}>
                  <View style={[styles.typeIcon, {backgroundColor: item.color + '15'}]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.categoryText, {color: theme.colors.text}]}>
                    {item.label}
                  </Text>
                  {category === item.id && (
                    <Icon name="check-circle" size={22} color={item.color} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Choose Color
              </Text>
              <Pressable onPress={() => setShowColorPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <View style={styles.colorGrid}>
              {ACCOUNT_COLORS.map(color => (
                <Pressable
                  key={color}
                  onPress={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                  }}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    selectedColor === color && styles.colorSelected,
                  ]}>
                  {selectedColor === color && (
                    <Icon name="check" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Choose Icon
              </Text>
              <Pressable onPress={() => setShowIconPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <View style={styles.iconGrid}>
              {ACCOUNT_ICONS.map(icon => (
                <Pressable
                  key={icon}
                  onPress={() => {
                    setSelectedIcon(icon);
                    setShowIconPicker(false);
                  }}
                  style={[
                    styles.iconOption,
                    {backgroundColor: theme.colors.surfaceVariant},
                    selectedIcon === icon && {
                      backgroundColor: selectedColor + '20',
                      borderColor: selectedColor,
                      borderWidth: 2,
                    },
                  ]}>
                  <Icon
                    name={icon}
                    size={24}
                    color={selectedIcon === icon ? selectedColor : theme.colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
});

AddAccountScreen.displayName = 'AddAccountScreen';

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
  previewCard: {marginBottom: 16},
  previewRow: {flexDirection: 'row', alignItems: 'center'},
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {marginLeft: 16},
  previewName: {fontSize: 18, fontWeight: '700'},
  previewType: {fontSize: 14, marginTop: 2},
  inputCard: {marginBottom: 12},
  inputLabel: {fontSize: 13, marginBottom: 10},
  textInput: {fontSize: 16, fontWeight: '500', paddingVertical: 4},
  selectorRow: {flexDirection: 'row', alignItems: 'center'},
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  subTypeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  subTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  subTypeText: {fontSize: 13, fontWeight: '500'},
  amountRow: {flexDirection: 'row', alignItems: 'center'},
  currencySymbol: {fontSize: 20, fontWeight: '600', marginRight: 8},
  amountInput: {flex: 1, fontSize: 24, fontWeight: '600'},
  dateRow: {flexDirection: 'row', gap: 16, marginTop: 16},
  dateField: {flex: 1},
  dateLabel: {fontSize: 12, marginBottom: 6},
  dateInput: {
    fontSize: 16,
    fontWeight: '500',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
  },
  customRow: {flexDirection: 'row', gap: 16},
  customButton: {flex: 1, alignItems: 'center', gap: 8},
  colorPreview: {width: 44, height: 44, borderRadius: 22},
  iconPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customLabel: {fontSize: 13},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {fontSize: 16, fontWeight: '500'},
  toggleHint: {fontSize: 12, marginTop: 2},
  toggle: {width: 44, height: 26, borderRadius: 13, justifyContent: 'center'},
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  footer: {paddingHorizontal: 20, paddingTop: 20},
  errorText: {fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4},
  modalOverlay: {flex: 1, justifyContent: 'flex-end'},
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 20, fontWeight: '700'},
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddAccountScreen;
