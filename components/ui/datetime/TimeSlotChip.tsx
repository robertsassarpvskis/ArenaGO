// components/ui/datetime/TimeSlotChip.tsx

import { URBAN_COLORS } from "@/utils/dateTimeHelpers";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.chipContent}>
        <Text
          style={[
            styles.chipText,
            selected && styles.chipTextSelected,
            disabled && styles.chipTextDisabled,
          ]}
        >
          {label}
        </Text>
        {crossesMidnight && (
          <View style={styles.midnightBadge}>
            <Text style={styles.midnightText}>+1</Text>
          </View>
        )}
      </View>
      {selected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: URBAN_COLORS.cardBg,
    marginRight: 12,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
  },
  chipSelected: {
    backgroundColor: URBAN_COLORS.primary,
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  chipDisabled: {
    opacity: 0.3,
    backgroundColor: "#F9FAFB",
  },
  chipContent: {
    alignItems: "center",
  },
  chipText: {
    fontSize: 16,
    fontWeight: "700",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  chipTextSelected: {
    color: "#fff",
  },
  chipTextDisabled: {
    color: URBAN_COLORS.textSecondary,
  },
  midnightBadge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: URBAN_COLORS.accentGreen,
    borderRadius: 8,
  },
  midnightText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  selectedIndicator: {
    position: "absolute",
    bottom: -2,
    width: "80%",
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
});
