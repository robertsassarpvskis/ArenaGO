import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useLinkBuilder } from '@react-navigation/native';
import { memo, useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Theme constants — optimized for better UX
const THEME = {
  primary: '#FF6B58',
  secondary: '#9CA3AF',
  background: '#FFFFFF',
  borderColor: '#E8E8E8', // Softer, more neutral border
  iconSize: 26, // Consistent, larger size for better touch targets
  iconContainerSize: 36, // Larger container for better tap area (min 44x44)
  indicatorHeight: 3,
  indicatorWidth: 20, // Smaller, subtler indicator
  borderRadius: 28,
  animationDuration: 200,
  labelFontSize: Platform.OS === 'ios' ? 11 : 10,
  tabPaddingTop: 14,
  tabPaddingBottom: Platform.OS === 'ios' ? 2 : 16,
  iconOffset: 0,
  borderWidth: 1,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
    borderTopWidth: THEME.borderWidth,
    borderTopColor: THEME.borderColor,
    borderTopLeftRadius: THEME.borderRadius,
    borderTopRightRadius: THEME.borderRadius,
    paddingTop: THEME.tabPaddingTop,
    paddingHorizontal: 10,
    // Enhanced shadow for better separation
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: THEME.iconContainerSize,
    height: THEME.iconContainerSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.iconContainerSize / 2,
  },
  indicator: {
    height: THEME.indicatorHeight,
    width: THEME.indicatorWidth,
    backgroundColor: THEME.primary,
    borderRadius: THEME.indicatorHeight / 2,
    marginTop: 2,
  },
  badgeText: {
    color: THEME.background,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(THEME.tabPaddingBottom, insets.bottom),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const isDisabled = options.tabBarAllowFontScaling === false;

          const onPress = () => {
            if (isDisabled) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            if (!isDisabled) {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            }
          };

          const IconComponent =
            options.tabBarIcon &&
            options.tabBarIcon({
              color: isFocused ? THEME.primary : THEME.secondary,
              size: THEME.iconSize,
              focused: isFocused,
            });

          const badge = options.tabBarBadge;

          return (
            <TabBarItem
              key={route.key}
              isFocused={isFocused}
              isDisabled={isDisabled}
              IconComponent={IconComponent}
              label={String(label)}
              badge={badge}
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

interface TabBarItemProps {
  isFocused: boolean;
  isDisabled: boolean;
  IconComponent?: React.ReactNode;
  label: string;
  badge?: string | number | boolean;
  onPress: () => void;
  onLongPress: () => void;
  href?: string;
}

const TabBarItem = memo(function TabBarItem({
  isFocused,
  isDisabled,
  IconComponent,
  label,
  badge,
  onPress,
  onLongPress,
  href,
}: TabBarItemProps) {
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);
  const iconScale = useSharedValue(isFocused ? 1.08 : 1);
  const badgeScale = useSharedValue(0);

  // Simple fade for indicator
  useEffect(() => {
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: THEME.animationDuration,
    });
  }, [isFocused]);

  // Subtle icon scale for tactile feedback
  useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.08 : 1, {
      damping: 14,
      stiffness: 180,
    });
  }, [isFocused]);

  // Badge animation
  useEffect(() => {
    badgeScale.value = withSpring(badge ? 1 : 0);
  }, [badge]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <PlatformPressable
      href={href}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityState={{
        selected: isFocused,
        disabled: isDisabled,
      }}
      accessibilityLabel={label}
      style={styles.tabItem}
    >
      <View style={styles.tabContent}>
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          {IconComponent}
        </Animated.View>
        <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      </View>
    </PlatformPressable>
  );
});