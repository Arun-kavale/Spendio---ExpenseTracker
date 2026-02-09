/**
 * Add/Edit Income Screen
 * 
 * Premium form for creating or editing an income entry.
 * Supports category, payment method, recurring, and notes.
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
import {useIncomeStore, useAccountStore} from '@/store';
import {Card, useToast} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {RootStackParamList, PaymentMethod, IncomeCategory, UserAccount} from '@/types';
import {validateAmount, formatDate} from '@/utils';
import {INCOME_CATEGORIES, PAYMENT_METHODS} from '@/constants';
import {format} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddIncome'>;
type RouteType = RouteProp<RootStackParamList, 'AddIncome'>;

export const AddIncomeScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {symbol, formatAmount} = useCurrency();
  const {showToast} = useToast();

  const {addIncome, updateIncome, getIncomeById} = useIncomeStore();
  const {accounts, getDefaultAccount, getActiveAccounts} = useAccountStore();

  const incomeId = route.params?.incomeId;
  const isEditing = Boolean(incomeId);

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [errors, setErrors] = useState<{amount?: string; category?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // Get active accounts for selection
  const activeAccounts = getActiveAccounts();

  useEffect(() => {
    if (incomeId) {
      const income = getIncomeById(incomeId);
      if (income) {
        setAmount(income.amount.toString());
        setNote(income.note);
        setDate(new Date(income.date));
        setPaymentMethod(income.paymentMethod);
        setIsRecurring(income.isRecurring);
        const cat = INCOME_CATEGORIES.find(c => c.id === income.categoryId);
        setSelectedCategory(cat || null);
        // Load linked account if any
        if (income.accountId) {
          const account = accounts.find(a => a.id === income.accountId);
          setSelectedAccount(account || null);
        }
      }
    } else {
      // Set default account for new income
      const defaultAcc = getDefaultAccount();
      if (defaultAcc) {
        setSelectedAccount(defaultAcc);
      }
    }
  }, [incomeId, getIncomeById, accounts, getDefaultAccount]);

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

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
    setErrors(prev => ({...prev, amount: undefined}));
  }, []);

  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) newErrors.amount = amountValidation.error;
    if (!selectedCategory) newErrors.category = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, selectedCategory]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Vibration.vibrate(50);
      return;
    }
    setIsSaving(true);
    try {
      const incomeData = {
        amount: parseFloat(amount),
        categoryId: selectedCategory!.id,
        note: note.trim(),
        date: format(date, 'yyyy-MM-dd'),
        paymentMethod,
        accountId: selectedAccount?.id,
        isRecurring,
      };

      if (isEditing && incomeId) {
        updateIncome(incomeId, incomeData);
        showToast({type: 'success', title: 'Income Updated', message: `${formatAmount(parseFloat(amount))} - ${selectedCategory!.name}`, duration: 2500});
      } else {
        addIncome(incomeData);
        Vibration.vibrate(100);
        showToast({type: 'success', title: 'Income Added', message: `${formatAmount(parseFloat(amount))} - ${selectedCategory!.name}`, duration: 2500});
      }
      navigation.goBack();
    } catch {
      showToast({type: 'error', title: 'Error', message: 'Failed to save income.', duration: 3000});
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, amount, selectedCategory, note, date, paymentMethod, isRecurring, isEditing, incomeId, updateIncome, addIncome, navigation, showToast, formatAmount]);

  return (
    <KeyboardAvoidingView style={[styles.container, {backgroundColor: theme.colors.background}]} behavior="padding" keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {isEditing ? 'Edit Income' : 'Add Income'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: 24 + insets.bottom}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <Text style={[styles.amountLabel, {color: theme.colors.textSecondary}]}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, {color: theme.colors.income}]}>{symbol}</Text>
              <TextInput
                style={[styles.amountInput, {color: theme.colors.income}]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus={!isEditing}
              />
            </View>
            {errors.amount && <Text style={[styles.errorText, {color: theme.colors.error}]}>{errors.amount}</Text>}
          </Card>
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Pressable onPress={() => setShowCategoryPicker(true)}>
            <Card style={{...styles.selectorCard, ...(errors.category && {borderColor: theme.colors.error, borderWidth: 1})}} padding="medium">
              <View style={styles.selectorRow}>
                {selectedCategory ? (
                  <>
                    <View style={[styles.catIcon, {backgroundColor: selectedCategory.color + '15'}]}>
                      <Icon name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                    </View>
                    <Text style={[styles.selectorText, {color: theme.colors.text}]}>{selectedCategory.name}</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.catIcon, {backgroundColor: theme.colors.surfaceVariant}]}>
                      <Icon name="shape-outline" size={20} color={theme.colors.textMuted} />
                    </View>
                    <Text style={[styles.selectorText, {color: theme.colors.textMuted}]}>Select Category</Text>
                  </>
                )}
                <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
              </View>
            </Card>
          </Pressable>
          {errors.category && <Text style={[styles.errorText, {color: theme.colors.error, marginTop: 4}]}>{errors.category}</Text>}
        </Animated.View>

        {/* Payment Method */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.selectorCard} padding="medium">
            <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map(pm => (
                <Pressable
                  key={pm.id}
                  onPress={() => setPaymentMethod(pm.id as PaymentMethod)}
                  style={[
                    styles.paymentChip,
                    {
                      backgroundColor: paymentMethod === pm.id ? theme.colors.income + '15' : theme.colors.surfaceVariant,
                      borderColor: paymentMethod === pm.id ? theme.colors.income : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}>
                  <Icon name={pm.icon} size={16} color={paymentMethod === pm.id ? theme.colors.income : theme.colors.textMuted} />
                  <Text style={[styles.paymentChipText, {color: paymentMethod === pm.id ? theme.colors.income : theme.colors.textSecondary}]}>{pm.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Date */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Card style={styles.selectorCard} padding="medium">
              <View style={styles.selectorRow}>
                <View style={[styles.catIcon, {backgroundColor: theme.colors.income + '15'}]}>
                  <Icon name="calendar" size={20} color={theme.colors.income} />
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
          <Animated.View entering={FadeInDown.delay(275).duration(400)}>
            <Pressable onPress={() => setShowAccountPicker(true)}>
              <Card style={styles.selectorCard} padding="medium">
                <View style={styles.selectorRow}>
                  {selectedAccount ? (
                    <>
                      <View style={[styles.catIcon, {backgroundColor: selectedAccount.color + '15'}]}>
                        <Icon name={selectedAccount.icon} size={20} color={selectedAccount.color} />
                      </View>
                      <Text style={[styles.selectorText, {color: theme.colors.text}]}>
                        {selectedAccount.name}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View style={[styles.catIcon, {backgroundColor: theme.colors.surfaceVariant}]}>
                        <Icon name="wallet-outline" size={20} color={theme.colors.textMuted} />
                      </View>
                      <Text style={[styles.selectorText, {color: theme.colors.textMuted}]}>
                        Deposit to Account (optional)
                      </Text>
                    </>
                  )}
                  <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        )}

        {/* Recurring Toggle */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card style={styles.selectorCard} padding="medium">
            <Pressable onPress={() => setIsRecurring(!isRecurring)} style={styles.selectorRow}>
              <View style={[styles.catIcon, {backgroundColor: theme.colors.info + '15'}]}>
                <Icon name="repeat" size={20} color={theme.colors.info} />
              </View>
              <Text style={[styles.selectorText, {color: theme.colors.text}]}>Recurring Income</Text>
              <View style={[styles.toggle, {backgroundColor: isRecurring ? theme.colors.income : theme.colors.surfaceVariant}]}>
                <View style={[styles.toggleKnob, {transform: [{translateX: isRecurring ? 18 : 2}]}]} />
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* Note */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Card style={styles.noteCard} padding="medium">
            <Text style={[styles.fieldLabel, {color: theme.colors.textSecondary}]}>Note (optional)</Text>
            <TextInput
              style={[styles.noteInput, {color: theme.colors.text, backgroundColor: theme.colors.surfaceVariant}]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
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
            title={isEditing ? 'Update Income' : 'Save Income'}
            onPress={handleSave}
            loading={isSaving}
            fullWidth
            icon="content-save"
            iconPosition="left"
            size="large"
            variant="success"
          />
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={INCOME_CATEGORIES}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryPicker(false);
                    setErrors(prev => ({...prev, category: undefined}));
                  }}
                  style={[styles.catPickerItem, {backgroundColor: selectedCategory?.id === item.id ? item.color + '10' : 'transparent'}]}>
                  <View style={[styles.catIcon, {backgroundColor: item.color + '15'}]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.catPickerText, {color: theme.colors.text}]}>{item.name}</Text>
                  {selectedCategory?.id === item.id && <Icon name="check-circle" size={22} color={item.color} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="spinner" onChange={handleDateChange} maximumDate={new Date()} />
      )}

      {/* Account Picker Modal */}
      <Modal visible={showAccountPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Deposit to Account
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
                          ? (item?.color || theme.colors.income) + '10'
                          : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.catIcon,
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
                      color={item?.color || theme.colors.income}
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

AddIncomeScreen.displayName = 'AddIncomeScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16},
  title: {fontSize: 18, fontWeight: '600'},
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  amountCard: {marginBottom: 16, alignItems: 'center'},
  amountLabel: {fontSize: 14, marginBottom: 12},
  amountInputContainer: {flexDirection: 'row', alignItems: 'center'},
  currencySymbol: {fontSize: 32, fontWeight: '600', marginRight: 4},
  amountInput: {fontSize: 48, fontWeight: '700', minWidth: 100, textAlign: 'center'},
  errorText: {fontSize: 12, marginTop: 8},
  selectorCard: {marginBottom: 12},
  selectorRow: {flexDirection: 'row', alignItems: 'center'},
  catIcon: {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  selectorText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  fieldLabel: {fontSize: 14, marginBottom: 12},
  paymentMethods: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  paymentChip: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6},
  paymentChipText: {fontSize: 12, fontWeight: '500'},
  toggle: {width: 44, height: 26, borderRadius: 13, justifyContent: 'center'},
  toggleKnob: {width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2},
  noteCard: {marginTop: 4},
  noteInput: {fontSize: 16, padding: 12, minHeight: 80, borderRadius: 12},
  footer: {paddingHorizontal: 20, paddingTop: 20, backgroundColor: 'transparent'},
  modalOverlay: {flex: 1, justifyContent: 'flex-end'},
  modalContent: {borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  modalTitle: {fontSize: 20, fontWeight: '700'},
  catPickerItem: {flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4},
  catPickerText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  accountPickerItem: {flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4},
  accountPickerText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
});

export default AddIncomeScreen;
