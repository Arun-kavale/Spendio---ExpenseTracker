/**
 * Tab Navigator
 * 
 * Premium floating tab bar with central FAB action button.
 * Features glassmorphism, smooth animations, and haptic feedback.
 */

import React, {memo} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '@/types';

import {DashboardScreen} from '@/screens/Dashboard';
import {ExpensesScreen} from '@/screens/Expenses';
import {AnalyticsScreen} from '@/screens/Analytics';
import {SettingsScreen} from '@/screens/Settings';
import {CustomTabBar} from './CustomTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = memo(() => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
});

TabNavigator.displayName = 'TabNavigator';

export default TabNavigator;
