// components/common/event/ParticipatedEventCard.tsx

import { useAuth } from "@/hooks/context/AuthContext";
import { useLeaveEvent } from "@/hooks/events/useEventLeave"; // your new hook
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

const { height } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.45);
const STICKER_CARD_HEIGHT = Math.round(height * 0.4);
const BORDER_RADIUS = 20;
const ANIMATION_DURATION = 200;
const SPRING_FRICTION = 5;

// ── Palette ───────────────────────────────────────────────────────────────────
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
  // "Joined" accent — a vivid teal/green so it reads differently from the
  // orange primary at a glance
  joinedAccent: "#059669",
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface ParticipatedEventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  categoryIconUrl?: string;
  time?: number;
  attendees?: number;
  location?: string;
  joinedAt?: string; // ISO date — shown as "Joined X days ago"
  onPress?: (id: string) => void;
  onLeave?: (id: string) => void;
}

// ── Joined Badge ──────────────────────────────────────────────────────────────
// Prominent "YOU'RE IN" pill — replaces the bookmark button used in EventCard
function JoinedBadge({ variant = "light" }: { variant?: "light" | "dark" }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse on mount to draw attention
  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.08,
        useNativeDriver: true,
        speed: 14,
        bounciness: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
    ]).start();
  }, []);

  const isLight = variant === "light";

  return (
    <Animated.View
      style={[
        joinedBadgeStyles.wrap,
        isLight ? joinedBadgeStyles.wrapLight : joinedBadgeStyles.wrapDark,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Ionicons name="checkmark-circle" size={16} color={COLORS.joinedAccent} />
      <Text style={joinedBadgeStyles.label}>YOU'RE IN</Text>
    </Animated.View>
  );
}

const joinedBadgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  // softer glass look
  wrapLight: {
    backgroundColor: "rgba(135, 220, 192, 0.4)", // very soft green tint
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },

  wrapDark: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.45)",
  },

  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    color: "#10B981", // solid readable green
  },
});

// ── Leave Button ──────────────────────────────────────────────────────────────
interface LeaveButtonProps {
  onPress: (e: any) => void;
  variant?: "light" | "dark";
}

function LeaveButton({
  onPress,
  variant = "light",
  disabled = false,
}: LeaveButtonProps & { disabled?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
    ]).start();
    onPress(e);
  };

  const isLight = variant === "light";

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityLabel="Leave event"
      disabled={disabled}
    >
      <Animated.View
        style={[
          leaveStyles.wrap,
          isLight ? leaveStyles.wrapLight : leaveStyles.wrapDark,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name="exit-outline"
          size={15}
          color={isLight ? COLORS.accentRed : "rgba(255,255,255,0.9)"}
        />
        <Text
          style={[
            leaveStyles.label,
            { color: isLight ? COLORS.accentRed : "rgba(255,255,255,0.9)" },
          ]}
        >
          LEAVE
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const leaveStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  wrapLight: {
    backgroundColor: `${COLORS.accentRed}12`,
    borderColor: `${COLORS.accentRed}40`,
  },
  wrapDark: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeRounded: { borderRadius: 6 },
  iconWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatJoinedAt(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Joined today";
  if (days === 1) return "Joined yesterday";
  return `Joined ${days}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParticipatedEventCard({
  id,
  image,
  title,
  category: propCategory,
  categoryIconUrl,
  time,
  attendees = 0,
  location,
  joinedAt,
  onPress,
  onLeave,
}: ParticipatedEventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const {
    leaveEvent,
    loading: leaving,
    error: leaveError,
  } = useLeaveEvent(user?.accessToken ?? null);

  const imageUri = typeof image === "string" ? image : image?.url;
  const hasImage = !!imageUri && !imageError;
  const showStickerMode = !imageUri || imageError;
  const resolvedCardHeight = hasImage ? IMAGE_CARD_HEIGHT : STICKER_CARD_HEIGHT;

  const timeLabel = getTimeLabel(time);
  const timeFormat = formatEventTime(time);
  const joinedLabel = formatJoinedAt(joinedAt);

  const category = useMemo(() => {
    if (propCategory) return propCategory;
    const cats = Object.keys(CATEGORY_COLORS);
    if (!id) return cats[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return cats[Math.abs(hash) % cats.length];
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
  }, []);

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
  }, []);

  const handlePress = useCallback(() => onPress?.(id), [id, onPress]);
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleLeave = useCallback(
    async (e: any) => {
      e.stopPropagation(); // prevent parent press
      if (!id) return;

      try {
        await leaveEvent(id);
        onLeave?.(id); // notify parent after successful leave
      } catch (err) {
        // optional: show error to user
        alert("Failed to leave event. Please try again.");
      }
    },
    [id, leaveEvent, onLeave],
  );

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: resolvedCardHeight,
          transform: [{ scale: scaleAnim }],
          shadowOpacity,
          borderColor: COLORS.joinedAccent,
          borderWidth: 3,
        },
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Joined event: ${title}`}
        accessibilityRole="button"
      >
        <View style={[styles.card, { borderRadius: BORDER_RADIUS }]}>
          {showStickerMode ? (
            // ── STICKER MODE ──────────────────────────────────────────────
            <View style={styles.stickerWrapper}>
              <LinearGradient
                colors={
                  styleVariation === 0
                    ? [`${COLORS.joinedAccent}18`, `${accentColor}10`]
                    : styleVariation === 1
                      ? [`${accentColor}10`, `${COLORS.joinedAccent}18`]
                      : styleVariation === 2
                        ? [
                            `${COLORS.joinedAccent}14`,
                            `${accentColor}08`,
                            `${COLORS.joinedAccent}14`,
                          ]
                        : [`${accentColor}10`, `${COLORS.joinedAccent}20`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stickerBackground}
              >
                {/* Subtle green tint overlay to distinguish from regular cards */}
                <View style={styles.joinedTintOverlay} />

                {styleVariation === 1 && (
                  <View
                    style={[
                      styles.decorCircle,
                      { backgroundColor: `${COLORS.joinedAccent}0A` },
                    ]}
                  />
                )}
                {styleVariation === 3 && (
                  <View
                    style={[
                      styles.decorLine,
                      { backgroundColor: `${COLORS.joinedAccent}14` },
                    ]}
                  />
                )}

                {/* Top bar: category + joined badge */}
                <View style={styles.topBar}>
                  <CategoryBadge
                    label={category}
                    color={accentColor}
                    iconUrl={categoryIconUrl}
                    rounded={styleVariation === 2}
                  />
                  <JoinedBadge variant="light" />
                </View>

                {/* Center content */}
                <View style={styles.stickerContent}>
                  <Text
                    style={[styles.stickerTitle, { color: COLORS.textPrimary }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>

                  {/* Green accent instead of primary */}
                  {styleVariation === 0 || styleVariation === 2 ? (
                    <View
                      style={[
                        styles.accentLine,
                        { backgroundColor: COLORS.joinedAccent },
                      ]}
                    />
                  ) : (
                    <View style={styles.accentDots}>
                      {[0, 1, 2].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            { backgroundColor: COLORS.joinedAccent },
                          ]}
                        />
                      ))}
                    </View>
                  )}

                  <View style={styles.timeContainer}>
                    <View
                      style={[
                        styles.timeLabel,
                        { backgroundColor: accentColor },
                        styleVariation === 1 && styles.timeLabelSquare,
                      ]}
                    >
                      <Text style={styles.timeLabelText}>{timeLabel}</Text>
                    </View>
                    <Text
                      style={[styles.timeText, { color: COLORS.textPrimary }]}
                    >
                      {timeFormat}
                    </Text>
                  </View>
                </View>

                {/* Bottom bar */}
                <View style={styles.bottomBar}>
                  <View style={styles.infoColumn}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={COLORS.joinedAccent}
                      />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="people"
                        size={16}
                        color={COLORS.joinedAccent}
                      />
                      <Text style={styles.infoText}>{attendees} Going</Text>
                    </View>
                    {joinedLabel ? (
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="time-outline"
                          size={15}
                          color={COLORS.joinedAccent}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: COLORS.joinedAccent, fontWeight: "700" },
                          ]}
                        >
                          {joinedLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <LeaveButton onPress={handleLeave} variant="light" />
                </View>
              </LinearGradient>
            </View>
          ) : (
            // ── IMAGE MODE ────────────────────────────────────────────────
            <>
              {/* Image + gradient */}
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
                    "rgba(0,0,0,0.45)",
                    "rgba(0,0,0,0.92)",
                  ]}
                  locations={[0, 0.3, 1]}
                  style={styles.gradientOverlay}
                />
                {/* Green tint so image cards also read differently */}
                <View
                  style={[
                    styles.gradientOverlay,
                    { backgroundColor: "rgba(5,150,105,0.08)" },
                  ]}
                />
              </View>

              {/* Content overlay */}
              <View
                style={[
                  styles.imageContentLayer,
                  { borderRadius: BORDER_RADIUS },
                ]}
              >
                {/* Top bar */}
                <View style={styles.imageTopBar}>
                  <CategoryBadge
                    label={category}
                    color={accentColor}
                    iconUrl={categoryIconUrl}
                    rounded={styleVariation === 2}
                  />
                  <JoinedBadge variant="dark" />
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
                      <Text style={styles.imageTimeLabelText}>{timeLabel}</Text>
                    </View>
                    <Text style={styles.imageTimeText}>{timeFormat}</Text>
                  </View>

                  <View style={styles.imageInfoBar}>
                    <View style={styles.infoColumn}>
                      <View style={styles.infoItem}>
                        <Ionicons name="location" size={16} color="#FFFFFF" />
                        <Text style={styles.imageInfoText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons name="people" size={16} color="#FFFFFF" />
                        <Text style={styles.imageInfoText}>
                          {attendees} Going
                        </Text>
                      </View>
                      {joinedLabel ? (
                        <View style={styles.infoItem}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="rgba(110,231,183,0.9)"
                          />
                          <Text
                            style={[
                              styles.imageInfoText,
                              {
                                color: "rgba(110,231,183,0.9)",
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {joinedLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <LeaveButton onPress={handleLeave} variant="dark" />
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    shadowColor: COLORS.joinedAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: 10,
    borderRadius: BORDER_RADIUS,
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 3,
    borderColor: `${COLORS.joinedAccent}40`,
    elevation: 4,
    overflow: "hidden",
  },

  // ── STICKER ───────────────────────────────────────────────────────────────
  stickerWrapper: { width: "100%", height: "100%", overflow: "hidden" },
  stickerBackground: { flex: 1, padding: 18 },
  joinedTintOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5,150,105,0.04)",
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
  topBar: {
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
  accentLine: { width: 60, height: 4, borderRadius: 2, marginBottom: 12 },
  accentDots: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  timeContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeLabel: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  timeLabelSquare: { borderRadius: 6 },
  timeLabelText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  timeText: { fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.joinedAccent}20`,
    gap: 12,
  },
  infoColumn: { flex: 1, gap: 6 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: {
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
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  gradientOverlay: {
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
    zIndex: 5,
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
  imageTitleCondensed: { letterSpacing: -1.2, fontSize: 22 },
  imageTitleExpanded: { letterSpacing: 0.5, fontSize: 24 },
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
  imageTimeLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  imageTimeText: {
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
  imageInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.2,
    flex: 1,
  },
});
