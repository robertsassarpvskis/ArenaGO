// components/ui/selectors/CategorySelector.tsx

import { URBAN_COLORS } from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CategoryOption } from "/buttons/DropdownButtons";

interface CategorySelectorProps {
  categories: CategoryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Optional hint text below the header */
  hint?: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: "1", label: "Sports", icon: "basketball", color: "#FF6B58" },
  { id: "2", label: "Music", icon: "musical-notes", color: "#FF8A73" },
  { id: "3", label: "Networking", icon: "people", color: "#10B981" },
  { id: "4", label: "Workshop", icon: "school", color: "#6B7280" },
  { id: "5", label: "Social", icon: "chatbubbles", color: "#EF4444" },
];

export function CategorySelector({
  categories,
  selectedId,
  onSelect,
  hint = "Tap a category that fits your event",
}: CategorySelectorProps) {
  const displayCategories =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <View>
      {/* Field Header */}
      <View style={styles.fieldHeader}>
        <View style={styles.iconWrapper}>
          <Ionicons name="grid-outline" size={20} color="#fff" />
        </View>
        <Text
          style={[
            styles.fieldTitle,
            selectedId ? styles.fieldTitleActive : null,
          ]}
        >
          Choose interest category
        </Text>
      </View>

      {/* Hint */}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {/* Category Grid */}
      <View style={styles.grid}>
        {displayCategories.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: isSelected ? cat.color : "#F3F4F6" },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={isSelected ? "#fff" : "#9CA3AF"}
                />
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  fieldTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: -0.3,
  },
  fieldTitleActive: {
    color: URBAN_COLORS.textPrimary,
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    backgroundColor: "#FFF",
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  labelSelected: {
    color: URBAN_COLORS.textPrimary,
  },
});
