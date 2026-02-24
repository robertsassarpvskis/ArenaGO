// components/common/event/CategoryBadge.tsx
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";

type BadgeState = "default" | "selected" | "disabled";

interface CategoryBadgeProps {
  label: string;
  color?: string; // optional base color
  iconUrl?: string;
  rounded?: boolean;
  state?: BadgeState; // new prop
}

export default function CategoryBadge({
  label,
  color = "#6B7280", // fallback color
  iconUrl,
  rounded = false,
  state = "default",
}: CategoryBadgeProps) {
  const [iconError, setIconError] = useState(false);

  // Determine background and text color based on state
  let bgColor = color;
  let textColor = "#FFFFFF";

  if (state === "selected") {
    bgColor = "#059669"; // example: green for selected
    textColor = "#FFFFFF";
  } else if (state === "disabled") {
    bgColor = "#E5E7EB"; // gray for disabled
    textColor = "#9CA3AF";
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        rounded && styles.badgeRounded,
        state === "disabled" && styles.disabledShadow,
      ]}
    >
      {iconUrl && !iconError && state !== "disabled" && (
        <View style={styles.iconWrap}>
          <SvgUri
            uri={iconUrl}
            width={14}
            height={14}
            color={textColor}
            onError={() => setIconError(true)}
          />
        </View>
      )}
      <Text style={[styles.label, { color: textColor }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeRounded: { borderRadius: 6 },
  disabledShadow: { shadowOpacity: 0 }, // remove shadow for disabled
  iconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
