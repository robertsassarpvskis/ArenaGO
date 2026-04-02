// components/layout/ProfileBase.tsx
//
// 2026 redesign v7 — street / editorial / flat.
//
// Design brief:
//   • Matches Discover page: white bg, bold ink type, coral accent, clean cards
//   • Hero bleeds DIRECTLY into flat white body — zero rounded card, zero drag handle
//   • Scroll nav: dark-glass buttons over photo → clean white bar after (NO dark overlay)
//   • Activity cards: Discover event-card language (cat pill + bold name + fill bar)
//   • Interest chips: flex-wrap, outlined, street style
//   • Zero glass-morphism, zero heavy shadows, zero dark scrolling artifacts
//
// Used by:
//   • MyProfileScreen   (mode="own")   — Edit + Share, Sign Out footer
//   • UserProfileScreen (mode="other") — Follow + Message

import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Users,
} from "lucide-react-native";
import React, { ReactNode, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Design tokens ────────────────────────────────────────────────────────────

export const C = {
  bg: "#FAFAFA",
  surface: "#F5F3EE",
  surfaceAlt: "#ECEAE4",
  border: "#E8E6E0",
  borderMid: "#D4D2CC",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  coral: "#FF6B58",
  ink: "#111111",
  heroBg: "#1A1A1A",
} as const;

// ─── Interest icon map ────────────────────────────────────────────────────────

const INTEREST_ICONS: Record<string, string> = {
  basketball: "🏀", yoga: "🧘", running: "🏃", tennis: "🎾",
  soccer: "⚽", football: "🏈", swimming: "🏊", cycling: "🚴",
  hiking: "🥾", photography: "📸", cooking: "👨‍🍳", music: "🎵",
  reading: "📚", gaming: "🎮", travel: "✈️", fitness: "💪",
  climbing: "🧗", skiing: "⛷️", surfing: "🏄", volleyball: "🏐",
  boxing: "🥊", dance: "💃", art: "🎨", coffee: "☕",
  wine: "🍷", chess: "♟️", badminton: "🏸", golf: "⛳",
  pilates: "🤸", martial: "🥋", rugby: "🏉", archery: "🏹",
};

// ─── Social config ────────────────────────────────────────────────────────────

const SOCIAL_CFG: Record<string, { label: string; bg: string; color: string }> = {
  instagram: { label: "IG",  bg: "#E1306C", color: "#fff" },
  twitter:   { label: "𝕏",   bg: "#000000", color: "#fff" },
  strava:    { label: "ST",  bg: "#FC4C02", color: "#fff" },
  youtube:   { label: "YT",  bg: "#FF0000", color: "#fff" },
  tiktok:    { label: "TK",  bg: "#010101", color: "#fff" },
  linkedin:  { label: "IN",  bg: "#0A66C2", color: "#fff" },
  spotify:   { label: "SP",  bg: "#1DB954", color: "#fff" },
};

// ─── Category colors + labels ─────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  sport:  "#FF6B58",
  social: "#6B5BF5",
  art:    "#C084FC",
  food:   "#F59E0B",
  nature: "#22C55E",
  music:  "#EC4899",
};

const CAT_LABEL: Record<string, string> = {
  sport:  "SPORT",
  social: "SOCIAL",
  art:    "ART",
  food:   "FOOD",
  nature: "NATURE",
  music:  "MUSIC",
};

// ─── Language → flag ──────────────────────────────────────────────────────────

const LANG_FLAG: Record<string, string> = {
  EN: "🇬🇧", LV: "🇱🇻", RU: "🇷🇺", DE: "🇩🇪",
  FR: "🇫🇷", ES: "🇪🇸", IT: "🇮🇹", PL: "🇵🇱",
  LT: "🇱🇹", EE: "🇪🇪", FI: "🇫🇮", SV: "🇸🇪",
  NL: "🇳🇱", PT: "🇵🇹", ZH: "🇨🇳", JA: "🇯🇵",
  KO: "🇰🇷", AR: "🇸🇦",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLink {
  platform: "instagram" | "twitter" | "strava" | "youtube" | "tiktok" | "linkedin" | "spotify";
  handle: string;
  url?: string;
}

export interface Interest {
  id: string;
  label: string;
  icon?: string;
}

export interface ProfileEvent {
  id: number;
  name: string;
  icon: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants?: number;
  imageUrl?: string;
  category?: keyof typeof CAT_COLOR;
}

export interface ProfileBaseProps {
  mode: "own" | "other";
  firstName: string;
  lastName: string;
  username: string;
  photoUrl?: string;
  photos?: string[];
  bio?: string;
  interests?: Interest[];
  socialLinks?: SocialLink[];
  preferredLanguages?: string[];
  locationLabel?: string;
  memberSince?: string;
  responseRate?: number;
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
  onAddPhotoPress?: () => void;
  recentEvents?: ProfileEvent[];
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W, height: SCREEN_H } = Dimensions.get("window");
const HERO_H = Math.round(W * 1.05);
const SIDE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function interestIcon(item: Interest): string {
  if (item.icon) return item.icon;
  return INTEREST_ICONS[item.id.toLowerCase()]
    ?? INTEREST_ICONS[item.label.toLowerCase()]
    ?? "⚡";
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

const Label = ({ t }: { t: string }) => <Text style={s.label}>{t}</Text>;
const Sep   = () => <View style={s.sep} />;

// ─── Interest chips (flex-wrap, street style) ─────────────────────────────────

function InterestChips({ interests }: { interests: Interest[] }) {
  return (
    <View style={s.chipsWrap}>
      {interests.map((item) => (
        <View key={item.id} style={s.chip}>
          <Text style={s.chipEmoji}>{interestIcon(item)}</Text>
          <Text style={s.chipLabel}>{item.label.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Activity card — Discover event card language ─────────────────────────────

function ActivityCard({ ev, isFirst }: { ev: ProfileEvent; isFirst?: boolean }) {
  const color    = ev.category ? (CAT_COLOR[ev.category] ?? C.coral) : C.coral;
  const catLabel = ev.category ? (CAT_LABEL[ev.category] ?? ev.category.toUpperCase()) : "EVENT";
  const fill     = ev.maxParticipants
    ? Math.min(ev.participants / ev.maxParticipants, 1)
    : null;

  return (
    <View style={s.actCard}>
      <View style={s.actTop}>
        <View style={[s.catPill, { backgroundColor: `${color}14` }]}>
          <View style={[s.catDot, { backgroundColor: color }]} />
          <Text style={[s.catPillText, { color }]}>{catLabel}</Text>
        </View>
        {isFirst && (
          <View style={s.latestPill}>
            <Text style={s.latestText}>LATEST</Text>
          </View>
        )}
        <Text style={s.actDate}>{ev.date}</Text>
      </View>

      <Text style={s.actName} numberOfLines={1}>{ev.name.toUpperCase()}</Text>

      <View style={s.actBottom}>
        <Text style={s.actMeta}>{ev.time}  ·  {ev.participants} GOING</Text>
        {fill !== null && (
          <View style={s.fillTrack}>
            <View style={[s.fillFill, { width: `${fill * 100}%` as any, backgroundColor: color }]} />
          </View>
        )}
        <View style={[s.arrowBtn, { backgroundColor: color }]}>
          <ArrowRight size={11} color="#fff" strokeWidth={2.5} />
        </View>
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
  photos: photosProp,
  bio,
  interests = [],
  socialLinks = [],
  preferredLanguages = [],
  locationLabel,
  memberSince,
  responseRate,
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
  onAddPhotoPress,
  recentEvents = [],
  refreshing = false,
  onRefresh,
  footer,
}: ProfileBaseProps) {
  const insets   = useSafeAreaInsets();
  const scrollY  = useRef(new Animated.Value(0)).current;
  const [photoIdx, setPhotoIdx] = useState(0);

  const photos     = photosProp?.length ? photosProp : photoUrl ? [photoUrl] : [];
  const multiPhoto = photos.length > 1;

  // ── Scroll-driven values ──────────────────────────────────────────────────

  const heroY = scrollY.interpolate({
    inputRange: [0, HERO_H],
    outputRange: [0, -HERO_H * 0.26],
    extrapolate: "clamp",
  });

  // Dark buttons over photo fade OUT
  const darkNavOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 10],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // White bar fades IN — clean, NO dark overlay ever
  const whiteBarOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Identity fades with hero
  const identityOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.28],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[s.heroAbs, { transform: [{ translateY: heroY }] }]}
        pointerEvents="box-none"
      >
        {photos.length > 0 ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={{ width: W, height: HERO_H }}
            scrollEnabled={multiPhoto}
            onMomentumScrollEnd={(e) =>
              setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
            }
          >
            {photos.map((uri, i) => (
              <View key={i} style={{ width: W, height: HERO_H }}>
                <Image source={{ uri }} style={s.heroImg} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={s.heroFallback}>
            <Text style={s.heroFallbackText}>{firstName[0]}{lastName[0]}</Text>
          </View>
        )}

        {/* Bottom-only scrim — swap for LinearGradient for sharper directional fade */}
        <View style={s.scrim} pointerEvents="none" />

        {multiPhoto && (
          <View style={s.dotsRow} pointerEvents="none">
            {photos.map((_, i) => (
              <View key={i} style={[s.dot, i === photoIdx && s.dotActive]} />
            ))}
          </View>
        )}

        {mode === "own" && onAddPhotoPress && (
          <TouchableOpacity
            style={[s.addPhotoBtn, { top: insets.top + 52 }]}
            onPress={onAddPhotoPress}
            activeOpacity={0.8}
          >
            <Text style={s.addPhotoText}>+ PHOTO</Text>
          </TouchableOpacity>
        )}

        <Animated.View
          style={[s.heroIdentity, { opacity: identityOpacity }]}
          pointerEvents="none"
        >
          {locationLabel && (
            <View style={s.locRow}>
              <MapPin size={9} color="rgba(255,255,255,0.45)" strokeWidth={2} />
              <Text style={s.locText}>{locationLabel.toUpperCase()}</Text>
            </View>
          )}
          <Text style={s.heroName}>
            {firstName.toUpperCase()}{"\n"}{lastName.toUpperCase()}
          </Text>
          <Text style={s.heroHandle}>@{username}</Text>
          {socialLinks.length > 0 && (
            <View style={s.socialRow}>
              {socialLinks.map((sl) => {
                const cfg = SOCIAL_CFG[sl.platform];
                if (!cfg) return null;
                return (
                  <View key={sl.platform} style={[s.socialBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.socialBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </Animated.View>

      {/* ── SCROLL ───────────────────────────────────────────────────────── */}
      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingTop: HERO_H, paddingBottom: 100 }}
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
              progressViewOffset={insets.top + 12}
            />
          ) : undefined
        }
      >
        {/* FLAT body — no borderRadius, no shadow, direct bleed from hero */}
        <View style={[s.body, { minHeight: SCREEN_H - HERO_H + 280 }]}>

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <View style={s.ctaRow}>
            {mode === "other" ? (
              <>
                <TouchableOpacity
                  style={[s.btnPrimary, isFollowing && s.btnOutline]}
                  activeOpacity={0.82}
                  onPress={onFollowPress}
                >
                  <Text style={[s.btnPrimaryText, isFollowing && { color: C.textSub }]}>
                    {isFollowing ? "FOLLOWING" : "FOLLOW"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnIcon} activeOpacity={0.7} onPress={onMessagePress}>
                  <MessageCircle size={16} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
                <TouchableOpacity style={s.btnIcon} activeOpacity={0.7} onPress={onSharePress}>
                  <Share2 size={16} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={s.btnEdit} activeOpacity={0.82} onPress={onEditPress}>
                  <Edit3 size={13} color="#fff" strokeWidth={2.2} />
                  <Text style={s.btnEditText}>EDIT PROFILE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnIcon} activeOpacity={0.7} onPress={onSharePress}>
                  <Share2 size={16} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── STATS ────────────────────────────────────────────────────── */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{fmt(followerCount)}</Text>
              <Text style={s.statKey}>FOLLOWERS</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{fmt(followingCount)}</Text>
              <Text style={s.statKey}>FOLLOWING</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.coral }]}>{fmt(participatedEventsCount)}</Text>
              <Text style={s.statKey}>EVENTS</Text>
            </View>
          </View>

          <Sep />

          {/* ── ABOUT ────────────────────────────────────────────────────── */}
          <Label t="ABOUT" />

          {bio ? <Text style={s.bio}>{bio}</Text> : null}

          <View style={s.metaList}>
            {locationLabel && (
              <View style={s.metaRow}>
                <MapPin size={13} color={C.textMuted} strokeWidth={2} />
                <Text style={s.metaKey}>Location</Text>
                <Text style={[s.metaVal, { color: C.coral }]}>{locationLabel}</Text>
              </View>
            )}
            {memberSince && (
              <View style={s.metaRow}>
                <Users size={13} color={C.textMuted} strokeWidth={2} />
                <Text style={s.metaKey}>Member since</Text>
                <Text style={s.metaVal}>{memberSince}</Text>
              </View>
            )}
          </View>

          {responseRate != null && (
            <View style={s.rateWrap}>
              <View style={s.rateHeader}>
                <Text style={s.metaKey}>Response rate</Text>
                <Text style={[s.metaVal, { color: responseRate >= 80 ? "#22C55E" : C.coral }]}>
                  {responseRate}%
                </Text>
              </View>
              <View style={s.rateTrack}>
                <View
                  style={[
                    s.rateFill,
                    {
                      width: `${responseRate}%` as any,
                      backgroundColor: responseRate >= 80 ? "#22C55E" : C.coral,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <Sep />

          {/* ── INTERESTS ────────────────────────────────────────────────── */}
          {interests.length > 0 && (
            <>
              <Label t="INTERESTS" />
              <InterestChips interests={interests} />
              <Sep />
            </>
          )}

          {/* ── LANGUAGES ────────────────────────────────────────────────── */}
          {preferredLanguages.length > 0 && (
            <>
              <Label t="SPEAKS" />
              <View style={s.langRow}>
                {preferredLanguages.map((code) => {
                  const up = code.toUpperCase();
                  return (
                    <View key={code} style={s.langPill}>
                      <Text style={s.langFlag}>{LANG_FLAG[up] ?? "🌐"}</Text>
                      <Text style={s.langCode}>{up}</Text>
                    </View>
                  );
                })}
              </View>
              <Sep />
            </>
          )}

          {/* ── RECENT ACTIVITY ──────────────────────────────────────────── */}
          {recentEvents.length > 0 && (
            <>
              <View style={s.actHeader}>
                <View style={s.actTitleRow}>
                  <View style={s.actDot} />
                  <Text style={s.actHeaderLabel}>RECENT ACTIVITY</Text>
                </View>
                <TouchableOpacity activeOpacity={0.6} onPress={onSeeAllActivityPress}>
                  <Text style={s.seeAll}>SEE ALL →</Text>
                </TouchableOpacity>
              </View>
              <View style={s.actList}>
                {recentEvents.map((ev, i) => (
                  <ActivityCard key={ev.id} ev={ev} isFirst={i === 0} />
                ))}
              </View>
            </>
          )}

          {footer}
        </View>
      </Animated.ScrollView>

      {/* ── DARK-GLASS NAV — over photo only, fades out ──────────────────── */}
      <Animated.View
        style={[s.navFloating, { paddingTop: insets.top + 10, opacity: darkNavOpacity }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity style={s.navDark} activeOpacity={0.75} onPress={onClosePress}>
          <ArrowLeft size={15} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.navRight}>
          {mode === "own" && (
            <TouchableOpacity style={s.navDark} activeOpacity={0.75} onPress={onEditPress}>
              <Edit3 size={13} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.navDark}
            activeOpacity={0.75}
            onPress={mode === "own" ? onSharePress : onMorePress}
          >
            <MoreHorizontal size={15} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── WHITE TOP BAR — fades in on scroll, Discover-style ───────────── */}
      <Animated.View
        style={[s.whiteBar, { paddingTop: insets.top, opacity: whiteBarOpacity }]}
        pointerEvents="box-none"
      >
        <View style={s.whiteBarBg} />
        <TouchableOpacity style={s.navLight} activeOpacity={0.75} onPress={onClosePress}>
          <ArrowLeft size={15} color={C.ink} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.whiteBarName} numberOfLines={1}>
          {firstName.toUpperCase()} {lastName.toUpperCase()}
        </Text>
        <View style={s.navRight}>
          {mode === "own" && (
            <TouchableOpacity style={s.navLight} activeOpacity={0.75} onPress={onEditPress}>
              <Edit3 size={13} color={C.ink} strokeWidth={2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.navLight}
            activeOpacity={0.75}
            onPress={mode === "own" ? onSharePress : onMorePress}
          >
            <MoreHorizontal size={15} color={C.ink} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.heroBg },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroAbs: { position: "absolute", top: 0, left: 0, width: W, height: HERO_H, zIndex: 0 },
  heroImg: { width: W, height: HERO_H },
  heroFallback: {
    width: W, height: HERO_H, backgroundColor: "#111",
    alignItems: "center", justifyContent: "center",
  },
  heroFallbackText: {
    fontSize: 100, fontWeight: "900",
    color: "rgba(255,255,255,0.06)", letterSpacing: -4,
  },

  // Scrim — swap this View for expo-linear-gradient for a true bottom-fade
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.32)" },

  dotsRow: {
    position: "absolute", bottom: 100, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.28)" },
  dotActive: { width: 16, backgroundColor: "#fff" },

  addPhotoBtn: {
    position: "absolute", right: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
  },
  addPhotoText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1.2 },

  heroIdentity: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: SIDE, paddingBottom: 24,
  },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 9 },
  locText: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.45)", letterSpacing: 1.5 },
  heroName: {
    fontSize: 42, fontWeight: "900", color: "#fff",
    letterSpacing: -2, lineHeight: 42, marginBottom: 7,
  },
  heroHandle: { fontSize: 11, color: "rgba(255,255,255,0.30)", marginBottom: 13 },
  socialRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  socialBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, minWidth: 30, alignItems: "center" },
  socialBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },

  // FLAT — no borderRadius, no shadow
  body: { backgroundColor: C.bg, paddingHorizontal: SIDE, paddingTop: 22 },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 26 },
  btnPrimary: {
    flex: 1, height: 46, borderRadius: 10,
    backgroundColor: C.coral, alignItems: "center", justifyContent: "center",
  },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: C.borderMid },
  btnPrimaryText: { fontSize: 11, fontWeight: "900", color: "#fff", letterSpacing: 1.2 },
  btnEdit: {
    flex: 1, height: 46, borderRadius: 10, backgroundColor: C.ink,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  btnEditText: { fontSize: 11, fontWeight: "900", color: "#fff", letterSpacing: 1.2 },
  btnIcon: {
    width: 46, height: 46, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center",
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 26 },
  statItem: { flex: 1 },
  statVal: { fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -1.2, lineHeight: 32 },
  statKey: { fontSize: 8, fontWeight: "700", color: C.textMuted, letterSpacing: 1.6, marginTop: 4 },
  statDiv: { width: 1, height: 34, backgroundColor: C.border, marginHorizontal: 14 },

  // ── Sep / label ───────────────────────────────────────────────────────────
  sep: { height: 1, backgroundColor: C.border, marginVertical: 22 },
  label: { fontSize: 8, fontWeight: "800", color: C.textMuted, letterSpacing: 2.4, marginBottom: 14 },

  // ── About ─────────────────────────────────────────────────────────────────
  bio: { fontSize: 14, color: C.textSub, lineHeight: 22, marginBottom: 16 },
  metaList: { gap: 11, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  metaKey: { flex: 1, fontSize: 13, color: C.textMuted, fontWeight: "500" },
  metaVal: { fontSize: 13, fontWeight: "700", color: C.ink },
  rateWrap: { marginTop: 12 },
  rateHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rateTrack: { height: 3, borderRadius: 2, backgroundColor: C.surfaceAlt, overflow: "hidden" },
  rateFill: { height: 3, borderRadius: 2 },

  // ── Interest chips ────────────────────────────────────────────────────────
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 11,
    borderRadius: 9, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 9, fontWeight: "800", color: C.textSub, letterSpacing: 0.8 },

  // ── Languages ─────────────────────────────────────────────────────────────
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  langPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 7, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  langFlag: { fontSize: 13 },
  langCode: { fontSize: 10, fontWeight: "800", color: C.text, letterSpacing: 0.6 },

  // ── Activity ──────────────────────────────────────────────────────────────
  actHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  actTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  actDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.coral },
  actHeaderLabel: { fontSize: 8, fontWeight: "900", color: C.ink, letterSpacing: 2.4 },
  seeAll: { fontSize: 9, fontWeight: "800", color: C.coral, letterSpacing: 0.6 },
  actList: { gap: 9, marginBottom: 4 },

  // Discover-style card
  actCard: {
    backgroundColor: C.surface, borderRadius: 13,
    borderWidth: 1, borderColor: C.border, padding: 13, gap: 6,
  },
  actTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  catPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5,
  },
  catDot: { width: 4, height: 4, borderRadius: 2 },
  catPillText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  latestPill: { backgroundColor: C.coral, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4 },
  latestText: { fontSize: 7, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  actDate: { marginLeft: "auto" as any, fontSize: 9, fontWeight: "700", color: C.textMuted, letterSpacing: 0.4 },
  actName: { fontSize: 17, fontWeight: "900", color: C.ink, letterSpacing: -0.4, lineHeight: 19 },
  actBottom: { flexDirection: "row", alignItems: "center", gap: 9 },
  actMeta: { flex: 1, fontSize: 10, color: C.textMuted, fontWeight: "600" },
  fillTrack: { width: 50, height: 3, borderRadius: 2, backgroundColor: C.border, overflow: "hidden" },
  fillFill: { height: 3, borderRadius: 2 },
  arrowBtn: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },

  // ── Nav ───────────────────────────────────────────────────────────────────
  navFloating: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 10,
  },
  navDark: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  whiteBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 6, paddingBottom: 10, paddingTop: 10,
  },
  whiteBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  whiteBarName: {
    flex: 1, textAlign: "center",
    fontSize: 12, fontWeight: "900", color: C.ink, letterSpacing: 0.6,
  },
  navLight: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  navRight: { flexDirection: "row" },
});