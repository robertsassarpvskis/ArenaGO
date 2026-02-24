import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/context/AuthContext";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const COLORS = {
  // Soft coral-to-peach — not punchy, not white
  gradientStart: "#E8705A",
  gradientMid: "#EF8C6F",
  gradientEnd: "#F4A07E",

  // Overlay & chip tints
  chipIdle: "rgba(255,255,255,0.18)",
  chipIdleBorder: "rgba(255,255,255,0.28)",
  chipActive: "rgba(255,255,255,0.95)",

  text: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.78)",
  textActive: "#D4563E",

  dot: "rgba(255,255,255,0.55)",
};

const RADII = {
  header: 30,
  chip: 20,
};

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Filter {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

type TimeSlot = "now" | "1h" | "3h" | "today" | "week";

interface Props {
  activeFilter: string;
  filters: Filter[];
  onFilterChange: (id: string) => void;
  scrollY: Animated.Value;
  savedCount?: number;
  activeTime?: TimeSlot;
  onTimeChange?: (t: TimeSlot) => void;
}

const TIME_SLOTS: { id: TimeSlot; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "1h", label: "1h" },
  { id: "3h", label: "3h" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
];

// ─── ANIMATED GRADIENT WRAPPER ───────────────────────────────────────────────
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const ModernHeader: React.FC<Props> = ({
  activeFilter,
  filters,
  onFilterChange,
  scrollY,
  savedCount = 0,
  activeTime = "now",
  onTimeChange,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const username = user?.userName ?? "you";

  // Greeting based on hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Heights
  const COLLAPSED = 58 + insets.top;
  // top bar + hero + time row + filter row + padding
  const EXPANDED = 248 + insets.top;

  // ── Animations ──────────────────────────────────────────────────────────
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 110],
    outputRange: [EXPANDED, COLLAPSED],
    extrapolate: "clamp",
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, 55],
    outputRange: [0, -14],
    extrapolate: "clamp",
  });

  const rowsOpacity = scrollY.interpolate({
    inputRange: [30, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rowsTranslate = scrollY.interpolate({
    inputRange: [30, 80],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 110],
    outputRange: [1, 0.88],
    extrapolate: "clamp",
  });

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <AnimatedLinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { height: headerHeight }]}
    >
      {/* Subtle texture overlay */}
      <View style={styles.noiseOverlay} pointerEvents="none" />

      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.topBar, { transform: [{ scale: titleScale }] }]}
        >
          {/* Brand wordmark */}
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.appName}>ArenaGO</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {savedCount > 0 && (
              <View style={styles.iconBtn}>
                <Ionicons name="bookmark-outline" size={20} color="#FFF" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{savedCount}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.75}>
              <Ionicons name="search-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} activeOpacity={0.75}>
              <Text style={styles.avatarText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.title}>{username} 👋</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={COLORS.textSoft} />
            <Text style={styles.locationText}>Near you</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.locationText}>Live events</Text>
          </View>
        </Animated.View>

        {/* ── TIME FILTER ──────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.rowWrapper,
            {
              opacity: rowsOpacity,
              transform: [{ translateY: rowsTranslate }],
            },
          ]}
        >
          <View style={styles.timeRow}>
            {TIME_SLOTS.map((slot) => {
              const active = activeTime === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => onTimeChange?.(slot.id)}
                  activeOpacity={0.75}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                >
                  {active && slot.id === "now" && (
                    <View style={styles.livePulse} />
                  )}
                  <Text
                    style={[
                      styles.timeChipText,
                      active && styles.timeChipTextActive,
                    ]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── CATEGORY FILTERS ─────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.rowWrapper,
            {
              opacity: rowsOpacity,
              transform: [{ translateY: rowsTranslate }],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {filters.map((f) => {
              const active = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => onFilterChange(f.id)}
                  activeOpacity={0.78}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Ionicons
                    name={f.icon}
                    size={15}
                    color={active ? COLORS.textActive : COLORS.text}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>

      <StatusBar style="light" />
    </AnimatedLinearGradient>
  );
};

export default ModernHeader;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    overflow: "hidden",
    borderBottomLeftRadius: RADII.header,
    borderBottomRightRadius: RADII.header,
    // Layered shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: "#C0503A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },

  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 2,
  },

  // ── TOP BAR ────────────────────────────────────────────────────────────
  topBar: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  appName: {
    color: "#FFF",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FFF",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textActive,
  },

  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },

  avatarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── HERO ───────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 10,
    paddingBottom: 4,
  },

  greeting: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  title: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 6,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  locationText: {
    color: COLORS.textSoft,
    fontSize: 12,
    fontWeight: "500",
  },

  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.dot,
  },

  // ── ROW WRAPPER ────────────────────────────────────────────────────────
  rowWrapper: {
    marginTop: 6,
  },

  // ── TIME CHIPS ─────────────────────────────────────────────────────────
  timeRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },

  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADII.chip,
    backgroundColor: COLORS.chipIdle,
    borderWidth: 1,
    borderColor: COLORS.chipIdleBorder,
    gap: 5,
  },

  timeChipActive: {
    backgroundColor: COLORS.chipActive,
    borderColor: COLORS.chipActive,
    // subtle lift
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },

  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E84C3D",
  },

  timeChipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  timeChipTextActive: {
    color: COLORS.textActive,
  },

  // ── CATEGORY FILTERS ───────────────────────────────────────────────────
  filtersContainer: {
    paddingVertical: 4,
    gap: 8,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADII.chip,
    backgroundColor: COLORS.chipIdle,
    borderWidth: 1,
    borderColor: COLORS.chipIdleBorder,
    gap: 6,
  },

  filterChipActive: {
    backgroundColor: COLORS.chipActive,
    borderColor: COLORS.chipActive,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },

  filterText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  filterTextActive: {
    color: COLORS.textActive,
  },
});
