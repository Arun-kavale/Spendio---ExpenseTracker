/**
 * Intro Flow
 *
 * Onboarding slides shown on first launch. Includes default currency selection.
 * Completing sets ONBOARDING_COMPLETE so the main app is shown on next launch.
 */

import React, {memo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown, FadeIn} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {useSettingsStore} from '@/store';
import {CURRENCIES} from '@/constants/currencies';
import {SpendioLogo} from '@/assets';
import type {Currency} from '@/types';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    icon: 'wallet-outline' as const,
    title: 'Welcome to Spendio',
    subtitle: 'Track expenses, manage budgets, and understand your spending in one place.',
  },
  {
    key: 'insights',
    icon: 'chart-arc' as const,
    title: 'See Your Insights',
    subtitle: 'Charts, trends, and reports help you make smarter money decisions.',
  },
  {
    key: 'currency',
    icon: 'currency-usd' as const,
    title: 'Choose your currency',
    subtitle: 'This will be used for all amounts. You can change it later in settings.',
  },
  {
    key: 'ready',
    icon: 'rocket-launch-outline' as const,
    title: "You're All Set",
    subtitle: 'Start adding expenses and take control of your finances today.',
  },
];

type Props = {
  onComplete: () => void;
};

const CurrencyRow = memo<{
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
          backgroundColor: isSelected ? theme.colors.primary + '15' : 'transparent',
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}>
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
      {isSelected && (
        <Icon name="check-circle" size={22} color={theme.colors.primary} />
      )}
    </Pressable>
  );
});

CurrencyRow.displayName = 'CurrencyRow';

export const IntroFlow = memo(({onComplete}: Props) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const {settings, setCurrency} = useSettingsStore();

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentIndex, onComplete]);

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;
  const isCurrencySlide = slide.key === 'currency';

  const renderCurrencyItem = useCallback(
    ({item}: {item: Currency}) => (
      <CurrencyRow
        currency={item}
        isSelected={item.code === settings.currency.code}
        onPress={() => setCurrency(item)}
      />
    ),
    [settings.currency.code, setCurrency]
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {/* Slide content */}
      <View
        style={[
          styles.slideContent,
          {paddingTop: insets.top + 24},
          isCurrencySlide && styles.slideContentTop,
        ]}>
        {!isCurrencySlide && (
          <>
            <Animated.View
              entering={FadeInDown.delay(80).duration(400).springify()}
              style={styles.iconWrap}>
              {slide.key === 'welcome' ? (
                <Image
                  source={SpendioLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="Spendio"
                />
              ) : (
                <View style={[styles.iconCircle, {backgroundColor: theme.colors.primary + '20'}]}>
                  <Icon name={slide.icon} size={64} color={theme.colors.primary} />
                </View>
              )}
            </Animated.View>
            <Animated.View entering={FadeIn.delay(150).duration(400)}>
              <Text style={[styles.title, {color: theme.colors.text}]}>{slide.title}</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(220).duration(400)}>
              <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
                {slide.subtitle}
              </Text>
            </Animated.View>
          </>
        )}
        {isCurrencySlide && (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.currencyHeader}>
              <View style={[styles.iconCircleSmall, {backgroundColor: theme.colors.primary + '20'}]}>
                <Icon name={slide.icon} size={32} color={theme.colors.primary} />
              </View>
              <Text style={[styles.title, {color: theme.colors.text}]}>{slide.title}</Text>
              <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
                {slide.subtitle}
              </Text>
            </Animated.View>
            <Animated.View
              entering={FadeIn.delay(150).duration(400)}
              style={[styles.currencyListWrap, {maxHeight: SCREEN_HEIGHT * 0.38}]}>
              <FlatList
                data={CURRENCIES}
                renderItem={renderCurrencyItem}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.currencyListContent}
              />
            </Animated.View>
          </>
        )}
      </View>

      {/* Pagination dots */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? theme.colors.primary : theme.colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        entering={FadeInDown.delay(350).duration(400)}
        style={[styles.footer, {paddingBottom: insets.bottom + 24}]}>
        <Pressable
          onPress={handleNext}
          style={({pressed}) => [
            styles.button,
            {backgroundColor: theme.colors.primary, opacity: pressed ? 0.9 : 1},
          ]}>
          <Text style={styles.buttonLabel}>
            {isLast ? 'Get started' : 'Next'}
          </Text>
          {!isLast && (
            <Icon name="arrow-right" size={20} color="#FFFFFF" />
          )}
        </Pressable>
        {!isLast && (
          <Pressable
            onPress={onComplete}
            style={({pressed}) => [{opacity: pressed ? 0.7 : 1}]}>
            <Text style={[styles.skipText, {color: theme.colors.textMuted}]}>
              Skip
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
});

IntroFlow.displayName = 'IntroFlow';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContentTop: {
    justifyContent: 'flex-start',
  },
  iconWrap: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logoImage: {
    width: 220,
    height: 72,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  currencyHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencyListWrap: {
    width: '100%',
    paddingHorizontal: 8,
  },
  currencyListContent: {
    paddingBottom: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1.5,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    width: 44,
    textAlign: 'center',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 12,
    marginTop: 2,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 15,
  },
});
