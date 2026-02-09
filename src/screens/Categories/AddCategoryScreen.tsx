/**
 * Add/Edit Category Screen
 * 
 * Form for creating or editing a category.
 */

import React, {memo, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks';
import {useCategoryStore} from '@/store';
import {Card, CategoryIcon} from '@/components/common';
import {GradientButton} from '@/components/gradient';
import {CATEGORY_ICONS, CATEGORY_COLORS} from '@/constants/categories';
import {RootStackParamList} from '@/types';
import {validateCategoryName} from '@/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddCategory'>;
type RouteType = RouteProp<RootStackParamList, 'AddCategory'>;

export const AddCategoryScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  
  const {addCategory, updateCategory, getCategoryById, categories} = useCategoryStore();
  
  const categoryId = route.params?.categoryId;
  const isEditing = Boolean(categoryId);
  const existingCategory = categoryId ? getCategoryById(categoryId) : undefined;
  
  // Form state
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState<{name?: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Load existing category data if editing
  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setSelectedIcon(existingCategory.icon);
      setSelectedColor(existingCategory.color);
    }
  }, [existingCategory]);
  
  const handleNameChange = useCallback((text: string) => {
    setName(text);
    setErrors({});
  }, []);
  
  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    
    const nameValidation = validateCategoryName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }
    
    // Check for duplicate names
    const duplicate = categories.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== categoryId
    );
    if (duplicate) {
      newErrors.name = 'A category with this name already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, categories, categoryId]);
  
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isEditing && categoryId) {
        updateCategory(categoryId, {
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      } else {
        addCategory({
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
        });
      }
      
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, isEditing, categoryId, updateCategory, addCategory, name, selectedIcon, selectedColor, navigation]);
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          {isEditing ? 'Edit Category' : 'New Category'}
        </Text>
        <View style={{width: 24}} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.previewContainer}>
          <CategoryIcon icon={selectedIcon} color={selectedColor} size="large" />
          <Text style={[styles.previewName, {color: theme.colors.text}]}>
            {name || 'Category Name'}
          </Text>
        </Animated.View>
        
        {/* Name Input */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.card} padding="medium">
            <Text style={[styles.label, {color: theme.colors.textSecondary}]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: errors.name ? theme.colors.error : 'transparent',
                },
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter category name"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={30}
            />
            {errors.name && (
              <Text style={[styles.errorText, {color: theme.colors.error}]}>
                {errors.name}
              </Text>
            )}
          </Card>
        </Animated.View>
        
        {/* Icon Picker */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.card} padding="medium">
            <Text style={[styles.label, {color: theme.colors.textSecondary}]}>
              Icon
            </Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.slice(0, 40).map(icon => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon
                          ? selectedColor + '20'
                          : theme.colors.surfaceVariant,
                      borderColor:
                        selectedIcon === icon ? selectedColor : 'transparent',
                    },
                  ]}>
                  <Icon
                    name={icon}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : theme.colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>
        
        {/* Color Picker */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Card style={styles.card} padding="medium">
            <Text style={[styles.label, {color: theme.colors.textSecondary}]}>
              Color
            </Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map(color => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 0,
                      borderColor: theme.colors.text,
                    },
                  ]}>
                  {selectedColor === color && (
                    <Icon name="check" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>
        
        <View style={{height: 24}} />
      </ScrollView>
      
      {/* Save Button - Premium Gradient */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + 20}]}>
        <GradientButton
          title={isEditing ? 'Update Category' : 'Create Category'}
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          icon="content-save"
          iconPosition="left"
          size="large"
        />
      </View>
    </View>
  );
});

AddCategoryScreen.displayName = 'AddCategoryScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

export default AddCategoryScreen;
