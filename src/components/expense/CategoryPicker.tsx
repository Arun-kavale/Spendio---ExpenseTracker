/**
 * CategoryPicker Component
 * 
 * A grid picker for selecting expense categories.
 */

import React, {memo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {Category} from '@/types';
import {CategoryIcon} from '@/components/common';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const COLUMNS = 4;
const ITEM_SIZE = (SCREEN_WIDTH - 48 - (COLUMNS - 1) * 12) / COLUMNS;

interface CategoryPickerProps {
  visible: boolean;
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryItem = memo<CategoryItemProps>(({category, isSelected, onPress}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9, {damping: 15});
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
        styles.categoryItem,
        {
          width: ITEM_SIZE,
          backgroundColor: isSelected
            ? category.color + '20'
            : theme.colors.surfaceVariant,
          borderColor: isSelected ? category.color : 'transparent',
          borderRadius: theme.borderRadius.md,
        },
        animatedStyle,
      ]}>
      <CategoryIcon icon={category.icon} color={category.color} size="medium" />
      <Text
        style={[
          styles.categoryName,
          {
            color: isSelected ? category.color : theme.colors.textSecondary,
          },
        ]}
        numberOfLines={2}>
        {category.name}
      </Text>
      
      {isSelected && (
        <View style={[styles.checkmark, {backgroundColor: category.color}]}>
          <Icon name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </AnimatedPressable>
  );
});

export const CategoryPicker = memo<CategoryPickerProps>(({
  visible,
  categories,
  selectedId,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const renderCategory = useCallback(
    ({item}: {item: Category}) => (
      <CategoryItem
        category={item}
        isSelected={item.id === selectedId}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
      />
    ),
    [selectedId, onSelect, onClose]
  );
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.overlay, {backgroundColor: theme.colors.overlay}]}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + 16,
              borderTopLeftRadius: theme.borderRadius.xl,
              borderTopRightRadius: theme.borderRadius.xl,
            },
          ]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={[styles.title, {color: theme.colors.text}]}>
              Select Category
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            numColumns={COLUMNS}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

CategoryPicker.displayName = 'CategoryPicker';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryPicker;
