/**
 * Add/Edit Budget Screen
 * 
 * Form for creating or updating category-wise monthly budgets.
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useBudgetStore, useCategoryStore} from '@/store';
import {Card, useToast} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {RootStackParamList, Category} from '@/types';
import {validateAmount, formatMonth} from '@/utils';
import {format} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddBudget'>;
type RouteType = RouteProp<RootStackParamList, 'AddBudget'>;

export const AddBudgetScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {symbol, formatAmount} = useCurrency();
  const {showToast} = useToast();

  const {addBudget, updateBudget, getBudgetById} = useBudgetStore();
  const {categories} = useCategoryStore();

  const budgetId = route.params?.budgetId;
  const month = route.params?.month || format(new Date(), 'yyyy-MM');
  const isEditing = Boolean(budgetId);

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [rollover, setRollover] = useState(false);
  const [errors, setErrors] = useState<{amount?: string; category?: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (budgetId) {
      const budget = getBudgetById(budgetId);
      if (budget) {
        setAmount(budget.amount.toString());
        setRollover(budget.rollover);
        const cat = categories.find(c => c.id === budget.categoryId);
        setSelectedCategory(cat || null);
      }
    }
  }, [budgetId, getBudgetById, categories]);

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
    setErrors(prev => ({...prev, amount: undefined}));
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
      const budgetData = {
        month,
        categoryId: selectedCategory!.id,
        amount: parseFloat(amount),
        rollover,
      };

      if (isEditing && budgetId) {
        updateBudget(budgetId, budgetData);
        showToast({type: 'success', title: 'Budget Updated', message: `${selectedCategory!.name}: ${formatAmount(parseFloat(amount))}`, duration: 2500});
      } else {
        addBudget(budgetData);
        Vibration.vibrate(100);
        showToast({type: 'success', title: 'Budget Created', message: `${selectedCategory!.name}: ${formatAmount(parseFloat(amount))}`, duration: 2500});
      }
      navigation.goBack();
    } catch {
      showToast({type: 'error', title: 'Error', message: 'Failed to save budget.', duration: 3000});
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, amount, selectedCategory, month, rollover, isEditing, budgetId, updateBudget, addBudget, navigation, showToast, formatAmount]);

  return (
    <KeyboardAvoidingView style={[styles.container, {backgroundColor: theme.colors.background}]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, {color: theme.colors.text}]}>{isEditing ? 'Edit Budget' : 'Create Budget'}</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Month indicator */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={[styles.monthBadge, {backgroundColor: theme.colors.primary + '15'}]}>
            <Icon name="calendar-month" size={16} color={theme.colors.primary} />
            <Text style={[styles.monthBadgeText, {color: theme.colors.primary}]}>{formatMonth(month)}</Text>
          </View>
        </Animated.View>

        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <Text style={[styles.amountLabel, {color: theme.colors.textSecondary}]}>Budget Limit</Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, {color: theme.colors.text}]}>{symbol}</Text>
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
            {errors.amount && <Text style={[styles.errorText, {color: theme.colors.error}]}>{errors.amount}</Text>}
          </Card>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={[styles.sectionLabel, {color: theme.colors.textSecondary}]}>Select Category</Text>
          {errors.category && <Text style={[styles.errorText, {color: theme.colors.error, marginBottom: 8}]}>{errors.category}</Text>}
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedCategory(cat);
                  setErrors(prev => ({...prev, category: undefined}));
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory?.id === cat.id ? cat.color + '20' : theme.colors.surfaceVariant,
                    borderColor: selectedCategory?.id === cat.id ? cat.color : 'transparent',
                    borderWidth: 1.5,
                  },
                ]}>
                <Icon name={cat.icon} size={18} color={selectedCategory?.id === cat.id ? cat.color : theme.colors.textMuted} />
                <Text
                  style={[styles.categoryChipText, {color: selectedCategory?.id === cat.id ? cat.color : theme.colors.textSecondary}]}
                  numberOfLines={1}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Rollover Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.toggleCard} padding="medium">
            <Pressable onPress={() => setRollover(!rollover)} style={styles.toggleRow}>
              <View style={[styles.toggleIcon, {backgroundColor: theme.colors.info + '15'}]}>
                <Icon name="repeat" size={20} color={theme.colors.info} />
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, {color: theme.colors.text}]}>Monthly Rollover</Text>
                <Text style={[styles.toggleSubtitle, {color: theme.colors.textMuted}]}>Carry unused budget to next month</Text>
              </View>
              <View style={[styles.toggle, {backgroundColor: rollover ? theme.colors.primary : theme.colors.surfaceVariant}]}>
                <View style={[styles.toggleKnob, {transform: [{translateX: rollover ? 18 : 2}]}]} />
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        <View style={{height: 24}} />
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
        <GradientButton
          title={isEditing ? 'Update Budget' : 'Create Budget'}
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          icon="chart-arc"
          iconPosition="left"
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
  );
});

AddBudgetScreen.displayName = 'AddBudgetScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16},
  title: {fontSize: 18, fontWeight: '600'},
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  monthBadge: {flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8, marginBottom: 16},
  monthBadgeText: {fontSize: 14, fontWeight: '600'},
  amountCard: {marginBottom: 20, alignItems: 'center'},
  amountLabel: {fontSize: 14, marginBottom: 12},
  amountInputContainer: {flexDirection: 'row', alignItems: 'center'},
  currencySymbol: {fontSize: 32, fontWeight: '600', marginRight: 4},
  amountInput: {fontSize: 48, fontWeight: '700', minWidth: 100, textAlign: 'center'},
  errorText: {fontSize: 12, marginTop: 8, color: '#EF4444'},
  sectionLabel: {fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4},
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20},
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  categoryChipText: {fontSize: 13, fontWeight: '500'},
  toggleCard: {marginBottom: 12},
  toggleRow: {flexDirection: 'row', alignItems: 'center'},
  toggleIcon: {width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  toggleContent: {flex: 1, marginLeft: 12},
  toggleTitle: {fontSize: 16, fontWeight: '500'},
  toggleSubtitle: {fontSize: 12, marginTop: 2},
  toggle: {width: 44, height: 26, borderRadius: 13, justifyContent: 'center'},
  toggleKnob: {width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2},
  footer: {paddingHorizontal: 20, paddingTop: 20, backgroundColor: 'transparent'},
});

export default AddBudgetScreen;
