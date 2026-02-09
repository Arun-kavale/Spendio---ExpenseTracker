/**
 * StickyHeader Component
 *
 * A reusable animated sticky header for scrollable screens.
 * Renders a compact fixed top bar with an optional collapsed summary
 * that smoothly expands in when the user scrolls down.
 *
 * The collapsed content starts at height 0 and takes no space on
 * initial load — it only appears after scrolling.
 *
 * Usage:
 *   const { scrollHandler, collapsedSummaryStyle, dividerOpacity, headerShadowStyle } =
 *     useCollapsibleHeader({ snapThreshold: 120 });
 *
 *   <StickyHeader
 *     topBar={<TopBarContent />}
 *     collapsedContent={<CompactSummary />}
 *     collapsedStyle={collapsedSummaryStyle}
 *     dividerStyle={dividerOpacity}
 *     shadowStyle={headerShadowStyle}
 *     backgroundColor={theme.colors.background}
 *   />
 *   <Animated.FlatList onScroll={scrollHandler} ... />
 */

import React, {memo} from 'react';
import {View, StyleSheet, Platform, ViewStyle} from 'react-native';
import Animated, {AnimatedStyleProp} from 'react-native-reanimated';

/** Animated style type returned by useAnimatedStyle */
type AnimStyle = AnimatedStyleProp<ViewStyle>;

interface StickyHeaderProps {
  /** Always-visible content: title, navigation buttons, actions */
  topBar: React.ReactNode;
  /** Compact content that fades in when scrolled (optional) */
  collapsedContent?: React.ReactNode;
  /** Animated style for collapsed content (from useCollapsibleHeader) */
  collapsedStyle?: AnimStyle;
  /** Animated style for bottom divider (from useCollapsibleHeader) */
  dividerStyle?: AnimStyle;
  /** Animated style for header shadow (from useCollapsibleHeader) */
  shadowStyle?: AnimStyle;
  /** Header background color */
  backgroundColor: string;
  /** Divider color */
  dividerColor?: string;
  /** Extra padding top (usually insets.top) */
  paddingTop?: number;
}

export const StickyHeader = memo<StickyHeaderProps>(
  ({
    topBar,
    collapsedContent,
    collapsedStyle,
    dividerStyle,
    shadowStyle,
    backgroundColor,
    dividerColor = 'rgba(0,0,0,0.08)',
    paddingTop = 0,
  }) => {
    return (
      <Animated.View
        style={[
          styles.headerContainer,
          {backgroundColor, paddingTop},
          shadowStyle,
        ]}>
        {/* Always-visible top bar (compact) */}
        {topBar}

        {/* Collapsed compact summary — height starts at 0, expands on scroll */}
        {collapsedContent && collapsedStyle && (
          <Animated.View style={[styles.collapsedWrapper, collapsedStyle]}>
            {collapsedContent}
          </Animated.View>
        )}

        {/* Subtle divider line — appears when scrolled */}
        {dividerStyle && (
          <Animated.View
            style={[
              styles.divider,
              {backgroundColor: dividerColor},
              dividerStyle,
            ]}
          />
        )}
      </Animated.View>
    );
  },
);

StickyHeader.displayName = 'StickyHeader';

const styles = StyleSheet.create({
  headerContainer: {
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    ...Platform.select({
      android: {elevation: 0},
      ios: {shadowOpacity: 0},
    }),
  },
  collapsedWrapper: {
    // No padding/margin here — the hook animates maxHeight + marginTop
    // from 0, so the wrapper takes zero space on initial load.
    paddingHorizontal: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
