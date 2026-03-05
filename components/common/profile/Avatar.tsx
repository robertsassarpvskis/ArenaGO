// components/Avatar.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";

interface AvatarProps {
  /** Full URL from profilePhoto.url */
  uri?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Size in px — drives width, height, borderRadius, fontSize */
  size?: number;
  style?: ViewStyle;
}

/**
 * Reusable Avatar component.
 *
 * Priority:
 *   1. Remote image (profilePhoto.url)
 *   2. Initials gradient fallback
 */
export default function Avatar({
  uri,
  firstName,
  lastName,
  size = 80,
  style,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const radius = size * 0.26; // rounded square — matches app card style
  const fontSize = size * 0.36;

  const showImage = !!uri && !imgError;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={["#FF6B58", "#FF8A73", "#FFB088"]}
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize, letterSpacing: fontSize * 0.08 },
            ]}
          >
            {initials}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    // shadow
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  initials: {
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
