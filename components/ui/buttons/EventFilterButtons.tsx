import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  orange: '#FF6B58',
  red: '#EF4444',
  background: '#fffcf4',
};

interface FilterButton {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface EventFilterButtonsProps {
  filters?: FilterButton[];
  onFilterChange?: (filterId: string) => void;
  activeFilter?: string;
}

export default function EventFilterButtons({
  filters = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'soon', label: 'Starting Soon', icon: 'time' },
    { id: 'tonight', label: 'Tonight', icon: 'moon' },
    { id: 'saved', label: 'Saved', icon: 'heart' },
  ],
  onFilterChange,
  activeFilter = 'all',
}: EventFilterButtonsProps) {
  const [selected, setSelected] = useState(activeFilter);

  const handlePress = (filterId: string) => {
    setSelected(filterId);
    onFilterChange?.(filterId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter, index) => {
          const isActive = selected === filter.id;
          
          return (
            <Pressable
              key={filter.id}
              onPress={() => handlePress(filter.id)}
              style={[styles.filterButton, index === 0 && styles.firstButton]}
            >
              {isActive ? (
                <LinearGradient
                  colors={[COLORS.orange, COLORS.red]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeGradient}
                >
                  {filter.icon && (
                    <Ionicons name={filter.icon} size={16} color="#fff" />
                  )}
                  <Text style={styles.activeText}>{filter.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveButton}>
                  {filter.icon && (
                    <Ionicons name={filter.icon} size={16} color="#6B7280" />
                  )}
                  <Text style={styles.inactiveText}>{filter.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  filterButton: {
    marginRight: 8,
  },
  firstButton: {
    marginLeft: 0,
  },
  activeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inactiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inactiveText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});