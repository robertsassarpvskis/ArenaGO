// ─── EventModal.tsx ───────────────────────────────────────────────────────────
// Minimalist × Street/Urban modal redesign.
//
// Layout order:
//   Hero (full-bleed, drag handle overlaid) → Stats → Attending → About → Where → Map → Host
//
// Hero behaviour (Bolt Food style):
//   • Hero image fills the top of the sheet edge-to-edge.
//   • Drag handle floats over the image (white pill, semi-transparent).
//   • No empty space above the image.
//   • No-image fallback: plain neutral strip — handle overlaid the same way.
//
// CategoryPill:
//   • Warm filled rounded pill replacing the old ink-block Tag chip.
//   • Color varies by category via getCategoryPillStyle palette.
//
// Dismiss gesture (Bolt-Food style):
//   • Over-scroll past top past OVERSCROLL_DISMISS
//   • Fast downward flick from top (velocity > VELOCITY_DISMISS)
//   • Handle bar drag

import JoinEventButton from "@/components/common/buttons/JoinEventButton";
import EventLocationMap from "@/components/common/event/EventLocationMap";
import InterestBadge from "@/components/common/InterestBadge";
import { useLocation } from "@/hooks/useLocation";
import { formatDistance, getDistanceKm } from "@/scripts/distance";
import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import {
  Avatar,
  BaseEventModalProps,
  C,
  CategoryPill,
  DISMISS_THRESHOLD,
  Divider,
  H_PAD,
  MODAL_HEIGHT,
  SCREEN_HEIGHT,
  SectionLabel,
  sharedS,
} from "../../components/layout/EventModalBase";
import UserProfileModal from "../modal/UserProfileModal";
import UserListModal, { UserListParticipant } from "./UserListModal";

// ─── Dismiss constants ────────────────────────────────────────────────────────

const OVERSCROLL_DISMISS = 36;
const VELOCITY_DISMISS = 0.55;

// ─── Hero height ──────────────────────────────────────────────────────────────
// Matches the Bolt Food screenshot proportions (~56% of 390px screen width).
const HERO_HEIGHT = 320;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventModalProps extends BaseEventModalProps {
  viewMode?: "basic" | "participant";
  onJoin: () => void;
  onLeave?: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelectUser?: (username: string) => void;
}

// ─── Bottom bars ─────────────────────────────────────────────────────────────

function ParticipantBottomBar({ onLeave }: { onLeave: () => void }) {
  const handleLeave = () => {
    Alert.alert("Leave Event", "Are you sure you want to leave this event?", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onLeave },
    ]);
  };

  return (
    <View style={sharedS.bottomInner}>
      <View style={MS.joinedPill}>
        <Ionicons name="checkmark" size={14} color={C.joined} />
        <Text style={MS.joinedPillText}>YOU'RE IN</Text>
      </View>
      <Pressable style={MS.leaveBtn} onPress={handleLeave}>
        <Text style={MS.leaveBtnText}>LEAVE</Text>
      </Pressable>
    </View>
  );
}

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
        style={[MS.squareBtn, isSaved && MS.squareBtnActive]}
        onPress={onToggleSave}
        hitSlop={8}
      >
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={18}
          color={isSaved ? "#FFF" : C.ink}
        />
      </Pressable>
      <Pressable style={MS.squareBtn} onPress={onShare} hitSlop={8}>
        <Ionicons name="arrow-redo-outline" size={18} color={C.ink} />
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
  onSelectUser,
}: EventModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpac = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const startY = useRef(0);

  const scrollAtTop = useRef(true);
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
      const res = await fetch(
        `http://217.182.74.113:30080/api/Events/${event.id}/participants`,
        {
          headers: {
            accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let participations: any[] = [];

      if (Array.isArray(data)) {
        participations = data;
      } else if (data?.participations && Array.isArray(data.participations)) {
        participations = data.participations;
      } else if (data?.participants && Array.isArray(data.participants)) {
        participations = data.participants;
      } else if (data?.items && Array.isArray(data.items)) {
        participations = data.items;
      } else if (data?.data && Array.isArray(data.data)) {
        participations = data.data;
      }

      const mapped: UserListParticipant[] = [];

      for (const p of participations) {
        const user = p.userSummary ?? p.user ?? p;
        if (!user.username && !user.userName) continue;
        mapped.push({
          username: user.username ?? user.userName ?? "",
          displayName:
            user.displayName || user.display_name || user.firstName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : (user.username ?? user.userName ?? ""),
          profilePhoto: user.profilePhoto ?? user.profile_photo ?? null,
          bio: user.bio ?? user.biography ?? null,
        });
      }

      setFullParticipants(mapped);
      setParticipantsFetched(true);
      setParticipantsLoading(false);
    } catch (err) {
      console.warn("Failed to fetch participants from API, using preview", err);
      const preview = (event?.participantsPreview ?? [])
        .map((p: any) => ({
          username: p.username ?? p.userName ?? "",
          displayName:
            p.displayName ?? p.display_name ?? p.username ?? p.userName ?? "",
          profilePhoto: p.profilePhoto ?? p.profile_photo ?? null,
          bio: null,
        }))
        .filter((p) => p.username);

      setFullParticipants(preview.length > 0 ? preview : []);
      setParticipantsFetched(true);
      setParticipantsLoading(false);
    }
  }, [event?.id, accessToken, participantsFetched]);

  const handleOpenParticipants = useCallback(() => {
    setShowParticipants(true);
    if (!participantsFetched) {
      fetchParticipants();
    }
  }, [fetchParticipants, participantsFetched]);

  // ── Sheet animations ──────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      dismissing.current = false;
      dragY.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 10,
          tension: 65,
        }),
        Animated.timing(backdropOpac, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpac, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animateDismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      onClose();
    });
  }, [onClose]);

  // ── Scroll dismiss ────────────────────────────────────────────────────────
  const handleScrollBeginDrag = useCallback(() => {
    dismissing.current = false;
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollAtTop.current = e.nativeEvent.contentOffset.y <= 0;
    },
    [],
  );

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, velocity } = e.nativeEvent;
      if (contentOffset.y < -OVERSCROLL_DISMISS) {
        animateDismiss();
        return;
      }
      if (scrollAtTop.current && (velocity?.y ?? 0) > VELOCITY_DISMISS)
        animateDismiss();
    },
    [animateDismiss],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (e.nativeEvent.contentOffset.y < -OVERSCROLL_DISMISS) animateDismiss();
    },
    [animateDismiss],
  );

  // ── Handle-bar drag ───────────────────────────────────────────────────────
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
      if (dy > DISMISS_THRESHOLD || (e.nativeEvent.velocityY ?? 0) > 0.6) {
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
      message: `${event.title} · ${event.locationName ?? ""}`,
    });
  };

  if (!event && !isLoading) return null;

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

  const hasImage = !!imageUri;

  const displayParticipants: UserListParticipant[] = participantsFetched
    ? fullParticipants
    : (event?.participantsSummary?.participantsPreview ?? []).map((p: any) => ({
        username: p.username ?? "",
        displayName: p.displayName ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? null,
        bio: null,
      }));

  const dragProgress = dragY.interpolate({
    inputRange: [0, DISMISS_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const sheetOpacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  const sheetBorderColor = isParticipant ? C.joined : "transparent";

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* ── Backdrop ── */}
        <Animated.View style={[sharedS.backdrop, { opacity: backdropOpac }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* ── Sheet ── */}
        <Animated.View
          style={[
            sharedS.sheet,
            {
              height: MODAL_HEIGHT,
              borderTopColor: sheetBorderColor,
              borderTopWidth: isParticipant ? 2 : 0,
              transform: [{ translateY }],
              opacity: sheetOpacity,
            },
          ]}
        >
          {/*
           * ── Drag handle (overlaid) ──────────────────────────────────────
           * Rendered OUTSIDE the ScrollView so it always sits on top of the
           * hero image, matching Bolt Food's pattern exactly.
           * position: "absolute" is set in sharedS.handleRow.
           */}
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
              <ActivityIndicator size="small" color={C.ink} />
              <Text style={sharedS.loadingText}>LOADING</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 0 }}
                showsVerticalScrollIndicator={false}
                bounces
                overScrollMode="always"
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                keyboardShouldPersistTaps="handled"
              >
                {/* ────────────────────────────────────────────────────────
                    HERO (SCROLLS WITH CONTENT)
                ──────────────────────────────────────────────────────── */}
                {hasImage ? (
                  <View style={MS.heroImage}>
                    <Image
                      source={{ uri: imageUri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {/* Subtle bottom scrim so close button is always legible */}

                    {/* Close button — white circle, top-right */}
                    <Pressable
                      style={MS.closeBtn}
                      onPress={onClose}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={20} color={C.ink} />
                    </Pressable>

                    {/* Participant joined badge — bottom-left overlay */}
                    {isParticipant && (
                      <View style={MS.heroJoinedBadge}>
                        <Ionicons name="checkmark" size={11} color={C.joined} />
                        <Text style={MS.heroJoinedText}>JOINED</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // No image — thin neutral header strip
                  <View style={MS.heroPlain}>
                    {isParticipant && (
                      <View style={MS.heroJoinedBadge}>
                        <Pressable style={MS.closeBtnDark} onPress={onClose}>
                          <Ionicons name="close" size={18} color={C.ink} />
                        </Pressable>
                        <Ionicons name="checkmark" size={11} color={C.joined} />
                        <Text style={MS.heroJoinedText}>JOINED</Text>
                      </View>
                    )}
                    {!isParticipant && (
                      <Pressable
                        style={MS.closeBtnDark}
                        onPress={onClose}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={18} color={C.ink} />
                      </Pressable>
                    )}
                  </View>
                )}

                {/* ────────────────────────────────────────────────────────
                    TITLE BLOCK
                    CategoryPill · Title (bold, large) · Time + label
                ──────────────────────────────────────────────────────── */}
                <View style={MS.titleBlock}>
                  {/* Category pill — Bolt Food style warm rounded chip */}
                  <View style={MS.titleTopRow}>
                    {event?.interest ? (
                      <InterestBadge
                        interest={{
                          id: event.interest.id || event.id,
                          name: event.interest.name || event.category,
                          label: event.interest.name || event.category,
                          icon: event.interest.icon,
                          color: event.interest.color,
                        }}
                        size="md"
                        variant="chip"
                        showLabel={true}
                        showIcon={true}
                      />
                    ) : (
                      <CategoryPill label={event!.category} />
                    )}
                  </View>

                  {/* Title — heaviest element on screen */}
                  <Text style={MS.title}>{event!.title}</Text>

                  {/* Time row — label + formatted string */}
                  <View style={MS.timeRow}>
                    <Text style={MS.timeLabel}>{timeLabel.toUpperCase()}</Text>
                    <View style={MS.timeDot} />
                    <Text style={MS.timeStr}>{timeFormat}</Text>
                  </View>
                </View>

                {/* ────────────────────────────────────────────────────────
                    STATS BAR
                ──────────────────────────────────────────────────────── */}
                <View style={MS.statsBar}>
                  <View style={MS.statItem}>
                    <Text style={MS.statNum}>
                      {event!.participantsSummary?.currentCount ?? 0}
                    </Text>
                    <Text style={MS.statCap}>GOING</Text>
                  </View>
                  <View style={MS.statRule} />
                  <View style={MS.statItem}>
                    <Text style={MS.statNum}>
                      {event!.participantsSummary?.maxCount ?? "∞"}
                    </Text>
                    <Text style={MS.statCap}>CAPACITY</Text>
                  </View>
                  <View style={MS.statRule} />
                  <View style={MS.statItem}>
                    <Text
                      style={[
                        MS.statNum,
                        !!eventDistance && { color: C.green },
                      ]}
                    >
                      {eventDistance ?? "—"}
                    </Text>
                    <Text style={MS.statCap}>DISTANCE</Text>
                  </View>
                </View>

                <Divider />

                {/* ────────────────────────────────────────────────────────
                    ABOUT
                ──────────────────────────────────────────────────────── */}
                {!!event!.description && (
                  <>
                    <View style={sharedS.block}>
                      <SectionLabel>ABOUT</SectionLabel>
                      <Text style={sharedS.bodyText}>{event!.description}</Text>
                    </View>
                    <Divider />
                  </>
                )}

                {/* ────────────────────────────────────────────────────────
                    WHERE
                ──────────────────────────────────────────────────────── */}
                <View style={sharedS.block}>
                  <SectionLabel>WHERE</SectionLabel>
                  <Text style={sharedS.locationText}>
                    {event!.locationName ??
                      (typeof event!.location === "string"
                        ? event!.location
                        : "")}
                  </Text>
                </View>

                {coords && (
                  <View style={sharedS.edgeMap}>
                    <EventLocationMap
                      coords={coords}
                      userCoords={userLocation}
                      locationName={event!.locationName ?? event!.title}
                      gradientColors={[C.ink, C.mid]}
                    />
                  </View>
                )}

                <View style={{ height: 12 }} />

                <Divider />

                {/* ────────────────────────────────────────────────────────
                    ATTENDING
                ──────────────────────────────────────────────────────── */}
                <Pressable
                  onPress={handleOpenParticipants}
                  style={({ pressed }) => [
                    MS.attendingSection,
                    pressed && { backgroundColor: "rgba(15,23,42,0.04)" },
                  ]}
                >
                  <View style={MS.attendingContent}>
                    <SectionLabel>ATTENDING</SectionLabel>
                    <View style={MS.attendRow}>
                      <View style={MS.avatarStack}>
                        {(
                          event!.participantsSummary?.participantsPreview ??
                          event!.participantsPreview ??
                          []
                        )
                          .slice(0, 4)
                          .map((p, i) => (
                            <View
                              key={i}
                              style={{
                                marginLeft: i > 0 ? -10 : 0,
                                zIndex: 10 - i,
                              }}
                              pointerEvents="none"
                            >
                              <Avatar
                                participant={p}
                                size={36}
                                borderColor={C.bg}
                              />
                            </View>
                          ))}
                        {(event!.participantsSummary?.currentCount ?? 0) >
                          4 && (
                          <View
                            style={[MS.overflowChip, { marginLeft: -10 }]}
                            pointerEvents="none"
                          >
                            <Text style={MS.overflowText}>
                              +
                              {(event!.participantsSummary?.currentCount ?? 0) -
                                4}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1 }} pointerEvents="none">
                        <Text style={MS.attendCount}>
                          <Text
                            style={{
                              color: isParticipant ? C.joined : C.accent,
                            }}
                          >
                            {event!.participantsSummary?.currentCount ?? 0}
                          </Text>
                          {event!.participantsSummary?.maxCount ? (
                            <Text style={{ color: C.muted }}>
                              /{event!.participantsSummary?.maxCount}
                            </Text>
                          ) : (
                            ""
                          )}
                          <Text style={{ color: C.mid }}> attending</Text>
                        </Text>
                        {!!event!.spotsLeft && event!.spotsLeft > 0 && (
                          <Text style={MS.spotsText}>
                            {event!.spotsLeft} spots left
                          </Text>
                        )}
                      </View>

                      <View pointerEvents="none">
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={C.muted}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>

                <Divider />

                {/* ────────────────────────────────────────────────────────
                    HOST
                ──────────────────────────────────────────────────────── */}
                <Pressable
                  style={({ pressed }) => [
                    MS.hostRow,
                    pressed && { backgroundColor: "rgba(15,23,42,0.04)" },
                  ]}
                  onPress={() => {
                    if (event!.author?.username) {
                      setSelectedUsername(event!.author.username);
                      onSelectUser?.(event!.author.username);
                    }
                  }}
                >
                  <View style={MS.hostMonogram}>
                    <Text style={MS.hostMonogramText}>
                      {event!.author?.username?.substring(0, 2).toUpperCase() ??
                        "?"}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={MS.hostCaption}>HOST</Text>
                    <Text style={MS.hostName}>
                      @{event!.author?.username ?? "unknown"}
                    </Text>
                  </View>

                  <Ionicons name="arrow-forward" size={14} color={C.muted} />
                </Pressable>

                <View style={{ height: 110 }} />
              </ScrollView>

              {/* ── BOTTOM BAR ── */}
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
        total={event?.participantsSummary?.currentCount ?? 0}
        isLoading={participantsLoading}
        title="ATTENDING"
        onClose={() => setShowParticipants(false)}
        accentColor={isParticipant ? C.joined : C.accent}
        onSelectUser={(u) => {
          setShowParticipants(false);
          setTimeout(() => {
            onSelectUser?.(u);
            setSelectedUsername(u);
          }, 60);
        }}
      />

      {selectedUsername !== null && (
        <UserProfileModal
          username={selectedUsername}
          onBack={() => setSelectedUsername(null)}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MS = StyleSheet.create({
  // ── Hero — image variant ──────────────────────────────────────────────────
  // Full height, no top padding — fills from the very top of the sheet.
  heroImage: {
    height: HERO_HEIGHT,
    width: "100%",
    backgroundColor: C.divider,
  },
  // Subtle bottom scrim — just enough to make the close button legible.
  heroScrimBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "rgba(15,23,42,0.22)",
  },
  // Close button floats top-right over image
  closeBtn: {
    position: "absolute",
    top: 14,
    right: H_PAD,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Hero — no image variant ───────────────────────────────────────────────
  heroPlain: {
    height: 52, // enough room for the overlaid handle + close btn
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
    gap: 8,
  },
  closeBtnDark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  // Joined badge — overlaid bottom-left on hero image
  heroJoinedBadge: {
    position: "absolute",
    bottom: 12,
    left: H_PAD,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.joined,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroJoinedText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.joined,
    letterSpacing: 1.5,
  },

  // ── Title block ───────────────────────────────────────────────────────────
  titleBlock: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 16,
  },
  titleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.6,
    lineHeight: 32,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: C.accent,
    letterSpacing: 1.5,
  },
  timeDot: {
    width: 2,
    height: 10,
    borderRadius: 2,
    backgroundColor: C.accentLight,
  },
  timeStr: {
    fontSize: 20,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: -0.1,
  },

  // ── Stats bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingVertical: 18,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statNum: {
    fontSize: 20,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  statCap: {
    fontSize: 9,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statRule: {
    width: 1.5,
    backgroundColor: C.mid,
    marginVertical: 4,
  },

  // ── Attending ─────────────────────────────────────────────────────────────
  attendingSection: {
    width: "100%",
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  attendingContent: {
    paddingHorizontal: H_PAD,
    paddingVertical: 14,
  },
  attendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  overflowChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.divider,
    borderWidth: 2,
    borderColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.mid,
  },
  attendCount: {
    fontSize: 14,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  spotsText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.amber,
    marginTop: 2,
  },

  // ── Host ──────────────────────────────────────────────────────────────────
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: H_PAD,
    paddingVertical: 18,
  },
  hostMonogram: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  hostMonogramText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  hostCaption: {
    fontSize: 9,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  hostName: {
    fontSize: 15,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.2,
  },

  // ── Bottom bar actions ────────────────────────────────────────────────────
  squareBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  squareBtnActive: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },

  // Participant mode bottom bar
  joinedPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.joined,
    backgroundColor: "transparent",
  },
  joinedPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.joined,
    letterSpacing: 1.5,
  },
  leaveBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${C.red}50`,
    backgroundColor: "transparent",
  },
  leaveBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.red,
    letterSpacing: 1.5,
  },
});
