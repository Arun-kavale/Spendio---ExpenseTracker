/**
 * Currency Select Screen
 * 
 * Allows user to select their preferred currency.
 */

import React, {memo, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@/hooks';
import {useSettingsStore} from '@/store';
import {AdvancedHeader} from '@/components/common';
import {CURRENCIES} from '@/constants/currencies';
import {Currency} from '@/types';

const CurrencyItem = memo<{
  currency: Currency;
  isSelected: boolean;
  onPress: () => void;
}>(({currency, isSelected, onPress}) => {
  const theme = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.currencyItem,
        {
          backgroundColor: isSelected
            ? theme.colors.primary + '10'
            : 'transparent',
          borderColor: isSelected ? theme.colors.primary : 'transparent',
        },
      ]}>
      <View style={styles.currencyInfo}>
        <Text style={[styles.currencySymbol, {color: theme.colors.text}]}>
          {currency.symbol}
        </Text>
        <View style={styles.currencyDetails}>
          <Text style={[styles.currencyCode, {color: theme.colors.text}]}>
            {currency.code}
          </Text>
          <Text style={[styles.currencyName, {color: theme.colors.textSecondary}]}>
            {currency.name}
          </Text>
        </View>
      </View>
      
      {isSelected && (
        <Icon name="check-circle" size={24} color={theme.colors.primary} />
      )}
    </Pressable>
  );
});

export const CurrencySelectScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const {settings, setCurrency} = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCurrencies = CURRENCIES.filter(
    c =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = useCallback(
    (currency: Currency) => {
      setCurrency(currency);
      navigation.goBack();
    },
    [setCurrency, navigation]
  );
  
  const renderCurrency = useCallback(
    ({item}: {item: Currency}) => (
      <CurrencyItem
        currency={item}
        isSelected={item.code === settings.currency.code}
        onPress={() => handleSelect(item)}
      />
    ),
    [settings.currency.code, handleSelect]
  );
  
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <AdvancedHeader
        title="Select Currency"
        showBack
        onBack={() => navigation.goBack()}
        variant="elevated"
      />
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {backgroundColor: theme.colors.surfaceVariant},
          ]}>
          <Icon name="magnify" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, {color: theme.colors.text}]}
            placeholder="Search currencies..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredCurrencies}
        renderItem={renderCurrency}
        keyExtractor={item => item.code}
        contentContainerStyle={[
          styles.list,
          {paddingBottom: insets.bottom + 24},
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

CurrencySelectScreen.displayName = 'CurrencySelectScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  list: {
    paddingHorizontal: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  currencyDetails: {
    marginLeft: 12,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default CurrencySelectScreen;
