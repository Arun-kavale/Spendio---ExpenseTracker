/**
 * EmptyState Component
 * 
 * Displays a friendly empty state with icon, title, and action.
 */

import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {Button} from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo<EmptyStateProps>(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {backgroundColor: theme.colors.primaryLight + '15'},
        ]}>
        <Icon name={icon} size={48} color={theme.colors.primary} />
      </View>
      
      <Text style={[styles.title, {color: theme.colors.text}]}>{title}</Text>
      
      {description && (
        <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.button}
        />
      )}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});

export default EmptyState;
