import React from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CompatibilityCircleProps {
  value: number;       // Rezultāts 0-100
  size?: number;       // Aplis px
  strokeWidth?: number;
  textStyle?: TextStyle;
}

const CompatibilityCircle: React.FC<CompatibilityCircleProps> = ({
  value,
  size = 100,
  strokeWidth = 10,
  textStyle,
}) => {
  const safeValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * safeValue) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Gaišā fona aplis */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#b9b5ff"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress aplis */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6C63FF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Centrā cipars */}
      <View style={styles.textContainer}>
        <Text style={[styles.text, textStyle]}>{safeValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
});

export default CompatibilityCircle;
