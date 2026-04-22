// ─── EventCard.tsx ────────────────────────────────────────────────────────────
import InterestBadge, { InterestData } from "@/components/common/InterestBadge";
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

const { height } = Dimensions.get("window");
const IMAGE_CARD_HEIGHT = Math.round(height * 0.42);
const BORDER_RADIUS = 28;
const STUB_WIDTH = 82;
const BODY_OFFSET = STUB_WIDTH + 14;
const SCREEN_BG = "#EDEBE4";

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

export interface EventCardProps {
  id: string;
  image?: string | { url?: string } | null;
  title: string;
  category?: string;
  categoryIconUrl?: string;
  interest?: InterestData;
  customInterestName?: string | null;
  time?: number;
  attendees?: number;
  location?: string;
  price?: string | number | null;
  isSaved?: boolean;
  onPress?: (id: string) => void;
  onJoin?: () => void;
  onSave?: () => void;
}

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

// JOIN BUTTON — light frosted variant, no heavy accent fill
function JoinButton({
  accent,
  onPress,
  surface = "light",
}: {
  accent: string;
  onPress: (e: any) => void;
  surface?: "image" | "light";
}) {
  if (surface === "image") {
    return (
      <Pressable style={jn.btnGlass} onPress={onPress} hitSlop={4}>
        <Text style={jn.labelGlass}>JOIN</Text>
        <Ionicons
          name="arrow-forward"
          size={11}
          color="rgba(255,255,255,0.85)"
        />
      </Pressable>
    );
  }
  return (
    <Pressable style={jn.btnLight} onPress={onPress} hitSlop={4}>
      <Text style={jn.labelLight}>JOIN</Text>
      <Ionicons name="arrow-forward" size={11} color="#333" />
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
  const chipBg = surface === "image" ? accent : `${accent}`;
  const chipColor = surface === "image" ? "#fff" : accent;
  const dateColor = surface === "image" ? "rgba(255,255,255)" : "#aaa";
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

interface SharedCardProps {
  title: string;
  category: string;
  accent: string;
  interest?: InterestData;
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
      {/* Sophisticated multi-layer gradient */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.08)",
          "rgba(0,0,0,0.28)",
          "rgba(0,0,0,0.62)",
          "rgba(0,0,0,0.90)",
        ]}
        locations={[0.15, 0.35, 0.55, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Top scrim — ensures pills are always legible on bright images */}
      <LinearGradient
        colors={["rgba(0,0,0,0.52)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.0)"]}
        locations={[0, 0.4, 1]}
        style={va.topScrim}
      />
      <View style={va.topRow}>
        {p.interest ? (
          <InterestBadge
            interest={p.interest}
            size="sm"
            variant="pill"
            surface="image"
            showLabel={true}
            showIcon={true}
          />
        ) : (
          <CategoryPill label={p.category} accent={p.accent} surface="image" />
        )}
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
          <JoinButton accent={p.accent} onPress={p.onJoin} surface="image" />
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
        {p.timeFormat}
      </Text>
      <View style={vb.topRow}>
        {p.interest ? (
          <InterestBadge
            interest={p.interest}
            size="sm"
            variant="pill"
            surface="light"
            showLabel={true}
            showIcon={true}
          />
        ) : (
          <CategoryPill label={p.category} accent={p.accent} surface="light" />
        )}
        <SaveButton saved={p.saved} onPress={p.onSave} surface="light" />
      </View>
      <Text style={vb.title} numberOfLines={2}>
        {p.title.toUpperCase()}
      </Text>
      <View style={tr.row}>
        <View style={[tr.chip, { backgroundColor: p.accent + "18" }]}>
          <Text style={[tr.chipText, { color: p.accent }]}>
            {p.timeLabel.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={[vb.rule, { backgroundColor: `${p.accent}22` }]} />
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
        <JoinButton accent={p.accent} onPress={p.onJoin} surface="light" />
      </View>
    </View>
  );
}

// ─── Variant D — No image, paid ───────────────────────────────────────────────
function CardD(p: SharedCardProps & { price: string }) {
  return (
    <View style={[s.card, vd.card]}>
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
      <View style={vd.body}>
        <View style={vd.topRow}>
          {p.interest ? (
            <InterestBadge
              interest={p.interest}
              size="sm"
              variant="pill"
              surface="light"
              showLabel={true}
              showIcon={true}
            />
          ) : (
            <CategoryPill
              label={p.category}
              accent={p.accent}
              surface="light"
            />
          )}
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
        <View style={[vd.rule, { backgroundColor: `${p.accent}22` }]} />
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
          <JoinButton accent={p.accent} onPress={p.onJoin} surface="light" />
        </View>
      </View>
    </View>
  );
}

// ─── Variant E — Image, paid ──────────────────────────────────────────────────
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
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={onImageError}
      />
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.72)",
          "rgba(0,0,0,0.52)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.52)",
          "rgba(0,0,0,0.88)",
        ]}
        locations={[0, 0.22, 0.45, 0.7, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top scrim right of perf line */}
      <LinearGradient
        colors={["rgba(0,0,0,0.50)", "rgba(0,0,0,0.0)"]}
        locations={[0, 1]}
        style={ve.topScrim}
      />
      <View style={ve.perfLine}>
        <View style={[ve.notch, ve.notchTop]} />
        <View style={[ve.notch, ve.notchBottom]} />
      </View>
      <View style={ve.stub}>
        <Text style={ve.priceAmount}>{price}</Text>
        <Text style={ve.priceLabel}>ENTRY</Text>
        <View style={ve.stubRule} />
        <Text style={ve.rotatedLabel} numberOfLines={1}>
          {p.category.toUpperCase()}
        </Text>
      </View>
      <View style={ve.topRow}>
        {p.interest ? (
          <InterestBadge
            interest={p.interest}
            size="sm"
            variant="pill"
            surface="image"
            showLabel={true}
            showIcon={true}
          />
        ) : (
          <CategoryPill label={p.category} accent={p.accent} surface="image" />
        )}
        <SaveButton saved={p.saved} onPress={p.onSave} surface="image" />
      </View>
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
        <View style={[s.metaRow, ve.bottomMeta]}>
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
          <JoinButton accent={p.accent} onPress={p.onJoin} surface="image" />
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
  categoryIconUrl,
  interest: propInterest,
  customInterestName,
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

  // ─── FIX: Resolve the effective display name for custom interests ──────────
  // When interest.name === "Custom", the API signals that customInterestName
  // holds the real user-defined label. We always prefer customInterestName
  // when it is a non-empty string, regardless of the interest.name value.
  const isCustomInterest =
    propInterest?.name?.toLowerCase() === "custom" ||
    (!!customInterestName && customInterestName.trim().length > 0);

  const effectiveName: string | undefined =
    customInterestName?.trim() || undefined;

  // ─── category: the string shown in pills, stubs, and fallback labels ──────
  // Priority: customInterestName → propCategory → interest.name (non-"Custom")
  // → deterministic hash fallback
  const category = useMemo<string>(() => {
    // 1. Custom interest name always wins
    if (effectiveName) return effectiveName;
    // 2. Explicit category prop (if not "Custom")
    if (propCategory && propCategory.toLowerCase() !== "custom")
      return propCategory;
    // 3. Interest name (skip "Custom" sentinel)
    if (propInterest?.name && propInterest.name.toLowerCase() !== "custom")
      return propInterest.name;
    // 4. Deterministic hash fallback (avoids showing "Custom" to users)
    const keys = Object.keys(CATEGORY_COLORS);
    if (!id) return keys[0];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return keys[Math.abs(h) % keys.length];
  }, [id, propCategory, propInterest?.name, effectiveName]);

  // ─── accent: colour derived from known categories; custom gets teal from API color ─
  const accent = useMemo<string>(() => {
    // Named category hit
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    // Custom interest: use the API-supplied color if present
    if (isCustomInterest && propInterest?.color) {
      const { r, g, b } = propInterest.color;
      return `rgb(${r},${g},${b})`;
    }
    return DEFAULT_ACCENT;
  }, [category, isCustomInterest, propInterest?.color]);

  const timeLabel = getTimeLabel(time);
  const timeFormat = formatEventTime(time);

  // ─── interest object passed to InterestBadge ─────────────────────────────
  // Always override name/label with effectiveName so the badge never shows
  // "Custom" as its label. The icon from the API is preserved as-is.
  const interest = useMemo<InterestData | undefined>(() => {
    if (propInterest) {
      return {
        ...propInterest,
        // If we have a custom name, use it; otherwise keep original name
        name: effectiveName ?? propInterest.name,
        label: effectiveName ?? propInterest.label ?? propInterest.name,
      };
    }
    if (categoryIconUrl) {
      return {
        id: `${id}-interest`,
        name: category,
        label: category,
        icon: { url: categoryIconUrl },
        color: null,
      };
    }
    return undefined;
  }, [propInterest, categoryIconUrl, id, category, effectiveName]);

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
      toValue: 0.96,
      useNativeDriver: true,
      damping: 18,
      stiffness: 350,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 280,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    onPress?.(id);
    console.log("EventCard pressed:", id);
  }, [id, onPress]);
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

  const variant: "A" | "B" | "D" | "E" =
    hasImage && priceStr ? "E" : hasImage ? "A" : priceStr ? "D" : "B";

  const shared: SharedCardProps = {
    title,
    category,
    accent,
    interest,
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const at = StyleSheet.create({
  dot: { width: 6.5, height: 6.5, borderRadius: 3.25, flexShrink: 0 },
  pillGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingVertical: 5.5,
    paddingHorizontal: 10.5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.28)",
  },
  pillGlassSaved: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "transparent",
  },
  pillLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingVertical: 5.5,
    paddingHorizontal: 10.5,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 0.8,
    borderColor: "rgba(0,0,0,0.06)",
  },
  pillLightSaved: { backgroundColor: "#0D0D0D", borderColor: "transparent" },
  pillDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingVertical: 5.5,
    paddingHorizontal: 10.5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pillDarkSaved: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "transparent",
  },
  pillLabel: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1.2 },
});

// JOIN — modern glass morphism buttons
const jn = StyleSheet.create({
  // On image: frosted glass, no solid accent
  btnGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.34)",
  },
  labelGlass: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.97)",
    letterSpacing: 1.2,
  },
  // On white card: refined minimalist style
  btnLight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 0.8,
    borderColor: "rgba(0,0,0,0.08)",
  },
  labelLight: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0D0D0D",
    letterSpacing: 1.2,
  },
});

const tr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },
  chip: { paddingHorizontal: 8.5, paddingVertical: 3.5, borderRadius: 7 },
  chipText: { fontSize: 14, fontWeight: "900", letterSpacing: 1.15 },
  date: { fontSize: 19, fontWeight: "800" },
});

const me = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5.5 },
  text: { fontSize: 11.5, fontWeight: "500", flex: 1 },
});

const s = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 13,
    borderRadius: BORDER_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
    }),
  },
  card: {
    width: "100%",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.06)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 11,
  },
  metaLeft: { flex: 1, gap: 4.5, minWidth: 0 },
});

const va = StyleSheet.create({
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "34%",
    zIndex: 1,
  },
  topRow: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
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
    padding: 17,
    paddingBottom: 19,
    zIndex: 2,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.7,
    lineHeight: 31,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2.5 },
    textShadowRadius: 10,
  },
});

const vb = StyleSheet.create({
  card: { padding: 17 },
  ghost: {
    position: "absolute",
    right: 20,
    bottom: 40,
    fontSize: 64,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#0D0D0D",
    opacity: 0.12,
    letterSpacing: -6,
    lineHeight: 110,
    includeFontPadding: false,
  } as any,
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: "#0D0D0D",
    letterSpacing: -0.6,
    lineHeight: 30,
    marginBottom: 11,
    maxWidth: "78%",
  },
  rule: {
    height: 1.2,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 13,
  },
});

const vd = StyleSheet.create({
  card: { flexDirection: "row", minHeight: 170 },
  stub: {
    width: STUB_WIDTH,
    flexShrink: 0,
    borderRightWidth: 1.2,
    borderStyle: "dashed",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 19,
    paddingHorizontal: 4,
  } as any,
  stubInner: { alignItems: "center", gap: 3.5 },
  priceAmount: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -1.3,
    lineHeight: 25,
  },
  priceLabel: {
    fontSize: 6.5,
    fontWeight: "900",
    color: "#e0e0e0",
    letterSpacing: 2.3,
    marginTop: 1.5,
  },
  stubRule: { width: 26, height: 1, borderRadius: 0.5, marginVertical: 7.5 },
  rotatedLabel: {
    fontSize: 6.5,
    fontWeight: "700",
    color: "#e0e0e0",
    letterSpacing: 1.4,
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
  body: { flex: 1, padding: 15.5, paddingLeft: 17 },
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
    letterSpacing: -0.5,
    lineHeight: 25,
    marginBottom: 11,
  },
  rule: {
    height: 1.2,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 13,
  },
});

const ve = StyleSheet.create({
  topScrim: {
    position: "absolute",
    top: 0,
    left: STUB_WIDTH,
    right: 0,
    height: "32%",
    zIndex: 1,
  },
  perfLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: STUB_WIDTH,
    width: 0,
    borderLeftWidth: 1.2,
    borderStyle: "dashed",
    borderLeftColor: "rgba(255,255,255,0.22)",
    zIndex: 3,
  } as any,
  notch: {
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: SCREEN_BG,
    left: -8.5,
    zIndex: 4,
  },
  notchTop: { top: -8 },
  notchBottom: { bottom: -8 },
  stub: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: STUB_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 21,
    paddingHorizontal: 6,
    zIndex: 2,
  },
  priceAmount: {
    fontSize: 27,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1.3,
    lineHeight: 29,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  priceLabel: {
    fontSize: 6.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.52)",
    letterSpacing: 2.3,
    marginTop: 2.5,
  },
  stubRule: {
    width: 23,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.24)",
    marginVertical: 7.5,
  },
  rotatedLabel: {
    fontSize: 6.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.40)",
    letterSpacing: 1.4,
    transform: [{ rotate: "90deg" }],
    width: 54,
    textAlign: "center",
  },
  topRow: {
    position: "absolute",
    top: 15,
    left: BODY_OFFSET,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 5,
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: BODY_OFFSET,
    right: 0,
    padding: 15.5,
    paddingBottom: 19,
    zIndex: 5,
  },
  bottomMeta: { marginTop: 3.5 },
  title: {
    fontSize: 23.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
    lineHeight: 26,
    marginBottom: 11,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
