// components/ui/datetime/DateOptionChip.tsx

import { URBAN_COLORS } from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
        outlined && !selected && styles.chipOutlined,
        isNow && !selected && styles.chipNow,
        disabled && styles.chipDisabled,
      ]}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={
            selected
              ? "#fff"
              : isNow
                ? URBAN_COLORS.primary
                : URBAN_COLORS.textSecondary
          }
          style={{ marginRight: 6 }}
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
      {selected && <View style={styles.selectedDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: URBAN_COLORS.cardBg,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: URBAN_COLORS.primary,
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chipOutlined: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#9CA3AF",
    borderStyle: "dashed",
  },
  chipNow: {
    backgroundColor: "#FFF1F0",
    borderWidth: 2,
    borderColor: URBAN_COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "700",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  chipTextSelected: {
    color: "#fff",
  },
  chipTextNow: {
    color: URBAN_COLORS.primary,
  },
  chipTextDisabled: {
    color: URBAN_COLORS.textSecondary,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginLeft: 6,
  },
});
