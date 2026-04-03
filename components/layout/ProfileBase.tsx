// components/layout/ProfileBase.tsx
//
// 2026 redesign v8 — UNIFIED SCROLL SURFACE
//
// Architecture:
//   • Single Animated.ScrollView owns ALL content (hero + body)
//   • Hero image is the FIRST element in scroll content — never absolutely positioned
//   • Pull-to-refresh: entire page moves together; hero scales up (iOS elastic stretch)
//   • Upward scroll: hero translates up with subtle parallax (0.3× speed), identity fades
//   • Single adaptive nav bar: transparent+light → white+dark, driven by scrollY
//   • StatusBar: light-content over hero → dark-content over white body (threshold logic)
//   • Zero split layers, zero background flash, zero independent scroll artifacts

import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Flame,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Music2,
  RefreshCw,
  Share2,
  Users,
  Youtube
} from "lucide-react-native";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
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
  basketball: "🏀",
  yoga: "🧘",
  running: "🏃",
  tennis: "🎾",
  soccer: "⚽",
  football: "🏈",
  swimming: "🏊",
  cycling: "🚴",
  hiking: "🥾",
  photography: "📸",
  cooking: "👨‍🍳",
  music: "🎵",
  reading: "📚",
  gaming: "🎮",
  travel: "✈️",
  fitness: "💪",
  climbing: "🧗",
  skiing: "⛷️",
  surfing: "🏄",
  volleyball: "🏐",
  boxing: "🥊",
  dance: "💃",
  art: "🎨",
  coffee: "☕",
  wine: "🍷",
  chess: "♟️",
  badminton: "🏸",
  golf: "⛳",
  pilates: "🤸",
  martial: "🥋",
  rugby: "🏉",
  archery: "🏹",
};

// ─── Social config ────────────────────────────────────────────────────────────

const SOCIAL_CFG: Record<string, { color: string; bgLight?: string }> = {
  instagram: { color: "#E1306C", bgLight: "#E1306C14" },
  twitter: { color: "#000000", bgLight: "#00000014" },
  strava: { color: "#FC4C02", bgLight: "#FC4C0214" },
  youtube: { color: "#FF0000", bgLight: "#FF000014" },
  tiktok: { color: "#000000", bgLight: "#00000014" },
  linkedin: { color: "#0A66C2", bgLight: "#0A66C214" },
  spotify: { color: "#1DB954", bgLight: "#1DB95414" },
};

// ─── Category colors + labels ─────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  sport: "#FF6B58",
  social: "#6B5BF5",
  art: "#C084FC",
  food: "#F59E0B",
  nature: "#22C55E",
  music: "#EC4899",
};
const CAT_LABEL: Record<string, string> = {
  sport: "SPORT",
  social: "SOCIAL",
  art: "ART",
  food: "FOOD",
  nature: "NATURE",
  music: "MUSIC",
};

// ─── Language → flag ──────────────────────────────────────────────────────────

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

// ─── Social icon renderer ─────────────────────────────────────────────────────

function SocialIcon({
  platform,
  color,
  size = 18,
}: {
  platform: string;
  color: string;
  size?: number;
}) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram size={size} color={color} strokeWidth={1.8} />;
    case "twitter":
    case "x":
      return (
        <Text style={{ fontSize: size, color, fontWeight: "900" }}>𝕏</Text>
      );
    case "youtube":
      return <Youtube size={size} color={color} strokeWidth={1.8} />;
    case "tiktok":
      return (
        <Text style={{ fontSize: size, color, fontWeight: "900" }}>♪</Text>
      );
    case "linkedin":
      return <Linkedin size={size} color={color} strokeWidth={1.8} />;
    case "spotify":
      return <Music2 size={size} color={color} strokeWidth={1.8} />;
    case "strava":
      return <Flame size={size} color={color} strokeWidth={1.8} />;
    default:
      return <Globe size={size} color={color} strokeWidth={1.8} />;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLink {
  platform:
    | "instagram"
    | "twitter"
    | "strava"
    | "youtube"
    | "tiktok"
    | "linkedin"
    | "spotify";
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
const HERO_H = Math.round(W * 1.05); // hero image height
const SIDE = 20; // horizontal padding
const PARALLAX_FACTOR = 0.3; // hero scrolls 30% slower than content
const NAV_THRESHOLD = HERO_H - 100; // scroll Y where nav turns white
const STATUS_THRESHOLD = HERO_H - 80; // scroll Y where StatusBar turns dark

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
function interestIcon(item: Interest): string {
  if (item.icon) return item.icon;
  return (
    INTEREST_ICONS[item.id.toLowerCase()] ??
    INTEREST_ICONS[item.label.toLowerCase()] ??
    "⚡"
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

const Label = ({ t }: { t: string }) => <Text style={s.label}>{t}</Text>;
const Sep = () => <View style={s.sep} />;

// ─── Interest chips ───────────────────────────────────────────────────────────

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

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({
  ev,
  isFirst,
}: {
  ev: ProfileEvent;
  isFirst?: boolean;
}) {
  const color = ev.category ? (CAT_COLOR[ev.category] ?? C.coral) : C.coral;
  const catLabel = ev.category
    ? (CAT_LABEL[ev.category] ?? ev.category.toUpperCase())
    : "EVENT";
  const fill = ev.maxParticipants
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
      <Text style={s.actName} numberOfLines={1}>
        {ev.name.toUpperCase()}
      </Text>
      <View style={s.actBottom}>
        <Text style={s.actMeta}>
          {ev.time} · {ev.participants} GOING
        </Text>
        {fill !== null && (
          <View style={s.fillTrack}>
            <View
              style={[
                s.fillFill,
                { width: `${fill * 100}%` as any, backgroundColor: color },
              ]}
            />
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
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [photoIdx, setPhotoIdx] = useState(0);
  // Track StatusBar style via JS (needed because Animated can't drive StatusBar directly)
  const [statusBarDark, setStatusBarDark] = useState(false);
  const statusBarDarkRef = useRef(false);
  // Custom pull-to-refresh tracking
  const refreshTriggeredRef = useRef(false);

  const photos = photosProp?.length ? photosProp : photoUrl ? [photoUrl] : [];
  const multiPhoto = photos.length > 1;

  // Reset refresh trigger when refresh completes
  useEffect(() => {
    if (!refreshing) {
      refreshTriggeredRef.current = false;
    }
  }, [refreshing]);

  // ── Handle scroll to toggle StatusBar + custom pull-to-refresh ──────────────
  const handleScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const shouldBeDark = y > STATUS_THRESHOLD;
        if (shouldBeDark !== statusBarDarkRef.current) {
          statusBarDarkRef.current = shouldBeDark;
          setStatusBarDark(shouldBeDark);
        }

        // Custom pull-to-refresh trigger: when scrollY < -100
        // Only trigger once per pull session; reset when refreshing completes
        if (
          y < -100 &&
          !refreshTriggeredRef.current &&
          onRefresh &&
          !refreshing
        ) {
          refreshTriggeredRef.current = true;
          onRefresh();
        }

        // Reset trigger if user releases and scrolls back up
        if (y > -40 && refreshTriggeredRef.current && !refreshing) {
          refreshTriggeredRef.current = false;
        }
      },
    }),
    [onRefresh, refreshing],
  );

  // ── Hero image: parallax on scroll-up, elastic scale on pull-down ──────────
  //
  // For positive scrollY (scroll up): image translates up at PARALLAX_FACTOR speed.
  //   translateY = scrollY * PARALLAX_FACTOR  →  image moves slower → parallax effect
  //
  // For negative scrollY (pull-down): image scales up elastically to fill gap.
  //   More aggressive scale range for premium elastic feel (like Instagram/Apple Photos).

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_H, 0, HERO_H],
    outputRange: [0, 0, HERO_H * PARALLAX_FACTOR],
    extrapolate: "clamp",
  });

  // Enhanced scale: at scrollY=0 → 1.0, at scrollY=-250 → 1.35 (elastic stretch)
  // More aggressive than before for premium feel during pull
  const heroScale = scrollY.interpolate({
    inputRange: [-250, 0],
    outputRange: [1.35, 1.0],
    extrapolate: "clamp",
  });

  // ── Loading indicator animations (custom pull-to-refresh) ───────────────────
  // Show indicator when pulling down or actively refreshing
  const loadingOpacity = scrollY.interpolate({
    inputRange: [-120, -80, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });

  const loadingScale = scrollY.interpolate({
    inputRange: [-120, -80, 0],
    outputRange: [1, 0.9, 0.7],
    extrapolate: "clamp",
  });

  // Identity (name/handle/social) fades out as hero scrolls away
  const identityOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Identity slight upward drift as you scroll
  const identityTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.3],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  // ── Nav bar ────────────────────────────────────────────────────────────────
  // Single nav container, its background and icon color driven by scrollY.
  // Background: transparent → white
  const navBgOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  // Dark icons: invisible → visible
  const navDarkIconOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  // Light icons (over photo): visible → invisible
  const navLightIconOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  // Username label in nav: fades in when white
  const navTitleOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD + 20, NAV_THRESHOLD + 70],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar
        barStyle={statusBarDark ? "dark-content" : "light-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── UNIFIED SCROLL VIEW — single surface ─────────────────────────── */}
      <Animated.ScrollView
        style={[s.scroll, { backgroundColor: C.heroBg }]}
        contentContainerStyle={{ paddingBottom: 100, backgroundColor: C.bg }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* ── HERO BLOCK — first element in scroll, not absolute ────────── */}
        <View style={[s.heroContainer, { height: HERO_H }]}>
          {/* Image with parallax + elastic stretch transform */}
          <Animated.View
            style={[
              s.heroImageWrapper,
              {
                transform: [
                  { translateY: heroTranslateY },
                  { scale: heroScale },
                ],
              },
            ]}
          >
            {photos.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: W, height: HERO_H }}
                scrollEnabled={multiPhoto}
                onMomentumScrollEnd={(e) =>
                  setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
                }
              >
                {photos.map((uri, i) => (
                  <View key={i} style={{ width: W, height: HERO_H }}>
                    <Image
                      source={{ uri }}
                      style={s.heroImg}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={s.heroFallback}>
                <Text style={s.heroFallbackText}>
                  {firstName[0]}
                  {lastName[0]}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Bottom scrim — subtle gradient for text readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={s.scrim}
            pointerEvents="none"
          />

          {/* Custom loading indicator — positioned at top center of hero */}
          {onRefresh && (
            <Animated.View
              style={[
                s.loadingIndicator,
                {
                  opacity: refreshing ? 1 : loadingOpacity,
                  transform: [{ scale: refreshing ? 1 : loadingScale }],
                },
              ]}
              pointerEvents="none"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={C.coral} />
              ) : (
                <RefreshCw size={16} color={C.coral} strokeWidth={2.5} />
              )}
            </Animated.View>
          )}

          {/* Photo dots */}
          {multiPhoto && (
            <View style={s.dotsRow} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === photoIdx && s.dotActive]} />
              ))}
            </View>
          )}

          {/* Add photo button (own mode only) */}
          {mode === "own" && onAddPhotoPress && (
            <TouchableOpacity
              style={[s.addPhotoBtn, { top: insets.top + 54 }]}
              onPress={onAddPhotoPress}
              activeOpacity={0.8}
            >
              <Text style={s.addPhotoText}>+ PHOTO</Text>
            </TouchableOpacity>
          )}

          {/* Identity block — name, handle, socials — fades out on scroll-up */}
          <Animated.View
            style={[
              s.heroIdentity,
              {
                opacity: identityOpacity,
                transform: [{ translateY: identityTranslateY }],
              },
            ]}
            pointerEvents="none"
          >
            {locationLabel && (
              <View style={s.locRow}>
                <MapPin
                  size={9}
                  color="rgba(255,255,255,0.50)"
                  strokeWidth={2}
                />
                <Text style={s.locText}>{locationLabel.toUpperCase()}</Text>
              </View>
            )}
            <Text style={s.heroHandle}>@{username}</Text>
            <Text style={s.heroName}>
              {firstName} {lastName}
            </Text>
            {socialLinks.length > 0 && (
              <View style={s.socialRow}>
                {socialLinks.map((sl) => {
                  const cfg = SOCIAL_CFG[sl.platform];
                  if (!cfg) return null;
                  return (
                    <View
                      key={sl.platform}
                      style={[s.socialIconBg, { backgroundColor: cfg.bgLight }]}
                    >
                      <SocialIcon
                        platform={sl.platform}
                        color={cfg.color}
                        size={16}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── BODY — flows directly after hero, no gap, no rounded corners ── */}
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
                  <Text
                    style={[
                      s.btnPrimaryText,
                      isFollowing && { color: C.textSub },
                    ]}
                  >
                    {isFollowing ? "FOLLOWING" : "FOLLOW"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.btnIcon}
                  activeOpacity={0.7}
                  onPress={onMessagePress}
                >
                  <MessageCircle
                    size={16}
                    color={C.textSub}
                    strokeWidth={1.8}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.btnIcon}
                  activeOpacity={0.7}
                  onPress={onSharePress}
                >
                  <Share2 size={16} color={C.textSub} strokeWidth={1.8} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={s.btnEdit}
                  activeOpacity={0.82}
                  onPress={onEditPress}
                >
                  <Edit3 size={13} color="#fff" strokeWidth={2.2} />
                  <Text style={s.btnEditText}>EDIT PROFILE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.btnIcon}
                  activeOpacity={0.7}
                  onPress={onSharePress}
                >
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
              <Text style={[s.statVal, { color: C.coral }]}>
                {fmt(participatedEventsCount)}
              </Text>
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
                <Text style={[s.metaVal, { color: C.coral }]}>
                  {locationLabel}
                </Text>
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
                <Text
                  style={[
                    s.metaVal,
                    { color: responseRate >= 80 ? "#22C55E" : C.coral },
                  ]}
                >
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
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={onSeeAllActivityPress}
                >
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

      {/* ── SINGLE ADAPTIVE NAV BAR ───────────────────────────────────────── */}
      {/*
        Architecture:
          - One container, always rendered at position:absolute top
          - Animated white background fades in via navBgOpacity
          - Two icon layers (light + dark) cross-fade
          - Username label fades in when white
          No two separate nav components, no switching logic — all interpolated.
      */}
      <View
        style={[s.navContainer, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        {/* White bg — fades in */}
        <Animated.View style={[s.navWhiteBg, { opacity: navBgOpacity }]} />

        {/* Bottom border on white bar */}
        <Animated.View style={[s.navBorderLine, { opacity: navBgOpacity }]} />

        <View style={s.navInner}>
          {/* Back / close button */}
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={onClosePress}
          >
            {/* Light icon layer (over photo) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                s.navIconCenter,
                { opacity: navLightIconOpacity },
              ]}
            >
              <ArrowLeft size={15} color="#fff" strokeWidth={2.5} />
            </Animated.View>
            {/* Dark icon layer (over white bar) */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                s.navIconCenter,
                { opacity: navDarkIconOpacity },
              ]}
            >
              <ArrowLeft size={15} color={C.ink} strokeWidth={2.5} />
            </Animated.View>
          </TouchableOpacity>

          {/* Center: username label — only visible in white bar state */}
          <Animated.Text
            style={[s.navUsername, { opacity: navTitleOpacity }]}
            numberOfLines={1}
          >
            @{username}
          </Animated.Text>

          {/* Right actions */}
          <View style={s.navRight}>
            {mode === "own" && (
              <TouchableOpacity
                style={s.navBtn}
                activeOpacity={0.75}
                onPress={onEditPress}
              >
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    s.navIconCenter,
                    { opacity: navLightIconOpacity },
                  ]}
                >
                  <Edit3 size={13} color="#fff" strokeWidth={2} />
                </Animated.View>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    s.navIconCenter,
                    { opacity: navDarkIconOpacity },
                  ]}
                >
                  <Edit3 size={13} color={C.ink} strokeWidth={2} />
                </Animated.View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={mode === "own" ? onSharePress : onMorePress}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  s.navIconCenter,
                  { opacity: navLightIconOpacity },
                ]}
              >
                <MoreHorizontal size={15} color="#fff" strokeWidth={2} />
              </Animated.View>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  s.navIconCenter,
                  { opacity: navDarkIconOpacity },
                ]}
              >
                <MoreHorizontal size={15} color={C.ink} strokeWidth={2} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Single scroll view covers entire screen ───────────────────────────────
  scroll: { flex: 1 },

  // ── Hero container: fixed height, clips the animated image ───────────────
  heroContainer: {
    width: W,
    height: HERO_H,
    overflow: "hidden", // clips scale-up so it doesn't bleed outside
    backgroundColor: C.heroBg,
  },

  // The animated wrapper that gets translateY + scale
  heroImageWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    // Extra height so parallax translate doesn't reveal a gap at bottom
    height: HERO_H + HERO_H * PARALLAX_FACTOR,
  },

  heroImg: { width: W, height: HERO_H + HERO_H * PARALLAX_FACTOR },

  heroFallback: {
    width: W,
    height: HERO_H + HERO_H * PARALLAX_FACTOR,
    backgroundColor: "#cccccc",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackText: {
    fontSize: 100,
    fontWeight: "900",
    color: "#555555",
    letterSpacing: -4,
  },

  // Subtle gradient scrim for text readability
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_H,
  },

  // Custom pull-to-refresh indicator
  loadingIndicator: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },

  dotsRow: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  dotActive: { width: 16, backgroundColor: "#fff" },

  addPhotoBtn: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addPhotoText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.2,
  },

  heroIdentity: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIDE,
    paddingBottom: 24,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 9,
  },
  locText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.5,
  },
  heroHandle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
    marginBottom: 5,
  },
  heroName: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  socialRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  socialIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  socialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 30,
    alignItems: "center",
  },
  socialBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },

  // ── Body — flat, no border radius, bleed from hero ────────────────────────
  body: { backgroundColor: C.bg, paddingHorizontal: SIDE, paddingTop: 22 },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 24,
  },
  btnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: C.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  btnPrimaryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.2,
  },
  btnEdit: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  btnEditText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.2,
  },
  btnIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: {
    fontSize: 30,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -1.2,
    lineHeight: 32,
  },
  statKey: {
    fontSize: 8,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 1.6,
    marginTop: 4,
  },
  statDiv: {
    width: 1,
    height: 34,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },

  // ── Sep / label ───────────────────────────────────────────────────────────
  sep: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  label: {
    fontSize: 8,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 2.4,
    marginBottom: 12,
  },

  // ── About ─────────────────────────────────────────────────────────────────
  bio: { fontSize: 14, color: C.textSub, lineHeight: 22, marginBottom: 16 },
  metaList: { gap: 11, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  metaKey: { flex: 1, fontSize: 13, color: C.textMuted, fontWeight: "500" },
  metaVal: { fontSize: 13, fontWeight: "700", color: C.ink },
  rateWrap: { marginTop: 12 },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rateTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: C.surfaceAlt,
    overflow: "hidden",
  },
  rateFill: { height: 3, borderRadius: 2 },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: C.textSub,
    letterSpacing: 0.8,
  },

  // ── Languages ─────────────────────────────────────────────────────────────
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  langFlag: { fontSize: 16 },
  langCode: {
    fontSize: 11,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.5,
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  actHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  actTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  actDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.coral },
  actHeaderLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 2.4,
  },
  seeAll: {
    fontSize: 9,
    fontWeight: "800",
    color: C.coral,
    letterSpacing: 0.6,
  },
  actList: { gap: 9, marginBottom: 4 },
  actCard: {
    backgroundColor: C.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  catDot: { width: 4, height: 4, borderRadius: 2 },
  catPillText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  latestPill: {
    backgroundColor: C.coral,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  latestText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  actDate: {
    marginLeft: "auto" as any,
    fontSize: 9,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.4,
  },
  actName: {
    fontSize: 17,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.4,
    lineHeight: 19,
  },
  actBottom: { flexDirection: "row", alignItems: "center", gap: 9 },
  actMeta: { flex: 1, fontSize: 10, color: C.textMuted, fontWeight: "600" },
  fillTrack: {
    width: 50,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.border,
    overflow: "hidden",
  },
  fillFill: { height: 3, borderRadius: 2 },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Adaptive nav bar ──────────────────────────────────────────────────────
  navContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  navWhiteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
  },
  navBorderLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.border,
  },
  navInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // Subtle dark-glass pill visible over photo
    overflow: "hidden",
  },
  navIconCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  navUsername: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 0.8,
  },
  navRight: { flexDirection: "row" },
});
