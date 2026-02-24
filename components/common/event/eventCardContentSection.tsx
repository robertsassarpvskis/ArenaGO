import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  background: '#FFFFFF',
  textPrimary: '#000000',
  accentGreen: '#34C759',
  accentOrange: '#FF9500',
  accentPink: '#FF2D55',
  accentBlue: '#007AFF',
  accentPurple: '#AF52DE',
  goldBrand: '#C89B3C',
};

interface EventCardContentProps {
  id: string;
  title: string;
  subtitle?: string;
  time?: string;
  interests?: string[];
  buttonText?: string;
  category?: string;
  onPress?: (id: string) => void;
}

export default function EventCardContentSection({
  id,
  title,
  subtitle,
  time,
  interests = [],
  buttonText = 'Join Now',
  category,
  onPress,
}: EventCardContentProps) {
  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      Sports: COLORS.accentGreen,
      Music: COLORS.accentPink,
      Technology: COLORS.accentBlue,
      Food: COLORS.accentOrange,
      Art: COLORS.accentPurple,
      Pet: COLORS.goldBrand,
      Business: COLORS.accentBlue,
    };
    return map[cat] || COLORS.goldBrand;
  };

  const categoryColor = getCategoryColor(category || '');
const gradientColors: [string, string] = [categoryColor, `${categoryColor}99`];

  return (
    <LinearGradient colors={gradientColors} style={styles.contentSection}>
      <Text style={[styles.mainTitle, styles.textShadow]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, styles.textShadow]}>{subtitle}</Text>}

      {time && (
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>🕓 {time}</Text>
        </View>
      )}

      {interests.length > 0 && (
        <View style={styles.interestsRow}>
          {interests.map((interest, idx) => (
            <View key={idx} style={styles.interestTag}>
              <Text style={[styles.interestText, { color: categoryColor }]}>{interest}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.button, { shadowColor: categoryColor }]} onPress={() => onPress?.(id)}>
        <Text style={[styles.buttonText, { color: categoryColor }]}>{buttonText}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contentSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  interestTag: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  textShadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
