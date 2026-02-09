/**
 * Income Details Screen
 * 
 * Shows full details of an income entry with edit and delete options.
 */

import React, {memo, useCallback} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useIncomeStore} from '@/store';
import {Button, Card, AdvancedHeader, useToast} from '@/components/common';
import {RootStackParamList} from '@/types';
import {formatDate, formatTimeAgo} from '@/utils';
import {INCOME_CATEGORIES, PAYMENT_METHODS} from '@/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'IncomeDetails'>;
type RouteType = RouteProp<RootStackParamList, 'IncomeDetails'>;

export const IncomeDetailsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {formatAmount} = useCurrency();
  const {showToast} = useToast();

  const {getIncomeById, deleteIncome} = useIncomeStore();
  const income = getIncomeById(route.params.incomeId);
  const category = income ? INCOME_CATEGORIES.find(c => c.id === income.categoryId) : undefined;
  const paymentMethodInfo = income ? PAYMENT_METHODS.find(p => p.id === income.paymentMethod) : undefined;

  const handleEdit = useCallback(() => {
    if (income) navigation.navigate('AddIncome', {incomeId: income.id});
  }, [income, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Income', 'Are you sure you want to delete this income entry?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (income) {
            deleteIncome(income.id);
            navigation.goBack();
            showToast({type: 'success', title: 'Income Deleted', message: `"${income.note || category?.name}" has been removed`, duration: 2500});
          }
        },
      },
    ]);
  }, [income, category, deleteIncome, navigation, showToast]);

  if (!income) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <AdvancedHeader title="Income Details" showBack onBack={() => navigation.goBack()} variant="elevated" />
        <View style={styles.notFound}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.notFoundText, {color: theme.colors.textMuted}]}>Income not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader title="Income Details" showBack onBack={() => navigation.goBack()} rightActions={[{icon: 'pencil', onPress: handleEdit}]} variant="elevated" />

      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 100}]} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <View style={[styles.categoryIconLarge, {backgroundColor: (category?.color || theme.colors.income) + '15'}]}>
              <Icon name={category?.icon || 'cash'} size={32} color={category?.color || theme.colors.income} />
            </View>
            <Text style={[styles.amount, {color: theme.colors.income}]}>+{formatAmount(income.amount)}</Text>
            <Text style={[styles.categoryName, {color: theme.colors.textSecondary}]}>{category?.name || 'Income'}</Text>
          </Card>
        </Animated.View>

        {/* Details Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.detailsCard} padding="none">
            <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
              <View style={[styles.detailIcon, {backgroundColor: theme.colors.income + '10'}]}>
                <Icon name="calendar" size={20} color={theme.colors.income} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>Date</Text>
                <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                  {formatDate(income.date, 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
            </View>

            <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
              <View style={[styles.detailIcon, {backgroundColor: theme.colors.income + '10'}]}>
                <Icon name={paymentMethodInfo?.icon || 'bank'} size={20} color={theme.colors.income} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>Payment Method</Text>
                <Text style={[styles.detailValue, {color: theme.colors.text}]}>{paymentMethodInfo?.label || income.paymentMethod}</Text>
              </View>
            </View>

            {income.isRecurring && (
              <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
                <View style={[styles.detailIcon, {backgroundColor: theme.colors.info + '10'}]}>
                  <Icon name="repeat" size={20} color={theme.colors.info} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>Type</Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>Recurring Income</Text>
                </View>
              </View>
            )}

            {income.note ? (
              <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
                <View style={[styles.detailIcon, {backgroundColor: theme.colors.income + '10'}]}>
                  <Icon name="text" size={20} color={theme.colors.income} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>Note</Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>{income.note}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, {backgroundColor: theme.colors.income + '10'}]}>
                <Icon name="clock-outline" size={20} color={theme.colors.income} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>Created</Text>
                <Text style={[styles.detailValue, {color: theme.colors.text}]}>{formatTimeAgo(income.createdAt)}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: insets.bottom + 16}]}>
        <Button title="Delete Income" onPress={handleDelete} variant="danger" icon="trash-can-outline" fullWidth />
      </View>
    </View>
  );
});

IncomeDetailsScreen.displayName = 'IncomeDetailsScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16},
  notFound: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  notFoundText: {fontSize: 16, marginTop: 16},
  amountCard: {alignItems: 'center', marginBottom: 16},
  categoryIconLarge: {width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  amount: {fontSize: 40, fontWeight: '700', marginTop: 16, marginBottom: 4},
  categoryName: {fontSize: 16},
  detailsCard: {marginBottom: 16},
  detailRow: {flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1},
  detailIcon: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  detailContent: {flex: 1},
  detailLabel: {fontSize: 12, marginBottom: 2},
  detailValue: {fontSize: 15, fontWeight: '500'},
  footer: {position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16, backgroundColor: 'transparent'},
});

export default IncomeDetailsScreen;
