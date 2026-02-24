// components/ui/buttons/ShareButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface ShareButtonProps {
  onPress: () => void;
  size?: number; // optional button size
}

const ShareButton: React.FC<ShareButtonProps> = ({ onPress, size = 50 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.ctaButton, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={handlePress}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706'] as [string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Ionicons name="share-outline" size={24} color="#FAFAFA" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ctaButton: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default ShareButton;
