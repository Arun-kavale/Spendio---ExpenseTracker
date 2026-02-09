/**
 * useCollapsibleHeader Hook
 *
 * Provides scroll-based animated values for building premium
 * collapsible sticky headers across any scrollable screen.
 *
 * Pattern:
 *  - A fixed top bar (title, nav, buttons) is always visible.
 *  - Expandable content (summary, filters) scrolls naturally.
 *  - A compact collapsed summary fades into the top bar area
 *    once the expandable content scrolls out of view.
 *
 * The collapsed content starts at height 0 and expands only after
 * the user scrolls, so no extra space is visible on initial load.
 *
 * Works with: ScrollView, FlatList, SectionList (via Animated wrappers)
 */

import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface UseCollapsibleHeaderConfig {
  /**
   * Scroll offset at which the collapsed summary is fully visible.
   * Usually matches the height of the expandable content.
   * @default 120
   */
  snapThreshold?: number;

  /**
   * Max height of the collapsed summary row when fully revealed.
   * @default 28
   */
  collapsedContentHeight?: number;
}

export function useCollapsibleHeader(config: UseCollapsibleHeaderConfig = {}) {
  const {snapThreshold = 120, collapsedContentHeight = 28} = config;
  const scrollY = useSharedValue(0);

  // Attach to Animated.ScrollView / Animated.FlatList via onScroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  /**
   * Collapsed summary style:
   *  - maxHeight animates from 0 → collapsedContentHeight (no layout space at start)
   *  - opacity fades from 0 → 1
   *  - translateY slides from +4 → 0
   *  - overflow: hidden clips content while height is animating
   */
  const collapsedSummaryStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = interpolate(
      scrollY.value,
      [snapThreshold * 0.3, snapThreshold * 0.8],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      maxHeight: interpolate(progress, [0, 0.05, 1], [0, collapsedContentHeight, collapsedContentHeight]),
      marginTop: interpolate(progress, [0, 0.05, 1], [0, 4, 4]),
      opacity: interpolate(progress, [0, 0.3, 1], [0, 0, 1]),
      overflow: 'hidden' as const,
      transform: [
        {
          translateY: interpolate(progress, [0.3, 1], [4, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Bottom divider for the sticky header — appears when scrolled
  const dividerOpacity = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(
        scrollY.value,
        [snapThreshold * 0.5, snapThreshold],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  // Subtle shadow on the sticky header when content is scrolled underneath
  const headerShadowStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      shadowOpacity: interpolate(
        scrollY.value,
        [0, snapThreshold * 0.5],
        [0, 0.06],
        Extrapolation.CLAMP,
      ),
      elevation: interpolate(
        scrollY.value,
        [0, snapThreshold * 0.5],
        [0, 3],
        Extrapolation.CLAMP,
      ),
    };
  });

  return {
    scrollY,
    scrollHandler,
    collapsedSummaryStyle,
    dividerOpacity,
    headerShadowStyle,
  };
}
