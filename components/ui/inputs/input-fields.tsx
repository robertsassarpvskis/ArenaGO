import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';

interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  inputBgColor?: string;
}

export default function InputField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  inputBgColor = 'transparent',
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = new Animated.Value(value ? 1 : 0);
  const animatedBorder = new Animated.Value(isFocused ? 1 : 0);

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(animatedBorder, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -6], // Adjusted values for better positioning
    }),
    fontSize: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabel.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9CA3AF', '#6C63FF'],
    }),
    backgroundColor: inputBgColor,
    paddingHorizontal: 4,
    zIndex: 1, // Ensure label is above the input
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['#D1D5DB', '#6C63FF'],
  });

  return (
    <View style={{ width: 320, marginVertical: 8, position: 'relative' }}>
      <Animated.Text style={labelStyle}>{placeholder}</Animated.Text>
      <Animated.View
        style={{
          borderWidth: 1,
          borderRadius: 5,
          borderColor,
          backgroundColor: inputBgColor,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          placeholder={isFocused || value ? '' : placeholder} // Hide placeholder when label is visible
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
});