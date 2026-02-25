import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CategoryBadge from "./CategoryBadge";
import { UrbanBookmark } from "./UrbanBookmark";
const { height, width } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.45);
const STICKER_CARD_HEIGHT = Math.round(height * 0.4);
const BORDER_RADIUS = 20;
const ANIMATION_DURATION = 200;
const SPRING_FRICTION = 5;
const BUTTON_SIZE = 21;

const COLORS = {
  primary: "#FF6B58",
  secondary: "#FF8A73",
  accentGreen: "#10B981",
  accentRed: "#EF4444",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  background: "#fffcf4",
  cardBg: "#FFFFFF",
  darkGray: "#374151",
};

const CATEGORY_COLORS: Record<string, string> = {
  Sports: COLORS.accentGreen,
  Music: COLORS.primary,
  Technology: COLORS.secondary,
  Food: COLORS.primary,
  Art: COLORS.secondary,
  Pet: COLORS.accentGreen,
  Business: COLORS.darkGray,
  Travel: COLORS.secondary,
  Health: COLORS.accentGreen,
  Gaming: COLORS.primary,
  Fashion: COLORS.secondary,
  Film: COLORS.accentRed,
  Education: COLORS.darkGray,
  Fitness: COLORS.accentGreen,
  Photography: COLORS.primary,
  Comedy: COLORS.secondary,
  Dance: COLORS.primary,
  Festival: COLORS.secondary,
  Networking: COLORS.darkGray,
  Workshop: COLORS.accentGreen,
  Conference: COLORS.darkGray,
  Party: COLORS.primary,
  Meetup: COLORS.secondary,
  Charity: COLORS.accentGreen,
  Nightlife: COLORS.primary,
  Concert: COLORS.accentRed,
  Exhibition: COLORS.darkGray,
  Webinar: COLORS.darkGray,
  Outdoor: COLORS.accentGreen,
  Gym: COLORS.accentGreen,
  Pickleball: COLORS.secondary,
  Yoga: COLORS.primary,
};

interface EventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  categoryIconUrl?: string; // ← NEW: real SVG icon URL from API
  time?: number;
  attendees?: number;
  onPress?: (id: string) => void;
  onJoin?: () => void;
  onLike?: () => void;
  onSkip?: () => void;
  isSaved?: boolean;
  location?: string;
  cardHeight?: number;
}

// ── Urban Bookmark Button ─────────────────────────────────────────────────────
// Replaces the heart icon with a street-style tag/bookmark shape

// Renders a bookmark shape using a View clip trick
function BookmarkIcon({
  filled,
  color,
  size,
}: {
  filled: boolean;
  color: string;
  size: number;
}) {
  // We use Ionicons bookmark icons — they're already street-tag shaped
  return (
    <Ionicons
      name={filled ? "bookmark" : "bookmark-outline"}
      size={size}
      color={color}
    />
  );
}

const bookmarkStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "solid",
  },
  wrapLight: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(0,0,0,0.10)",
  },
  wrapDark: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  savedLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeRounded: {
    borderRadius: 6,
  },
  iconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    // Slight background ring so icon pops on saturated badge colors
    backgroundColor: "transparent",
    borderRadius: 4,
    padding: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

// ── Main EventCard ────────────────────────────────────────────────────────────

export default function EventCard({
  id,
  image,
  title,
  category: propCategory,
  categoryIconUrl,
  time,
  attendees = 0,
  onPress,
  onJoin,
  onLike,
  onSkip,
  location,
  isSaved = false,
}: EventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);
  const imageUri = typeof image === "string" ? image : image?.url;
  const hasImage = !!imageUri && !imageError;
  const timeLabel = getTimeLabel(time);
  const timeFormat = formatEventTime(time);

  const resolvedCardHeight = hasImage ? IMAGE_CARD_HEIGHT : STICKER_CARD_HEIGHT;

  const category = useMemo(() => {
    if (propCategory) return propCategory;
    const categories = Object.keys(CATEGORY_COLORS);
    if (!id) return categories[Math.floor(Math.random() * categories.length)];
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return categories[Math.abs(hash) % categories.length];
  }, [id, propCategory]);

  const accentColor = useMemo(
    () => CATEGORY_COLORS[category] || COLORS.primary,
    [category],
  );

  const styleVariation = useMemo(() => {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 4;
  }, [id]);

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION + 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, glowAnim]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: SPRING_FRICTION,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION + 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, glowAnim]);

  const handlePress = useCallback(() => onPress?.(id), [id, onPress]);
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleLike = useCallback(
    (e: any) => {
      e.stopPropagation();
      onLike?.();
    },
    [onLike],
  );

  const handleJoin = useCallback(
    (e: any) => {
      e.stopPropagation();
      onJoin?.();
    },
    [onJoin],
  );

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.25],
  });

  const containerStyle = useMemo(
    () => [
      styles.container,
      { transform: [{ scale: scaleAnim }], shadowOpacity },
    ],
    [scaleAnim, shadowOpacity],
  );

  const showStickerMode = !imageUri || imageError;

  return (
    <Animated.View style={[containerStyle, { height: resolvedCardHeight }]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Event: ${title}`}
        accessibilityRole="button"
      >
        <View style={[styles.card, { borderRadius: BORDER_RADIUS }]}>
          {showStickerMode ? (
            // ── STICKER MODE ──────────────────────────────────────────────
            <View style={styles.stickerWrapper}>
              <LinearGradient
                colors={
                  styleVariation === 0
                    ? [`${accentColor}15`, `${accentColor}08`]
                    : styleVariation === 1
                      ? [`${accentColor}08`, `${accentColor}15`]
                      : styleVariation === 2
                        ? [
                            `${accentColor}12`,
                            `${accentColor}05`,
                            `${accentColor}12`,
                          ]
                        : [`${accentColor}10`, `${accentColor}18`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stickerBackground}
              >
                <View
                  style={[
                    styles.noiseOverlay,
                    { opacity: styleVariation % 2 === 0 ? 0.5 : 0.3 },
                  ]}
                />
                {styleVariation === 1 && (
                  <View
                    style={[
                      styles.decorCircle,
                      { backgroundColor: `${accentColor}08` },
                    ]}
                  />
                )}
                {styleVariation === 3 && (
                  <View
                    style={[
                      styles.decorLine,
                      { backgroundColor: `${accentColor}12` },
                    ]}
                  />
                )}

                {/* ── Top bar ── */}
                <View style={styles.stickerTopBar}>
                  {/* Category badge with real SVG icon */}
                  <CategoryBadge
                    label={category}
                    color={accentColor}
                    iconUrl={categoryIconUrl}
                    rounded={styleVariation === 2}
                  />

                  {/* Urban bookmark */}
                  <UrbanBookmark
                    eventId={id}
                    eventName={title}
                    variant="light"
                    accentColor={accentColor}
                  />
                </View>

                <View style={styles.stickerContent}>
                  <Text
                    style={[styles.stickerTitle, { color: COLORS.textPrimary }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  {styleVariation === 0 || styleVariation === 2 ? (
                    <View
                      style={[
                        styles.accentLine,
                        { backgroundColor: accentColor },
                      ]}
                    />
                  ) : (
                    <View style={styles.accentDots}>
                      <View
                        style={[styles.dot, { backgroundColor: accentColor }]}
                      />
                      <View
                        style={[styles.dot, { backgroundColor: accentColor }]}
                      />
                      <View
                        style={[styles.dot, { backgroundColor: accentColor }]}
                      />
                    </View>
                  )}
                  <View style={styles.stickerTimeContainer}>
                    <View
                      style={[
                        styles.stickerTimeLabel,
                        { backgroundColor: accentColor },
                        styleVariation === 1 && styles.timeLabelSquare,
                      ]}
                    >
                      <Text style={styles.stickerTimeText}>{timeLabel}</Text>
                    </View>
                    <Text
                      style={[
                        styles.stickerTime,
                        { color: COLORS.textPrimary },
                      ]}
                    >
                      {timeFormat}
                    </Text>
                  </View>
                </View>

                <View style={styles.stickerBottomBar}>
                  <View style={styles.stickerInfoColumn}>
                    <View style={styles.stickerInfoItem}>
                      <Ionicons name="location" size={16} color={accentColor} />
                      <Text style={styles.stickerInfoText} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                    <View style={styles.stickerInfoItem}>
                      <Ionicons name="people" size={16} color={accentColor} />
                      <Text style={styles.stickerInfoText}>
                        {attendees} Going
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.urbanCTA, { backgroundColor: accentColor }]}
                    onPress={handleJoin}
                  >
                    <Text style={styles.urbanCTAText}>JOIN</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          ) : (
            // ── IMAGE MODE ─────────────────────────────────────────────────
            <>
              {/* IMAGE CLIP LAYER */}
              <View
                style={[styles.imageClipLayer, { borderRadius: BORDER_RADIUS }]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={handleImageError}
                />
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(0,0,0,0.55)",
                    "rgba(0,0,0,0.94)",
                  ]}
                  locations={[0, 0.3, 1]}
                  style={styles.gradientOverlay}
                />
                {styleVariation === 3 && (
                  <View
                    style={[
                      styles.colorOverlay,
                      { backgroundColor: `${accentColor}15` },
                    ]}
                  />
                )}
              </View>

              {/* CONTENT OVERLAY LAYER */}
              <View
                style={[
                  styles.imageContentLayer,
                  { borderRadius: BORDER_RADIUS },
                ]}
              >
                {/* Top bar */}
                <View style={styles.imageTopBar}>
                  {/* Category badge with real SVG icon */}
                  <CategoryBadge
                    label={category}
                    color={accentColor}
                    iconUrl={categoryIconUrl}
                    rounded={styleVariation === 2}
                  />

                  {/* Urban bookmark on dark/image background */}
                  <UrbanBookmark
                    eventId={id}
                    eventName={title}
                    variant="light"
                    accentColor={accentColor}
                  />
                </View>

                {/* Bottom content */}
                <View style={styles.imageBottomContent}>
                  <Text
                    style={[
                      styles.imageTitle,
                      styleVariation === 1 && styles.imageTitleCondensed,
                      styleVariation === 3 && styles.imageTitleExpanded,
                    ]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {title}
                  </Text>

                  <View style={styles.imageTimeRow}>
                    <View
                      style={[
                        styles.imageTimeLabel,
                        { backgroundColor: accentColor },
                        styleVariation === 1 && styles.timeLabelSquare,
                      ]}
                    >
                      <Text style={styles.imageTimeText}>{timeLabel}</Text>
                    </View>
                    <Text style={styles.imageTime}>
                      {formatEventTime(time)}
                    </Text>
                  </View>

                  <View style={styles.imageInfoBar}>
                    <View style={styles.imageInfoColumn}>
                      <View style={styles.imageInfoItem}>
                        <Ionicons name="location" size={16} color="#FFFFFF" />
                        <Text style={styles.imageInfoText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                      <View style={styles.imageInfoItem}>
                        <Ionicons name="people" size={16} color="#FFFFFF" />
                        <Text style={styles.imageInfoText}>
                          {attendees} Going
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={[
                        styles.urbanCTA,
                        { backgroundColor: accentColor },
                      ]}
                      onPress={handleJoin}
                    >
                      <Text style={styles.urbanCTAText}>JOIN</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    marginBottom: 10,
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    elevation: 4,
  },

  // ── STICKER MODE ──────────────────────────────────────────────────────────
  stickerWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  stickerBackground: {
    flex: 1,
    padding: 18,
    position: "relative",
  },
  noiseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  decorCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -50,
    right: -50,
    opacity: 0.4,
  },
  decorLine: {
    position: "absolute",
    width: 200,
    height: 4,
    bottom: 80,
    left: -20,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.3,
  },
  stickerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stickerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  stickerTitle: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 28,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  accentLine: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  accentDots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stickerTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stickerTimeLabel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeLabelSquare: {
    borderRadius: 6,
  },
  stickerTimeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  stickerTime: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  stickerBottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  stickerInfoColumn: {
    flex: 1,
    gap: 8,
  },
  stickerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stickerInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    flex: 1,
  },

  // ── IMAGE MODE ────────────────────────────────────────────────────────────
  imageClipLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  colorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageContentLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    overflow: "visible",
    zIndex: 5,
    flexDirection: "column",
  },
  imageTopBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  imageBottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: BORDER_RADIUS,
    justifyContent: "flex-end",
    overflow: "visible",
  },
  imageTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: -0.5,
    lineHeight: 24,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  imageTitleCondensed: {
    letterSpacing: -1.2,
    fontSize: 22,
  },
  imageTitleExpanded: {
    letterSpacing: 0.5,
    fontSize: 24,
  },
  imageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  imageTimeLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  imageTimeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  imageTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  imageInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  imageInfoColumn: {
    flex: 1,
    gap: 8,
  },
  imageInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.2,
    flex: 1,
  },

  // ── SHARED ────────────────────────────────────────────────────────────────
  urbanCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  urbanCTAText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
});
