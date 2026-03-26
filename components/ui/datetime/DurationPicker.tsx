// components/ui/datetime/DurationPicker.tsx

import { DURATION_OPTIONS } from "@/utils/dateTimeHelpers";
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

const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  borderMid: "#D8D8D8",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  ink: "#1A1A1A",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.08)",
  success: "#1A9E6A",
  overlay: "rgba(17,17,17,0.5)",
} as const;

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
        <View style={styles.sheet}>
          <TouchableOpacity activeOpacity={1}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                {/* Urban stencil label */}
                <Text style={styles.headerEyebrow}>DURATION</Text>
                <Text style={styles.headerTitle}>How long is it?</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 28 }}
            >
              {DURATION_OPTIONS.map((option, idx) => {
                const isSelected = currentDuration === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      idx < DURATION_OPTIONS.length - 1 && styles.optionBorder,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={16} color={C.success} />
                    ) : (
                      <View style={styles.optionRadio} />
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
    backgroundColor: C.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "65%",
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  dragHandle: {
    width: 36,
    height: 3,
    backgroundColor: C.borderMid,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: C.textMuted,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  optionSelected: {
    // no background fill — just text + check color change
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: C.textSub,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: C.text,
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
});
