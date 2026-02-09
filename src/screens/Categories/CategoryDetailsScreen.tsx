/**
 * Category Details Screen
 * 
 * Shows category analytics and related expenses.
 */

import React, {memo, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useCategoryStore, useExpenseStore} from '@/store';
import {Card, CategoryIcon, AdvancedHeader, Button, EmptyState} from '@/components/common';
import {ExpenseCard} from '@/components/expense';
import {BarChart} from '@/components/charts';
import {RootStackParamList, Expense} from '@/types';
import {startOfMonth, endOfMonth, subMonths, format} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryDetails'>;
type RouteType = RouteProp<RootStackParamList, 'CategoryDetails'>;

export const CategoryDetailsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {formatAmount} = useCurrency();
  
  const {getCategoryById, deleteCategory} = useCategoryStore();
  const {expenses, getDailyExpenses} = useExpenseStore();
  
  const category = getCategoryById(route.params.categoryId);
  
  // Get expenses for this category
  const categoryExpenses = useMemo(() => {
    if (!category) return [];
    return expenses
      .filter(e => e.categoryId === category.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, category]);
  
  // Get monthly totals
  const monthlyStats = useMemo(() => {
    if (!category) return {thisMonth: 0, lastMonth: 0, dailyData: []};
    
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const thisMonthExpenses = categoryExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    });
    
    const lastMonthExpenses = categoryExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    
    // Daily data for chart
    const dailyData = getDailyExpenses(thisMonthStart, thisMonthEnd)
      .map(d => ({
        ...d,
        total: categoryExpenses
          .filter(e => e.date === d.date)
          .reduce((sum, e) => sum + e.amount, 0),
      }));
    
    return {
      thisMonth: thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
      lastMonth: lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
      thisMonthCount: thisMonthExpenses.length,
      dailyData,
    };
  }, [category, categoryExpenses, getDailyExpenses]);
  
  const handleEdit = useCallback(() => {
    if (category) {
      navigation.navigate('AddCategory', {categoryId: category.id});
    }
  }, [category, navigation]);
  
  const handleDelete = useCallback(() => {
    if (!category) return;
    
    if (category.isSystem) {
      Alert.alert('Cannot Delete', 'System categories cannot be deleted.');
      return;
    }
    
    if (categoryExpenses.length > 0) {
      Alert.alert(
        'Category Has Expenses',
        `This category has ${categoryExpenses.length} expenses. Delete them first or reassign them to another category.`
      );
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategory(category.id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [category, categoryExpenses, deleteCategory, navigation]);
  
  const renderExpense = useCallback(
    ({item, index}: {item: Expense; index: number}) => (
      <ExpenseCard
        expense={item}
        category={category}
        onPress={() => navigation.navigate('ExpenseDetails', {expenseId: item.id})}
        index={index}
      />
    ),
    [category, navigation]
  );
  
  if (!category) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <AdvancedHeader title="Category" showBack onBack={() => navigation.goBack()} variant="elevated" />
        <EmptyState icon="shape-outline" title="Category not found" />
      </View>
    );
  }
  
  const percentChange = monthlyStats.lastMonth > 0
    ? ((monthlyStats.thisMonth - monthlyStats.lastMonth) / monthlyStats.lastMonth) * 100
    : 0;
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title={category.name}
        showBack
        onBack={() => navigation.goBack()}
        rightActions={!category.isSystem ? [{icon: 'pencil', onPress: handleEdit}] : undefined}
        variant="elevated"
      />
      
      <FlatList
        data={categoryExpenses.slice(0, 20)}
        renderItem={renderExpense}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            {/* Category Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Card style={styles.headerCard} padding="large">
                <CategoryIcon icon={category.icon} color={category.color} size="large" />
                <Text style={[styles.totalSpent, {color: theme.colors.expense}]}>
                  {formatAmount(monthlyStats.thisMonth)}
                </Text>
                <Text style={[styles.periodLabel, {color: theme.colors.textSecondary}]}>
                  spent this month ({monthlyStats.thisMonthCount} transactions)
                </Text>
                
                {monthlyStats.lastMonth > 0 && (
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor:
                          percentChange > 0
                            ? theme.colors.error + '15'
                            : theme.colors.success + '15',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.changeText,
                        {
                          color: percentChange > 0 ? theme.colors.error : theme.colors.success,
                        },
                      ]}>
                      {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>
            
            {/* Daily Chart */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <Card style={styles.chartCard} padding="medium">
                <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
                  Daily Spending
                </Text>
                <BarChart data={monthlyStats.dailyData} height={140} />
              </Card>
            </Animated.View>
            
            {/* Recent Expenses Header */}
            {categoryExpenses.length > 0 && (
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                Recent Expenses
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt"
            title="No expenses yet"
            description="Start tracking by adding your first expense in this category"
          />
        }
        ListFooterComponent={
          !category.isSystem ? (
            <View style={styles.deleteSection}>
              <Button
                title="Delete Category"
                onPress={handleDelete}
                variant="ghost"
                icon="trash-can-outline"
              />
            </View>
          ) : null
        }
        contentContainerStyle={[styles.list, {paddingBottom: insets.bottom + 24}]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

CategoryDetailsScreen.displayName = 'CategoryDetailsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalSpent: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 16,
  },
  periodLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  deleteSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});

export default CategoryDetailsScreen;
