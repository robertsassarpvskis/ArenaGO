// ─── EventModal.tsx ───────────────────────────────────────────────────────────
// Minimalist × Street/Urban modal redesign.
//
// Layout order:
//   Hero → Stats → Attending → About → Where → Map → Host
//
// Design principles:
//   • Near-monochrome. Accent only on key status (joined, spots, CTA).
//   • No gradients. No floating decorative elements. No heavy shadows.
//   • Typography does the heavy lifting — weight contrast over color contrast.
//   • Every section is flat, clean, easy to scan.
//   • Street edge: uppercase labels, tight tracking, raw mono stat numbers,
//     ink-block tag chips, square avatar corners.
//
// Dismiss gesture (Bolt-Food style):
//   • Over-scroll past top past OVERSCROLL_DISMISS
//   • Fast downward flick from top (velocity > VELOCITY_DISMISS)
//   • Handle bar drag

import JoinEventButton from "@/components/common/buttons/JoinEventButton";
import EventLocationMap from "@/components/common/event/EventLocationMap";
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
  DISMISS_THRESHOLD,
  Divider,
  H_PAD,
  MODAL_HEIGHT,
  SCREEN_HEIGHT,
  SectionLabel,
  Tag,
  sharedS,
} from "../../components/layout/EventModalBase";
import UserProfileModal from "../modal/UserProfileModal";
import UserListModal, { UserListParticipant } from "./UserListModal";

// ─── Dismiss constants ────────────────────────────────────────────────────────

const OVERSCROLL_DISMISS = 52;
const VELOCITY_DISMISS = 0.55;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventModalProps extends BaseEventModalProps {
  viewMode?: "basic" | "participant";
  onJoin: () => void;
  onLeave?: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
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
      {/* Joined indicator — a single quiet pill */}
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
      {/* Save */}
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
      {/* Share */}
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
    } catch {
      const preview = (event?.participantsPreview ?? []).map((p: any) => ({
        username: p.username ?? "",
        displayName: p.displayName ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? null,
        bio: null,
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
    : (event?.participantsPreview ?? []).map((p: any) => ({
        username: p.username ?? "",
        displayName: p.displayName ?? p.username ?? "",
        profilePhoto: p.profilePhoto ?? null,
        bio: null,
      }));

  // Drag-to-dismiss opacity
  const dragProgress = dragY.interpolate({
    inputRange: [0, DISMISS_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const sheetOpacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  // Participant mode gives a hairline left accent to the sheet
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
              transform: [{ translateY: Animated.add(translateY, dragY) }],
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
                    HERO
                    Clean image at natural aspect ratio. No overlaid text.
                    No image → compact neutral bar.
                ──────────────────────────────────────────────────────── */}
                {hasImage ? (
                  <View style={MS.heroImage}>
                    <Image
                      source={{ uri: imageUri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {/* Minimal dark veil at bottom edge only — legibility for the overlay close btn */}
                    <View style={MS.heroScrimBottom} />
                    {/* Close button */}
                    <Pressable style={MS.closeBtn} onPress={onClose}>
                      <Ionicons name="close" size={18} color="#FFF" />
                    </Pressable>
                    {/* Participant badge */}
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
                  </View>
                )}

                {/* ────────────────────────────────────────────────────────
                    TITLE BLOCK
                    Category tag · Title (bold, large) · Time + label
                ──────────────────────────────────────────────────────── */}
                <View style={MS.titleBlock}>
                  {/* Category chip */}
                  <View style={MS.titleTopRow}>
                    <Tag label={event!.category} />
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
                    3 numbers. Raw mono weight. No backgrounds.
                ──────────────────────────────────────────────────────── */}
                <View style={MS.statsBar}>
                  <View style={MS.statItem}>
                    <Text style={MS.statNum}>{event!.attendees}</Text>
                    <Text style={MS.statCap}>GOING</Text>
                  </View>
                  <View style={MS.statRule} />
                  <View style={MS.statItem}>
                    <Text style={MS.statNum}>
                      {event!.maxParticipants ?? "∞"}
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

                {/* ── Map (edge-to-edge within section paddings) ── */}
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
                    Avatar stack + count tap to open list
                ──────────────────────────────────────────────────────── */}
                <Pressable
                  style={sharedS.block}
                  onPress={handleOpenParticipants}
                >
                  <SectionLabel>ATTENDING</SectionLabel>
                  <View style={MS.attendRow}>
                    {/* Avatar stack */}
                    <View style={MS.avatarStack}>
                      {(event!.participantsPreview ?? [])
                        .slice(0, 4)
                        .map((p, i) => (
                          <View
                            key={i}
                            style={{
                              marginLeft: i > 0 ? -10 : 0,
                              zIndex: 10 - i,
                            }}
                          >
                            <Avatar
                              participant={p}
                              size={36}
                              borderColor={C.bg}
                            />
                          </View>
                        ))}
                      {(event!.attendees ?? 0) > 4 && (
                        <View style={[MS.overflowChip, { marginLeft: -10 }]}>
                          <Text style={MS.overflowText}>
                            +{event!.attendees - 4}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Count + spots */}
                    <View style={{ flex: 1 }}>
                      <Text style={MS.attendCount}>
                        <Text
                          style={{ color: isParticipant ? C.joined : C.accent }}
                        >
                          {event!.attendees}
                        </Text>
                        {event!.maxParticipants ? (
                          <Text style={{ color: C.muted }}>
                            /{event!.maxParticipants}
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

                    {/* Chevron hint */}
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={C.muted}
                    />
                  </View>
                </Pressable>

                <Divider />

                {/* ────────────────────────────────────────────────────────
                    HOST
                ──────────────────────────────────────────────────────── */}
                <Pressable
                  style={MS.hostRow}
                  onPress={() => {
                    if (event!.author?.username)
                      setSelectedUsername(event!.author.username);
                  }}
                >
                  {/* Monogram stamp */}
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
        total={event?.attendees ?? 0}
        isLoading={participantsLoading}
        onClose={() => setShowParticipants(false)}
        accentColor={isParticipant ? C.joined : C.accent}
        onSelectUser={(u) => setSelectedUsername(u)}
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
  heroImage: {
    height: 260,
    width: "100%",
    position: "relative",
    backgroundColor: C.divider,
  },
  // Thin bottom scrim for close button legibility only — not decorative
  heroScrimBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // rgba fade implemented as a View with opacity rather than LinearGradient
    backgroundColor: "rgba(15,23,42,0.30)",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: H_PAD,
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.50)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Hero — no image variant ───────────────────────────────────────────────
  // Flat, light, neutral — does NOT look bad without an image
  heroPlain: {
    height: 16,
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: H_PAD,
    gap: 8,
  },
  closeBtnDark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  // Joined badge — sits next to close btn
  heroJoinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.joined,
    backgroundColor: "transparent",
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
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.green,
    letterSpacing: 0.2,
  },

  // Street-heavy title — large, tight, near-black
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.6,
    lineHeight: 32,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  // Time row — lightweight
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
  // Mono-weight large number
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
  attendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 15,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
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
