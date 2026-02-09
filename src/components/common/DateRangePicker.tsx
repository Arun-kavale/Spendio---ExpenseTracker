/**
 * DateRangePicker Component
 * 
 * Professional date range picker with presets and calendar view.
 * Used for filtering analytics and expense data.
 */

import React, {memo, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '@/hooks';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  addMonths,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  eachDayOfInterval,
  getDay,
} from 'date-fns';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type PresetKey = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: PresetKey;
}

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (range: DateRange) => void;
  initialRange?: DateRange;
  title?: string;
}

const PRESETS: {key: PresetKey; label: string; icon: string}[] = [
  {key: 'today', label: 'Today', icon: 'calendar-today'},
  {key: 'yesterday', label: 'Yesterday', icon: 'calendar-arrow-left'},
  {key: 'thisWeek', label: 'This Week', icon: 'calendar-week'},
  {key: 'lastWeek', label: 'Last Week', icon: 'calendar-week'},
  {key: 'thisMonth', label: 'This Month', icon: 'calendar-month'},
  {key: 'lastMonth', label: 'Last Month', icon: 'calendar-month-outline'},
  {key: 'last3Months', label: 'Last 3 Months', icon: 'calendar-range'},
  {key: 'last6Months', label: 'Last 6 Months', icon: 'calendar-range'},
  {key: 'thisYear', label: 'This Year', icon: 'calendar-blank'},
  {key: 'custom', label: 'Custom Range', icon: 'calendar-edit'},
];

const getPresetRange = (preset: PresetKey): {startDate: Date; endDate: Date} => {
  const now = new Date();
  
  switch (preset) {
    case 'today':
      return {startDate: startOfDay(now), endDate: endOfDay(now)};
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {startDate: startOfDay(yesterday), endDate: endOfDay(yesterday)};
    case 'thisWeek':
      return {startDate: startOfWeek(now, {weekStartsOn: 1}), endDate: endOfWeek(now, {weekStartsOn: 1})};
    case 'lastWeek':
      const lastWeekStart = subDays(startOfWeek(now, {weekStartsOn: 1}), 7);
      return {startDate: lastWeekStart, endDate: endOfWeek(lastWeekStart, {weekStartsOn: 1})};
    case 'thisMonth':
      return {startDate: startOfMonth(now), endDate: endOfMonth(now)};
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return {startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth)};
    case 'last3Months':
      return {startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now)};
    case 'last6Months':
      return {startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now)};
    case 'thisYear':
      return {startDate: new Date(now.getFullYear(), 0, 1), endDate: now};
    default:
      return {startDate: startOfMonth(now), endDate: endOfMonth(now)};
  }
};

const PresetButton = memo<{
  preset: typeof PRESETS[0];
  isSelected: boolean;
  onPress: () => void;
}>(({preset, isSelected, onPress}) => {
  const theme = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.presetButton,
        {
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}>
      <Icon
        name={preset.icon}
        size={18}
        color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.presetLabel,
          {color: isSelected ? '#FFFFFF' : theme.colors.text},
        ]}>
        {preset.label}
      </Text>
    </Pressable>
  );
});

const CalendarMonth = memo<{
  month: Date;
  startDate: Date | null;
  endDate: Date | null;
  onDayPress: (date: Date) => void;
}>(({month, startDate, endDate, onDayPress}) => {
  const theme = useTheme();
  
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDay = getDay(monthStart);
    
    // Adjust for week starting on Monday
    const offset = startDay === 0 ? 6 : startDay - 1;
    
    const allDays = eachDayOfInterval({start: monthStart, end: monthEnd});
    
    // Add empty slots for days before month starts
    const emptySlots = Array(offset).fill(null);
    
    return [...emptySlots, ...allDays];
  }, [month]);
  
  const isInRange = (date: Date) => {
    if (!startDate || !endDate) {
      return false;
    }
    return isWithinInterval(date, {start: startDate, end: endDate});
  };
  
  const isStart = (date: Date) => startDate && isSameDay(date, startDate);
  const isEnd = (date: Date) => endDate && isSameDay(date, endDate);
  const isToday = (date: Date) => isSameDay(date, new Date());
  
  return (
    <View style={styles.calendarMonth}>
      <Text style={[styles.monthTitle, {color: theme.colors.text}]}>
        {format(month, 'MMMM yyyy')}
      </Text>
      
      {/* Week day headers */}
      <View style={styles.weekDays}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <Text
            key={i}
            style={[styles.weekDay, {color: theme.colors.textMuted}]}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Days grid */}
      <View style={styles.daysGrid}>
        {days.map((day, i) => {
          if (!day) {
            return <View key={`empty-${i}`} style={styles.dayCell} />;
          }
          
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const today = isToday(day);
          
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onDayPress(day)}
              style={[
                styles.dayCell,
                inRange && {backgroundColor: theme.colors.primary + '20'},
                (start || end) && {backgroundColor: theme.colors.primary},
                start && {borderTopLeftRadius: 8, borderBottomLeftRadius: 8},
                end && {borderTopRightRadius: 8, borderBottomRightRadius: 8},
              ]}>
              <Text
                style={[
                  styles.dayText,
                  {color: theme.colors.text},
                  today && !start && !end && {color: theme.colors.primary, fontWeight: '700'},
                  (start || end) && {color: '#FFFFFF', fontWeight: '700'},
                ]}>
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

export const DateRangePicker = memo<DateRangePickerProps>(({
  visible,
  onClose,
  onSelect,
  initialRange,
  title = 'Select Date Range',
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(
    initialRange?.preset || null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    initialRange?.startDate || null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialRange?.endDate || null
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  
  const handlePresetSelect = useCallback((preset: PresetKey) => {
    if (preset === 'custom') {
      setShowCalendar(true);
      setSelectedPreset('custom');
      return;
    }
    
    const range = getPresetRange(preset);
    setSelectedPreset(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setShowCalendar(false);
  }, []);
  
  const handleDayPress = useCallback((date: Date) => {
    if (selectingStart) {
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (date < startDate!) {
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
      }
      setSelectingStart(true);
    }
  }, [selectingStart, startDate]);
  
  const handleApply = useCallback(() => {
    if (startDate && endDate) {
      onSelect({
        startDate,
        endDate,
        preset: selectedPreset || undefined,
      });
      onClose();
    }
  }, [startDate, endDate, selectedPreset, onSelect, onClose]);
  
  const handleClear = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPreset(null);
    setShowCalendar(false);
  }, []);
  
  if (!visible) {
    return null;
  }
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.overlay, {backgroundColor: theme.colors.overlay}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: insets.bottom + 16,
            },
          ]}>
          {/* Header */}
          <View style={[styles.header, {borderBottomColor: theme.colors.border}]}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={[styles.title, {color: theme.colors.text}]}>
              {title}
            </Text>
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Text style={[styles.clearText, {color: theme.colors.primary}]}>
                Clear
              </Text>
            </Pressable>
          </View>
          
          {/* Selected Range Display */}
          {startDate && (
            <View style={[styles.rangeDisplay, {backgroundColor: theme.colors.surfaceVariant}]}>
              <View style={styles.rangePart}>
                <Text style={[styles.rangeLabel, {color: theme.colors.textMuted}]}>
                  From
                </Text>
                <Text style={[styles.rangeValue, {color: theme.colors.text}]}>
                  {format(startDate, 'MMM d, yyyy')}
                </Text>
              </View>
              <Icon name="arrow-right" size={20} color={theme.colors.textMuted} />
              <View style={styles.rangePart}>
                <Text style={[styles.rangeLabel, {color: theme.colors.textMuted}]}>
                  To
                </Text>
                <Text style={[styles.rangeValue, {color: theme.colors.text}]}>
                  {endDate ? format(endDate, 'MMM d, yyyy') : 'Select'}
                </Text>
              </View>
            </View>
          )}
          
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}>
            {/* Presets */}
            {!showCalendar && (
              <View style={styles.presetsContainer}>
                <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary}]}>
                  Quick Presets
                </Text>
                <View style={styles.presetsGrid}>
                  {PRESETS.map(preset => (
                    <PresetButton
                      key={preset.key}
                      preset={preset}
                      isSelected={selectedPreset === preset.key}
                      onPress={() => handlePresetSelect(preset.key)}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {/* Calendar */}
            {showCalendar && (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarNav}>
                  <Pressable
                    onPress={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                    style={styles.navButton}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    style={styles.navButton}>
                    <Icon name="chevron-right" size={24} color={theme.colors.text} />
                  </Pressable>
                </View>
                
                <CalendarMonth
                  month={calendarMonth}
                  startDate={startDate}
                  endDate={endDate}
                  onDayPress={handleDayPress}
                />
                
                <Pressable
                  onPress={() => setShowCalendar(false)}
                  style={styles.backToPresets}>
                  <Icon name="arrow-left" size={18} color={theme.colors.primary} />
                  <Text style={[styles.backText, {color: theme.colors.primary}]}>
                    Back to presets
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
          
          {/* Apply Button */}
          <Pressable
            onPress={handleApply}
            disabled={!startDate || !endDate}
            style={[
              styles.applyButton,
              {
                backgroundColor: startDate && endDate
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}>
            <Text
              style={[
                styles.applyText,
                {color: startDate && endDate ? '#FFFFFF' : theme.colors.textMuted},
              ]}>
              Apply Filter
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

DateRangePicker.displayName = 'DateRangePicker';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  rangePart: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 400,
  },
  presetsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarContainer: {
    padding: 16,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  calendarMonth: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 32) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  backToPresets: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateRangePicker;
