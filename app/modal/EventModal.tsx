import JoinEventButton from "@/components/common/buttons/JoinEventButton";
import { updateEvent } from "@/hooks/events/getEvents";
import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import UserProfileModal from "../modal/UserProfileModal";
import UserListModal from "./UserListModal";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const { height } = Dimensions.get("window");
const MODAL_HEIGHT = height * 0.9;
const DISMISS_THRESHOLD = 140;
const H_PAD = 22;

const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F8F7F2",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.65)",
  joined: "#059669",
  joinedLight: "#10B981",
} as const;

const ACCENT_BG = "rgba(255,107,88,0.12)";
const GREEN_BG = "rgba(16,185,129,0.12)";
const AMBER_BG = "rgba(245,158,11,0.12)";
const JOINED_BG = "rgba(5,150,105,0.12)";

// ─── View mode ────────────────────────────────────────────────────────────────

export type EventModalViewMode = "basic" | "participant" | "author";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Participant {
  username: string;
  displayName: string;
  profilePhoto?: { id: string; url: string; contentType: string } | null;
}

export interface EventModalProps {
  visible: boolean;
  viewMode?: EventModalViewMode;
  event: {
    id: string;
    title: string;
    description?: string | null;
    image?: string | { url?: string } | null;
    category: string;
    time: string;
    location: string | { latitude: number; longitude: number };
    locationName?: string;
    distance?: string;
    attendees: number;
    spotsLeft?: number;
    maxParticipants?: number | null;
    author: { username: string } | null;
    participantsPreview?: Participant[] | null;
  } | null;
  onClose: () => void;
  onJoin: () => void;
  onLeave?: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  isLoading?: boolean;
  accessToken?: string;
  onEventUpdated?: () => void;
  onCancelEvent?: (id: string) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ini = (name: string) => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const openMaps = (lat: number, lng: number, label?: string) => {
  const n = encodeURIComponent(label || "Event");
  const ios = `maps:0,0?q=${n}@${lat},${lng}`;
  const android = `geo:0,0?q=${lat},${lng}(${n})`;
  const web = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(Platform.OS === "ios" ? ios : android).catch(() =>
    Linking.openURL(web),
  );
};

const AVATAR_PALETTES: Array<[string, string]> = [
  ["#FF6B58", "#FF8A73"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
  ["#F59E0B", "#FCD34D"],
  ["#EF4444", "#F87171"],
];
const avatarGradient = (seed: string): [string, string] =>
  AVATAR_PALETTES[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
      AVATAR_PALETTES.length
  ];

// ─── Micro-components ─────────────────────────────────────────────────────────

const Divider = ({ heavy }: { heavy?: boolean }) => (
  <View
    style={{
      height: heavy ? 2 : StyleSheet.hairlineWidth * 2,
      backgroundColor: heavy ? C.ink : C.divider,
      marginHorizontal: heavy ? 0 : H_PAD,
    }}
  />
);

const EyebrowLabel = ({
  children,
  color = C.muted,
}: {
  children: string;
  color?: string;
}) => <Text style={[S.eyebrow, { color }]}>{children}</Text>;

function Pill({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[S.pill, { backgroundColor: bg }]}>
      <Text style={[S.pillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ─── Avatar (for cluster display inside modal) ────────────────────────────────

function Avatar({
  participant,
  size = 46,
  borderColor = C.bg,
  onPress,
}: {
  participant: Participant;
  size?: number;
  borderColor?: string;
  onPress?: () => void;
}) {
  const [g1, g2] = avatarGradient(participant.username);
  const radius = size * 0.28;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: 2.5,
        borderColor,
        overflow: "hidden",
        backgroundColor: C.bg,
        shadowColor: g1,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      {participant.profilePhoto ? (
        <Image
          source={{ uri: participant.profilePhoto.url }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[g1, g2]}
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text
            style={{ color: "#FFF", fontSize: size * 0.3, fontWeight: "900" }}
          >
            {ini(participant.displayName)}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

// ─── Author Action Sheet ──────────────────────────────────────────────────────

function AuthorActions({
  visible,
  onClose,
  onEdit,
  onCancel,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const anim = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 0 : 400,
      useNativeDriver: true,
      friction: 10,
      tension: 85,
    }).start();
  }, [visible]);

  const items = [
    {
      label: "Edit Event",
      sub: "Update details, time & location",
      icon: "pencil" as const,
      action: onEdit,
      destructive: false,
    },
    {
      label: "Cancel Event",
      sub: "Attendees will be notified",
      icon: "ban" as const,
      action: onCancel,
      destructive: false,
    },
    {
      label: "Delete Event",
      sub: "Permanently remove this event",
      icon: "trash" as const,
      action: onDelete,
      destructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={S.backdrop} onPress={onClose} />
      <Animated.View
        style={[S.subSheet, { transform: [{ translateY: anim }] }]}
      >
        <View style={S.handleRow}>
          <View style={S.handle} />
        </View>
        <View style={S.sheetHeader}>
          <View>
            <Text style={S.sheetBigTitle}>MANAGE EVENT</Text>
            <Text style={S.sheetSubtitle}>Choose an action</Text>
          </View>
          <View
            style={[
              S.monoCountBox,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: C.ink,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={16} color={C.ink} />
          </View>
        </View>
        <Divider heavy />

        {items.map((item, i) => (
          <React.Fragment key={i}>
            <Pressable style={S.actionRow} onPress={item.action}>
              <View
                style={[
                  S.actionIconBox,
                  item.destructive
                    ? { backgroundColor: C.ink }
                    : {
                        backgroundColor: "transparent",
                        borderWidth: 1.5,
                        borderColor: C.ink,
                      },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.destructive ? "#FFF" : C.ink}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    S.actionLabel,
                    { color: item.destructive ? C.accent : C.ink },
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={S.actionSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={C.muted} />
            </Pressable>
            {i < items.length - 1 && <Divider />}
          </React.Fragment>
        ))}

        <View
          style={{
            paddingHorizontal: H_PAD,
            paddingTop: 20,
            paddingBottom: Platform.OS === "ios" ? 36 : 24,
          }}
        >
          <Pressable style={S.dismissBtn} onPress={onClose}>
            <Text style={S.dismissText}>DISMISS</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Bottom Bars ──────────────────────────────────────────────────────────────

function AuthorBottomBar({
  onEditPress,
  onManagePress,
}: {
  onEditPress: () => void;
  onManagePress: () => void;
}) {
  return (
    <View style={S.bottomInner}>
      <Pressable style={S.editQuickBtn} onPress={onEditPress}>
        <Ionicons name="pencil-outline" size={17} color={C.ink} />
        <Text style={S.editQuickText}>EDIT</Text>
      </Pressable>
      <Pressable style={[S.primaryCTA, { flex: 1 }]} onPress={onManagePress}>
        <Text style={S.primaryCTAText}>MANAGE EVENT</Text>
        <View style={S.primaryCTAArrow}>
          <Ionicons name="chevron-up" size={16} color={C.accent} />
        </View>
      </Pressable>
    </View>
  );
}

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
    <View style={S.bottomInner}>
      <Animated.View
        style={[S.joinedStatusPill, { transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons name="checkmark-circle" size={18} color="#FFF" />
        <View>
          <Text style={S.joinedStatusLabel}>YOU'RE IN</Text>
          <Text style={S.joinedStatusSub}>You're attending</Text>
        </View>
      </Animated.View>

      <Pressable style={S.leaveBtn} onPress={handleLeave}>
        <Ionicons name="exit-outline" size={17} color={C.red} />
        <Text style={S.leaveBtnText}>LEAVE</Text>
      </Pressable>
    </View>
  );
}

function BasicBottomBar({ eventId }: { eventId: string }) {
  return (
    <View style={S.bottomInner}>
      <View style={{ flex: 1 }}>
        <JoinEventButton eventId={eventId} variant="modal" />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  onCancelEvent,
  onDeleteEvent,
}: EventModalProps) {
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpac = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const startY = useRef(0);

  // Sub-sheet visibility
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAuthorActions, setShowAuthorActions] = useState(false);

  // ── Profile modal state ───────────────────────────────────────────────────
  // Kept in EventModal (the topmost modal owner) so UserProfileModal renders
  // outside the UserListModal's Modal stack — avoiding z-index issues.
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocationName, setEditLocationName] = useState("");
  const [editCoords, setEditCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuthor = viewMode === "author";
  const isParticipant = viewMode === "participant";
  const isBasic = viewMode === "basic";

  // ── Sync edit fields when event changes ───────────────────────────────────
  useEffect(() => {
    if (!event || !visible) return;
    setEditTitle(event.title);
    setEditDescription(event.description ?? "");
    setEditLocationName(
      typeof event.location === "string"
        ? event.location
        : (event.locationName ?? ""),
    );
    if (typeof event.location === "object") {
      const c = {
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      };
      setEditCoords(c);
      setMapRegion({ ...c, latitudeDelta: 0.012, longitudeDelta: 0.012 });
    }
    setIsEditing(false);
  }, [event, visible]);

  // ── Sheet open / close animation ──────────────────────────────────────────
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
          toValue: height,
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

  // ── Drag-to-dismiss ───────────────────────────────────────────────────────
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
          toValue: height,
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!event || !accessToken) return;
    try {
      setIsUpdating(true);
      await updateEvent(
        event.id,
        {
          title: editTitle,
          description: editDescription,
          locationName: editLocationName,
          ...(editCoords ? { location: editCoords } : {}),
        },
        accessToken,
      );
      setIsEditing(false);
      onEventUpdated?.();
    } catch {
      Alert.alert("Error", "Failed to update event.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    setShowAuthorActions(false);
    setTimeout(() => setIsEditing(true), 300);
  };

  const handleCancel = () => {
    setShowAuthorActions(false);
    setTimeout(() => {
      Alert.alert("Cancel Event", "Attendees will be notified.", [
        { text: "Keep Event", style: "cancel" },
        {
          text: "Cancel Event",
          style: "destructive",
          onPress: () => {
            if (event) onCancelEvent?.(event.id);
          },
        },
      ]);
    }, 300);
  };

  const handleDelete = () => {
    setShowAuthorActions(false);
    setTimeout(() => {
      Alert.alert("Delete Event", "This cannot be undone.", [
        { text: "Keep Event", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            if (event) onDeleteEvent?.(event.id);
          },
        },
      ]);
    }, 300);
  };

  const handleShare = () => {
    if (!event) return;
    Share.share({
      title: event.title,
      message: `"${event.title}" on ArenaGo · ${event.locationName ?? ""}`,
    });
  };

  // ── Called by UserListModal when a row is tapped ──────────────────────────
  // UserListModal closes itself first, then fires this after 60ms.
  const handleSelectUser = (username: string) => {
    setSelectedUsername(username);
  };

  // ── Close profile and clear state ─────────────────────────────────────────
  const handleCloseProfile = () => {
    setSelectedUsername(null);
  };

  if (!event && !isLoading) return null;

  // ── Animated interpolations ───────────────────────────────────────────────
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

  // ── FIX: Date.parse returns ms → divide by 1000 for unix seconds ──────────
  const eventTime =
    typeof event!.time === "string"
      ? Math.floor(Date.parse(event!.time) / 1000)
      : event!.time;
  const timeLabel = getTimeLabel(eventTime);
  const timeFormat = formatEventTime(eventTime);

  const sheetBorderColor = isParticipant ? C.joined : C.accent;

  // ── RENDER ────────────────────────────────────────────────────────────────

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
        <Animated.View style={[S.backdrop, { opacity: backdropOpac }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            S.sheet,
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
            style={S.handleRow}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <View style={S.handle} />
          </View>

          {/* Top chrome */}
          <View style={S.topChrome}>
            <Pressable style={S.chromeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={C.ink} />
            </Pressable>

            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              {isParticipant && (
                <View style={S.chromeMiniJoinedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#FFF" />
                  <Text style={S.chromeMiniJoinedText}>IN</Text>
                </View>
              )}

              <Pressable style={S.chromeBtn} onPress={handleShare}>
                <Ionicons name="arrow-redo-outline" size={24} color={C.ink} />
              </Pressable>

              {isBasic && (
                <Pressable
                  style={[S.chromeBtn, isSaved && S.chromeBtnSaved]}
                  onPress={onToggleSave}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color={isSaved ? "#FFF" : C.ink}
                  />
                </Pressable>
              )}

              {isAuthor && !isEditing && (
                <Pressable
                  style={[S.chromeBtn, S.chromeBtnAccent]}
                  onPress={() => setShowAuthorActions(true)}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color="#FFF" />
                </Pressable>
              )}
            </View>
          </View>

          {isLoading ? (
            <View style={S.centered}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={S.loadingText}>LOADING</Text>
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
                  <View style={S.hero}>
                    <Image
                      source={{ uri: imageUri }}
                      style={S.heroImage}
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
                    <View style={S.heroTagRow}>
                      <Pill
                        label={event!.category}
                        bg={
                          isParticipant
                            ? "rgba(5,150,105,0.90)"
                            : "rgba(255,107,88,0.92)"
                        }
                        color="#FFF"
                      />
                      {!!event!.distance && (
                        <View
                          style={[
                            S.pill,
                            {
                              backgroundColor: "rgba(16,185,129,0.88)",
                              marginLeft: 6,
                            },
                          ]}
                        >
                          <Text style={[S.pillText, { color: "#FFF" }]}>
                            {event!.distance} AWAY
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* ══════ EDIT MODE ══════ */}
                {isEditing ? (
                  <View>
                    <View style={[S.block, { paddingTop: imageUri ? 8 : 60 }]}>
                      <Text style={S.editPageTitle}>EDIT EVENT</Text>
                    </View>
                    <Divider heavy />

                    <View style={S.block}>
                      <EyebrowLabel>TITLE</EyebrowLabel>
                      <TextInput
                        style={S.lineInput}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Event title"
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <Divider />

                    <View style={S.block}>
                      <EyebrowLabel>DESCRIPTION</EyebrowLabel>
                      <TextInput
                        style={[
                          S.lineInput,
                          {
                            minHeight: 80,
                            textAlignVertical: "top",
                            paddingTop: 8,
                          },
                        ]}
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder="Describe the event…"
                        placeholderTextColor={C.muted}
                        multiline
                        numberOfLines={4}
                      />
                    </View>
                    <Divider />

                    <View style={S.block}>
                      <EyebrowLabel>LOCATION</EyebrowLabel>
                      <TextInput
                        style={S.lineInput}
                        value={editLocationName}
                        onChangeText={setEditLocationName}
                        placeholder="Venue or address"
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <Divider />

                    {editCoords && mapRegion && (
                      <>
                        <View style={S.block}>
                          <EyebrowLabel>DRAG PIN TO REPOSITION</EyebrowLabel>
                        </View>
                        <View style={S.edgeMap}>
                          <MapView
                            style={StyleSheet.absoluteFill}
                            initialRegion={mapRegion}
                            onRegionChangeComplete={setMapRegion}
                          >
                            <Marker
                              coordinate={editCoords}
                              draggable
                              onDragEnd={(e) =>
                                setEditCoords(e.nativeEvent.coordinate)
                              }
                            />
                          </MapView>
                          <View style={S.mapPillOverlay}>
                            <Ionicons name="move" size={12} color="#FFF" />
                            <Text style={S.mapPillText}>
                              Drag to reposition
                            </Text>
                          </View>
                        </View>
                        <Divider />
                      </>
                    )}

                    <View style={[S.editActions, { paddingHorizontal: H_PAD }]}>
                      <Pressable
                        style={S.editCancelBtn}
                        onPress={() => setIsEditing(false)}
                      >
                        <Text style={S.editCancelText}>CANCEL</Text>
                      </Pressable>
                      <Pressable
                        style={S.editSaveBtn}
                        onPress={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={S.editSaveText}>SAVE CHANGES</Text>
                        )}
                      </Pressable>
                    </View>
                    <View style={{ height: 200 }} />
                  </View>
                ) : (
                  /* ══════ VIEW MODE ══════ */
                  <>
                    {/* Title block */}
                    <View
                      style={[
                        S.block,
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

                      <Text style={S.bigTitle}>{event!.title}</Text>

                      {/* Time row */}
                      <View style={S.timeRow}>
                        <View
                          style={[
                            S.timeBadgeInline,
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
                              S.timeBadgeInlineText,
                              {
                                color: isParticipant ? C.joined : C.accent,
                              },
                            ]}
                          >
                            {timeLabel.toUpperCase()}
                          </Text>
                        </View>
                        <View style={S.timeSep} />
                        <Text style={S.timeFormatText}>{timeFormat}</Text>
                      </View>
                    </View>

                    <Divider />

                    {/* WHERE */}
                    <View style={S.block}>
                      <EyebrowLabel>WHERE</EyebrowLabel>
                      <Text style={S.locationText}>
                        {event!.locationName ??
                          (typeof event!.location === "string"
                            ? event!.location
                            : "")}
                      </Text>
                      {!!event!.distance && (
                        <View style={S.distanceRow}>
                          <View
                            style={[
                              S.distanceBadge,
                              { backgroundColor: GREEN_BG },
                            ]}
                          >
                            <Ionicons
                              name="navigate-outline"
                              size={12}
                              color={C.green}
                            />
                            <Text style={S.distanceText}>
                              {event!.distance} away
                            </Text>
                          </View>
                        </View>
                      )}

                      {coords && (
                        <View style={S.edgeMap}>
                          <MapView
                            style={StyleSheet.absoluteFill}
                            initialRegion={{
                              ...coords,
                              latitudeDelta: 0.012,
                              longitudeDelta: 0.012,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                          >
                            <Marker
                              coordinate={coords}
                              title={event!.locationName ?? event!.title}
                            />
                          </MapView>
                        </View>
                      )}

                      {coords && (
                        <Pressable
                          style={S.mapsLinkBtn}
                          onPress={() =>
                            openMaps(
                              coords.latitude,
                              coords.longitude,
                              event!.locationName ?? event!.title,
                            )
                          }
                        >
                          <LinearGradient
                            colors={
                              isParticipant
                                ? [C.joined, C.joinedLight]
                                : [C.accent, C.accentLight]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={S.mapsLinkGrad}
                          >
                            <Ionicons name="navigate" size={14} color="#FFF" />
                            <Text style={S.mapsLinkText}>OPEN IN MAPS</Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>

                    <Divider />

                    {/* ATTENDING — tapping opens UserListModal */}
                    <Pressable
                      style={S.attendeeBlock}
                      onPress={() => {
                        if ((event!.participantsPreview?.length ?? 0) > 0) {
                          setShowParticipants(true);
                        }
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <EyebrowLabel>ATTENDING</EyebrowLabel>

                        <View style={S.avatarCluster}>
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
                                  onPress={() => {
                                    setShowParticipants(true);
                                  }}
                                />
                              </View>
                            ))}
                          {(event!.attendees ?? 0) > 5 && (
                            <View
                              style={[S.overflowAvatar, { marginLeft: -14 }]}
                            >
                              <Text style={S.overflowText}>
                                +{event!.attendees - 5}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={S.attendeeInfo}>
                          <Text style={S.attendeeCountText}>
                            <Text
                              style={{
                                color: isParticipant ? C.joined : C.accent,
                              }}
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
                              style={[
                                S.spotsBadge,
                                { backgroundColor: AMBER_BG },
                              ]}
                            >
                              <Ionicons
                                name="ticket-outline"
                                size={11}
                                color={C.amber}
                              />
                              <Text style={[S.spotsText, { color: C.amber }]}>
                                {event!.spotsLeft} SPOTS LEFT
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {(event!.participantsPreview?.length ?? 0) > 0 && (
                        <View
                          style={[
                            S.seeAllChip,
                            isParticipant && { backgroundColor: JOINED_BG },
                          ]}
                        >
                          <Text
                            style={[
                              S.seeAllText,
                              isParticipant && { color: C.joined },
                            ]}
                          >
                            SEE ALL
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={isParticipant ? C.joined : C.accent}
                          />
                        </View>
                      )}
                    </Pressable>

                    <Divider />

                    {/* ABOUT */}
                    {!!event!.description && (
                      <>
                        <View style={S.block}>
                          <EyebrowLabel>ABOUT</EyebrowLabel>
                          <Text style={S.bodyText}>{event!.description}</Text>
                        </View>
                        <Divider />
                      </>
                    )}

                    {/* ORGANIZER */}
                    <Pressable
                      style={S.hostCard}
                      onPress={() => {
                        if (event!.author?.username) {
                          setSelectedUsername(event!.author.username);
                        }
                      }}
                    >
                      <View
                        style={[
                          S.hostStamp,
                          isAuthor && {
                            borderColor: C.accent,
                            backgroundColor: ACCENT_BG,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            S.hostStampText,
                            { color: isAuthor ? C.accent : C.joined },
                          ]}
                        >
                          {event!.author?.username
                            ?.substring(0, 2)
                            .toUpperCase() ?? "??"}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={S.hostLabel}>
                          {isAuthor ? "YOU (HOST)" : "HOST"}
                        </Text>
                        <Text style={S.hostUsername}>
                          @{event!.author?.username ?? "unknown"}
                        </Text>
                      </View>

                      {!isAuthor && (
                        <View style={S.hostArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={C.ink}
                          />
                        </View>
                      )}
                    </Pressable>

                    <View style={{ height: 120 }} />
                  </>
                )}
              </ScrollView>

              {/* Bottom bar */}
              {!isEditing && (
                <View
                  style={[
                    S.bottomBar,
                    isParticipant && { borderTopColor: C.joined },
                  ]}
                >
                  {isAuthor && (
                    <AuthorBottomBar
                      onEditPress={() => setIsEditing(true)}
                      onManagePress={() => setShowAuthorActions(true)}
                    />
                  )}
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
              )}
            </>
          )}
        </Animated.View>
      </Modal>

      {/* ── UserListModal ────────────────────────────────────────────────────
          Rendered OUTSIDE the main Modal so it sits at the top of the
          React tree and its own Modal can stack above EventModal correctly.
          onSelectUser → sets selectedUsername → opens UserProfileModal below.
      ─────────────────────────────────────────────────────────────────────── */}
      <UserListModal
        visible={showParticipants}
        participants={event?.participantsPreview ?? []}
        total={event?.attendees ?? 0}
        onClose={() => setShowParticipants(false)}
        accentColor={isParticipant ? C.joined : C.accent}
        accentBg={isParticipant ? JOINED_BG : ACCENT_BG}
        onSelectUser={handleSelectUser}
      />

      {/* ── AuthorActions ────────────────────────────────────────────────── */}
      <AuthorActions
        visible={showAuthorActions}
        onClose={() => setShowAuthorActions(false)}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      {/* ── UserProfileModal ─────────────────────────────────────────────────
          Rendered last so it sits above everything else in the modal stack.
          Triggered by tapping a participant row or the host card.
      ─────────────────────────────────────────────────────────────────────── */}
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

const S = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: C.overlay },

  monoCountBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 24,
  },

  handleRow: { paddingVertical: 10, alignItems: "center", zIndex: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1" },

  topChrome: {
    position: "absolute",
    top: 35,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    zIndex: 50,
  },
  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,244,239,0.95)",
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeBtnAccent: { backgroundColor: C.accent, borderColor: C.accent },
  chromeBtnSaved: { backgroundColor: C.accent, borderColor: C.accent },

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

  hero: { height: 380, width: "100%", position: "relative" },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroTagRow: {
    position: "absolute",
    bottom: 18,
    left: H_PAD,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  pillText: { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },

  block: { paddingHorizontal: H_PAD, paddingVertical: 20 },

  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
    color: C.muted,
  },

  bigTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -1,
    lineHeight: 38,
    textTransform: "uppercase",
    marginTop: 6,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  timeBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeBadgeInlineText: { fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  timeSep: {
    width: 4,
    height: 14,
    backgroundColor: "#bbbebf",
    borderRadius: 2,
  },
  timeFormatText: {
    fontSize: 21,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: -0.2,
  },

  locationText: {
    fontSize: 20,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.4,
    marginTop: 2,
    marginBottom: 10,
  },
  distanceRow: { marginBottom: 14 },
  distanceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.green,
    letterSpacing: 0.3,
  },
  edgeMap: {
    height: 260,
    marginHorizontal: -H_PAD,
    position: "relative",
    marginBottom: 12,
  },
  mapPillOverlay: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapPillText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  mapsLinkBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  mapsLinkGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  mapsLinkText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
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

  bodyText: {
    fontSize: 15,
    color: C.mid,
    lineHeight: 25,
    fontWeight: "500",
    marginTop: 4,
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
    borderColor: C.joined,
  },
  hostStampText: {
    color: C.joined,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
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
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.accent,
    zIndex: 40,
  },
  bottomInner: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 38 : 22,
  },

  // Author bar
  editQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: C.accent,
    borderRadius: 12,
  },
  editQuickText: {
    fontSize: 12,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 1.2,
  },
  primaryCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.ink,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryCTAText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  primaryCTAArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  // Participant bar
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

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 3,
  },

  // Edit mode
  editPageTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  lineInput: {
    fontSize: 16,
    fontWeight: "700",
    color: C.ink,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    marginTop: 4,
  },
  editActions: { flexDirection: "row", gap: 10, paddingVertical: 20 },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.divider,
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 13,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: 1,
  },
  editSaveBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  editSaveText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },

  // Sub-sheets (AuthorActions)
  subSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: H_PAD,
    paddingVertical: 18,
  },
  sheetBigTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  sheetSubtitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
    marginTop: 3,
  },
  countBadge: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: { fontSize: 18, fontWeight: "900" },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: H_PAD,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.1,
  },
  actionSub: { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  dismissBtn: {
    backgroundColor: C.divider,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  dismissText: { fontSize: 14, fontWeight: "800", color: C.mid },
});
