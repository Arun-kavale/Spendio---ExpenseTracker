/**
 * Root Navigator
 * 
 * The main stack navigator containing all screens.
 */

import React, {memo} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks';
import {RootStackParamList} from '@/types';

import {TabNavigator} from './TabNavigator';
import {AddExpenseScreen, ExpenseDetailsScreen} from '@/screens/Expenses';
import {AddCategoryScreen, CategoryDetailsScreen, CategoriesScreen} from '@/screens/Categories';
import {IncomeScreen, AddIncomeScreen, IncomeDetailsScreen} from '@/screens/Income';
import {BudgetScreen, AddBudgetScreen} from '@/screens/Budget';
import {TransferScreen, AddTransferScreen} from '@/screens/Transfer';
import {
  AccountsScreen,
  AddAccountScreen,
  AccountDetailsScreen,
  AccountsDashboardScreen,
} from '@/screens/Accounts';
import {ReportsScreen} from '@/screens/Reports';
import {
  CurrencySelectScreen,
  BackupScreen,
  AboutScreen,
  StatisticsScreen,
} from '@/screens/Settings';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = memo(() => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: theme.colors.background},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Expense Screens */}
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
      
      {/* Category Screens */}
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="CategoryDetails" component={CategoryDetailsScreen} />
      
      {/* Income Screens */}
      <Stack.Screen name="IncomeList" component={IncomeScreen} />
      <Stack.Screen
        name="AddIncome"
        component={AddIncomeScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="IncomeDetails" component={IncomeDetailsScreen} />
      
      {/* Budget Screens */}
      <Stack.Screen name="BudgetDashboard" component={BudgetScreen} />
      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      
      {/* Transfer Screens */}
      <Stack.Screen name="TransferList" component={TransferScreen} />
      <Stack.Screen
        name="AddTransfer"
        component={AddTransferScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      
      {/* Account Screens */}
      <Stack.Screen name="AccountsList" component={AccountsScreen} />
      <Stack.Screen name="AccountsDashboard" component={AccountsDashboardScreen} />
      <Stack.Screen
        name="AddAccount"
        component={AddAccountScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      
      {/* Reports Screen */}
      <Stack.Screen name="Reports" component={ReportsScreen} />
      
      {/* Settings Screens */}
      <Stack.Screen name="CurrencySelect" component={CurrencySelectScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
  );
});

RootNavigator.displayName = 'RootNavigator';

export default RootNavigator;
