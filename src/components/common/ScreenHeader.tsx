/**
 * ScreenHeader Component
 * 
 * A consistent header component for screens.
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export const ScreenHeader = memo<ScreenHeaderProps>(({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing.sm,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}>
      <View style={styles.content}>
        {showBack && (
          <Pressable
            onPress={onBack}
            style={[styles.backButton, {marginRight: theme.spacing.sm}]}
            hitSlop={8}>
            <Icon name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
        )}
        
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, {color: theme.colors.text}]}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, {color: theme.colors.textSecondary}]}
              numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            style={styles.rightButton}
            hitSlop={8}>
            <Icon name={rightAction.icon} size={24} color={theme.colors.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

ScreenHeader.displayName = 'ScreenHeader';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightButton: {
    padding: 4,
  },
});

export default ScreenHeader;
