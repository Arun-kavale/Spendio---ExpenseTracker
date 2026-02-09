/**
 * Reports Screen
 *
 * Allows users to generate and share professional PDF reports
 * for expenses, income, budgets, and combined financial statements.
 */

import React, {memo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInDown} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTheme, useCurrency} from '@/hooks';
import {
  useExpenseStore,
  useCategoryStore,
  useIncomeStore,
  useBudgetStore,
  useTransferStore,
  useAccountStore,
} from '@/store';
import {Card, useToast} from '@/components/common';
import {
  generateExpenseReport,
  generateIncomeReport,
  generateBudgetReport,
  generateCombinedReport,
  sharePDF,
  ReportOptions,
} from '@/services/reports';
import {INCOME_CATEGORIES} from '@/constants';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';

type ReportType = 'expense' | 'income' | 'budget' | 'combined';
type DateRangeType = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

interface ReportCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
  delay: number;
}

const ReportCard = memo<ReportCardProps>(
  ({icon, title, description, color, onPress, delay}) => {
    const theme = useTheme();

    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
        <Card style={styles.reportCard} padding="medium" onPress={onPress}>
          <View style={styles.reportCardContent}>
            <View style={[styles.reportIcon, {backgroundColor: color + '15'}]}>
              <Icon name={icon} size={24} color={color} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={[styles.reportTitle, {color: theme.colors.text}]}>
                {title}
              </Text>
              <Text style={[styles.reportDesc, {color: theme.colors.textMuted}]}>
                {description}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
          </View>
        </Card>
      </Animated.View>
    );
  },
);

export const ReportsScreen = memo(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {showToast} = useToast();
  const {currency} = useCurrency();

  // Stores
  const {expenses} = useExpenseStore();
  const {categories} = useCategoryStore();
  const {incomes} = useIncomeStore();
  const {budgets} = useBudgetStore();
  const {transfers} = useTransferStore();
  const {accounts} = useAccountStore();

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(startOfMonth(new Date()));
  const [customEndDate, setCustomEndDate] = useState(endOfMonth(new Date()));
  const [pickingDateType, setPickingDateType] = useState<'start' | 'end'>('start');

  const getDateRange = useCallback((): {start: Date; end: Date} => {
    const now = new Date();
    switch (dateRange) {
      case 'thisMonth':
        return {start: startOfMonth(now), end: endOfMonth(now)};
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {start: startOfMonth(lastMonth), end: endOfMonth(lastMonth)};
      case 'thisYear':
        return {start: startOfYear(now), end: endOfYear(now)};
      case 'custom':
        return {start: customStartDate, end: customEndDate};
      default:
        return {start: startOfMonth(now), end: endOfMonth(now)};
    }
  }, [dateRange, customStartDate, customEndDate]);

  const handleGenerateReport = useCallback(
    async (type: ReportType) => {
      setIsGenerating(true);

      try {
        const {start, end} = getDateRange();
        const options: ReportOptions = {
          title:
            type === 'expense'
              ? 'Expense Report'
              : type === 'income'
              ? 'Income Report'
              : type === 'budget'
              ? 'Budget Report'
              : 'Financial Statement',
          startDate: start,
          endDate: end,
          currency: {symbol: currency.symbol, code: currency.code},
        };

        // Filter data by date range
        const filteredExpenses = expenses.filter(e =>
          isWithinInterval(parseISO(e.date), {start, end}),
        );
        const filteredIncomes = incomes.filter(i =>
          isWithinInterval(parseISO(i.date), {start, end}),
        );
        const filteredTransfers = transfers.filter(t =>
          isWithinInterval(parseISO(t.date), {start, end}),
        );

        let filePath = '';

        switch (type) {
          case 'expense':
            filePath = await generateExpenseReport(
              {expenses: filteredExpenses, categories},
              options,
            );
            break;
          case 'income':
            filePath = await generateIncomeReport(
              {incomes: filteredIncomes, categories: INCOME_CATEGORIES},
              options,
            );
            break;
          case 'budget':
            filePath = await generateBudgetReport(
              {budgets, expenses: filteredExpenses, categories},
              options,
            );
            break;
          case 'combined':
            filePath = await generateCombinedReport(
              {
                expenses: filteredExpenses,
                incomes: filteredIncomes,
                transfers: filteredTransfers,
                accounts,
                categories,
              },
              options,
            );
            break;
        }

        if (filePath) {
          showToast({
            type: 'success',
            title: 'Report Generated',
            message: 'Opening share options...',
            duration: 2000,
          });

          // Slight delay for toast to show
          setTimeout(() => {
            sharePDF(filePath, options.title);
          }, 500);
        }
      } catch (error) {
        console.error('Report generation error:', error);
        showToast({
          type: 'error',
          title: 'Generation Failed',
          message: 'Could not generate the report. Please try again.',
          duration: 3000,
        });
      } finally {
        setIsGenerating(false);
        setShowRangeModal(false);
      }
    },
    [
      getDateRange,
      currency,
      expenses,
      incomes,
      transfers,
      budgets,
      accounts,
      categories,
      showToast,
    ],
  );

  const openReportModal = useCallback((type: ReportType) => {
    setSelectedReport(type);
    setShowRangeModal(true);
  }, []);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        if (pickingDateType === 'start') {
          setCustomStartDate(selectedDate);
        } else {
          setCustomEndDate(selectedDate);
        }
        setDateRange('custom');
      }
    },
    [pickingDateType],
  );

  const dateRangeOptions: {id: DateRangeType; label: string}[] = [
    {id: 'thisMonth', label: 'This Month'},
    {id: 'lastMonth', label: 'Last Month'},
    {id: 'thisYear', label: 'This Year'},
    {id: 'custom', label: 'Custom Range'},
  ];

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>Reports</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 24}]}
        showsVerticalScrollIndicator={false}>
        {/* Expense Reports */}
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Expense Reports
        </Text>
        <ReportCard
          icon="trending-down"
          title="Expense Report"
          description="Detailed breakdown of all expenses by category"
          color={theme.colors.expense}
          onPress={() => openReportModal('expense')}
          delay={100}
        />

        {/* Income Reports */}
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Income Reports
        </Text>
        <ReportCard
          icon="trending-up"
          title="Income Report"
          description="Summary of all income sources"
          color={theme.colors.income}
          onPress={() => openReportModal('income')}
          delay={150}
        />

        {/* Budget Reports */}
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Budget Reports
        </Text>
        <ReportCard
          icon="target"
          title="Budget Report"
          description="Budget vs actual spending analysis"
          color={theme.colors.warning}
          onPress={() => openReportModal('budget')}
          delay={200}
        />

        {/* Combined Reports */}
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Financial Statements
        </Text>
        <ReportCard
          icon="file-document-outline"
          title="Profit & Loss Statement"
          description="Complete financial overview with account balances"
          color={theme.colors.primary}
          onPress={() => openReportModal('combined')}
          delay={250}
        />
      </ScrollView>

      {/* Date Range Modal */}
      <Modal visible={showRangeModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, {backgroundColor: theme.colors.overlay}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Select Date Range
              </Text>
              <Pressable onPress={() => setShowRangeModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </Pressable>
            </View>

            <View style={styles.dateRangeOptions}>
              {dateRangeOptions.map(option => (
                <Pressable
                  key={option.id}
                  onPress={() => setDateRange(option.id)}
                  style={[
                    styles.dateRangeOption,
                    {
                      backgroundColor:
                        dateRange === option.id
                          ? theme.colors.primary + '15'
                          : theme.colors.surfaceVariant,
                      borderColor:
                        dateRange === option.id
                          ? theme.colors.primary
                          : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dateRangeLabel,
                      {
                        color:
                          dateRange === option.id
                            ? theme.colors.primary
                            : theme.colors.text,
                      },
                    ]}>
                    {option.label}
                  </Text>
                  {dateRange === option.id && (
                    <Icon name="check" size={18} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Custom Date Pickers */}
            {dateRange === 'custom' && (
              <View style={styles.customDateRow}>
                <Pressable
                  style={[styles.datePickerBtn, {backgroundColor: theme.colors.surfaceVariant}]}
                  onPress={() => {
                    setPickingDateType('start');
                    setShowDatePicker(true);
                  }}>
                  <Icon name="calendar" size={18} color={theme.colors.primary} />
                  <Text style={[styles.datePickerText, {color: theme.colors.text}]}>
                    {format(customStartDate, 'dd MMM yyyy')}
                  </Text>
                </Pressable>
                <Text style={{color: theme.colors.textMuted}}>to</Text>
                <Pressable
                  style={[styles.datePickerBtn, {backgroundColor: theme.colors.surfaceVariant}]}
                  onPress={() => {
                    setPickingDateType('end');
                    setShowDatePicker(true);
                  }}>
                  <Icon name="calendar" size={18} color={theme.colors.primary} />
                  <Text style={[styles.datePickerText, {color: theme.colors.text}]}>
                    {format(customEndDate, 'dd MMM yyyy')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Generate Button */}
            <Pressable
              onPress={() => selectedReport && handleGenerateReport(selectedReport)}
              disabled={isGenerating}
              style={[styles.generateBtn, {backgroundColor: theme.colors.primary}]}>
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="file-pdf-box" size={20} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>Generate PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={pickingDateType === 'start' ? customStartDate : customEndDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
});

ReportsScreen.displayName = 'ReportsScreen';

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 8},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  reportCard: {marginBottom: 8},
  reportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {flex: 1, marginLeft: 12},
  reportTitle: {fontSize: 16, fontWeight: '600'},
  reportDesc: {fontSize: 13, marginTop: 2},
  modalOverlay: {flex: 1, justifyContent: 'flex-end'},
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {fontSize: 20, fontWeight: '700'},
  dateRangeOptions: {gap: 8, marginBottom: 16},
  dateRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dateRangeLabel: {fontSize: 15, fontWeight: '500'},
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  datePickerText: {fontSize: 14, fontWeight: '500'},
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportsScreen;
