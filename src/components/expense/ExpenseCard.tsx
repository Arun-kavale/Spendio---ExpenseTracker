/**
 * ExpenseCard Component
 * 
 * Premium expense item card with animations and rich visual design.
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet, Pressable, Platform} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  Layout,
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {useCurrency} from '@/hooks';
import {Expense, Category} from '@/types';
import {CategoryIcon} from '@/components/common';
import {formatRelativeDate} from '@/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ExpenseCardProps {
  expense: Expense;
  category: Category | undefined;
  onPress?: () => void;
  index?: number;
  showCategoryBadge?: boolean;
}

export const ExpenseCard = memo<ExpenseCardProps>(({
  expense,
  category,
  onPress,
  index = 0,
  showCategoryBadge = true,
}) => {
  const theme = useTheme();
  const {formatAmount} = useCurrency();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: scale.value},
      {translateX: pressed.value * -2},
    ],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, {damping: 15, stiffness: 400});
    pressed.value = withSpring(1, {damping: 15, stiffness: 400});
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15, stiffness: 400});
    pressed.value = withSpring(0, {damping: 15, stiffness: 400});
  };
  
  const displayNote = expense.note || category?.name || 'Expense';
  const categoryColor = category?.color || theme.colors.textMuted;
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={SlideInRight.delay(Math.min(index * 30, 200)).duration(300).springify()}
      layout={Layout.springify().damping(14)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
          borderLeftColor: categoryColor,
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.shadow,
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 1,
              shadowRadius: 8,
            },
            android: {
              elevation: 3,
            },
          }),
        },
        animatedStyle,
      ]}>
      {/* Category indicator strip */}
      <View style={[styles.categoryStrip, {backgroundColor: categoryColor}]} />
      
      {/* Icon */}
      <View style={styles.iconWrapper}>
        <CategoryIcon
          icon={category?.icon || 'help-circle'}
          color={categoryColor}
          size="medium"
        />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.note, {color: theme.colors.text}]}
          numberOfLines={1}>
          {displayNote}
        </Text>
        <View style={styles.metaRow}>
          {showCategoryBadge && category && (
            <View style={[styles.categoryBadge, {backgroundColor: categoryColor + '15'}]}>
              <Text style={[styles.categoryText, {color: categoryColor}]}>
                {category.name}
              </Text>
            </View>
          )}
          <Text style={[styles.date, {color: theme.colors.textMuted}]}>
            {formatRelativeDate(expense.date)}
          </Text>
        </View>
      </View>
      
      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, {color: theme.colors.expense}]}>
          -{formatAmount(expense.amount)}
        </Text>
        <Icon
          name="chevron-right"
          size={18}
          color={theme.colors.textMuted}
          style={styles.chevron}
        />
      </View>
    </AnimatedPressable>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 12,
    paddingLeft: 0,
    marginVertical: 4,
    overflow: 'hidden',
  },
  categoryStrip: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 12,
  },
  iconWrapper: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  note: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.5,
  },
});

export default ExpenseCard;
