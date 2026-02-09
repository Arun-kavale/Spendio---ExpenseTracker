/**
 * Categories Screen
 * 
 * Displays and manages expense categories.
 */

import React, {memo, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, Layout} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, useCurrency} from '@/hooks';
import {useCategoryStore, useExpenseStore} from '@/store';
import {Card, CategoryIcon} from '@/components/common';
import {RootStackParamList, Category} from '@/types';
import {startOfMonth, endOfMonth} from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CategoryWithStats extends Category {
  totalSpent: number;
  transactionCount: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryCard = memo<{
  category: CategoryWithStats;
  onPress: () => void;
  index: number;
}>(({category, onPress, index}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  
  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeIn.delay(index * 50).duration(300)}
      layout={Layout.springify()}>
      <Card style={styles.categoryCard} padding="medium">
        <View style={styles.categoryRow}>
          <CategoryIcon icon={category.icon} color={category.color} size="medium" />
          
          <View style={styles.categoryInfo}>
            <View style={styles.categoryNameRow}>
              <Text
                style={[styles.categoryName, {color: theme.colors.text}]}
                numberOfLines={1}>
                {category.name}
              </Text>
              {category.isSystem && (
                <View style={[styles.systemBadge, {backgroundColor: theme.colors.surfaceVariant}]}>
                  <Text style={[styles.systemText, {color: theme.colors.textMuted}]}>
                    System
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.categoryStats, {color: theme.colors.textSecondary}]}>
              {category.transactionCount} transactions this month
            </Text>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[styles.categoryAmount, {color: theme.colors.expense}]}>
              {formatAmount(category.totalSpent)}
            </Text>
            <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  );
});

export const CategoriesScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  const {categories} = useCategoryStore();
  const {getCategoryBreakdown} = useExpenseStore();
  
  // Get category stats for current month
  const categoriesWithStats = useMemo((): CategoryWithStats[] => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const breakdown = getCategoryBreakdown(monthStart, monthEnd);
    
    return categories.map(cat => {
      const stats = breakdown.find(b => b.categoryId === cat.id);
      return {
        ...cat,
        totalSpent: stats?.total || 0,
        transactionCount: stats?.count || 0,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [categories, getCategoryBreakdown]);
  
  const renderCategory = useCallback(
    ({item, index}: {item: CategoryWithStats; index: number}) => (
      <CategoryCard
        category={item}
        onPress={() => navigation.navigate('CategoryDetails', {categoryId: item.id})}
        index={index}
      />
    ),
    [navigation]
  );
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, {color: theme.colors.text}]}>Categories</Text>
          
          <Pressable
            style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => navigation.navigate('AddCategory')}>
            <Icon name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          {categories.length} categories • This month's spending
        </Text>
      </View>
      
      <FlatList
        data={categoriesWithStats}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

CategoriesScreen.displayName = 'CategoriesScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  categoryCard: {
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemText: {
    fontSize: 10,
    fontWeight: '500',
  },
  categoryStats: {
    fontSize: 13,
    marginTop: 2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default CategoriesScreen;
