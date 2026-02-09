/**
 * Expense Details Screen
 * 
 * Shows full details of an expense with edit and delete options.
 * Features: Toast notifications for delete feedback.
 */

import React, {memo, useCallback} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useExpenseStore, useCategoryStore} from '@/store';
import {Button, Card, CategoryIcon, AdvancedHeader, useToast} from '@/components/common';
import {RootStackParamList} from '@/types';
import {formatDate, formatTimeAgo} from '@/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExpenseDetails'>;
type RouteType = RouteProp<RootStackParamList, 'ExpenseDetails'>;

export const ExpenseDetailsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {formatAmount} = useCurrency();
  const {showToast} = useToast();
  
  const {getExpenseById, deleteExpense} = useExpenseStore();
  const {categories} = useCategoryStore();
  
  const expense = getExpenseById(route.params.expenseId);
  const category = expense
    ? categories.find(c => c.id === expense.categoryId)
    : undefined;
  
  const handleEdit = useCallback(() => {
    if (expense) {
      navigation.navigate('AddExpense', {expenseId: expense.id});
    }
  }, [expense, navigation]);
  
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (expense) {
              const expenseNote = expense.note || category?.name || 'Expense';
              deleteExpense(expense.id);
              navigation.goBack();
              showToast({
                type: 'success',
                title: 'Expense Deleted',
                message: `"${expenseNote}" has been removed`,
                duration: 2500,
              });
            }
          },
        },
      ]
    );
  }, [expense, category, deleteExpense, navigation, showToast]);
  
  if (!expense) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <AdvancedHeader
          title="Expense Details"
          showBack
          onBack={() => navigation.goBack()}
          variant="elevated"
        />
        <View style={styles.notFound}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.notFoundText, {color: theme.colors.textMuted}]}>
            Expense not found
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="Expense Details"
        showBack
        onBack={() => navigation.goBack()}
        rightActions={[{icon: 'pencil', onPress: handleEdit}]}
        variant="elevated"
      />
      
      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 100}]}
        showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.amountCard} padding="large">
            <CategoryIcon
              icon={category?.icon || 'help-circle'}
              color={category?.color || theme.colors.textMuted}
              size="large"
            />
            <Text style={[styles.amount, {color: theme.colors.expense}]}>
              -{formatAmount(expense.amount)}
            </Text>
            <Text style={[styles.categoryName, {color: theme.colors.textSecondary}]}>
              {category?.name || 'Unknown Category'}
            </Text>
          </Card>
        </Animated.View>
        
        {/* Details Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.detailsCard} padding="none">
            <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
              <View style={styles.detailIcon}>
                <Icon name="calendar" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                  Date
                </Text>
                <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                  {formatDate(expense.date, 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
            </View>
            
            {expense.note && (
              <View style={[styles.detailRow, {borderBottomColor: theme.colors.border}]}>
                <View style={styles.detailIcon}>
                  <Icon name="text" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                    Note
                  </Text>
                  <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                    {expense.note}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon name="clock-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, {color: theme.colors.textSecondary}]}>
                  Created
                </Text>
                <Text style={[styles.detailValue, {color: theme.colors.text}]}>
                  {formatTimeAgo(expense.createdAt)}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + 16}]}>
        <Button
          title="Delete Expense"
          onPress={handleDelete}
          variant="danger"
          icon="trash-can-outline"
          fullWidth
        />
      </View>
    </View>
  );
});

ExpenseDetailsScreen.displayName = 'ExpenseDetailsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    marginTop: 16,
  },
  amountCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
});

export default ExpenseDetailsScreen;
