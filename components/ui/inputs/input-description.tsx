import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface InputDescriptionProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  onErrorClear?: () => void;
}

export default function InputDescription({
  value,
  onChangeText,
  placeholder = "Add a description (optional)",
  maxLength = 200,
  error,
  onErrorClear,
}: InputDescriptionProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    onChangeText(text);
    if (error && onErrorClear) {
      onErrorClear();
    }
  };

  return (
    <View style={styles.fieldGroup}>
      <TextInput
        style={[
          styles.descriptionInput,
          error && styles.inputError,
          isFocused && styles.inputFocused,
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline
        placeholderTextColor="#D0D0D0"
        maxLength={maxLength}
      />
      <View style={styles.footerRow}>
        <View style={styles.spacer} />
        <Text style={styles.charCount}>{value.length}/{maxLength}</Text>
      </View>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#FF6B9D" />
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
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8EAEF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 175,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#FF6B58',
  },
  inputError: {
    borderColor: '#FF6B58',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
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