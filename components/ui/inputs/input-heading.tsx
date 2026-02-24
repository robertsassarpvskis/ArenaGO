import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface InputHeadingProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  onErrorClear?: () => void;
}

export default function InputHeading({ value, onChangeText, placeholder = "Event name", maxLength = 64, error, onErrorClear, }: InputHeadingProps) {
  const handleChange = (text: string) => {
    onChangeText(text);
    if (error && onErrorClear) {
      onErrorClear();
    }
  };

  return (
    <View style={styles.fieldGroup}>
      <TextInput
        style={[styles.largeInput, error && styles.inputError]}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChange}
        placeholderTextColor="#D0D0D0"
        maxLength={maxLength}
      />
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#FF6B58" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 16,
  },
  largeInput: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B58',
  },
  inputError: {
    borderBottomColor: '#FF6B9D',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F9',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B9D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  errorText: {
    color: '#FF6B9D',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});