/**
 * Add/Edit Expense Screen
 * 
 * Premium form for creating or editing an expense.
 * Features: instant feedback via Toast, smooth animations, and better UX.
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
  Alert,
  Vibration,
  Modal,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTheme, useCurrency} from '@/hooks';
import {useExpenseStore, useCategoryStore, useAccountStore} from '@/store';
import {Card, CategoryIcon, useToast} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {CategoryPicker} from '@/components/expense';
import {RootStackParamList, Category, UserAccount} from '@/types';
import {validateAmount, formatDate} from '@/utils';
import {format} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type RouteType = RouteProp<RootStackParamList, 'AddExpense'>;

export const AddExpenseScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {symbol, formatAmount} = useCurrency();
  const {showToast} = useToast();
  
  const {addExpense, updateExpense, getExpenseById} = useExpenseStore();
  const {categories} = useCategoryStore();
  const {accounts, getDefaultAccount, getActiveAccounts} = useAccountStore();
  
  // Animation values
  const saveButtonScale = useSharedValue(1);
  
  const expenseId = route.params?.expenseId;
  const isEditing = Boolean(expenseId);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [errors, setErrors] = useState<{amount?: string; category?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Get active accounts for selection
  const activeAccounts = getActiveAccounts();
  
  // Load existing expense data if editing, or set default account
  useEffect(() => {
    if (expenseId) {
      const expense = getExpenseById(expenseId);
      if (expense) {
        setAmount(expense.amount.toString());
        setNote(expense.note);
        setDate(new Date(expense.date));
        const category = categories.find(c => c.id === expense.categoryId);
        setSelectedCategory(category || null);
        // Load linked account if any
        if (expense.accountId) {
          const account = accounts.find(a => a.id === expense.accountId);
          setSelectedAccount(account || null);
        }
      }
    } else {
      // Set default account for new expenses
      const defaultAcc = getDefaultAccount();
      if (defaultAcc) {
        setSelectedAccount(defaultAcc);
      }
    }
  }, [expenseId, getExpenseById, categories, accounts, getDefaultAccount]);
  
  const handleAmountChange = useCallback((text: string) => {
    // Only allow numbers and one decimal point
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
  
  const handleCategorySelect = useCallback((category: Category) => {
    setSelectedCategory(category);
    setErrors(prev => ({...prev, category: undefined}));
  }, []);
  
  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);
  
  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error;
    }
    
    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, selectedCategory]);
  
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      // Shake animation for error feedback
      Vibration.vibrate(50);
      return;
    }
    
    setIsSaving(true);
    
    // Success animation
    saveButtonScale.value = withSequence(
      withTiming(0.95, {duration: 100}),
      withSpring(1, {damping: 10, stiffness: 200}),
    );
    
    try {
      const expenseData = {
        amount: parseFloat(amount),
        categoryId: selectedCategory!.id,
        note: note.trim(),
        date: format(date, 'yyyy-MM-dd'),
        accountId: selectedAccount?.id,
      };
      
      if (isEditing && expenseId) {
        updateExpense(expenseId, expenseData);
        showToast({
          type: 'success',
          title: 'Expense Updated',
          message: `${formatAmount(parseFloat(amount))} for ${selectedCategory!.name}`,
          duration: 2500,
        });
      } else {
        addExpense(expenseData);
        // Haptic feedback for success
        Vibration.vibrate(100);
        showToast({
          type: 'success',
          title: 'Expense Added',
          message: `${formatAmount(parseFloat(amount))} for ${selectedCategory!.name}`,
          duration: 2500,
        });
      }
      
      navigation.goBack();
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save expense. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm,
    amount,
    selectedCategory,
    note,
    date,
    isEditing,
    expenseId,
    updateExpense,
    addExpense,
    navigation,
    showToast,
    formatAmount,
    saveButtonScale,
  ]);
  
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
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </Text>
        <View style={{width: 24}} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <Text style={[styles.amountLabel, {color: theme.colors.textSecondary}]}>
              Amount
            </Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, {color: theme.colors.text}]}>
                {symbol}
              </Text>
              <TextInput
                style={[styles.amountInput, {color: theme.colors.text}]}
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
        
        {/* Category Selector */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Pressable onPress={() => setShowCategoryPicker(true)}>
            <Card
              style={{
                ...styles.selectorCard,
                ...(errors.category && {borderColor: theme.colors.error, borderWidth: 1}),
              }}
              padding="medium">
              <View style={styles.selectorRow}>
                {selectedCategory ? (
                  <>
                    <CategoryIcon
                      icon={selectedCategory.icon}
                      color={selectedCategory.color}
                      size="medium"
                    />
                    <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                      {selectedCategory.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.placeholderIcon,
                        {backgroundColor: theme.colors.surfaceVariant},
                      ]}>
                      <Icon name="shape-outline" size={20} color={theme.colors.textMuted} />
                    </View>
                    <Text style={[styles.selectorText, {color: theme.colors.textMuted}]}>
                      Select Category
                    </Text>
                  </>
                )}
                <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
              </View>
            </Card>
          </Pressable>
          {errors.category && (
            <Text style={[styles.errorText, {color: theme.colors.error, marginTop: 4}]}>
              {errors.category}
            </Text>
          )}
        </Animated.View>
        
        {/* Date Selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Card style={styles.selectorCard} padding="medium">
              <View style={styles.selectorRow}>
                <View
                  style={[
                    styles.placeholderIcon,
                    {backgroundColor: theme.colors.primaryLight + '20'},
                  ]}>
                  <Icon name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                  {formatDate(format(date, 'yyyy-MM-dd'), 'EEEE, MMM d, yyyy')}
                </Text>
                <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>
        
        {/* Account Selector (Optional) */}
        {activeAccounts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(225).duration(400)}>
            <Pressable onPress={() => setShowAccountPicker(true)}>
              <Card style={styles.selectorCard} padding="medium">
                <View style={styles.selectorRow}>
                  {selectedAccount ? (
                    <>
                      <View
                        style={[
                          styles.placeholderIcon,
                          {backgroundColor: selectedAccount.color + '20'},
                        ]}>
                        <Icon name={selectedAccount.icon} size={20} color={selectedAccount.color} />
                      </View>
                      <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                        {selectedAccount.name}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View
                        style={[
                          styles.placeholderIcon,
                          {backgroundColor: theme.colors.surfaceVariant},
                        ]}>
                        <Icon name="wallet-outline" size={20} color={theme.colors.textMuted} />
                      </View>
                      <Text style={[styles.selectorText, {color: theme.colors.textMuted}]}>
                        Select Account (optional)
                      </Text>
                    </>
                  )}
                  <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        )}
        
        {/* Note Input */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Card style={styles.noteCard} padding="medium">
            <Text style={[styles.noteLabel, {color: theme.colors.textSecondary}]}>
              Note (optional)
            </Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Card>
        </Animated.View>
        
        <View style={{height: 24}} />
      </ScrollView>
      
      {/* Save Button - Premium Gradient */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
        <GradientButton
          title={isEditing ? 'Update Expense' : 'Save Expense'}
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          icon="content-save"
          iconPosition="left"
          size="large"
        />
      </View>
      
      {/* Category Picker Modal */}
      <CategoryPicker
        visible={showCategoryPicker}
        categories={categories}
        selectedId={selectedCategory?.id || null}
        onSelect={handleCategorySelect}
        onClose={() => setShowCategoryPicker(false)}
      />
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
      
      {/* Account Picker Modal */}
      <Modal visible={showAccountPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Select Account
              </Text>
              <Pressable onPress={() => setShowAccountPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={[null, ...activeAccounts]}
              keyExtractor={item => item?.id || 'none'}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => {
                    setSelectedAccount(item);
                    setShowAccountPicker(false);
                  }}
                  style={[
                    styles.accountPickerItem,
                    {
                      backgroundColor:
                        (item?.id || null) === (selectedAccount?.id || null)
                          ? (item?.color || theme.colors.primary) + '10'
                          : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.accountPickerIcon,
                      {backgroundColor: item ? item.color + '15' : theme.colors.surfaceVariant},
                    ]}>
                    <Icon
                      name={item?.icon || 'close-circle-outline'}
                      size={22}
                      color={item?.color || theme.colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.accountPickerText, {color: theme.colors.text}]}>
                    {item?.name || 'No Account'}
                  </Text>
                  {(item?.id || null) === (selectedAccount?.id || null) && (
                    <Icon
                      name="check-circle"
                      size={22}
                      color={item?.color || theme.colors.primary}
                    />
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

AddExpenseScreen.displayName = 'AddExpenseScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  amountCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  selectorCard: {
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  noteCard: {
    marginTop: 4,
  },
  noteLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  noteInput: {
    fontSize: 16,
    padding: 12,
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
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
  accountPickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default AddExpenseScreen;
