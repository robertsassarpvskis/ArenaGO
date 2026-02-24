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
import { SvgUri } from "react-native-svg";

const { height } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.42);
const STICKER_CARD_HEIGHT = Math.round(height * 0.38);
const BORDER_RADIUS = 20;
const ANIMATION_DURATION = 200;
const SPRING_FRICTION = 5;

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
  participatingTeal: "#0EA5E9",
  participatingGreen: "#10B981",
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

interface ParticipatingEventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  categoryIconUrl?: string;
  time?: number;
  attendees?: number;
  location?: string;
  joinedAt?: string; // ISO date string
  onPress?: (id: string) => void;
}

// ── Participating Badge ───────────────────────────────────────────────────────
function ParticipatingBadge({ variant }: { variant: "light" | "dark" }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const isLight = variant === "light";

  return (
    <View
      style={[
        badgeStyles.container,
        isLight ? badgeStyles.containerLight : badgeStyles.containerDark,
      ]}
    >
      <Animated.View
        style={[badgeStyles.dot, { transform: [{ scale: pulseAnim }] }]}
      />
      <Text style={badgeStyles.label}>JOINED</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  containerLight: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderColor: "rgba(16,185,129,0.35)",
  },
  containerDark: {
    backgroundColor: "rgba(16,185,129,0.25)",
    borderColor: "rgba(16,185,129,0.5)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.participatingGreen,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.participatingGreen,
    letterSpacing: 1.2,
  },
});

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({
  label,
  color,
  iconUrl,
  rounded,
}: {
  label: string;
  color: string;
  iconUrl?: string;
  rounded?: boolean;
}) {
  const [iconError, setIconError] = useState(false);

  return (
    <View
      style={[
        catStyles.badge,
        { backgroundColor: color },
        rounded && catStyles.badgeRounded,
      ]}
    >
      {iconUrl && !iconError ? (
        <SvgUri
          uri={iconUrl}
          width={14}
          height={14}
          color="#FFFFFF"
          onError={() => setIconError(true)}
        />
      ) : null}
      <Text style={catStyles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}

const catStyles = StyleSheet.create({
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
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});

// ── Joined At label ───────────────────────────────────────────────────────────
function formatJoinedAt(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `Joined ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParticipatingEventCard({
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
}: ParticipatingEventCardProps) {
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
    if (!id) return categories[0];
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

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const showStickerMode = !imageUri || imageError;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: resolvedCardHeight,
          transform: [{ scale: scaleAnim }],
          shadowOpacity,
        },
      ]}
    >
      {/* Green left accent bar — signals participation */}
      <View style={styles.participationAccentBar} />

      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`Participating in: ${title}`}
        accessibilityRole="button"
      >
        <View style={[styles.card, { borderRadius: BORDER_RADIUS }]}>
          {showStickerMode ? (
            // ── STICKER MODE ────────────────────────────────────────────────
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
                <View style={styles.topBar}>
                  <CategoryBadge
                    label={category}
                    color={accentColor}
                    iconUrl={categoryIconUrl}
                    rounded={styleVariation === 2}
                  />
                  <ParticipatingBadge variant="light" />
                </View>

                {/* Center content */}
                <View style={styles.stickerContent}>
                  <Text
                    style={[styles.stickerTitle, { color: COLORS.textPrimary }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  {styleVariation % 2 === 0 ? (
                    <View
                      style={[
                        styles.accentLine,
                        { backgroundColor: accentColor },
                      ]}
                    />
                  ) : (
                    <View style={styles.accentDots}>
                      {[0, 1, 2].map((i) => (
                        <View
                          key={i}
                          style={[styles.dot, { backgroundColor: accentColor }]}
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
                      style={[styles.timeValue, { color: COLORS.textPrimary }]}
                    >
                      {timeFormat}
                    </Text>
                  </View>
                </View>

                {/* Bottom bar */}
                <View style={styles.bottomBar}>
                  <View style={styles.infoColumn}>
                    <View style={styles.infoItem}>
                      <Ionicons name="location" size={16} color={accentColor} />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="people" size={16} color={accentColor} />
                      <Text style={styles.infoText}>{attendees} Going</Text>
                    </View>
                  </View>

                  {/* "You're in" pill */}
                  <View
                    style={[
                      styles.youreInPill,
                      { borderColor: COLORS.participatingGreen },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.participatingGreen}
                    />
                    <View>
                      <Text style={styles.youreInText}>YOU'RE IN</Text>
                      {joinedAt && (
                        <Text style={styles.joinedAtText}>
                          {formatJoinedAt(joinedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ) : (
            // ── IMAGE MODE ──────────────────────────────────────────────────
            <>
              {/* Image layer */}
              <View
                style={[styles.imageClipLayer, { borderRadius: BORDER_RADIUS }]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(0,0,0,0.50)",
                    "rgba(0,0,0,0.92)",
                  ]}
                  locations={[0, 0.3, 1]}
                  style={styles.gradientOverlay}
                />
                {/* Green tint overlay to signal participation */}
                <View style={styles.participationTint} />
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
                  <ParticipatingBadge variant="dark" />
                </View>

                {/* Bottom content */}
                <View style={styles.imageBottomContent}>
                  <Text
                    style={styles.imageTitle}
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
                    <Text style={styles.imageTimeValue}>{timeFormat}</Text>
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

                    {/* "You're in" pill — dark variant */}
                    <View style={styles.youreInPillDark}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={COLORS.participatingGreen}
                      />
                      <View>
                        <Text style={styles.youreInTextDark}>YOU'RE IN</Text>
                        {joinedAt && (
                          <Text style={styles.joinedAtTextDark}>
                            {formatJoinedAt(joinedAt)}
                          </Text>
                        )}
                      </View>
                    </View>
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
    shadowColor: COLORS.participatingGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: 10,
    // Slightly inset to make room for the left accent bar
    paddingLeft: 6,
  },
  participationAccentBar: {
    position: "absolute",
    left: 0,
    top: "15%",
    bottom: "15%",
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.participatingGreen,
    zIndex: 10,
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: `${COLORS.participatingGreen}40`,
    elevation: 4,
  },

  // ── STICKER MODE ────────────────────────────────────────────────────────────
  stickerWrapper: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: BORDER_RADIUS,
  },
  stickerBackground: {
    flex: 1,
    padding: 18,
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeLabel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeLabelSquare: { borderRadius: 6 },
  timeLabelText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  infoColumn: {
    flex: 1,
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    flex: 1,
  },
  youreInPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  youreInText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.participatingGreen,
    letterSpacing: 1.2,
  },
  joinedAtText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // ── IMAGE MODE ──────────────────────────────────────────────────────────────
  imageClipLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  participationTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,185,129,0.08)",
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
  imageTimeValue: {
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
  youreInPillDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${COLORS.participatingGreen}70`,
    backgroundColor: "rgba(16,185,129,0.22)",
  },
  youreInTextDark: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.participatingGreen,
    letterSpacing: 1.2,
  },
  joinedAtTextDark: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
});
