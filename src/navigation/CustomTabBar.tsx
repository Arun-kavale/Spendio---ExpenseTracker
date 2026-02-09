/**
 * Premium Custom Tab Bar
 * 
 * A professional fintech-grade tab bar featuring:
 * - Floating pill design with glassmorphism
 * - Smooth animated active indicator
 * - Elegant center action button with multi-action menu
 * - Refined micro-interactions
 * - Accessibility support
 */

import React, {memo, useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Vibration,
  Modal,
  Dimensions,
} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, LinearGradient, Stop, Rect} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  FadeInUp,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks';
import {RootStackParamList} from '@/types';

// Design tokens
const DESIGN = {
  barMargin: 16,
  barHeight: 56,
  barRadius: 28,
  fabSize: 48,
  fabOffset: 12,
  iconSize: 22,
  labelSize: 10,
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH - DESIGN.barMargin * 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab configuration with better icons
const TABS: Record<string, {icon: string; activeIcon: string; label: string}> = {
  Dashboard: {icon: 'home-variant-outline', activeIcon: 'home-variant', label: 'Home'},
  Expenses: {icon: 'credit-card-outline', activeIcon: 'credit-card', label: 'Expenses'},
  Analytics: {icon: 'poll', activeIcon: 'poll', label: 'Analytics'},
  Settings: {icon: 'tune-variant', activeIcon: 'tune-variant', label: 'Settings'},
};

/**
 * Individual Tab Button with animated states
 */
const TabButton = memo<{
  name: string;
  isActive: boolean;
  onPress: () => void;
}>(({name, isActive, onPress}) => {
  const theme = useTheme();
  const pressed = useSharedValue(0);
  const active = useSharedValue(isActive ? 1 : 0);
  
  const tab = TABS[name] || {icon: 'help-circle-outline', activeIcon: 'help-circle', label: name};
  
  useEffect(() => {
    active.value = withSpring(isActive ? 1 : 0, {damping: 15, stiffness: 120});
  }, [isActive, active]);
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{scale: 1 - pressed.value * 0.08}],
    opacity: 0.6 + active.value * 0.4,
  }));
  
  const iconColor = isActive ? theme.colors.gradientStart : theme.colors.textMuted;
  
  return (
    <AnimatedPressable
      onPress={() => {
        if (Platform.OS === 'android') Vibration.vibrate(5);
        onPress();
      }}
      onPressIn={() => {
        pressed.value = withTiming(1, {duration: 100});
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, {duration: 150});
      }}
      style={[styles.tab, containerStyle]}
      accessibilityRole="tab"
      accessibilityState={{selected: isActive}}
      accessibilityLabel={tab.label}>
      
      <Icon
        name={isActive ? tab.activeIcon : tab.icon}
        size={DESIGN.iconSize}
        color={iconColor}
      />
      
      <Text
        style={[
          styles.tabLabel,
          {
            color: iconColor,
            fontWeight: isActive ? '600' : '400',
          },
        ]}>
        {tab.label}
      </Text>
      
      {/* Active indicator dot */}
      {isActive && (
        <Animated.View
          style={[styles.activeDot, {backgroundColor: theme.colors.gradientStart}]}
        />
      )}
    </AnimatedPressable>
  );
});

/**
 * Quick Action Menu Item
 */
const QuickActionItem = memo<{
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
}>(({icon, label, color, onPress, delay}) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(200)}>
      <Pressable onPress={onPress} style={styles.quickActionItem}>
        <View style={[styles.quickActionIcon, {backgroundColor: color + '15'}]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.quickActionLabel, {color: theme.colors.text}]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

/**
 * Center Action Button (FAB) with multi-action menu
 */
const ActionButton = memo<{onPress: () => void}>(({onPress}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
  }));
  
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Vibration.vibrate(10);
    
    // Quick rotation animation
    rotation.value = withSequence(
      withTiming(90, {duration: 150, easing: Easing.out(Easing.cubic)}),
      withTiming(0, {duration: 200, easing: Easing.out(Easing.cubic)})
    );
    
    onPress();
  }, [onPress, rotation]);
  
  return (
    <View style={styles.fabContainer}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.92, {damping: 15, stiffness: 400});
        }}
        onPressOut={() => {
          scale.value = withSpring(1, {damping: 12, stiffness: 300});
        }}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.gradientStart,
            ...Platform.select({
              ios: {
                shadowColor: theme.colors.gradientStart,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: {elevation: 6},
            }),
          },
          buttonStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add new transaction">
        
        {/* Gradient overlay */}
        <Svg width={DESIGN.fabSize} height={DESIGN.fabSize} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="fabGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.gradientStart} />
              <Stop offset="1" stopColor={theme.colors.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={DESIGN.fabSize}
            height={DESIGN.fabSize}
            rx={DESIGN.fabSize / 2}
            fill="url(#fabGrad)"
          />
        </Svg>
        
        <Icon name="plus" size={22} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
});

/**
 * Main Tab Bar Component
 */
export const CustomTabBar = memo<BottomTabBarProps>(({state, navigation}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showActions, setShowActions] = useState(false);
  
  // Refined frosted glass: base + tint + gradient shine (no blur lib)
  const barBg = theme.mode === 'dark'
    ? 'rgba(24, 24, 32, 0.92)'
    : 'rgba(252, 252, 255, 0.92)';
  
  const barBorder = theme.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.6)';
  
  const frostedTint = theme.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.35)'
    : 'rgba(255, 255, 255, 0.62)';
  
  const topHighlight = theme.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.85)';
  
  const bottomSpace = Math.max(insets.bottom, 8);
  
  // Navigation handlers
  const navigateTo = useCallback((index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [navigation, state]);
  
  const openActionMenu = useCallback(() => {
    setShowActions(true);
  }, []);

  const handleAction = useCallback((screen: keyof RootStackParamList) => {
    setShowActions(false);
    setTimeout(() => {
      rootNav.navigate(screen as any);
    }, 150);
  }, [rootNav]);
  
  return (
    <>
      <Animated.View
        entering={FadeInUp.duration(350).springify()}
        style={[styles.wrapper, {paddingBottom: bottomSpace}]}>
        
        <View
          style={[
            styles.bar,
            {
              backgroundColor: barBg,
              borderColor: barBorder,
              ...Platform.select({
                ios: {
                  shadowColor: theme.mode === 'dark' ? '#000' : '#94a3b8',
                  shadowOffset: {width: 0, height: 6},
                  shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.1,
                  shadowRadius: 20,
                },
                android: {elevation: 10},
              }),
            },
          ]}>
          {/* Glass layers: tint + gradient shine + top edge */}
          <View
            style={[StyleSheet.absoluteFill, styles.glassOverlay]}
            pointerEvents="none">
            <View style={[StyleSheet.absoluteFill, {backgroundColor: frostedTint}]} />
            {/* Gradient: top light reflection + bottom subtle depth */}
            <Svg width={BAR_WIDTH} height={DESIGN.barHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="glassShine" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFF" stopOpacity={theme.mode === 'dark' ? 0.08 : 0.22} />
                  <Stop offset="0.35" stopColor="#FFF" stopOpacity="0" />
                  <Stop offset="0.85" stopColor="#FFF" stopOpacity="0" />
                  <Stop offset="1" stopColor="#000" stopOpacity={theme.mode === 'dark' ? 0.08 : 0.04} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={BAR_WIDTH} height={DESIGN.barHeight} rx={DESIGN.barRadius} fill="url(#glassShine)" />
            </Svg>
            <View style={[styles.glassHighlight, {backgroundColor: topHighlight}]} />
            {/* Soft secondary highlight under the edge */}
            <View style={[styles.glassHighlightSoft, {backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.25)'}]} />
          </View>
          
          {/* Left section */}
          <View style={styles.section}>
            <TabButton
              name={state.routes[0].name}
              isActive={state.index === 0}
              onPress={() => navigateTo(0)}
            />
            <TabButton
              name={state.routes[1].name}
              isActive={state.index === 1}
              onPress={() => navigateTo(1)}
            />
          </View>
          
          {/* Center FAB */}
          <ActionButton onPress={openActionMenu} />
          
          {/* Right section */}
          <View style={styles.section}>
            <TabButton
              name={state.routes[2].name}
              isActive={state.index === 2}
              onPress={() => navigateTo(2)}
            />
            <TabButton
              name={state.routes[3].name}
              isActive={state.index === 3}
              onPress={() => navigateTo(3)}
            />
          </View>
        </View>
      </Animated.View>

      {/* Quick Action Menu */}
      <Modal visible={showActions} transparent animationType="fade">
        <Pressable style={[styles.actionOverlay, {backgroundColor: theme.colors.overlay}]} onPress={() => setShowActions(false)}>
          <Animated.View entering={FadeIn.duration(200)} style={[styles.actionSheet, {backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 20}]}>
            <View style={[styles.actionSheetHandle, {backgroundColor: theme.colors.textMuted}]} />
            <Text style={[styles.actionSheetTitle, {color: theme.colors.text}]}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <QuickActionItem icon="cash-minus" label="Expense" color={theme.colors.expense} onPress={() => handleAction('AddExpense')} delay={50} />
              <QuickActionItem icon="cash-plus" label="Income" color={theme.colors.income} onPress={() => handleAction('AddIncome')} delay={100} />
              <QuickActionItem icon="swap-horizontal" label="Transfer" color={theme.colors.transfer} onPress={() => handleAction('AddTransfer')} delay={150} />
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
});

CustomTabBar.displayName = 'CustomTabBar';

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: DESIGN.barMargin,
    height: DESIGN.barHeight,
    borderRadius: DESIGN.barRadius,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  glassOverlay: {
    overflow: 'hidden',
    borderRadius: DESIGN.barRadius,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopLeftRadius: DESIGN.barRadius,
    borderTopRightRadius: DESIGN.barRadius,
  },
  glassHighlightSoft: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: 1,
    opacity: 0.9,
    borderTopLeftRadius: DESIGN.barRadius - 4,
    borderTopRightRadius: DESIGN.barRadius - 4,
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: DESIGN.labelSize,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  fabContainer: {
    marginHorizontal: 4,
    marginTop: -DESIGN.fabOffset,
  },
  fab: {
    width: DESIGN.fabSize,
    height: DESIGN.fabSize,
    borderRadius: DESIGN.fabSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Quick Action Menu styles
  actionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CustomTabBar;
