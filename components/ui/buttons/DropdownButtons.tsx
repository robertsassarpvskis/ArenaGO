import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface CategoryOption {
  id: string;
  label: string;
  icon?: {
    id: string;
    url: string;
    contentType: string;
  };
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

// Helper: convert RGBA object → CSS rgba string
export const rgbaToString = (color?: {
  r: number;
  g: number;
  b: number;
  a: number;
}): string => {
  if (!color) return "#6366F1";
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

interface CategoryDropdownProps {
  options: CategoryOption[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select category",
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const selectedCategory = useMemo(
    () => options.find((cat) => cat.id === value),
    [value, options],
  );

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((cat) =>
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, options]);

  const handleOpenModal = () => {
    if (disabled) return;
    setShowModal(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      setSearchQuery("");
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    onChange(categoryId);
    handleCloseModal();
  };

  const CategoryItem = ({ item }: { item: CategoryOption }) => {
    const colorStr = rgbaToString(item.color);
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          value === item.id && styles.categoryItemSelected,
        ]}
        onPress={() => handleSelectCategory(item.id)}
        activeOpacity={0.6}
      >
        <View style={styles.categoryItemContent}>
          {item.icon?.url ? (
            <View
              style={[
                styles.categoryIconContainer,
                { backgroundColor: `${colorStr}20` },
              ]}
            >
              <Image
                source={{ uri: item.icon.url }}
                style={[styles.categoryIcon, { tintColor: colorStr }]}
                resizeMode="contain"
              />
            </View>
          ) : null}
          <View style={styles.categoryTextContainer}>
            <Text style={styles.categoryLabel}>{item.label}</Text>
          </View>
        </View>
        {value === item.id && (
          <View style={[styles.checkmark, { backgroundColor: colorStr }]}>
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedColorStr = rgbaToString(selectedCategory?.color);

  return (
    <>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          value && styles.dropdownButtonActive,
          disabled && styles.dropdownButtonDisabled,
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownContent}>
          {selectedCategory ? (
            <>
              {selectedCategory.icon?.url && (
                <View
                  style={[
                    styles.dropdownIconContainer,
                    { backgroundColor: `${selectedColorStr}15` },
                  ]}
                >
                  <Image
                    source={{ uri: selectedCategory.icon.url }}
                    style={[
                      styles.dropdownIcon,
                      { tintColor: selectedColorStr },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              )}
              <View>
                <Text style={styles.dropdownLabel}>Category</Text>
                <Text style={styles.dropdownText}>
                  {selectedCategory.label}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.dropdownIconContainer}>
                <Ionicons name="apps" size={24} color="#999" />
              </View>
              <View>
                <Text style={styles.dropdownLabel}>Category</Text>
                <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
              </View>
            </>
          )}
        </View>
        <Ionicons
          name="chevron-down"
          size={24}
          color={value ? "#6366F1" : "#999"}
          style={{ opacity: disabled ? 0.6 : 1 }}
        />
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose Category</Text>
                <Text style={styles.modalSubtitle}>
                  Pick one that suits you best
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor="#BBB"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-sharp" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Categories List */}
            {filteredCategories.length > 0 ? (
              <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CategoryItem item={item} />}
                scrollEnabled={true}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="search" size={64} color="#E0E0E0" />
                </View>
                <Text style={styles.emptyStateText}>No categories found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try a different search term
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: "#FAFBFC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonActive: {
    borderColor: "#6366F1",
    backgroundColor: "#F5F3FF",
  },
  dropdownButtonDisabled: {
    opacity: 0.5,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  dropdownIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  dropdownIcon: {
    width: 26,
    height: 26,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  dropdownPlaceholder: {
    fontSize: 17,
    fontWeight: "600",
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    maxHeight: "85%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 28,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
    marginTop: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 16,
    backgroundColor: "#F8F8F8",
    gap: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  categoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  categoryItemSelected: {
    backgroundColor: "#F5F3FF",
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    width: 32,
    height: 32,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  checkmark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: "#999",
    fontWeight: "600",
  },
});
