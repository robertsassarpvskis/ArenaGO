// components/ui/datetime/DurationPicker.tsx

import { DURATION_OPTIONS, URBAN_COLORS } from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DurationPickerProps {
  visible: boolean;
  currentDuration: number;
  onSelect: (duration: number) => void;
  onClose: () => void;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  visible,
  currentDuration,
  onSelect,
  onClose,
}) => {
  const handleSelect = (duration: number) => {
    onSelect(duration);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="timer" size={24} color="#fff" />
                </View>
                <Text style={styles.title}>Event Duration</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons
                  name="close"
                  size={28}
                  color={URBAN_COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {DURATION_OPTIONS.map((option) => {
                const isSelected = currentDuration === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.optionRadioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.optionRadioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: URBAN_COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    borderTopWidth: 3,
    borderTopColor: URBAN_COLORS.darkGray,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    marginBottom: 10,
    backgroundColor: URBAN_COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionSelected: {
    backgroundColor: URBAN_COLORS.darkGray,
    borderColor: URBAN_COLORS.darkGray,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioSelected: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  optionRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  optionText: {
    fontSize: 17,
    fontWeight: "600",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: "#fff",
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: URBAN_COLORS.accentGreen,
    justifyContent: "center",
    alignItems: "center",
  },
});
