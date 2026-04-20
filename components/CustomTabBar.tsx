import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useLinkBuilder } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { memo, useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── ArenaGO Design System tokens ──────────────────────────────────────────
const THEME = {
  // Colors — from design system
  colorActive: "#FF6B58", // --coral
  colorInactive: "#CCC8C5", // --ink-20
  background: "#FDFCFB", // --white
  borderColor: "#E8E4E1", // --ink-10

  // Geometry
  tapTarget: 44, // minimum touch area per tab
  iconSize: 22, // matches the 22×22 SVGs in the mockups
  indicatorWidth: 22, // small coral pill below active icon
  indicatorHeight: 3,

  // Spacing — matches mockup: 14px top, 22px bottom (overridden by safe area)
  paddingTop: 14,
  paddingBottomMin: 22,
  paddingHorizontal: 8,

  // Border
  borderTopWidth: 1,

  // Animation
  springDamping: 18,
  springStiffness: 200,
  fadeDuration: 160,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
    borderTopWidth: THEME.borderTopWidth,
    borderTopColor: THEME.borderColor,
    paddingTop: THEME.paddingTop,
    paddingHorizontal: THEME.paddingHorizontal,
    // Shadow — matches the phone screen's nav-bar visual weight
    ...Platform.select({
      ios: {
        shadowColor: "#0F0D0C",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  // Each tab is exactly 44×44 for accessibility
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: THEME.tapTarget,
  },

  tabContent: {
    alignItems: "center",
    // gap between icon and indicator dot
    gap: 5,
  },

  // Icon container — matches .nav-icon (24×24 in CSS, but tap area is 44×44 via tabItem)
  iconWrap: {
    width: THEME.tapTarget,
    height: THEME.tapTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  // The small coral pill that appears below the active icon
  // matches the design's active state visual — no label, just a dot/line
  indicator: {
    height: THEME.indicatorHeight,
    width: THEME.indicatorWidth,
    backgroundColor: THEME.colorActive,
    borderRadius: THEME.indicatorHeight / 2,
  },
});

// ─── Main Tab Bar ──────────────────────────────────────────────────────────
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(THEME.paddingBottomMin, insets.bottom),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Label — used only for accessibility, never rendered visually
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            // Trigger haptic feedback on tab press
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          const icon = options.tabBarIcon?.({
            color: isFocused ? THEME.colorActive : THEME.colorInactive,
            size: THEME.iconSize,
            focused: isFocused,
          });

          return (
            <TabBarItem
              key={route.key}
              isFocused={isFocused}
              icon={icon}
              label={label}
              badge={options.tabBarBadge}
              onPress={onPress}
              onLongPress={onLongPress}
              href={buildHref(route.name, route.params)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Individual Tab Item ───────────────────────────────────────────────────
interface TabBarItemProps {
  isFocused: boolean;
  icon?: React.ReactNode;
  label: string;
  badge?: string | number | boolean;
  onPress: () => void;
  onLongPress: () => void;
  href?: string;
}

const TabBarItem = memo(function TabBarItem({
  isFocused,
  icon,
  label,
  onPress,
  onLongPress,
  href,
}: TabBarItemProps) {
  // ── Icon scale: subtle spring bump on focus ──
  // Active: 1.1× (slightly larger, feels "selected")
  // Inactive: 1.0× (resting)
  const iconScale = useSharedValue(isFocused ? 1.1 : 1);

  // ── Indicator: fade in/out, no slide ──
  // Matches the CSS: active = coral, inactive = invisible
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);

  // ── Icon color is handled via the `color` prop passed to tabBarIcon ──
  // We animate stroke opacity as a proxy for the color transition feel
  const iconOpacity = useSharedValue(isFocused ? 1 : 0.55);

  useEffect(() => {
    // Spring for icon — matches CSS `transition: color .18s` but springier
    iconScale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: THEME.springDamping,
      stiffness: THEME.springStiffness,
    });

    // Fade for indicator pill
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: THEME.fadeDuration,
    });

    // Fade icon to full opacity when active
    iconOpacity.value = withTiming(isFocused ? 1 : 0.55, {
      duration: THEME.fadeDuration,
    });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  return (
    <PlatformPressable
      href={href}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.tabItem}
    >
      <View style={styles.tabContent}>
        {/* Icon — animated scale + opacity */}
        <Animated.View style={[styles.iconWrap, animatedIconStyle]}>
          {icon}
        </Animated.View>

        {/* Coral indicator pill — fades in when active, invisible otherwise */}
        <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      </View>
    </PlatformPressable>
  );
});
