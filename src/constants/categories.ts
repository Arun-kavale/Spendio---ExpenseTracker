import {Category} from '@/types';

// Category colors - Modern, vibrant palette
export const CATEGORY_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Soft Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
  '#F8B500', // Orange
  '#58D68D', // Green
  '#EC7063', // Light Red
  '#5DADE2', // Blue
  '#AF7AC5', // Violet
  '#48C9B0', // Turquoise
  '#F5B041', // Amber
  '#EB984E', // Carrot
  '#5499C7', // Steel Blue
  '#52BE80', // Emerald
];

// Material Design Icons
export const CATEGORY_ICONS = [
  'food',
  'food-fork-drink',
  'coffee',
  'pizza',
  'hamburger',
  'car',
  'bus',
  'train',
  'airplane',
  'gas-station',
  'home',
  'home-city',
  'bed',
  'sofa',
  'lightbulb',
  'shopping',
  'cart',
  'basket',
  'gift',
  'tshirt-crew',
  'medical-bag',
  'hospital',
  'pill',
  'heart-pulse',
  'stethoscope',
  'movie',
  'music',
  'gamepad-variant',
  'controller-classic',
  'television',
  'book-open-variant',
  'school',
  'notebook',
  'certificate',
  'briefcase',
  'laptop',
  'cellphone',
  'wifi',
  'phone',
  'email',
  'dumbbell',
  'yoga',
  'run',
  'basketball',
  'soccer',
  'dog',
  'cat',
  'paw',
  'baby-carriage',
  'account-child',
  'wallet',
  'bank',
  'cash',
  'credit-card',
  'piggy-bank',
  'chart-line',
  'trending-up',
  'currency-usd',
  'receipt',
  'file-document',
  'tools',
  'hammer',
  'wrench',
  'brush',
  'spray',
  'water',
  'fire',
  'flash',
  'leaf',
  'flower',
  'tree',
  'beach',
  'umbrella-beach',
  'mountain',
  'hiking',
  'camera',
  'palette',
  'star',
  'heart',
  'emoticon-happy',
  'party-popper',
];

// Default system categories with static IDs
// Using static IDs for default categories ensures consistency across app installations
const INITIAL_TIMESTAMP = 1704067200000; // 2024-01-01T00:00:00.000Z

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-default-food-dining',
    name: 'Food & Dining',
    icon: 'food-fork-drink',
    color: '#FF6B6B',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-transport',
    name: 'Transport',
    icon: 'car',
    color: '#4ECDC4',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-shopping',
    name: 'Shopping',
    icon: 'shopping',
    color: '#45B7D1',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-entertainment',
    name: 'Entertainment',
    icon: 'movie',
    color: '#DDA0DD',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-bills-utilities',
    name: 'Bills & Utilities',
    icon: 'lightbulb',
    color: '#F7DC6F',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-health',
    name: 'Health',
    icon: 'medical-bag',
    color: '#58D68D',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-education',
    name: 'Education',
    icon: 'school',
    color: '#85C1E9',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-rent',
    name: 'Rent',
    icon: 'home',
    color: '#96CEB4',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-personal-care',
    name: 'Personal Care',
    icon: 'brush',
    color: '#BB8FCE',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-groceries',
    name: 'Groceries',
    icon: 'cart',
    color: '#52BE80',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-travel',
    name: 'Travel',
    icon: 'airplane',
    color: '#5499C7',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
  {
    id: 'cat-default-other',
    name: 'Other',
    icon: 'dots-horizontal-circle',
    color: '#95A5A6',
    isSystem: true,
    createdAt: INITIAL_TIMESTAMP,
    updatedAt: INITIAL_TIMESTAMP,
  },
];
