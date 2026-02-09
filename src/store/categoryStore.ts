/**
 * Category Store
 * 
 * Manages expense categories with CRUD operations and persistence.
 */

import {create} from 'zustand';
import {Category} from '@/types';
import {StorageService, STORAGE_KEYS} from '@/services/storage';
import {DEFAULT_CATEGORIES} from '@/constants/categories';
import {generateId} from '@/utils';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  
  // Actions
  loadCategories: () => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) => Category;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'isSystem'>>) => void;
  deleteCategory: (id: string) => boolean;
  getCategoryById: (id: string) => Category | undefined;
  resetToDefaults: () => void;
  importCategories: (categories: Category[]) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: true,
  
  loadCategories: () => {
    const stored = StorageService.get<Category[]>(STORAGE_KEYS.CATEGORIES);
    if (stored && stored.length > 0) {
      set({categories: stored, isLoading: false});
    } else {
      // Initialize with default categories
      StorageService.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      set({categories: DEFAULT_CATEGORIES, isLoading: false});
    }
  },
  
  addCategory: (categoryData) => {
    const now = Date.now();
    const newCategory: Category = {
      id: generateId(),
      ...categoryData,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    
    const updated = [...get().categories, newCategory];
    StorageService.set(STORAGE_KEYS.CATEGORIES, updated);
    set({categories: updated});
    
    return newCategory;
  },
  
  updateCategory: (id, updates) => {
    const categories = get().categories.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return cat;
    });
    
    StorageService.set(STORAGE_KEYS.CATEGORIES, categories);
    set({categories});
  },
  
  deleteCategory: (id) => {
    const category = get().categories.find(c => c.id === id);
    if (!category || category.isSystem) {
      return false; // Cannot delete system categories
    }
    
    const updated = get().categories.filter(c => c.id !== id);
    StorageService.set(STORAGE_KEYS.CATEGORIES, updated);
    set({categories: updated});
    return true;
  },
  
  getCategoryById: (id) => {
    return get().categories.find(c => c.id === id);
  },
  
  resetToDefaults: () => {
    StorageService.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    set({categories: DEFAULT_CATEGORIES});
  },
  
  importCategories: (categories) => {
    // Merge imported categories with existing ones
    const existing = get().categories;
    const existingIds = new Set(existing.map(c => c.id));
    
    const merged = [...existing];
    for (const cat of categories) {
      if (!existingIds.has(cat.id)) {
        merged.push(cat);
      }
    }
    
    StorageService.set(STORAGE_KEYS.CATEGORIES, merged);
    set({categories: merged});
  },
}));
