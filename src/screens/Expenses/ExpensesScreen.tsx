/**
 * Expenses Screen
 * 
 * Lists all expenses with filtering, searching, and sorting.
 * Features a collapsible sticky header:
 *  - Title + actions always visible
 *  - Search bar, date filters, and summary scroll naturally with content
 *  - Compact summary fades into sticky header when scrolled
 * 
 * REACTIVE: Automatically updates when expenses change via Zustand subscription.
 */

import React, {memo, useMemo, useCallback, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  SlideInRight,
  SlideOutLeft,
  FadeInDown,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Swipeable} from 'react-native-gesture-handler';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useExpenseStore, useCategoryStore} from '@/store';
import {ExpenseCard, DateFilterChips} from '@/components/expense';
import {EmptyState, StickyHeader} from '@/components/common';
import {RootStackParamList, Expense, DateFilterType} from '@/types';
import {formatDate} from '@/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GroupedExpenses {
  date: string;
  formattedDate: string;
  total: number;
  expenses: Expense[];
}

export const ExpensesScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount} = useCurrency();
  
  // Collapsible header — snap after search+filters+summary (~140px)
  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 140});
  
  // CRITICAL FIX: Subscribe directly to expenses array for reactivity
  const expenses = useExpenseStore(state => state.expenses);
  const filters = useExpenseStore(state => state.filters);
  const setFilters = useExpenseStore(state => state.setFilters);
  const getFilteredExpenses = useExpenseStore(state => state.getFilteredExpenses);
  const deleteExpense = useExpenseStore(state => state.deleteExpense);
  const {categories} = useCategoryStore();
  
  // Track open swipeable refs
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Include expenses in dependencies for reactivity
  const filteredExpenses = useMemo(() => {
    let result = getFilteredExpenses();
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(exp => {
        const category = categories.find(c => c.id === exp.categoryId);
        return (
          exp.note.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [expenses, getFilteredExpenses, searchQuery, categories, filters]);
  
  // Handle swipe to delete
  const handleDeleteExpense = useCallback((expenseId: string, expenseNote: string) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseNote || 'this expense'}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteExpense(expenseId);
            // Close all swipeables
            swipeableRefs.current.forEach(ref => ref?.close());
          },
        },
      ],
    );
  }, [deleteExpense]);
  
  // Render delete action for swipeable
  const renderRightActions = useCallback((expense: Expense) => (
    <Pressable
      style={[styles.deleteAction, {backgroundColor: theme.colors.error}]}
      onPress={() => handleDeleteExpense(expense.id, expense.note)}>
      <Icon name="trash-can-outline" size={24} color="#FFFFFF" />
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  ), [theme.colors.error, handleDeleteExpense]);
  
  // Group expenses by date
  const groupedExpenses = useMemo((): GroupedExpenses[] => {
    const groups: Map<string, Expense[]> = new Map();
    
    filteredExpenses.forEach(expense => {
      const existing = groups.get(expense.date) || [];
      groups.set(expense.date, [...existing, expense]);
    });
    
    return Array.from(groups.entries())
      .map(([date, exps]) => ({
        date,
        formattedDate: formatDate(date, 'EEEE, MMMM d'),
        total: exps.reduce((sum, e) => sum + e.amount, 0),
        expenses: exps,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses]);
  
  const handleDateFilterChange = useCallback(
    (type: DateFilterType) => {
      setFilters({dateFilter: {type, startDate: null, endDate: null}});
    },
    [setFilters]
  );
  
  const getCategoryForExpense = useCallback(
    (categoryId: string) => categories.find(c => c.id === categoryId),
    [categories]
  );
  
  const renderSectionHeader = useCallback(
    ({section}: {section: GroupedExpenses}) => (
      <View
        style={[
          styles.sectionHeader,
          {backgroundColor: theme.colors.background},
        ]}>
        <Text style={[styles.sectionDate, {color: theme.colors.text}]}>
          {section.formattedDate}
        </Text>
        <Text style={[styles.sectionTotal, {color: theme.colors.textSecondary}]}>
          {formatAmount(section.total)}
        </Text>
      </View>
    ),
    [theme, formatAmount]
  );
  
  const renderExpense = useCallback(
    ({item, index}: {item: Expense; index: number}) => (
      <Swipeable
        ref={ref => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          }
        }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}>
        <ExpenseCard
          expense={item}
          category={getCategoryForExpense(item.categoryId)}
          onPress={() => navigation.navigate('ExpenseDetails', {expenseId: item.id})}
          index={index}
        />
      </Swipeable>
    ),
    [getCategoryForExpense, navigation, renderRightActions]
  );
  
  const renderGroup = useCallback(
    ({item}: {item: GroupedExpenses}) => (
      <Animated.View
        entering={FadeIn.duration(300)}
        layout={Layout.springify()}>
        {renderSectionHeader({section: item})}
        {item.expenses.map((expense, index) => (
          <View key={expense.id}>
            {renderExpense({item: expense, index})}
          </View>
        ))}
      </Animated.View>
    ),
    [renderSectionHeader, renderExpense]
  );
  
  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );
  
  // List header: search, filters, summary (scrolls naturally with content)
  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      {searchVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {backgroundColor: theme.colors.surfaceVariant},
            ]}>
            <Icon name="magnify" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, {color: theme.colors.text}]}
              placeholder="Search expenses..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
      
      {/* Date Filters */}
      <DateFilterChips
        selectedFilter={filters.dateFilter.type}
        onFilterChange={handleDateFilterChange}
      />
      
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={[styles.summaryText, {color: theme.colors.textSecondary}]}>
          {filteredExpenses.length} expenses • Total:{' '}
          <Text style={{color: theme.colors.expense, fontWeight: '600'}}>
            {formatAmount(totalFiltered)}
          </Text>
        </Text>
      </View>
    </View>
  ), [searchVisible, searchQuery, theme, filters.dateFilter.type, filteredExpenses.length, totalFiltered, formatAmount, handleDateFilterChange]);
  
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
          <View style={styles.headerTop}>
            <Text style={[styles.title, {color: theme.colors.text}]}>Expenses</Text>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.iconButton}
                onPress={() => setSearchVisible(!searchVisible)}>
                <Icon
                  name={searchVisible ? 'close' : 'magnify'}
                  size={24}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable
                style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
                onPress={() => navigation.navigate('AddExpense')}>
                <Icon name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        }
        collapsedContent={
          <View style={styles.collapsedRow}>
            <Text style={[styles.collapsedCount, {color: theme.colors.textSecondary}]}>
              {filteredExpenses.length} expenses
            </Text>
            <Text style={[styles.collapsedTotal, {color: theme.colors.expense}]}>
              {formatAmount(totalFiltered)}
            </Text>
          </View>
        }
        collapsedStyle={collapsedSummaryStyle}
      />
      
      {/* Expense List or Empty State — date filters always visible */}
      {groupedExpenses.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <View style={styles.listHeader}>
            {searchVisible && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.searchContainer}>
                <View
                  style={[
                    styles.searchBar,
                    {backgroundColor: theme.colors.surfaceVariant},
                  ]}>
                  <Icon name="magnify" size={20} color={theme.colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, {color: theme.colors.text}]}
                    placeholder="Search expenses..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            )}
            <DateFilterChips
              selectedFilter={filters.dateFilter.type}
              onFilterChange={handleDateFilterChange}
            />
            <View style={styles.summary}>
              <Text style={[styles.summaryText, {color: theme.colors.textSecondary}]}>
                {filteredExpenses.length} expenses • Total:{' '}
                <Text style={{color: theme.colors.expense, fontWeight: '600'}}>
                  {formatAmount(totalFiltered)}
                </Text>
              </Text>
            </View>
          </View>
          <EmptyState
            icon="receipt"
            title="No expenses found"
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Start tracking your expenses by adding one'
            }
            actionLabel="Add Expense"
            onAction={() => navigation.navigate('AddExpense')}
          />
        </View>
      ) : (
        <Animated.FlatList
          data={groupedExpenses}
          renderItem={renderGroup}
          keyExtractor={item => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            searchQuery ? (
              <EmptyState
                icon="magnify"
                title="No results"
                description="Try a different search term"
              />
            ) : null
          }
        />
      )}
    </View>
  );
});

ExpensesScreen.displayName = 'ExpensesScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Collapsed compact summary
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  collapsedTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Wrapper when list is empty so date filters stay visible
  emptyWrapper: {
    flex: 1,
  },
  // List header (scrolls with content)
  listHeader: {},
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  summary: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default ExpensesScreen;
