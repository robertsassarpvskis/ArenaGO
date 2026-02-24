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

const { height, width } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.45);
const STICKER_CARD_HEIGHT = Math.round(height * 0.44);
const BORDER_RADIUS = 20;
const ANIMATION_DURATION = 200;
const SPRING_FRICTION = 5;
const BUTTON_SIZE = 21;
const CARD_BORDER_WIDTH = 2;

// ArenaGO Brand Colors
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
};

interface CreatedEventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  time?: number;
  attendees?: number;
  location?: string;
  onPress?: (id: string) => void;
  onLike?: () => void;
  onSkip?: () => void;
  isSaved?: boolean;
  cardHeight?: number;
}

export default function CreatedEventCard({
  id,
  image,
  title,
  category: propCategory,
  time,
  attendees = 0,
  location = "My Event",
  onPress,
  onLike,
  onSkip,
  isSaved = false,
}: CreatedEventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);
  const imageUri = typeof image === "string" ? image : image?.url;
  const hasImage = !!imageUri && !imageError;

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

  const getFormattedDateTime = useCallback((timestamp?: number) => {
    if (!timestamp) return { label: "UPCOMING", date: "", time: "" };
    const now = new Date();
    const eventDate = new Date(timestamp * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
    );
    const diffDays =
      (eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    let label = "";
    if (diffDays === 0)
      label = eventDate.getHours() >= 17 ? "TONIGHT" : "TODAY";
    else if (diffDays === 1) label = "TOMORROW";
    else if (diffDays > 1 && diffDays < 7) {
      const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      label = weekdays[eventDay.getDay()];
    } else {
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      label = `${eventDay.getDate()} ${monthNames[eventDay.getMonth()]}`;
    }

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dateStr = `${eventDay.getDate()} ${monthNames[eventDay.getMonth()]} ${eventDay.getFullYear()}`;
    const hours = eventDate.getHours().toString().padStart(2, "0");
    const minutes = eventDate.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    return { label, date: dateStr, time: timeStr };
  }, []);

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

  const handleSkip = useCallback(
    (e: any) => {
      e.stopPropagation();
      onSkip?.();
    },
    [onSkip],
  );

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.35],
  });

  const {
    label: timeLabel,
    date: dateStr,
    time: timeStr,
  } = getFormattedDateTime(time);

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        transform: [{ scale: scaleAnim }],
        shadowOpacity,
        shadowColor: accentColor,
      },
    ],
    [scaleAnim, shadowOpacity, accentColor],
  );

  const showStickerMode = !imageUri || imageError;

  return (
    <Animated.View style={[containerStyle, { height: resolvedCardHeight }]}>
      {/* Thick colored border wrapper */}
      <View style={[styles.borderWrapper, { borderColor: accentColor }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={`Event: ${title}`}
          accessibilityRole="button"
        >
          <View style={styles.card}>
            {showStickerMode ? (
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

                  {/* Top bar */}
                  <View style={styles.stickerTopBar}>
                    <View
                      style={[
                        styles.myEventSticker,
                        { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Text style={styles.categoryText}>MY EVENT</Text>
                    </View>
                    <Pressable
                      onPress={handleLike}
                      accessibilityLabel={isSaved ? "Saved" : "Like"}
                    >
                      <Ionicons
                        name={isSaved ? "save" : "save-outline"}
                        size={BUTTON_SIZE}
                        color={
                          isSaved ? COLORS.accentRed : COLORS.textSecondary
                        }
                      />
                    </Pressable>
                  </View>

                  {/* Main content */}
                  <View style={styles.stickerContent}>
                    <Text
                      style={[
                        styles.stickerTitle,
                        { color: COLORS.textPrimary },
                      ]}
                      numberOfLines={3}
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

                    {/* Date & Time block */}
                    <View
                      style={[
                        styles.dateTimeBlock,
                        {
                          borderColor: `${accentColor}30`,
                          backgroundColor: `${accentColor}10`,
                        },
                      ]}
                    >
                      <View style={styles.dateTimeRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={accentColor}
                        />
                        <Text
                          style={[
                            styles.dateTimeText,
                            { color: COLORS.textPrimary },
                          ]}
                        >
                          {time ? dateStr : "Date TBD"}
                        </Text>
                        <View
                          style={[
                            styles.timeLabelBadge,
                            { backgroundColor: accentColor },
                          ]}
                        >
                          <Text style={styles.timeLabelText}>{timeLabel}</Text>
                        </View>
                      </View>
                      {time ? (
                        <View style={styles.dateTimeRow}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={accentColor}
                          />
                          <Text
                            style={[
                              styles.dateTimeText,
                              { color: COLORS.textPrimary },
                            ]}
                          >
                            {timeStr}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Bottom info bar */}
                  <View style={styles.stickerBottomBar}>
                    <View style={styles.stickerInfoColumn}>
                      <View style={styles.stickerInfoItem}>
                        <Ionicons
                          name="location"
                          size={15}
                          color={accentColor}
                        />
                        <Text style={styles.stickerInfoText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                      <View style={styles.stickerInfoItem}>
                        <Ionicons name="people" size={15} color={accentColor} />
                        <Text style={styles.stickerInfoText}>
                          {attendees} Going
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[
                        styles.urbanCTA,
                        { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Text style={styles.urbanCTAText}>VIEW</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={handleImageError}
                />

                <LinearGradient
                  colors={
                    styleVariation === 0
                      ? ["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.88)"]
                      : styleVariation === 1
                        ? [
                            "rgba(0,0,0,0.1)",
                            "rgba(0,0,0,0.4)",
                            "rgba(0,0,0,0.92)",
                          ]
                        : styleVariation === 2
                          ? [
                              "transparent",
                              "rgba(0,0,0,0.2)",
                              "rgba(0,0,0,0.85)",
                            ]
                          : [
                              "transparent",
                              "rgba(0,0,0,0.35)",
                              "rgba(0,0,0,0.9)",
                            ]
                  }
                  locations={[0, 0.4, 1]}
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

                {/* Top bar */}
                <View style={styles.imageTopBar}>
                  <View
                    style={[
                      styles.myEventSticker,
                      { backgroundColor: COLORS.primary },
                    ]}
                  >
                    <Text style={styles.categoryText}>MY EVENT</Text>
                  </View>
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
                  >
                    {title}
                  </Text>

                  {/* Date & time row */}
                  <View style={styles.imageDateTimeRow}>
                    <View
                      style={[
                        styles.imageDateTimeBadge,
                        { backgroundColor: accentColor },
                      ]}
                    >
                      <Text style={styles.timeLabelText}>{timeLabel}</Text>
                    </View>
                    {time ? (
                      <>
                        <View style={styles.imageDateItem}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color="rgba(255,255,255,0.9)"
                          />
                          <Text style={styles.imageDateText}>{dateStr}</Text>
                        </View>
                        <View style={styles.imageDateItem}>
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color="rgba(255,255,255,0.9)"
                          />
                          <Text style={styles.imageDateText}>{timeStr}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.imageDateText}>Date TBD</Text>
                    )}
                  </View>

                  {/* Location + going + CTA */}
                  <View style={styles.imageInfoBar}>
                    <View style={styles.imageInfoColumn}>
                      <View style={styles.imageInfoItem}>
                        <Ionicons
                          name="location"
                          size={13}
                          color="rgba(255,255,255,0.9)"
                        />
                        <Text style={styles.imageInfoText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                      <View style={styles.imageInfoItem}>
                        <Ionicons
                          name="people"
                          size={13}
                          color="rgba(255,255,255,0.9)"
                        />
                        <Text style={styles.imageInfoText}>
                          {attendees} going
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[
                        styles.imageJoinButton,
                        styleVariation === 1 && styles.imageJoinButtonCompact,
                      ]}
                      onPress={() => {
                        // Handle view event press
                        console.log("View event pressed");
                        handlePress();
                      }}
                    >
                      <Text style={styles.imageJoinText}>VIEW</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    elevation: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    marginBottom: 14,
    borderRadius: BORDER_RADIUS + CARD_BORDER_WIDTH,
  },

  // ── thick colored border ──────────────────────────────────────────
  borderWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS + CARD_BORDER_WIDTH,
    borderWidth: CARD_BORDER_WIDTH,
    overflow: "hidden",
  },

  card: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: BORDER_RADIUS,
    backgroundColor: COLORS.cardBg,
  },

  // ── STICKER MODE ──────────────────────────────────────────────────
  stickerWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  stickerBackground: {
    flex: 1,
    padding: 16,
    position: "relative",
  },
  noiseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  myEventSticker: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  stickerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  stickerTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 26,
    marginBottom: 12,
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

  // date/time block (sticker mode)
  dateTimeBlock: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    alignSelf: "stretch",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  timeLabelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },

  stickerBottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    gap: 12,
    marginTop: 10,
  },
  stickerInfoColumn: {
    flex: 1,
    gap: 6,
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

  // ── IMAGE MODE ────────────────────────────────────────────────────
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
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
  imageTopBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  imageActionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  imageActionButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 5,
    gap: 8,
  },
  imageTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: -0.5,
    lineHeight: 24,
    textTransform: "uppercase",
  },
  imageTitleCondensed: {
    letterSpacing: -1.2,
    fontSize: 26,
  },
  imageTitleExpanded: {
    letterSpacing: 0.5,
    fontSize: 30,
  },

  // date/time row (image mode)
  imageDateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  imageDateTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageDateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  imageDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },

  imageInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  imageInfoColumn: {
    flex: 1,
    gap: 5,
  },
  imageInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  imageInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 0.2,
    flex: 1,
  },
  imageJoinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  imageJoinButtonCompact: {
    paddingHorizontal: 12,
  },
  imageJoinText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },

  // ── URBAN CTA ─────────────────────────────────────────────────────
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
