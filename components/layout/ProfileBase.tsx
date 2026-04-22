// components/layout/ProfileBase.tsx
//
// 2026 redesign v9 — REAL EVENT DATA
//
// Changes from v8:
//  • Accepts `eventsLoading` prop — shows skeleton cards while events load.
//  • ProfileEvent._kind, ._startScheduledTo, ._locationName, ._categoryName
//    are forwarded directly to MyEventCard (full-width).
//  • Empty state shown when events load but none exist.
// ─────────────────────────────────────────────────────────────────────────────

import InterestBadge from "@/components/common/InterestBadge";
import MyEventCard from "@/components/common/event/cards/MyEventCard";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Calendar,
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
  Youtube,
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

const STICKER_COLORS = [{ bg: "#E8E6E0", border: "#B5B2AC", text: "#111111" }];

function getRandomStickerColor(index: number) {
  return STICKER_COLORS[index % STICKER_COLORS.length];
}

const SOCIAL_CFG: Record<string, { color: string; bgLight?: string }> = {
  instagram: { color: "#E1306C", bgLight: "#E1306C14" },
  twitter: { color: "#000000", bgLight: "#00000014" },
  strava: { color: "#FC4C02", bgLight: "#FC4C0214" },
  youtube: { color: "#FF0000", bgLight: "#FF000014" },
  tiktok: { color: "#000000", bgLight: "#00000014" },
  linkedin: { color: "#0A66C2", bgLight: "#0A66C214" },
  spotify: { color: "#1DB954", bgLight: "#1DB95414" },
};

const CAT_COLOR: Record<string, string> = {
  sport: "#FF6B58",
  social: "#6B5BF5",
  art: "#C084FC",
  food: "#F59E0B",
  nature: "#22C55E",
  music: "#EC4899",
};

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
  id: number | string;
  name: string;
  icon: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants?: number;
  imageUrl?: string;
  category?: keyof typeof CAT_COLOR;
  // ── Real API data fields consumed by MyEventCard ──────────────────────────
  _startScheduledTo?: string;
  _locationName?: string;
  _categoryName?: string;
  _kind?: "created" | "participated";
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
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onMessagePress?: () => void;
  onEditPress?: () => void;
  onSharePress?: () => void;
  onClosePress?: () => void;
  onMorePress?: () => void;
  onSeeAllActivityPress?: () => void;
  onAddPhotoPress?: () => void;
  recentEvents?: ProfileEvent[];
  /** When true shows skeleton cards while events are being fetched */
  eventsLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W, height: SCREEN_H } = Dimensions.get("window");
const HERO_H_WITH_PHOTO = Math.round(W * 1.1);
const HERO_H_NO_PHOTO = Math.round(W * 0.8);
const SIDE = 20;
const PARALLAX_FACTOR = 0.3;
const SKELETON_COUNT = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonEventCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  return (
    <Animated.View style={[sk.card, { opacity }]}>
      {/* Badge skeleton */}
      <View style={sk.badge} />
      {/* Title skeleton */}
      <View style={sk.titleFull} />
      <View style={sk.titleHalf} />
      {/* Meta skeleton */}
      <View style={sk.meta} />
      {/* Footer skeleton */}
      <View style={sk.footer} />
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },
  badge: {
    width: 70,
    height: 20,
    borderRadius: 6,
    backgroundColor: C.surfaceAlt,
  },
  titleFull: {
    width: "80%",
    height: 16,
    borderRadius: 4,
    backgroundColor: C.surfaceAlt,
  },
  titleHalf: {
    width: "50%",
    height: 16,
    borderRadius: 4,
    backgroundColor: C.surfaceAlt,
  },
  meta: {
    width: "40%",
    height: 10,
    borderRadius: 4,
    backgroundColor: C.surfaceAlt,
  },
  footer: {
    width: "60%",
    height: 10,
    borderRadius: 4,
    backgroundColor: C.surfaceAlt,
    marginTop: 4,
  },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyEventsState({ isOwnProfile }: { isOwnProfile: boolean }) {
  return (
    <View style={emp.wrap}>
      <View style={emp.iconWrap}>
        <Calendar size={22} color={C.textMuted} strokeWidth={1.6} />
      </View>
      <Text style={emp.title}>No events yet</Text>
      <Text style={emp.sub}>
        {isOwnProfile
          ? "Events you create or join will appear here."
          : "This user hasn't joined any events yet."}
      </Text>
    </View>
  );
}

const emp = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textSub,
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 220,
  },
});

// ─── Atoms ────────────────────────────────────────────────────────────────────

const Label = ({ t }: { t: string }) => <Text style={s.label}>{t}</Text>;
const Sep = () => <View style={s.sep} />;

// ─── Interest chips ───────────────────────────────────────────────────────────

function InterestChips({ interests }: { interests: Interest[] }) {
  return (
    <View style={s.chipsWrap}>
      {interests.map((item) => (
        <InterestBadge
          key={item.id}
          interest={{
            id: item.id,
            name: item.label,
            label: item.label,
            icon: undefined,
            color: null,
          }}
          size="sm"
          variant="chip"
          showLabel={true}
          showIcon={false}
        />
      ))}
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
  onFollowersPress,
  onFollowingPress,
  onMessagePress,
  onEditPress,
  onSharePress,
  onClosePress,
  onMorePress,
  onSeeAllActivityPress,
  onAddPhotoPress,
  recentEvents = [],
  eventsLoading = false,
  refreshing = false,
  onRefresh,
  footer,
}: ProfileBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [photoIdx, setPhotoIdx] = useState(0);
  const [statusBarDark, setStatusBarDark] = useState(false);
  const statusBarDarkRef = useRef(false);
  const refreshTriggeredRef = useRef(false);

  const photos = photosProp?.length ? photosProp : photoUrl ? [photoUrl] : [];
  const multiPhoto = photos.length > 1;
  const hasPhotos = photos.length > 0;
  const HERO_H = hasPhotos ? HERO_H_WITH_PHOTO : HERO_H_NO_PHOTO;
  const NAV_THRESHOLD = HERO_H - 100;
  const STATUS_THRESHOLD = HERO_H - 80;

  useEffect(() => {
    if (!refreshing) {
      refreshTriggeredRef.current = false;
    }
  }, [refreshing]);

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
        if (
          y < -100 &&
          !refreshTriggeredRef.current &&
          onRefresh &&
          !refreshing
        ) {
          refreshTriggeredRef.current = true;
          onRefresh();
        }
        if (y > -40 && refreshTriggeredRef.current && !refreshing) {
          refreshTriggeredRef.current = false;
        }
      },
    }),
    [onRefresh, refreshing],
  );

  // ── Animations ─────────────────────────────────────────────────────────────

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_H, 0, HERO_H],
    outputRange: [0, 0, HERO_H * PARALLAX_FACTOR],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-250, 0],
    outputRange: [1.35, 1.0],
    extrapolate: "clamp",
  });
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
  const identityOpacity = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const identityTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_H * 0.3],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });
  const navBgOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const navDarkIconOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const navLightIconOpacity = scrollY.interpolate({
    inputRange: [NAV_THRESHOLD, NAV_THRESHOLD + 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
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

      <Animated.ScrollView
        style={[s.scroll, { backgroundColor: C.heroBg }]}
        contentContainerStyle={{ paddingBottom: 100, backgroundColor: C.bg }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <View
          style={[s.heroContainer, { height: HERO_H }]}
          key={`hero-${HERO_H}`}
        >
          <Animated.View
            style={[
              s.heroImageWrapper,
              {
                height: HERO_H + HERO_H * PARALLAX_FACTOR,
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
                style={{ width: W, height: HERO_H, backgroundColor: C.heroBg }}
                scrollEnabled={multiPhoto}
                onMomentumScrollEnd={(e) =>
                  setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
                }
              >
                {photos.map((uri, i) => (
                  <View key={i} style={{ width: W, height: HERO_H }}>
                    <Image
                      source={{ uri }}
                      style={[s.heroImg, { height: HERO_H }]}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View
                style={[
                  s.heroFallback,
                  { height: HERO_H + HERO_H * PARALLAX_FACTOR },
                ]}
              >
                <Text style={s.heroFallbackText}>
                  {firstName[0]}
                  {lastName[0]}
                </Text>
              </View>
            )}
          </Animated.View>

          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.35)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[s.scrim, { height: HERO_H }]}
            pointerEvents="none"
          />

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

          {multiPhoto && (
            <View style={s.dotsRow} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === photoIdx && s.dotActive]} />
              ))}
            </View>
          )}

          {mode === "own" && onAddPhotoPress && (
            <TouchableOpacity
              style={[s.addPhotoBtn, { top: insets.top + 54 }]}
              onPress={onAddPhotoPress}
              activeOpacity={0.8}
            >
              <Text style={s.addPhotoText}>+ PHOTO</Text>
            </TouchableOpacity>
          )}

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
          </Animated.View>
        </View>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <View style={[s.body, { minHeight: SCREEN_H - HERO_H + 280 }]}>
          {/* Stats */}
          <View style={s.statsRow}>
            <TouchableOpacity
              style={s.statItem}
              activeOpacity={0.75}
              onPress={onFollowersPress}
            >
              <Text
                style={[s.statVal2, onFollowersPress && { color: C.textSub }]}
              >
                {fmt(followerCount)}
              </Text>
              <Text style={s.statKey}>FOLLOWERS</Text>
            </TouchableOpacity>
            <View style={s.statDiv} />
            <TouchableOpacity
              style={s.statItem}
              activeOpacity={0.75}
              onPress={onFollowingPress}
            >
              <Text
                style={[s.statVal2, onFollowingPress && { color: C.textSub }]}
              >
                {fmt(followingCount)}
              </Text>
              <Text style={s.statKey}>FOLLOWING</Text>
            </TouchableOpacity>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.coral }]}>
                {fmt(participatedEventsCount)}
              </Text>
              <Text style={s.statKey}>EVENTS</Text>
            </View>
          </View>

          {/* CTA */}
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

          {/* Social links */}
          {socialLinks.length > 0 && (
            <View style={s.bodySocialSection}>
              <View style={s.bodySocialIcons}>
                {socialLinks.map((sl) => {
                  const cfg = SOCIAL_CFG[sl.platform];
                  if (!cfg) return null;
                  return (
                    <SocialIcon
                      key={sl.platform}
                      platform={sl.platform}
                      color={cfg.color}
                      size={20}
                    />
                  );
                })}
              </View>
            </View>
          )}

          <Sep />

          {/* About */}
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

          {/* Interests */}
          {interests.length > 0 && (
            <>
              <Label t="INTERESTS" />
              <InterestChips interests={interests} />
              <Sep />
            </>
          )}

          {/* Languages */}
          {preferredLanguages.length > 0 && (
            <>
              <Label t="SPEAKS" />
              <View style={s.langRow}>
                {preferredLanguages.map((code, idx) => {
                  const up = code.toUpperCase();
                  const color = getRandomStickerColor(idx + 100);
                  return (
                    <View
                      key={code}
                      style={[
                        s.langPill,
                        {
                          backgroundColor: color.bg,
                          borderColor: color.border,
                        },
                      ]}
                    >
                      <Text style={s.langFlag}>{LANG_FLAG[up] ?? "🌐"}</Text>
                      <Text style={[s.langCode, { color: color.text }]}>
                        {up}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Sep />
            </>
          )}

          {/* ── RECENT ACTIVITY ─────────────────────────────────────────── */}
          <>
            <View style={s.actHeader}>
              <View style={s.actTitleRow}>
                <View style={s.actDot} />
                <Text style={s.actHeaderLabel}>RECENT ACTIVITY</Text>
                {eventsLoading && (
                  <ActivityIndicator
                    size="small"
                    color={C.coral}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              {!eventsLoading && recentEvents.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={onSeeAllActivityPress}
                >
                  <Text style={s.seeAll}>SEE ALL →</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={s.actList}>
              {eventsLoading ? (
                // Skeleton placeholders
                Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonEventCard key={`sk-${i}`} />
                ))
              ) : recentEvents.length > 0 ? (
                // Real event cards
                recentEvents.map((ev) => (
                  <MyEventCard
                    key={String(ev.id)}
                    eventId={String(ev.id)}
                    title={ev.name}
                    startScheduledTo={
                      ev._startScheduledTo ??
                      (ev.date && ev.date !== "TBD"
                        ? `${new Date().getFullYear()} ${ev.date} ${ev.time}`.trim()
                        : undefined)
                    }
                    kind={ev._kind ?? "participated"}
                    currentCount={ev.participants}
                    maxCount={ev.maxParticipants}
                    locationName={ev._locationName}
                    categoryName={ev._categoryName}
                    fullWidth
                    onPress={() => {
                      // TODO: navigate to event detail
                    }}
                  />
                ))
              ) : (
                // Empty state
                <EmptyEventsState isOwnProfile={mode === "own"} />
              )}
            </View>
          </>

          {footer}
        </View>
      </Animated.ScrollView>

      {/* ── ADAPTIVE NAV BAR ─────────────────────────────────────────────── */}
      <View
        style={[s.navContainer, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[s.navWhiteBg, { opacity: navBgOpacity }]} />
        <Animated.View style={[s.navBorderLine, { opacity: navBgOpacity }]} />

        <View style={s.navInner}>
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={onClosePress}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                s.navIconCenter,
                { opacity: navLightIconOpacity },
              ]}
            >
              <ArrowLeft size={15} color="#fff" strokeWidth={2.5} />
            </Animated.View>
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

          <Animated.Text
            style={[s.navUsername, { opacity: navTitleOpacity }]}
            numberOfLines={1}
          >
            @{username}
          </Animated.Text>

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
  scroll: { flex: 1 },

  heroContainer: { width: W, overflow: "hidden", backgroundColor: C.heroBg },
  heroImageWrapper: { position: "absolute", top: 0, left: 0, width: W },
  heroImg: { width: W },
  heroFallback: {
    width: W,
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
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
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  heroName: {
    fontSize: 27,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.6,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  body: { backgroundColor: C.bg, paddingHorizontal: SIDE, paddingTop: 22 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: {
    fontSize: 38,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  statVal2: {
    fontSize: 38,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -1.2,
    lineHeight: 38,
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

  ctaRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  btnPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: C.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: C.textSub,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.4,
  },
  btnEdit: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: C.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  btnEditText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.4,
  },
  btnIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.text,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  bodySocialSection: { marginVertical: 8 },
  bodySocialIcons: {
    flexDirection: "row",
    paddingHorizontal: SIDE,
    gap: 24,
    justifyContent: "flex-start",
  },

  sep: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: C.text,
    letterSpacing: 0.7,
    marginBottom: 10,
  },

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

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 4,
  },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 4 },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  langFlag: { fontSize: 14 },
  langCode: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },

  // ── Recent Activity ─────────────────────────────────────────────────────
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

  // ── Nav bar ────────────────────────────────────────────────────────────
  navContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navWhiteBg: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg },
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
    overflow: "hidden",
  },
  navIconCenter: { alignItems: "center", justifyContent: "center" },
  navUsername: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 0.5,
  },
  navRight: { flexDirection: "row" },
});
