// ─── EventCard.tsx ────────────────────────────────────────────────────────────
// Four card variants — chosen automatically:
//
//   A  Image, free      → full-bleed photo, frosted glass pills, heavy title
//   B  No image, free   → white card, ghost attendee number bleeds bg
//   D  No image, paid   → white card, dashed perforation + left price stub
//   E  Image, paid      → full-bleed photo, dashed perforation overlay,
//                         frosted price stub on the left dark zone
//
// Variant selection:
//   hasImage  &&  price  → E
//   hasImage  && !price  → A
//  !hasImage  &&  price  → D
//  !hasImage  && !price  → B
//
// Accent color is always derived from category.

import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const { height } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.42);
const BORDER_RADIUS = 18;

// Ticket stub column width — shared between Variant D and E
const STUB_WIDTH = 82;
// Gap between perforation line and body content
const BODY_OFFSET = STUB_WIDTH + 14;

// Screen bg color — used for the notch cutout trick
const SCREEN_BG = "#EDEBE4";

// ─── Category → accent color ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Sports: "#10B981",
  Music: "#FF6B58",
  Technology: "#6366F1",
  Food: "#F59E0B",
  Art: "#EC4899",
  Pet: "#10B981",
  Business: "#475569",
  Travel: "#0EA5E9",
  Health: "#10B981",
  Gaming: "#8B5CF6",
  Fashion: "#F43F5E",
  Film: "#EF4444",
  Education: "#475569",
  Fitness: "#10B981",
  Photography: "#FF6B58",
  Comedy: "#F59E0B",
  Dance: "#EC4899",
  Festival: "#FF6B58",
  Networking: "#475569",
  Workshop: "#10B981",
  Conference: "#475569",
  Party: "#FF6B58",
  Meetup: "#6366F1",
  Charity: "#10B981",
  Nightlife: "#8B5CF6",
  Concert: "#EF4444",
  Exhibition: "#475569",
  Webinar: "#475569",
  Outdoor: "#10B981",
  Gym: "#10B981",
  Pickleball: "#0EA5E9",
  Yoga: "#EC4899",
};

const DEFAULT_ACCENT = "#FF6B58";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  categoryIconUrl?: string;
  time?: number;
  attendees?: number;
  location?: string;
  /** Price string e.g. "€12" or number. Falsy = free. */
  price?: string | number | null;
  isSaved?: boolean;
  onPress?: (id: string) => void;
  onJoin?: () => void;
  onSave?: () => void;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

type Surface = "image" | "light" | "dark";

function CategoryPill({
  label,
  accent,
  surface,
}: {
  label: string;
  accent: string;
  surface: Surface;
}) {
  const containerStyle =
    surface === "image"
      ? at.pillGlass
      : surface === "dark"
        ? at.pillDark
        : at.pillLight;
  const textColor =
    surface === "image"
      ? "#fff"
      : surface === "dark"
        ? "rgba(255,255,255,0.55)"
        : "#666";

  return (
    <View style={containerStyle}>
      <View style={[at.dot, { backgroundColor: accent }]} />
      <Text style={[at.pillLabel, { color: textColor }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function SaveButton({
  saved,
  onPress,
  surface,
}: {
  saved: boolean;
  onPress: () => void;
  surface: Surface;
}) {
  const handlePress = useCallback(
    (e: any) => {
      e.stopPropagation();
      onPress();
    },
    [onPress],
  );

  const baseStyle =
    surface === "image"
      ? at.pillGlass
      : surface === "dark"
        ? at.pillDark
        : at.pillLight;
  const activatedStyle =
    surface === "image"
      ? at.pillGlassSaved
      : surface === "dark"
        ? at.pillDarkSaved
        : at.pillLightSaved;

  const iconColor = saved
    ? surface === "light"
      ? "#fff"
      : "#0D0D0D"
    : surface === "image"
      ? "#fff"
      : surface === "dark"
        ? "rgba(255,255,255,0.45)"
        : "#999";

  const labelColor = saved
    ? surface === "light"
      ? "#fff"
      : "#0D0D0D"
    : surface === "image"
      ? "#fff"
      : surface === "dark"
        ? "rgba(255,255,255,0.45)"
        : "#999";

  return (
    <Pressable
      onPress={handlePress}
      style={[baseStyle, saved && activatedStyle]}
      hitSlop={8}
    >
      <Ionicons
        name={saved ? "bookmark" : "bookmark-outline"}
        size={11}
        color={iconColor}
      />
      <Text style={[at.pillLabel, { color: labelColor }]}>
        {saved ? "SAVED" : "SAVE"}
      </Text>
    </Pressable>
  );
}

function JoinButton({
  accent,
  onPress,
}: {
  accent: string;
  onPress: (e: any) => void;
}) {
  return (
    <Pressable
      style={[jn.btn, { backgroundColor: accent }]}
      onPress={onPress}
      hitSlop={4}
    >
      <Text style={jn.label}>JOIN</Text>
      <Ionicons name="arrow-forward" size={12} color="#fff" />
    </Pressable>
  );
}

function TimeRow({
  timeLabel,
  timeFormat,
  accent,
  surface,
}: {
  timeLabel: string;
  timeFormat: string;
  accent: string;
  surface: Surface;
}) {
  const chipBg = surface === "image" ? accent : `${accent}18`;
  const chipColor = surface === "image" ? "#fff" : accent;
  const dateColor = surface === "image" ? "rgba(255,255,255,0.62)" : "#aaa";

  return (
    <View style={tr.row}>
      <View style={[tr.chip, { backgroundColor: chipBg }]}>
        <Text style={[tr.chipText, { color: chipColor }]}>
          {timeLabel.toUpperCase()}
        </Text>
      </View>
      <Text style={[tr.date, { color: dateColor }]}>{timeFormat}</Text>
    </View>
  );
}

function MetaItem({
  icon,
  text,
  surface,
}: {
  icon: string;
  text: string;
  surface: Surface;
}) {
  const color = surface === "image" ? "rgba(255,255,255,0.62)" : "#aaa";
  return (
    <View style={me.row}>
      <Ionicons
        name={icon as any}
        size={16}
        color={color}
        style={{ marginTop: 0.5 }}
      />
      <Text style={[me.text, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

// ─── Shared card props ────────────────────────────────────────────────────────

interface SharedCardProps {
  title: string;
  category: string;
  accent: string;
  timeLabel: string;
  timeFormat: string;
  attendees: number;
  location?: string;
  saved: boolean;
  onSave: () => void;
  onJoin: (e: any) => void;
}

// ─── Variant A — Image, free ──────────────────────────────────────────────────

function CardA({
  imageUri,
  onImageError,
  ...p
}: SharedCardProps & { imageUri: string; onImageError: () => void }) {
  return (
    <View style={[s.card, { height: IMAGE_CARD_HEIGHT }]}>
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={onImageError}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.42)", "rgba(0,0,0,0.88)"]}
        locations={[0.1, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={va.topRow}>
        <CategoryPill label={p.category} accent={p.accent} surface="image" />
        <SaveButton saved={p.saved} onPress={p.onSave} surface="image" />
      </View>
      <View style={va.bottom}>
        <Text style={va.title} numberOfLines={2}>
          {p.title.toUpperCase()}
        </Text>
        <TimeRow
          timeLabel={p.timeLabel}
          timeFormat={p.timeFormat}
          accent={p.accent}
          surface="image"
        />
        <View style={s.metaRow}>
          <View style={s.metaLeft}>
            {!!p.location && (
              <MetaItem
                icon="location-outline"
                text={p.location}
                surface="image"
              />
            )}
            <MetaItem
              icon="people-outline"
              text={`${p.attendees} going`}
              surface="image"
            />
          </View>
          <JoinButton accent={p.accent} onPress={p.onJoin} />
        </View>
      </View>
    </View>
  );
}

// ─── Variant B — No image, free ───────────────────────────────────────────────

function CardB(p: SharedCardProps) {
  return (
    <View style={[s.card, vb.card]}>
      <Text style={vb.ghost} aria-hidden>
        {p.attendees > 0 ? String(p.attendees) : "0"}km
      </Text>
      <View style={vb.topRow}>
        <CategoryPill label={p.category} accent={p.accent} surface="light" />
        <SaveButton saved={p.saved} onPress={p.onSave} surface="light" />
      </View>
      <Text style={vb.title} numberOfLines={2}>
        {p.title.toUpperCase()}
      </Text>
      <TimeRow
        timeLabel={p.timeLabel}
        timeFormat={p.timeFormat}
        accent={p.accent}
        surface="light"
      />
      <View style={vb.rule} />
      <View style={s.metaRow}>
        <View style={s.metaLeft}>
          {!!p.location && (
            <MetaItem
              icon="location-outline"
              text={p.location}
              surface="light"
            />
          )}
          <MetaItem
            icon="people-outline"
            text={`${p.attendees} going`}
            surface="light"
          />
        </View>
        <JoinButton accent={p.accent} onPress={p.onJoin} />
      </View>
    </View>
  );
}

// ─── Variant D — No image, paid ───────────────────────────────────────────────

function CardD(p: SharedCardProps & { price: string }) {
  return (
    <View style={[s.card, vd.card]}>
      {/* Left stub */}
      <View style={[vd.stub, { borderRightColor: `${p.accent}28` }]}>
        <View style={[vd.notch, vd.notchTop]} />
        <View style={[vd.notch, vd.notchBottom]} />
        <View style={vd.stubInner}>
          <Text style={[vd.priceAmount, { color: p.accent }]}>{p.price}</Text>
          <Text style={vd.priceLabel}>ENTRY</Text>
          <View style={[vd.stubRule, { backgroundColor: `${p.accent}20` }]} />
          <Text style={vd.rotatedLabel} numberOfLines={1}>
            {p.category.toUpperCase()}
          </Text>
        </View>
      </View>
      {/* Body */}
      <View style={vd.body}>
        <View style={vd.topRow}>
          <CategoryPill label={p.category} accent={p.accent} surface="light" />
          <SaveButton saved={p.saved} onPress={p.onSave} surface="light" />
        </View>
        <Text style={vd.title} numberOfLines={2}>
          {p.title.toUpperCase()}
        </Text>
        <TimeRow
          timeLabel={p.timeLabel}
          timeFormat={p.timeFormat}
          accent={p.accent}
          surface="light"
        />
        <View style={vd.rule} />
        <View style={s.metaRow}>
          <View style={s.metaLeft}>
            {!!p.location && (
              <MetaItem
                icon="location-outline"
                text={p.location}
                surface="light"
              />
            )}
            <MetaItem
              icon="people-outline"
              text={`${p.attendees} going`}
              surface="light"
            />
          </View>
          <JoinButton accent={p.accent} onPress={p.onJoin} />
        </View>
      </View>
    </View>
  );
}

// ─── Variant E — Image, paid ──────────────────────────────────────────────────
//
// Layout (left → right):
//   [  price stub  | perf line |  photo content area  ]
//
// The photo is full-bleed under everything.
// A dual-direction gradient darkens the left stub zone and the right content zone.
// The dashed perforation line sits at STUB_WIDTH from the left edge.
// Notch circles straddle the perf line at top and bottom card edges.

function CardE({
  imageUri,
  onImageError,
  price,
  ...p
}: SharedCardProps & {
  imageUri: string;
  onImageError: () => void;
  price: string;
}) {
  return (
    <View style={[s.card, { height: IMAGE_CARD_HEIGHT }]}>
      {/* Full-bleed photo */}
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={onImageError}
      />

      {/* Dual-zone gradient:
          Left stub → dark so price is readable
          Right area → bottom-heavy dark for title readability  */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.72)", // left stub — always dark
          "rgba(0,0,0,0.52)", // just past stub
          "rgba(0,0,0,0.0)", // photo shows through in mid
          "rgba(0,0,0,0.52)", // darkens back toward bottom-right
          "rgba(0,0,0,0.88)", // bottom edge — title contrast
        ]}
        locations={[0, 0.22, 0.45, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dashed perforation line */}
      <View style={ve.perfLine}>
        {/* Notch cutouts that visually "punch" through the card edges */}
        <View style={[ve.notch, ve.notchTop]} />
        <View style={[ve.notch, ve.notchBottom]} />
      </View>

      {/* Left price stub */}
      <View style={ve.stub}>
        <Text style={ve.priceAmount}>{price}</Text>
        <Text style={ve.priceLabel}>ENTRY</Text>
        <View style={ve.stubRule} />
        <Text style={ve.rotatedLabel} numberOfLines={1}>
          {p.category.toUpperCase()}
        </Text>
      </View>

      {/* Top chrome — category pill + save, offset right of perf */}
      <View style={ve.topRow}>
        <CategoryPill label={p.category} accent={p.accent} surface="image" />
        <SaveButton saved={p.saved} onPress={p.onSave} surface="image" />
      </View>

      {/* Bottom content — offset right of perf */}
      <View style={ve.bottom}>
        <Text style={ve.title} numberOfLines={2}>
          {p.title.toUpperCase()}
        </Text>
        <TimeRow
          timeLabel={p.timeLabel}
          timeFormat={p.timeFormat}
          accent={p.accent}
          surface="image"
        />
        <View style={s.metaRow}>
          <View style={s.metaLeft}>
            {!!p.location && (
              <MetaItem
                icon="location-outline"
                text={p.location}
                surface="image"
              />
            )}
            <MetaItem
              icon="people-outline"
              text={`${p.attendees} going`}
              surface="image"
            />
          </View>
          <JoinButton accent={p.accent} onPress={p.onJoin} />
        </View>
      </View>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function EventCard({
  id,
  image,
  title,
  category: propCategory,
  time,
  attendees = 0,
  location,
  price,
  isSaved = false,
  onPress,
  onJoin,
  onSave,
}: EventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = useState(false);
  const [savedLocal, setSavedLocal] = useState(isSaved);

  const imageUri =
    typeof image === "string" ? image : ((image as any)?.url ?? undefined);
  const hasImage = !!imageUri && !imageError;

  const category = useMemo(() => {
    if (propCategory) return propCategory;
    const keys = Object.keys(CATEGORY_COLORS);
    if (!id) return keys[0];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return keys[Math.abs(h) % keys.length];
  }, [id, propCategory]);

  const accent = CATEGORY_COLORS[category] ?? DEFAULT_ACCENT;
  const timeLabel = getTimeLabel(time);
  const timeFormat = formatEventTime(time);

  const priceStr = useMemo((): string | null => {
    if (!price) return null;
    const raw = String(price).trim();
    if (!raw || raw === "0") return null;
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    if (isNaN(n) || n <= 0) return null;
    return /[^0-9.]/.test(raw) ? raw : `€${n}`;
  }, [price]);

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      useNativeDriver: true,
      damping: 20,
      stiffness: 400,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 300,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => onPress?.(id), [id, onPress]);
  const handleJoin = useCallback(
    (e: any) => {
      e.stopPropagation();
      onJoin?.();
    },
    [onJoin],
  );
  const handleSave = useCallback(() => {
    setSavedLocal((v) => !v);
    onSave?.();
  }, [onSave]);
  const handleImageError = useCallback(() => setImageError(true), []);

  // Variant selection
  const variant: "A" | "B" | "D" | "E" =
    hasImage && priceStr ? "E" : hasImage ? "A" : priceStr ? "D" : "B";

  const shared: SharedCardProps = {
    title,
    category,
    accent,
    timeLabel,
    timeFormat,
    attendees,
    location,
    saved: savedLocal,
    onSave: handleSave,
    onJoin: handleJoin,
  };

  return (
    <Animated.View style={[s.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel={`Event: ${title}`}
        accessibilityRole="button"
      >
        {variant === "A" && (
          <CardA
            {...shared}
            imageUri={imageUri!}
            onImageError={handleImageError}
          />
        )}
        {variant === "B" && <CardB {...shared} />}
        {variant === "D" && <CardD {...shared} price={priceStr!} />}
        {variant === "E" && (
          <CardE
            {...shared}
            imageUri={imageUri!}
            onImageError={handleImageError}
            price={priceStr!}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Style sheets ─────────────────────────────────────────────────────────────

const at = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  pillGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  pillGlassSaved: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "transparent",
  },
  pillLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  pillLightSaved: { backgroundColor: "#0D0D0D", borderColor: "transparent" },
  pillDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  pillDarkSaved: {
    backgroundColor: "rgba(255,255,255,0.90)",
    borderColor: "transparent",
  },
  pillLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
});

const jn = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  label: { fontSize: 13, fontWeight: "900", color: "#fff", letterSpacing: 1.5 },
});

const tr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  chipText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  date: { fontSize: 12, fontWeight: "500" },
});

const me = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  text: { fontSize: 11, fontWeight: "500", flex: 1 },
});

const s = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
    borderRadius: BORDER_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  card: {
    width: "100%",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: "rgba(0,0,0,0.07)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  metaLeft: { flex: 1, gap: 4, minWidth: 0 },
});

const va = StyleSheet.create({
  topRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 9,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});

const vb = StyleSheet.create({
  card: { padding: 16 },
  ghost: {
    position: "absolute",
    right: 20,
    bottom: 40,
    fontSize: 64,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#0D0D0D",
    opacity: 0.15,
    letterSpacing: -6,
    lineHeight: 110,
    includeFontPadding: false,
  } as any,
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0D0D0D",
    letterSpacing: -0.5,
    lineHeight: 29,
    marginBottom: 10,
    maxWidth: "78%",
  },
  rule: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 10 },
});

const vd = StyleSheet.create({
  card: { flexDirection: "row", minHeight: 164 },
  stub: {
    width: STUB_WIDTH,
    flexShrink: 0,
    borderRightWidth: 1.5,
    borderStyle: "dashed",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 4,
  } as any,
  stubInner: { alignItems: "center", gap: 3 },
  priceAmount: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 24,
  },
  priceLabel: {
    fontSize: 7,
    fontWeight: "900",
    color: "#ccc",
    letterSpacing: 2.5,
    marginTop: 1,
  },
  stubRule: { width: 28, height: 1, borderRadius: 1, marginVertical: 6 },
  rotatedLabel: {
    fontSize: 7,
    fontWeight: "700",
    color: "#ccc",
    letterSpacing: 1.5,
    transform: [{ rotate: "90deg" }],
    width: 54,
    textAlign: "center",
  },
  notch: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SCREEN_BG,
    right: -8,
    zIndex: 2,
  },
  notchTop: { top: -8 },
  notchBottom: { bottom: -8 },
  body: { flex: 1, padding: 14, paddingLeft: 16 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0D0D0D",
    letterSpacing: -0.4,
    lineHeight: 25,
    marginBottom: 9,
  },
  rule: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 10 },
});

// ─── Variant E styles ─────────────────────────────────────────────────────────

const ve = StyleSheet.create({
  // Dashed perforation line — vertical rule at STUB_WIDTH
  perfLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: STUB_WIDTH,
    width: 0,
    borderLeftWidth: 1.5,
    borderStyle: "dashed",
    borderLeftColor: "rgba(255,255,255,0.30)",
    zIndex: 3,
  } as any,

  // Notch circles that straddle the perf line at card top/bottom edges
  notch: {
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: SCREEN_BG,
    left: -8.5, // centre on the perf line
    zIndex: 4,
  },
  notchTop: { top: -8 },
  notchBottom: { bottom: -8 },

  // Left price stub — overlays the dark zone of the photo
  stub: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: STUB_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 6,
    zIndex: 2,
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 28,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceLabel: {
    fontSize: 7,
    fontWeight: "900",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 2.5,
    marginTop: 2,
  },
  stubRule: {
    width: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginVertical: 7,
  },
  rotatedLabel: {
    fontSize: 7,
    fontWeight: "700",
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 1.5,
    transform: [{ rotate: "90deg" }],
    width: 54,
    textAlign: "center",
  },

  // Top chrome — starts right of the perf line
  topRow: {
    position: "absolute",
    top: 14,
    left: BODY_OFFSET,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 5,
  },

  // Bottom content area — starts right of the perf line
  bottom: {
    position: "absolute",
    bottom: 0,
    left: BODY_OFFSET,
    right: 0,
    padding: 14,
    paddingBottom: 18,
    zIndex: 5,
  },

  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 24,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
