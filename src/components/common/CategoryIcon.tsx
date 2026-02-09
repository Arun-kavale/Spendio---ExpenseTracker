/**
 * CategoryIcon Component
 * 
 * Displays a category icon with colored background.
 */

import React, {memo} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type IconSize = 'small' | 'medium' | 'large';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: IconSize;
  style?: ViewStyle;
}

const sizeConfig = {
  small: {container: 32, icon: 16},
  medium: {container: 44, icon: 22},
  large: {container: 56, icon: 28},
};

export const CategoryIcon = memo<CategoryIconProps>(({
  icon,
  color,
  size = 'medium',
  style,
}) => {
  const config = sizeConfig[size];
  
  return (
    <View
      style={[
        styles.container,
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor: color + '20',
        },
        style,
      ]}>
      <Icon name={icon} size={config.icon} color={color} />
    </View>
  );
});

CategoryIcon.displayName = 'CategoryIcon';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryIcon;
