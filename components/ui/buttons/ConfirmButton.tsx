import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ConfirmButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  active?: boolean;
  style?: ViewStyle;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  label,
  icon,
  onPress,
  type = 'primary',
  active = false,
  style
}) => {
  const isPrimary = type === 'primary';
  const backgroundColor = active ? '#4CAF50' : isPrimary ? '#6c63ff' : 'transparent';
  const borderColor = isPrimary ? 'transparent' : '#6c63ff';
  const textColor = isPrimary ? '#FFF' : '#6c63ff';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          shadowColor: active ? '#4CAF50' : '#6c63ff',
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 8 }} />}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
