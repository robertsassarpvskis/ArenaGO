// ─── EventModal.tsx ───────────────────────────────────────────────────────────
// Event modal for basic (not joined) and participant (already joined) view modes.
// Author view is handled by AuthorEventModal.tsx.
// Distance from user location to event is computed inside this component.
//
// Map + "Open in Maps" button are delegated to <EventLocationMap />.

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
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import UserProfileModal from "../modal/UserProfileModal";
import {
  ACCENT_BG,
  AMBER_BG,
  Avatar,
  BaseEventModalProps,
  C,
  DISMISS_THRESHOLD,
  Divider,
  EyebrowLabel,
  H_PAD,
  JOINED_BG,
  MODAL_HEIGHT,
  Pill,
  SCREEN_HEIGHT,
  sharedS,
} from "./EventModalBase";
import UserListModal, { UserListParticipant } from "./UserListModal";

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
        toValue: 1.04,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 6,
      }),
    ]).start();
  }, []);

  return (
    <View style={sharedS.bottomInner}>
      <Animated.View
        style={[ES.joinedStatusPill, { transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons name="checkmark-circle" size={18} color="#FFF" />
        <View>
          <Text style={ES.joinedStatusLabel}>YOU'RE IN</Text>
          <Text style={ES.joinedStatusSub}>You're attending</Text>
        </View>
      </Animated.View>
      <Pressable style={ES.leaveBtn} onPress={handleLeave}>
        <Ionicons name="exit-outline" size={17} color={C.red} />
        <Text style={ES.leaveBtnText}>LEAVE</Text>
      </Pressable>
    </View>
  );
}

function BasicBottomBar({ eventId }: { eventId: string }) {
  return (
    <View style={sharedS.bottomInner}>
      <View style={{ flex: 1 }}>
        <JoinEventButton eventId={eventId} variant="modal" />
      </View>
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

  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  // ─── User location ────────────────────────────────────────────────────────
  const { location: userLocation } = useLocation();

  // ─── Compute distance to this event ──────────────────────────────────────
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

    return formatDistance(km); // e.g. "250 m", "1.4 km", "23 km"
  }, [userLocation, event?.id, event?.location]);

  // ─── Full participants state ──────────────────────────────────────────────
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

  // ─── Open / close animation ───────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
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

  // ─── Drag-to-dismiss ──────────────────────────────────────────────────────
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
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          dragY.setValue(0);
          onClose();
        });
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }).start();
      }
    },
    [onClose],
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

  // ─── Interpolations ───────────────────────────────────────────────────────
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

  const sheetBorderColor = isParticipant ? C.joined : C.accent;

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
              borderTopWidth: isParticipant ? 3 : 0,
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

          {/* Top chrome */}
          <View style={sharedS.topChrome}>
            <Pressable style={sharedS.chromeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={C.ink} />
            </Pressable>

            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              {isParticipant && (
                <View style={ES.chromeMiniJoinedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#FFF" />
                  <Text style={ES.chromeMiniJoinedText}>IN</Text>
                </View>
              )}

              <Pressable style={sharedS.chromeBtn} onPress={handleShare}>
                <Ionicons name="arrow-redo-outline" size={24} color={C.ink} />
              </Pressable>

              {isBasic && (
                <Pressable
                  style={[sharedS.chromeBtn, isSaved && sharedS.chromeBtnSaved]}
                  onPress={onToggleSave}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color={isSaved ? "#FFF" : C.ink}
                  />
                </Pressable>
              )}
            </View>
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
                bounces
                keyboardShouldPersistTaps="handled"
              >
                {/* Hero image */}
                {imageUri && (
                  <View style={sharedS.hero}>
                    <Image
                      source={{ uri: imageUri }}
                      style={sharedS.heroImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["rgba(15,23,42,0.15)", "transparent", C.bg]}
                      locations={[0, 0.45, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    {isParticipant && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          { backgroundColor: "rgba(5,150,105,0.06)" },
                        ]}
                      />
                    )}
                    <View style={sharedS.heroTagRow}>
                      <Pill
                        label={event!.category}
                        bg={
                          isParticipant
                            ? "rgba(5,150,105,0.90)"
                            : "rgba(255,107,88,0.92)"
                        }
                        color="#FFF"
                      />
                      {!!eventDistance && (
                        <View
                          style={[
                            sharedS.pill,
                            {
                              backgroundColor: "rgba(16,185,129,0.88)",
                              marginLeft: 6,
                            },
                          ]}
                        >
                          <Ionicons
                            name="navigate"
                            size={13}
                            color="#FFF"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[sharedS.pillText, { color: "#FFF" }]}>
                            {eventDistance} AWAY
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Title block */}
                <View
                  style={[
                    sharedS.block,
                    { paddingTop: imageUri ? 6 : 60, paddingBottom: 16 },
                  ]}
                >
                  {!imageUri && (
                    <>
                      <Pill
                        label={event!.category}
                        bg={isParticipant ? JOINED_BG : ACCENT_BG}
                        color={isParticipant ? C.joined : C.accent}
                      />
                      <View style={{ height: 10 }} />
                    </>
                  )}
                  <Text style={sharedS.bigTitle}>{event!.title}</Text>
                  <View style={sharedS.timeRow}>
                    <View
                      style={[
                        sharedS.timeBadgeInline,
                        {
                          backgroundColor: isParticipant
                            ? JOINED_BG
                            : ACCENT_BG,
                        },
                      ]}
                    >
                      <Ionicons
                        name="flash"
                        size={13}
                        color={isParticipant ? C.joined : C.accent}
                      />
                      <Text
                        style={[
                          sharedS.timeBadgeInlineText,
                          { color: isParticipant ? C.joined : C.accent },
                        ]}
                      >
                        {timeLabel.toUpperCase()}
                      </Text>
                    </View>
                    <View style={sharedS.timeSep} />
                    <Text style={sharedS.timeFormatText}>{timeFormat}</Text>
                  </View>
                </View>

                <Divider />

                {/* Stats bar */}
                <View style={ES.statsBar}>
                  <View style={ES.statItem}>
                    <Text style={ES.statValue}>{event!.attendees}</Text>
                    <Text style={ES.statLabel}>GOING</Text>
                  </View>
                  <View style={ES.statDivider} />
                  <View style={ES.statItem}>
                    <Text style={ES.statValue}>
                      {event!.maxParticipants ?? "10"}
                    </Text>
                    <Text style={ES.statLabel}>CAPACITY</Text>
                  </View>
                  <View style={ES.statDivider} />
                  <View style={ES.statItem}>
                    <Text
                      style={[
                        ES.statValue,
                        !!eventDistance && { color: C.green },
                      ]}
                    >
                      {eventDistance ?? "—"}
                    </Text>
                    <Text style={ES.statLabel}>DISTANCE</Text>
                  </View>
                </View>

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

                {/*
                  EventLocationMap receives:
                  - coords      → event pin (end)
                  - userCoords  → user pin (start) + triggers route line + auto-fit region
                  - gradientColors → themed button matching view mode
                */}
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
                              size={46}
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
                        <View
                          style={[ES.spotsBadge, { backgroundColor: AMBER_BG }]}
                        >
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

                {/* ORGANIZER */}
                <Pressable
                  style={ES.hostCard}
                  onPress={() => {
                    if (event!.author?.username)
                      setSelectedUsername(event!.author.username);
                  }}
                >
                  <View style={[ES.hostStamp, { borderColor: C.joined }]}>
                    <Text style={[ES.hostStampText, { color: C.joined }]}>
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
                    <Ionicons name="arrow-forward" size={14} color={C.ink} />
                  </View>
                </Pressable>

                <View style={{ height: 120 }} />
              </ScrollView>

              {/* Bottom bar */}
              <View
                style={[
                  sharedS.bottomBar,
                  isParticipant && { borderTopColor: C.joined },
                ]}
              >
                {isParticipant && (
                  <ParticipantBottomBar
                    onLeave={() => {
                      onLeave?.();
                      onClose();
                    }}
                  />
                )}
                {isBasic && <BasicBottomBar eventId={event!.id} />}
              </View>
            </>
          )}
        </Animated.View>
      </Modal>

      {/* Participant list */}
      <UserListModal
        visible={showParticipants}
        participants={displayParticipants}
        total={event?.attendees ?? 0}
        isLoading={participantsLoading}
        onClose={() => setShowParticipants(false)}
        accentColor={isParticipant ? C.joined : C.accent}
        accentBg={isParticipant ? JOINED_BG : ACCENT_BG}
        onSelectUser={handleSelectUser}
      />

      {/* Profile modal */}
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
  statsBar: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: H_PAD,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 1.2,
    marginTop: 3,
  },
  statDivider: { width: 1, backgroundColor: C.divider, marginVertical: 4 },

  chromeMiniJoinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.joined,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chromeMiniJoinedText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.8,
  },

  joinedStatusPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.joined,
    borderRadius: 12,
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
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: `${C.red}50`,
    borderRadius: 12,
    backgroundColor: `${C.red}10`,
  },
  leaveBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: C.red,
    letterSpacing: 1.2,
  },

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
    marginBottom: 12,
  },
  overflowAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
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
  },
  spotsText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  seeAllChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  seeAllText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.accent,
    letterSpacing: 1.2,
  },

  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: H_PAD,
    paddingVertical: 20,
  },
  hostStamp: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  hostStampText: { fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  hostLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    color: C.muted,
  },
  hostUsername: {
    fontSize: 18,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.4,
  },
  hostArrow: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
