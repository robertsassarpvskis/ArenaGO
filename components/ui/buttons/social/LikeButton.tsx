import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

const FavoriteButton = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFavorite = () => {
    setIsFavorite(prev => !prev);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.ctaButton, styles.smallButton]}
        onPress={handleFavorite}
      >
        <LinearGradient
          colors={
            isFavorite
              ? ['#EF4444', '#DC2626'] // filled red gradient
              : ['#FFFFFF', '#F3F4F6'] // clean white/gray gradient
          }
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 25,
              borderWidth: isFavorite ? 0 : 2,
              borderColor: '#EF4444',
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? '#FFF' : '#EF4444'}
          style={isFavorite && styles.heartGlow}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 30,
    overflow: 'hidden',
  },
  smallButton: {
    flex: 1,
  },
  heartGlow: {
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default FavoriteButton;
