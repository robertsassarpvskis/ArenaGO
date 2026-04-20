import React, { useRef } from "react";
import { Animated, StyleSheet } from "react-native";

/**
 * Modern scroll header that animates with scroll position
 * Shows a clean fade/blur effect as user scrolls
 *
 * Usage:
 *   const scrollY = useRef(new Animated.Value(0)).current;
 *   <ModernScrollHeader scrollY={scrollY} title="Events" />
 */
export function ModernScrollHeader({
  scrollY,
  title,
  backgroundColor = "#FAFAFA",
}: {
  scrollY: Animated.Value;
  title: string;
  backgroundColor?: string;
}) {
  const shadowOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 0.1],
    extrapolate: "clamp",
  });

  const translateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          backgroundColor,
          shadowOpacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.headerTitle,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0.8],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        {title}
      </Animated.Text>
    </Animated.View>
  );
}

/**
 * Modern scroll indicator - shows when user is scrolling
 * Premium feel with smooth animations
 */
export function ModernScrollIndicator({
  scrollY,
  contentHeight,
  viewportHeight,
}: {
  scrollY: Animated.Value;
  contentHeight: number;
  viewportHeight: number;
}) {
  if (contentHeight <= viewportHeight) return null;

  const indicatorHeight = Math.max(
    20,
    (viewportHeight / contentHeight) * viewportHeight,
  );
  const scrollableHeight = viewportHeight - indicatorHeight;
  const maxScroll = contentHeight - viewportHeight;

  const translateY = scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, scrollableHeight],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, 10],
    outputRange: [0, 0.7],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.scrollIndicator,
        {
          height: indicatorHeight,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

/**
 * Smooth scroll to position helper
 * Used with FlatList/SectionList ref
 */
export function useScrollAnimation() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const scrollToTop = (ref: any, animated = true) => {
    ref?.current?.scrollToLocation({
      itemIndex: 0,
      viewPosition: 0,
      animated,
    });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  };

  return {
    scrollY,
    handleScroll,
    scrollToTop,
  };
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  scrollIndicator: {
    position: "absolute",
    right: 2,
    top: 0,
    width: 3,
    backgroundColor: "#FF6B58",
    borderRadius: 1.5,
    opacity: 0.7,
  },
});
