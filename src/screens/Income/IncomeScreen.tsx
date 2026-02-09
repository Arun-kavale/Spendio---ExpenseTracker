/**
 * Income List Screen
 * 
 * Displays all income entries grouped by date with filtering and search.
 * Features a collapsible sticky header:
 *  - Back button, title, actions always visible
 *  - Search bar and summary scroll naturally with content
 *  - Compact summary fades into sticky header when scrolled
 * 
 * Premium fintech-grade design matching the expense list.
 */

import React, {memo, useMemo, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency, useCollapsibleHeader} from '@/hooks';
import {useIncomeStore} from '@/store';
import {EmptyState, StickyHeader} from '@/components/common';
import {RootStackParamList, Income} from '@/types';
import {formatDate, formatRelativeDate} from '@/utils';
import {INCOME_CATEGORIES} from '@/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GroupedIncomes {
  date: string;
  formattedDate: string;
  total: number;
  incomes: Income[];
}

const IncomeItem = memo<{
  income: Income;
  onPress: () => void;
}>(({income, onPress}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  const category = INCOME_CATEGORIES.find(c => c.id === income.categoryId);

  return (
    <Pressable onPress={onPress} style={[styles.incomeItem, {borderBottomColor: theme.colors.divider}]}>
      <View style={[styles.incomeIcon, {backgroundColor: (category?.color || theme.colors.income) + '15'}]}>
        <Icon name={category?.icon || 'cash'} size={20} color={category?.color || theme.colors.income} />
      </View>
      <View style={styles.incomeContent}>
        <Text style={[styles.incomeNote, {color: theme.colors.text}]} numberOfLines={1}>
          {income.note || category?.name || 'Income'}
        </Text>
        <Text style={[styles.incomeDate, {color: theme.colors.textMuted}]}>
          {formatRelativeDate(income.date)}
        </Text>
      </View>
      <Text style={[styles.incomeAmount, {color: theme.colors.income}]}>
        +{formatAmount(income.amount)}
      </Text>
    </Pressable>
  );
});

export const IncomeScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {formatAmount} = useCurrency();

  // Collapsible header — snap after search+summary (~100px)
  const {
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  } = useCollapsibleHeader({snapThreshold: 100});

  const incomes = useIncomeStore(state => state.incomes);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncomes = useMemo(() => {
    let result = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inc => {
        const category = INCOME_CATEGORIES.find(c => c.id === inc.categoryId);
        return (
          inc.note.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query)
        );
      });
    }
    return result;
  }, [incomes, searchQuery]);

  const groupedIncomes = useMemo((): GroupedIncomes[] => {
    const groups = new Map<string, Income[]>();
    filteredIncomes.forEach(income => {
      const existing = groups.get(income.date) || [];
      groups.set(income.date, [...existing, income]);
    });

    return Array.from(groups.entries())
      .map(([date, incs]) => ({
        date,
        formattedDate: formatDate(date, 'EEEE, MMMM d'),
        total: incs.reduce((sum, i) => sum + i.amount, 0),
        incomes: incs,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredIncomes]);

  const totalFiltered = useMemo(
    () => filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    [filteredIncomes],
  );

  const renderGroup = useCallback(
    ({item}: {item: GroupedIncomes}) => (
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={[styles.sectionHeader, {backgroundColor: theme.colors.background}]}>
          <Text style={[styles.sectionDate, {color: theme.colors.text}]}>
            {item.formattedDate}
          </Text>
          <Text style={[styles.sectionTotal, {color: theme.colors.income}]}>
            +{formatAmount(item.total)}
          </Text>
        </View>
        {item.incomes.map(income => (
          <IncomeItem
            key={income.id}
            income={income}
            onPress={() => navigation.navigate('IncomeDetails', {incomeId: income.id})}
          />
        ))}
      </Animated.View>
    ),
    [theme, formatAmount, navigation],
  );

  // List header: search + summary (scrolls with content)
  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      {searchVisible && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.searchContainer}>
          <View style={[styles.searchBar, {backgroundColor: theme.colors.surfaceVariant}]}>
            <Icon name="magnify" size={20} color={theme.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, {color: theme.colors.text}]}
              placeholder="Search income..."
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

      <View style={styles.summary}>
        <Text style={[styles.summaryText, {color: theme.colors.textSecondary}]}>
          {filteredIncomes.length} entries • Total:{' '}
          <Text style={{color: theme.colors.income, fontWeight: '600'}}>
            +{formatAmount(totalFiltered)}
          </Text>
        </Text>
      </View>
    </View>
  ), [searchVisible, searchQuery, theme, filteredIncomes.length, totalFiltered, formatAmount]);

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
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Icon name="arrow-left" size={22} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, {color: theme.colors.text}]}>Income</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.iconButton} onPress={() => setSearchVisible(!searchVisible)}>
                <Icon name={searchVisible ? 'close' : 'magnify'} size={24} color={theme.colors.text} />
              </Pressable>
              <Pressable
                style={[styles.addButton, {backgroundColor: theme.colors.income}]}
                onPress={() => navigation.navigate('AddIncome')}>
                <Icon name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        }
        collapsedContent={
          <View style={styles.collapsedRow}>
            <Text style={[styles.collapsedCount, {color: theme.colors.textSecondary}]}>
              {filteredIncomes.length} entries
            </Text>
            <Text style={[styles.collapsedTotal, {color: theme.colors.income}]}>
              +{formatAmount(totalFiltered)}
            </Text>
          </View>
        }
        collapsedStyle={collapsedSummaryStyle}
      />

      {groupedIncomes.length === 0 && !searchVisible ? (
        <EmptyState
          icon="cash-plus"
          title="No income recorded"
          description="Start tracking your income by adding your first entry"
          actionLabel="Add Income"
          onAction={() => navigation.navigate('AddIncome')}
        />
      ) : (
        <Animated.FlatList
          data={groupedIncomes}
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

IncomeScreen.displayName = 'IncomeScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  title: {fontSize: 18, fontWeight: '700'},
  headerActions: {flexDirection: 'row', alignItems: 'center', gap: 6},
  iconButton: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  addButton: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  // Collapsed compact summary
  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedCount: {fontSize: 13, fontWeight: '500'},
  collapsedTotal: {fontSize: 15, fontWeight: '700'},
  // List header (scrolls with content)
  listHeader: {},
  searchContainer: {paddingHorizontal: 16, marginBottom: 8},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchInput: {flex: 1, marginLeft: 8, fontSize: 16},
  summary: {paddingHorizontal: 16, paddingBottom: 8},
  summaryText: {fontSize: 13},
  list: {paddingHorizontal: 16, paddingBottom: 100},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionDate: {fontSize: 15, fontWeight: '600'},
  sectionTotal: {fontSize: 14, fontWeight: '500'},
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  incomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeContent: {flex: 1, marginLeft: 12},
  incomeNote: {fontSize: 15, fontWeight: '500'},
  incomeDate: {fontSize: 12, marginTop: 2},
  incomeAmount: {fontSize: 16, fontWeight: '700'},
});

export default IncomeScreen;
