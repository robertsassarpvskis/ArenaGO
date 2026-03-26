// components/ui/datetime/DateOptionChip.tsx

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

// ─── Local design tokens (aligned with create.tsx) ───────────────────────────
const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  ink: "#1A1A1A",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.09)",
  coralBorder: "rgba(255,107,88,0.28)",
} as const;

interface DateOptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  outlined?: boolean;
  disabled?: boolean;
}

export const DateOptionChip: React.FC<DateOptionChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  outlined = false,
  disabled = false,
}) => {
  const isNow = label === "NOW";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        isNow && !selected && styles.chipNow,
        outlined && !selected && styles.chipOutlined,
        disabled && styles.chipDisabled,
      ]}
      activeOpacity={0.75}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? "#fff" : isNow ? C.coral : C.textMuted}
          style={{ marginRight: 5 }}
        />
      )}
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          isNow && !selected && styles.chipTextNow,
          disabled && styles.chipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.surface,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  chipSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  chipNow: {
    backgroundColor: C.coralLight,
    borderColor: C.coralBorder,
  },
  chipOutlined: {
    backgroundColor: "transparent",
    borderColor: C.border,
    borderStyle: "dashed",
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSub,
    letterSpacing: 0.1,
  },
  chipTextSelected: {
    color: "#fff",
  },
  chipTextNow: {
    color: C.coral,
  },
  chipTextDisabled: {
    color: C.textMuted,
  },
});
