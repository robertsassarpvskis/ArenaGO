import React from 'react';
import { Pressable, Text } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  className?: string;       // optional for Tailwind classes
  textColor?: string;       // optional for custom text color
}

export default function PrimaryButton({
  title,
  onPress,
  className = '',
  textColor = '#fff',
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`bg-[#6C63FF] rounded-2xl px-6 py-3 items-center justify-center ${className}`}
    >
      <Text style={{ color: textColor }} className="font-semibold text-lg">
        {title}
      </Text>
    </Pressable>
  );
}
