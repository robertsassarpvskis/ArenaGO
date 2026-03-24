// ─── EventModal.tsx ───────────────────────────────────────────────────────────
// Event modal for basic (not joined) and participant (already joined) view modes.
// Author view is handled by AuthorEventModal.tsx.
// Redesign: title + time live in the hero, all actions consolidated in the
// bottom bar (Join / Save / Share), top chrome simplified to Close only.
// See → Understand → Act layout principle.
//
// Dismiss gesture — Bolt Food style:
//   • Over-scroll past the top of the list (rubber-band, scrollY < -OVERSCROLL_DISMISS)
//   • Fast downward flick while already at the top (velocity > VELOCITY_DISMISS)
//   • Drag the handle bar downward as before
// No-image hero is a flat dark block — no gradient noise.

import JoinEventButton from "@/components/common/buttons/JoinEventButton";
import EventLocationMap from "@/components/common/event/EventLocationMap";
import { useLocation } from "@/hooks/useLocation";
import { formatDistance, getDistanceKm } from "@/scripts/distance";
import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import UserProfileModal from "../modal/UserProfileModal";
import {
  Avatar,
  BaseEventModalProps,
  C,
  DISMISS_THRESHOLD,
  Divider,
  EyebrowLabel,
  H_PAD,
  MODAL_HEIGHT,
  Pill,
  SCREEN_HEIGHT,
  sharedS
} from "./EventModalBase";
import UserListModal, { UserListParticipant } from "./UserListModal";

// ─── Dismiss constants ────────────────────────────────────────────────────────

// px over-scrolled past top required to trigger dismiss (rubber-band)
const OVERSCROLL_DISMISS = 52;
// downward velocity threshold (px/ms) for a flick-to-dismiss while at top
const VELOCITY_DISMISS = 0.55;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventModalProps extends BaseEventModalProps {
  viewMode?: "basic" | "participant";
  onJoin: () => void;
  onLeave?: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

// ─── Participant bottom bar ───────────────────────────────────────────────────

function ParticipantBottomBar({ onLeave }: { onLeave: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLeave = () => {
    Alert.alert("Leave Event", "Are you sure you want to leave this event?", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onLeave },
    ]);
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.03,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 4,
      }),
    ]).start();
  }, []);

  return (
    <View style={sharedS.bottomInner}>
      <Animated.View
        style={[ES.joinedStatusPill, { transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons name="checkmark-circle" size={17} color="#FFF" />
        <View>
          <Text style={ES.joinedStatusLabel}>YOU'RE IN</Text>
          <Text style={ES.joinedStatusSub}>You're attending</Text>
        </View>
      </Animated.View>
      <Pressable style={ES.leaveBtn} onPress={handleLeave}>
        <Ionicons name="exit-outline" size={16} color={C.red} />
        <Text style={ES.leaveBtnText}>LEAVE</Text>
      </Pressable>
    </View>
  );
}

// Basic bottom bar: Join (flex) + Save + Share icon buttons side by side
function BasicBottomBar({
  eventId,
  isSaved,
  onToggleSave,
  onShare,
}: {
  eventId: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
}) {
  return (
    <View style={sharedS.bottomInner}>
      <View style={{ flex: 1 }}>
        <JoinEventButton eventId={eventId} variant="modal" />
      </View>
      <Pressable
        style={[ES.iconBtn, isSaved && ES.iconBtnSaved]}
        onPress={onToggleSave}
        hitSlop={8}
      >
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={21}
          color={isSaved ? "#FFF" : C.ink}
        />
      </Pressable>
      <Pressable style={ES.iconBtn} onPress={onShare} hitSlop={8}>
        <Ionicons name="arrow-redo-outline" size={21} color={C.ink} />
      </Pressable>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventModal({
  visible,
  viewMode = "basic",
  event,
  onClose,
  onJoin,
  onLeave,
  isSaved,
  onToggleSave,
  isLoading = false,
  accessToken = "",
  onEventUpdated,
}: EventModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpac = useRef(new Animated.Value(0)).current;
  // dragY drives the handle-bar drag-to-dismiss (still works as a fallback)
  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const startY = useRef(0);

  // ── Bolt-Food scroll-to-dismiss ────────────────────────────────────────────
  // True whenever the list is at the very top (scrollY === 0)
  const scrollAtTop = useRef(true);
  // Guard: only fire dismiss once per gesture
  const dismissing = useRef(false);

  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const { location: userLocation } = useLocation();

  const eventDistance = useMemo(() => {
    if (!userLocation || !event) return null;
    const coords =
      event.location && typeof event.location === "object"
        ? (event.location as { latitude: number; longitude: number })
        : null;
    if (!coords) return null;
    const km = getDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      coords.latitude,
      coords.longitude,
    );
    return formatDistance(km);
  }, [userLocation, event?.id, event?.location]);

  const [fullParticipants, setFullParticipants] = useState<
    UserListParticipant[]
  >([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsFetched, setParticipantsFetched] = useState(false);

  const isParticipant = viewMode === "participant";
  const isBasic = viewMode === "basic";

  useEffect(() => {
    setParticipantsFetched(false);
    setFullParticipants([]);
  }, [event?.id]);

  const fetchParticipants = useCallback(async () => {
    if (!event?.id || participantsFetched) return;
    setParticipantsLoading(true);
    try {
      const res = await fetch(`/api/Events/${event.id}/participants`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw: any[] = Array.isArray(data)
        ? data
        : (data.participants ?? data.items ?? []);
      const mapped: UserListParticipant[] = raw.map((p: any) => ({
        username: p.username ?? p.userName ?? "",
        displayName: p.displayName ?? p.display_name ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? p.profile_photo ?? null,
        bio: p.bio ?? null,
      }));
      setFullParticipants(mapped);
      setParticipantsFetched(true);
    } catch (err) {
      console.warn("[EventModal] Failed to fetch participants:", err);
      const preview = (event?.participantsPreview ?? []).map((p: any) => ({
        username: p.username ?? "",
        displayName: p.displayName ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? null,
        bio: p.bio ?? null,
      }));
      setFullParticipants(preview);
      setParticipantsFetched(true);
    } finally {
      setParticipantsLoading(false);
    }
  }, [event?.id, accessToken, participantsFetched]);

  const handleOpenParticipants = useCallback(() => {
    if (
      (event?.participantsPreview?.length ?? 0) > 0 ||
      (event?.attendees ?? 0) > 0
    ) {
      setShowParticipants(true);
      fetchParticipants();
    }
  }, [event, fetchParticipants]);

  // ── Sheet enter / exit animations ─────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      dismissing.current = false;
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 70,
        }),
        Animated.timing(backdropOpac, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpac, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // ── Shared dismiss animation ───────────────────────────────────────────────
  const animateDismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      onClose();
    });
  }, [onClose]);

  // ── Bolt-Food scroll-to-dismiss ────────────────────────────────────────────
  // Strategy: attach to ScrollView's onScroll + onMomentumScrollEnd.
  //   1. onScroll keeps scrollAtTop in sync.
  //   2. onScrollBeginDrag: reset dismissing guard.
  //   3. onMomentumScrollEnd (or onScrollEndDrag for slow flicks):
  //      if scrollY ≤ 0 AND contentOffset.y crossed below -OVERSCROLL_DISMISS
  //      → dismiss.
  //   4. Fast downward velocity while at top → dismiss immediately.

  const handleScrollBeginDrag = useCallback(() => {
    // allow a new dismiss attempt each time the user starts dragging
    dismissing.current = false;
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      scrollAtTop.current = y <= 0;
    },
    [],
  );

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, velocity } = e.nativeEvent;
      const y = contentOffset.y;
      const vy = velocity?.y ?? 0;

      // Over-scrolled past threshold while at top
      if (y < -OVERSCROLL_DISMISS) {
        animateDismiss();
        return;
      }
      // Fast downward flick from the top
      if (scrollAtTop.current && vy > VELOCITY_DISMISS) {
        animateDismiss();
      }
    },
    [animateDismiss],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y < -OVERSCROLL_DISMISS) animateDismiss();
    },
    [animateDismiss],
  );

  // ── Handle-bar drag-to-dismiss (fallback) ─────────────────────────────────
  const onTouchStart = useCallback((e: any) => {
    isDragging.current = true;
    startY.current = e.nativeEvent.pageY;
    dragY.setValue(0);
  }, []);

  const onTouchMove = useCallback((e: any) => {
    if (!isDragging.current) return;
    const dy = e.nativeEvent.pageY - startY.current;
    if (dy > 0) dragY.setValue(dy);
  }, []);

  const onTouchEnd = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const dy = e.nativeEvent.pageY - startY.current;
      const vy = e.nativeEvent.velocityY ?? 0;
      if (dy > DISMISS_THRESHOLD || vy > 0.6) {
        animateDismiss();
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }).start();
      }
    },
    [animateDismiss],
  );

  const handleShare = () => {
    if (!event) return;
    Share.share({
      title: event.title,
      message: `"${event.title}" on ArenaGo · ${event.locationName ?? ""}`,
    });
  };

  const handleSelectUser = (username: string) => setSelectedUsername(username);
  const handleCloseProfile = () => setSelectedUsername(null);

  if (!event && !isLoading) return null;

  const dragProgress = dragY.interpolate({
    inputRange: [0, DISMISS_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const sheetScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });
  const sheetOpacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.5],
  });

  const imageUri = event
    ? typeof event.image === "string"
      ? event.image
      : event.image?.url
    : undefined;

  const coords =
    event && typeof event.location === "object"
      ? (event.location as { latitude: number; longitude: number })
      : null;

  const eventTime = event
    ? typeof event.time === "string"
      ? Math.floor(Date.parse(event.time) / 1000)
      : (event.time as any)
    : 0;
  const timeLabel = event ? getTimeLabel(eventTime) : "";
  const timeFormat = event ? formatEventTime(eventTime) : "";

  // Sheet top border — only shown for participant mode
  const sheetBorderColor = isParticipant ? C.joined : "transparent";
  const sheetBorderWidth = isParticipant ? 2 : 0;

  const displayParticipants: UserListParticipant[] = participantsFetched
    ? fullParticipants
    : (event?.participantsPreview ?? []).map((p: any) => ({
        username: p.username ?? "",
        displayName: p.displayName ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? null,
        bio: p.bio ?? null,
      }));

  const mapGradient: [string, string] = isParticipant
    ? [C.joined, C.joinedLight]
    : [C.accent, C.accentLight];

  // Hero height: taller when we have an image so the overlaid content has room.
  // When no image we use a dark fallback so the title text always sits on a
  // dark surface and remains legible.
  const hasImage = !!imageUri;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View style={[sharedS.backdrop, { opacity: backdropOpac }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            sharedS.sheet,
            {
              height: MODAL_HEIGHT,
              borderTopColor: sheetBorderColor,
              borderTopWidth: sheetBorderWidth,
              transform: [
                { translateY: Animated.add(translateY, dragY) },
                { scale: sheetScale },
              ],
              opacity: sheetOpacity,
            },
          ]}
        >
          {/* Drag handle */}
          <View
            style={sharedS.handleRow}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <View style={sharedS.handle} />
          </View>

          {isLoading ? (
            <View style={sharedS.centered}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={sharedS.loadingText}>LOADING</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 0 }}
                showsVerticalScrollIndicator={false}
                // ── Bolt-Food dismiss: over-scroll up or fast flick down from top
                bounces
                overScrollMode="always"
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                keyboardShouldPersistTaps="handled"
              >
                {/* ── HERO — title + time live here ───────────────────────── */}
                <View style={[ES.hero, !hasImage && ES.heroNoImage]}>
                  {hasImage && (
                    <Image
                      source={{ uri: imageUri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  )}
                  {/* No-image: flat dark block — no gradient noise */}
                  {!hasImage && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: isParticipant
                            ? "#064e3b"
                            : "#0F172A",
                        },
                      ]}
                    />
                  )}

                  {/* Scrim gradient: only when an image is present */}
                  {hasImage && (
                    <LinearGradient
                      colors={[
                        "rgba(15,23,42,0.08)",
                        "rgba(15,23,42,0.20)",
                        "rgba(15,23,42,0.72)",
                        C.bg,
                      ]}
                      locations={[0, 0.3, 0.72, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                  )}

                  {/* Optional participant tint overlay */}
                  {isParticipant && hasImage && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: "rgba(5,150,105,0.06)" },
                      ]}
                    />
                  )}

                  {/* Top-right: close button only — simplified chrome */}
                  <View style={ES.heroChromeRow}>
                    {isParticipant && (
                      <View style={ES.heroJoinedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="#FFF"
                        />
                        <Text style={ES.heroJoinedBadgeText}>IN</Text>
                      </View>
                    )}
                    <Pressable
                      style={[
                        ES.heroCloseBtn,
                        !hasImage && ES.heroCloseBtnLight,
                      ]}
                      onPress={onClose}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={hasImage ? "#FFF" : C.ink}
                      />
                    </Pressable>
                  </View>

                  {/* Bottom: category + distance pills, then title + time.
                       Colors flip between white-on-dark (image) and
                       ink-on-dark (no-image flat block). */}
                  <View style={ES.heroContent}>
                    <View style={ES.heroPillRow}>
                      <Pill
                        label={event!.category}
                        bg={
                          isParticipant
                            ? "rgba(5,150,105,0.88)"
                            : hasImage
                              ? "rgba(15,23,42,0.72)"
                              : "rgba(255,107,88,0.20)"
                        }
                        color={hasImage || isParticipant ? "#FFF" : C.accent}
                      />
                      {!!eventDistance && (
                        <View
                          style={[
                            sharedS.pill,
                            {
                              backgroundColor: "rgba(16,185,129,0.88)",
                              marginLeft: 6,
                              flexDirection: "row",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <Ionicons
                            name="navigate"
                            size={12}
                            color="#FFF"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[sharedS.pillText, { color: "#FFF" }]}>
                            {eventDistance} AWAY
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Title: white over image, white over flat dark block too */}
                    <Text style={ES.heroTitle}>{event!.title}</Text>

                    <View style={sharedS.timeRow}>
                      <View
                        style={[
                          ES.heroTimeBadge,
                          {
                            backgroundColor: isParticipant
                              ? "rgba(5,150,105,0.30)"
                              : hasImage
                                ? "rgba(255,107,88,0.30)"
                                : "rgba(255,107,88,0.18)",
                            borderColor: isParticipant
                              ? "rgba(16,185,129,0.5)"
                              : "rgba(255,138,115,0.5)",
                          },
                        ]}
                      >
                        <Ionicons
                          name="flash"
                          size={12}
                          color={isParticipant ? "#6ee7b7" : "#FFAA99"}
                        />
                        <Text
                          style={[
                            ES.heroTimeBadgeText,
                            {
                              color: isParticipant ? "#6ee7b7" : "#FFAA99",
                            },
                          ]}
                        >
                          {timeLabel.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          sharedS.timeSep,
                          { backgroundColor: "rgba(255,255,255,0.30)" },
                        ]}
                      />
                      <Text style={ES.heroTimeStr}>{timeFormat}</Text>
                    </View>
                  </View>
                </View>

                {/* ── STATS BAR — see at a glance ─────────────────────────── */}
                <View style={ES.statsBar}>
                  <View style={ES.statItem}>
                    <Text style={ES.statValue}>{event!.attendees}</Text>
                    <Text style={ES.statLabel}>GOING</Text>
                  </View>
                  <View style={ES.statDivider} />
                  <View style={ES.statItem}>
                    <Text style={ES.statValue}>
                      {event!.maxParticipants ?? "∞"}
                    </Text>
                    <Text style={ES.statLabel}>CAPACITY</Text>
                  </View>
                  <View style={ES.statDivider} />
                  <View style={ES.statItem}>
                    <Text
                      style={[
                        ES.statValue,
                        !!eventDistance && ES.statValueGreen,
                      ]}
                    >
                      {eventDistance ?? "—"}
                    </Text>
                    <Text style={ES.statLabel}>DISTANCE</Text>
                  </View>
                </View>

                <Divider />

                {/* WHERE */}
                <View style={sharedS.block}>
                  <EyebrowLabel>WHERE</EyebrowLabel>
                  <Text style={sharedS.locationText}>
                    {event!.locationName ??
                      (typeof event!.location === "string"
                        ? event!.location
                        : "")}
                  </Text>
                </View>

                <EventLocationMap
                  coords={coords}
                  userCoords={userLocation}
                  locationName={event!.locationName ?? event!.title}
                  gradientColors={mapGradient}
                />

                <Divider />

                {/* ATTENDING */}
                <Pressable
                  style={ES.attendeeBlock}
                  onPress={handleOpenParticipants}
                >
                  <View style={{ flex: 1 }}>
                    <EyebrowLabel>ATTENDING</EyebrowLabel>
                    <View style={ES.avatarCluster}>
                      {(event!.participantsPreview ?? [])
                        .slice(0, 5)
                        .map((p, i) => (
                          <View
                            key={i}
                            style={{
                              marginLeft: i > 0 ? -14 : 0,
                              zIndex: 10 - i,
                            }}
                          >
                            <Avatar
                              participant={p}
                              size={44}
                              borderColor={C.bg}
                              onPress={handleOpenParticipants}
                            />
                          </View>
                        ))}
                      {(event!.attendees ?? 0) > 5 && (
                        <View style={[ES.overflowAvatar, { marginLeft: -14 }]}>
                          <Text style={ES.overflowText}>
                            +{event!.attendees - 5}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={ES.attendeeInfo}>
                      <Text style={ES.attendeeCountText}>
                        <Text
                          style={{ color: isParticipant ? C.joined : C.accent }}
                        >
                          {event!.attendees}
                        </Text>
                        {event!.maxParticipants ? (
                          <Text style={{ color: C.mid }}>
                            /{event!.maxParticipants}
                          </Text>
                        ) : (
                          ""
                        )}{" "}
                        going
                      </Text>
                      {event!.spotsLeft != null && event!.spotsLeft > 0 && (
                        <View style={ES.spotsBadge}>
                          <Ionicons
                            name="ticket-outline"
                            size={11}
                            color={C.amber}
                          />
                          <Text style={[ES.spotsText, { color: C.amber }]}>
                            {event!.spotsLeft} SPOTS LEFT
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>

                <Divider />

                {/* ABOUT */}
                {!!event!.description && (
                  <>
                    <View style={sharedS.block}>
                      <EyebrowLabel>ABOUT</EyebrowLabel>
                      <Text style={sharedS.bodyText}>{event!.description}</Text>
                    </View>
                    <Divider />
                  </>
                )}

                {/* HOST */}
                <Pressable
                  style={ES.hostCard}
                  onPress={() => {
                    if (event!.author?.username)
                      setSelectedUsername(event!.author.username);
                  }}
                >
                  <View style={ES.hostStamp}>
                    <Text style={ES.hostStampText}>
                      {event!.author?.username?.substring(0, 2).toUpperCase() ??
                        "??"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ES.hostLabel}>HOST</Text>
                    <Text style={ES.hostUsername}>
                      @{event!.author?.username ?? "unknown"}
                    </Text>
                  </View>
                  <View style={ES.hostArrow}>
                    <Ionicons name="arrow-forward" size={13} color={C.mid} />
                  </View>
                </Pressable>

                <View style={{ height: 120 }} />
              </ScrollView>

              {/* ── BOTTOM BAR — all actions in one row ─────────────────── */}
              <View style={sharedS.bottomBar}>
                {isParticipant && (
                  <ParticipantBottomBar
                    onLeave={() => {
                      onLeave?.();
                      onClose();
                    }}
                  />
                )}
                {isBasic && (
                  <BasicBottomBar
                    eventId={event!.id}
                    isSaved={isSaved}
                    onToggleSave={onToggleSave}
                    onShare={handleShare}
                  />
                )}
              </View>
            </>
          )}
        </Animated.View>
      </Modal>

      <UserListModal
        visible={showParticipants}
        participants={displayParticipants}
        total={event?.attendees ?? 0}
        isLoading={participantsLoading}
        onClose={() => setShowParticipants(false)}
        accentColor={isParticipant ? C.joined : C.accent}
        onSelectUser={handleSelectUser}
      />

      {selectedUsername !== null && (
        <UserProfileModal
          username={selectedUsername}
          onBack={handleCloseProfile}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ES = StyleSheet.create({
  // ── Hero — title + time overlay ─────────────────────────────────────────────
  hero: {
    height: 320,
    width: "100%",
    position: "relative",
    justifyContent: "flex-end",
  },
  // No image: shorter flat block — no image, no gradient, clean dark surface
  heroNoImage: {
    height: 220,
  },

  // Close button + optional "IN" badge float in the top-right of the hero
  heroChromeRow: {
    position: "absolute",
    top: 14,
    right: H_PAD,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  // Over dark image — frosted dark glass
  heroCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Over flat dark block (no image) — neutral warm-white, ink icon
  heroCloseBtnLight: {
    backgroundColor: "rgba(245,244,239,0.95)",
    borderColor: "rgba(0,0,0,0.08)",
  },
  heroJoinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.joined,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroJoinedBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.8,
  },

  // Content anchored to the bottom of the hero
  heroContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 18,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.8,
    lineHeight: 34,
    textTransform: "uppercase",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  heroTimeBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroTimeStr: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: -0.2,
  },

  // ── Stats bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: H_PAD,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
  },
  statValueGreen: {
    color: C.green,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 1.5,
    marginTop: 3,
    textTransform: "uppercase",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: C.divider,
    marginVertical: 6,
  },

  // ── Icon buttons in the basic bottom bar ──────────────────────────────────
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(245,244,239,0.98)",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.09)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconBtnSaved: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },

  // ── Participant bottom bar pill ───────────────────────────────────────────
  joinedStatusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.joined,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  joinedStatusLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },
  joinedStatusSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.70)",
    marginTop: 1,
  },

  // Leave button — red is semantic (destructive)
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: `${C.red}40`,
    borderRadius: 14,
    backgroundColor: `${C.red}08`,
  },
  leaveBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: C.red,
    letterSpacing: 1.2,
  },

  // ── Attendees ─────────────────────────────────────────────────────────────
  attendeeBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingVertical: 20,
  },
  avatarCluster: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  overflowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.divider,
    borderWidth: 2.5,
    borderColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  overflowText: { fontSize: 12, fontWeight: "900", color: C.mid },
  attendeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  attendeeCountText: {
    fontSize: 17,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.3,
  },
  spotsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(245,158,11,0.10)",
  },
  spotsText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },

  // ── Host card ─────────────────────────────────────────────────────────────
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: H_PAD,
    paddingVertical: 20,
  },
  hostStamp: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  hostStampText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: C.ink,
  },
  hostLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: C.muted,
    textTransform: "uppercase",
  },
  hostUsername: {
    fontSize: 17,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  hostArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },
});
