/**
 * Theme Hook
 * 
 * Provides access to the current theme based on user preference
 * and system settings.
 */

import {useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {useSettingsStore} from '@/store';
import {lightTheme, darkTheme} from '@/theme';
import {Theme} from '@/types';

export const useTheme = (): Theme => {
  const {settings} = useSettingsStore();
  const systemColorScheme = useColorScheme();
  
  const theme = useMemo(() => {
    if (settings.theme === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return settings.theme === 'dark' ? darkTheme : lightTheme;
  }, [settings.theme, systemColorScheme]);
  
  return theme;
};

export default useTheme;
