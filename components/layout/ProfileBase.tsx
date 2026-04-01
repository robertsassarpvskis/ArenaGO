// components/layout/ProfileBase.tsx
//
// 2026 redesign v2 — editorial, modern, immersive.
//
// Hero is position:absolute (pinned behind scroll).
// The ScrollView content starts with paddingTop = HERO_H so the body
// sits below the photo initially, then slides UP over it as the user scrolls.
// Overscroll-up reveals more of the pinned photo — never white.
//
// Font: Playfair Display (display) + DM Sans (body) — load via expo-google-fonts
// or embed in your asset pipeline:
//   @expo-google-fonts/playfair-display
//   @expo-google-fonts/dm-sans
//
// Used by:
//   • MyProfileScreen   (mode="own")  — Edit + Share, no Follow/Message
//   • UserProfileScreen (mode="other") — Follow + Message, no Edit

import {
  ArrowLeft,
  Edit3,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Zap,
} from "lucide-react-native";
import React, { ReactNode, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Design tokens ────────────────────────────────────────────────────────────

export const C = {
  // Backgrounds
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1EFE8", // gray-50 from palette
  surfaceWarm: "#FAECE7", // coral-50 — warm accent surface
  border: "rgba(0,0,0,0.07)",
  borderMid: "rgba(0,0,0,0.12)",

  // Text
  text: "#111111",
  textSub: "#5F5E5A", // gray-600
  textMuted: "#888780", // gray-400
  textOnDark: "#FFFFFF",

  // Accent
  coral: "#D85A30", // coral-400 — primary CTA
  coralLight: "#F0997B", // coral-200
  coralSurface: "#FAECE7", // coral-50

  teal: "#1D9E75", // teal-400 — secondary accent
  tealSurface: "#E1F5EE", // teal-50

  // Structural
  ink: "#111111",
  heroBg: "#0D0D0D",
} as const;

// ─── Language → flag map ──────────────────────────────────────────────────────

const LANG_FLAG: Record<string, string> = {
  EN: "🇬🇧",
  LV: "🇱🇻",
  RU: "🇷🇺",
  DE: "🇩🇪",
  FR: "🇫🇷",
  ES: "🇪🇸",
  IT: "🇮🇹",
  PL: "🇵🇱",
  LT: "🇱🇹",
  EE: "🇪🇪",
  FI: "🇫🇮",
  SV: "🇸🇪",
  NL: "🇳🇱",
  PT: "🇵🇹",
  ZH: "🇨🇳",
  JA: "🇯🇵",
  KO: "🇰🇷",
  AR: "🇸🇦",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileEvent {
  id: number;
  name: string;
  icon: string;
  date: string;
  time: string;
  participants: number;
  photoUrl?: string;
}

export interface ProfileBaseProps {
  mode: "own" | "other";
  firstName: string;
  lastName: string;
  username: string;
  photoUrl?: string;
  bio?: string;
  preferredLanguages?: string[];
  locationLabel?: string;
  followingCount?: number;
  followerCount?: number;
  participatedEventsCount?: number;
  isFollowing?: boolean;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onEditPress?: () => void;
  onSharePress?: () => void;
  onClosePress?: () => void;
  onMorePress?: () => void;
  onSeeAllActivityPress?: () => void;
  recentEvents?: ProfileEvent[];
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W, height: SCREEN_H } = Dimensions.get("window");

const HERO_H = Math.round(W * 1.15);
const BODY_TOP = HERO_H;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={s.statItem}>
      <Text style={[s.statValue, accent && { color: C.coral }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function EventRow({ ev, last }: { ev: ProfileEvent; last?: boolean }) {
  return (
    <View style={[s.eventRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.eventIconWrap}>
        <Text style={s.eventIconText}>{ev.icon}</Text>
      </View>
      <View style={s.eventInfo}>
        <Text style={s.eventName} numberOfLines={1}>
          {ev.name}
        </Text>
        <Text style={s.eventMeta}>
          {ev.time} · {ev.participants} joined
        </Text>
      </View>
      <View style={s.eventDateWrap}>
        <Text style={s.eventDate}>{ev.date}</Text>
      </View>
    </View>
  );
}

// ─── ProfileBase ──────────────────────────────────────────────────────────────

export default function ProfileBase({
  mode,
  firstName,
  lastName,
  username,
  photoUrl,
  bio,
  preferredLanguages = [],
  locationLabel,
  followingCount,
  followerCount,
  participatedEventsCount,
  isFollowing = false,
  onFollowPress,
  onMessagePress,
  onEditPress,
  onSharePress,
  onClosePress,
  onMorePress,
  onSeeAllActivityPress,
  recentEvents = [],
  refreshing = false,
  onRefresh,
  footer,
}: ProfileBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Parallax ──────────────────────────────────────────────────────────────
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, HERO_H],
    outputRange: [0, -HERO_H * 0.35],
    extrapolate: "clamp",
  });

  // ── Top-bar fade ──────────────────────────────────────────────────────────
  const topBarBg = scrollY.interpolate({
    inputRange: [HERO_H - 90, HERO_H - 10],
    outputRange: ["rgba(13,13,13,0)", "rgba(13,13,13,0.96)"],
    extrapolate: "clamp",
  });

  // ── Identity fades as body rises ──────────────────────────────────────────
  const identityOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[s.root, { backgroundColor: C.heroBg }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ══════════════════════════════════════════════════════════════════
          HERO — absolute, pinned behind scroll
      ════════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[s.heroAbs, { transform: [{ translateY: heroTranslate }] }]}
        pointerEvents="none"
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={s.heroImg}
            resizeMode="cover"
          />
        ) : (
          <View style={s.heroFallback}>
            <Text style={s.heroInitials}>
              {firstName[0]}
              {lastName[0]}
            </Text>
          </View>
        )}

        {/* Multi-stop scrim: clear top → dark bottom */}
        <View style={s.heroScrim} />
        {/*
         * Prefer expo-linear-gradient for smooth gradients:
         * <LinearGradient
         *   colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)']}
         *   locations={[0, 0.45, 1]}
         *   style={StyleSheet.absoluteFillObject}
         * />
         */}

        {/* Identity block — fades as body scrolls up */}
        <Animated.View style={[s.heroBottom, { opacity: identityOpacity }]}>
          {locationLabel && (
            <View style={s.locationRow}>
              <MapPin
                size={11}
                color="rgba(255,255,255,0.55)"
                strokeWidth={2}
              />
              <Text style={s.locationText}>{locationLabel}</Text>
            </View>
          )}
          {/* Display name uses a serif-style — swap with PlayfairDisplay_700Bold when loaded */}
          <Text style={s.heroName}>
            {firstName} {lastName}
          </Text>
          <Text style={s.heroHandle}>@{username}</Text>
        </Animated.View>
      </Animated.View>

      {/* ══════════════════════════════════════════════════════════════════
          SCROLL LAYER
      ════════════════════════════════════════════════════════════════════ */}
      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: BODY_TOP }]}
        showsVerticalScrollIndicator={false}
        bounces
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.coral}
              colors={[C.coral]}
              progressViewOffset={insets.top + 10}
            />
          ) : undefined
        }
      >
        {/* Body sheet */}
        <View style={s.body}>
          {/* ── Pull indicator ─────────────────────────────────────────── */}
          <View style={s.pullIndicator} />

          {/* ── CTA row ────────────────────────────────────────────────── */}
          <View style={s.ctaRow}>
            {mode === "other" ? (
              <>
                <TouchableOpacity
                  style={[s.followBtn, isFollowing && s.followBtnActive]}
                  activeOpacity={0.85}
                  onPress={onFollowPress}
                >
                  <Text
                    style={[
                      s.followBtnText,
                      isFollowing && s.followBtnTextActive,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.squareBtn}
                  activeOpacity={0.7}
                  onPress={onMessagePress}
                >
                  <MessageCircle
                    size={18}
                    color={C.textSub}
                    strokeWidth={1.8}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.squareBtn}
                  activeOpacity={0.7}
                  onPress={onSharePress}
                >
                  <Share2 size={18} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={s.editBtn}
                  activeOpacity={0.85}
                  onPress={onEditPress}
                >
                  <Edit3 size={14} color={C.text} strokeWidth={2} />
                  <Text style={s.editBtnText}>Edit profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.squareBtn}
                  activeOpacity={0.7}
                  onPress={onSharePress}
                >
                  <Share2 size={18} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Stats — inline text, no cards ──────────────────────────── */}
          <View style={s.statsRow}>
            <StatItem value={fmt(followingCount)} label="Following" />
            <View style={s.statDot} />
            <StatItem value={fmt(followerCount)} label="Followers" />
            <View style={s.statDot} />
            <StatItem
              value={fmt(participatedEventsCount)}
              label="Events"
              accent
            />
          </View>

          {/* ── Bio ────────────────────────────────────────────────────── */}
          {bio ? <Text style={s.bioText}>{bio}</Text> : null}

          {/* ── Languages ──────────────────────────────────────────────── */}
          {preferredLanguages.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Speaks</Text>
              <View style={s.langRow}>
                {preferredLanguages.map((code) => {
                  const upper = code.toUpperCase();
                  return (
                    <View key={code} style={s.langPill}>
                      <Text style={s.langFlag}>{LANG_FLAG[upper] ?? "🌐"}</Text>
                      <Text style={s.langCode}>{upper}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Activity ───────────────────────────────────────────────── */}
          {recentEvents.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionLabelRow}>
                  <Zap
                    size={12}
                    color={C.coral}
                    strokeWidth={2.5}
                    fill={C.coral}
                  />
                  <Text style={s.sectionLabel}>Recent activity</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={onSeeAllActivityPress}
                >
                  <Text style={s.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              <View style={s.eventList}>
                {recentEvents.map((ev, i) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    last={i === recentEvents.length - 1}
                  />
                ))}
              </View>
            </View>
          )}

          {footer}
        </View>
      </Animated.ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          FLOATING TOP BAR
      ════════════════════════════════════════════════════════════════════ */}
      <Animated.View
        style={[
          s.topBar,
          {
            paddingTop: insets.top + 10,
            backgroundColor: topBarBg as any,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={s.navBtn}
          activeOpacity={0.75}
          onPress={onClosePress}
        >
          <ArrowLeft size={16} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={s.navRight}>
          {mode === "own" && (
            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={onEditPress}
            >
              <Edit3 size={14} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={mode === "own" ? onSharePress : onMorePress}
          >
            <MoreHorizontal size={16} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroAbs: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: HERO_H,
    zIndex: 0,
  },
  heroImg: { width: W, height: HERO_H },
  heroFallback: {
    width: W,
    height: HERO_H,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  heroInitials: {
    fontSize: 96,
    fontWeight: "900",
    color: "rgba(255,255,255,0.06)",
    letterSpacing: -4,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.2,
  },
  // ↓ Swap fontFamily to "PlayfairDisplay_700Bold" once expo-google-fonts is installed
  heroName: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.8,
    lineHeight: 44,
    // fontFamily: "PlayfairDisplay_700Bold",
  },
  heroHandle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: 5,
    // fontFamily: "DMSans_400Regular",
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: { paddingBottom: 100 },

  // ── Body sheet ────────────────────────────────────────────────────────────
  body: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // Soft shadow to lift sheet off hero
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 14,
    paddingHorizontal: 22,
    paddingTop: 12,
    minHeight: SCREEN_H - HERO_H + 200,
  },

  // Pull indicator
  pullIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: "center",
    marginBottom: 22,
  },

  // ── CTA row ───────────────────────────────────────────────────────────────
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 24,
  },
  followBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
    // fontFamily: "DMSans_700Bold",
  },
  followBtnTextActive: { color: C.textSub },
  editBtn: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderMid,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    // fontFamily: "DMSans_600SemiBold",
  },
  squareBtn: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderMid,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Stats — inline, minimal ───────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.8,
    // fontFamily: "DMSans_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textMuted,
    letterSpacing: 0.3,
    // fontFamily: "DMSans_500Medium",
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    marginHorizontal: 2,
  },

  // ── Bio ───────────────────────────────────────────────────────────────────
  bioText: {
    fontSize: 15,
    color: C.textSub,
    lineHeight: 24,
    marginBottom: 24,
    // fontFamily: "DMSans_400Regular",
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.1,
    marginBottom: 14,
    // fontFamily: "DMSans_700Bold",
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "600",
    color: C.coral,
    // fontFamily: "DMSans_600SemiBold",
  },

  // ── Languages ─────────────────────────────────────────────────────────────
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  langFlag: { fontSize: 15 },
  langCode: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.5,
    // fontFamily: "DMSans_700Bold",
  },

  // ── Events ────────────────────────────────────────────────────────────────
  eventList: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  eventIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eventIconText: { fontSize: 20 },
  eventInfo: { flex: 1 },
  eventName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
    // fontFamily: "DMSans_600SemiBold",
  },
  eventMeta: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    // fontFamily: "DMSans_400Regular",
  },
  eventDateWrap: {
    backgroundColor: C.surfaceWarm,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eventDate: {
    fontSize: 9,
    fontWeight: "800",
    color: C.coral,
    letterSpacing: 0.6,
    // fontFamily: "DMSans_700Bold",
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  navRight: { flexDirection: "row", gap: 8 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
