/**
 * DateFilterChips Component
 * 
 * Horizontal filter chips for date filtering.
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {useTheme} from '@/hooks';
import {DateFilterType} from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DateFilterChipsProps {
  selectedFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

const FILTERS: {type: DateFilterType; label: string}[] = [
  {type: 'today', label: 'Today'},
  {type: 'week', label: 'This Week'},
  {type: 'month', label: 'This Month'},
  {type: 'year', label: 'This Year'},
  {type: 'all', label: 'All Time'},
];

interface ChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const Chip = memo<ChipProps>(({label, isSelected, onPress}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95, {damping: 15});
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, {damping: 15});
  };
  
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? theme.colors.primary
            : theme.colors.surfaceVariant,
          borderRadius: theme.borderRadius.full,
        },
        animatedStyle,
      ]}>
      <Text
        style={[
          styles.chipText,
          {
            color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
          },
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
});

export const DateFilterChips = memo<DateFilterChipsProps>(({
  selectedFilter,
  onFilterChange,
}) => {
  const theme = useTheme();
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={{backgroundColor: theme.colors.background}}>
      {FILTERS.map(filter => (
        <Chip
          key={filter.type}
          label={filter.label}
          isSelected={selectedFilter === filter.type}
          onPress={() => onFilterChange(filter.type)}
        />
      ))}
    </ScrollView>
  );
});

DateFilterChips.displayName = 'DateFilterChips';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DateFilterChips;
