// components/ui/datetime/TimeSlotChip.tsx

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const C = {
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  ink: "#1A1A1A",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.08)",
} as const;

interface TimeSlotChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  crossesMidnight?: boolean;
}

export const TimeSlotChip: React.FC<TimeSlotChipProps> = ({
  label,
  selected,
  onPress,
  disabled = false,
  crossesMidnight = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.chip,
      selected && styles.chipSelected,
      disabled && styles.chipDisabled,
    ]}
    activeOpacity={0.75}
  >
    <Text
      style={[
        styles.label,
        selected && styles.labelSelected,
        disabled && styles.labelDisabled,
      ]}
    >
      {label}
    </Text>
    {crossesMidnight && !disabled && (
      <Ionicons
        name="moon-outline"
        size={10}
        color={selected ? "rgba(255,255,255,0.7)" : C.textMuted}
        style={{ marginLeft: 4 }}
      />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.surface,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  chipSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  chipDisabled: {
    opacity: 0.3,
    backgroundColor: C.surfaceAlt,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSub,
    letterSpacing: 0.1,
  },
  labelSelected: {
    color: "#fff",
  },
  labelDisabled: {
    color: C.textMuted,
  },
});
