// ─── AuthorEventModal.tsx ─────────────────────────────────────────────────────
// Full-featured event modal for the event author.
// Supports: Edit, Start, Cancel, Delete event · Kick individual participants.

import { updateEvent } from "@/hooks/events/getEvents";
import {
  useCancelEvent,
  useDeleteEvent,
  useKickParticipant,
  useStartEvent,
} from "@/hooks/events/useEventActions";
import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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
import {
  ACCENT_BG,
  AMBER_BG,
  Avatar,
  BaseEventModalProps,
  C,
  DISMISS_THRESHOLD,
  Divider,
  EventData,
  EyebrowLabel,
  GREEN_BG,
  H_PAD,
  MODAL_HEIGHT,
  openMaps,
  Participant,
  Pill,
  RED_BG,
  SCREEN_HEIGHT,
  sharedS,
} from "./EventModalBase";
import UserListModal from "./UserListModal";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AuthorEventModalProps extends BaseEventModalProps {
  /** Called after any mutating action completes (start/cancel/delete/kick) so parent can refresh its list */
  isSaved: boolean;
  onToggleSave: () => void;
  /** Optional override — if omitted the modal handles it internally via useDeleteEvent + onClose */
  onDeleteEvent?: (id: string) => Promise<void>;
}

// ─── Manage dropdown ─────────────────────────────────────────────────────────

interface ManageDropdownProps {
  visible: boolean;
  eventStatus?: EventData["status"];
  onClose: () => void;
  onEdit: () => void;
  onStart: () => void;
  onKick: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ManageDropdown({
  visible,
  eventStatus,
  onClose,
  onEdit,
  onStart,
  onKick,
  onCancel,
  onDelete,
}: ManageDropdownProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      friction: 12,
      tension: 100,
    }).start();
  }, [visible]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const isStarted = eventStatus === "started";
  const isCancelled = eventStatus === "cancelled";

  const items = [
    {
      label: isStarted ? "Event is Live" : "Start Event",
      sub: isStarted ? "Currently running" : "Open check-in",
      icon: "play-circle" as const,
      action: onStart,
      color: C.joined,
      bg: "#D1FAE5",
      disabled: isStarted || isCancelled,
    },
    {
      label: "Edit Event",
      sub: "Update details",
      icon: "pencil" as const,
      action: onEdit,
      color: C.ink,
      bg: C.divider,
      disabled: isCancelled,
    },

    {
      label: "Cancel Event",
      sub: "Notify & stop joins",
      icon: "close-circle" as const,
      action: onCancel,
      color: C.red,
      bg: "#FEE2E2",
      disabled: isCancelled,
    },
  ];

  if (!visible) return null;

  return (
    <>
      {/* Invisible tap-away overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        style={[MD.dropdown, { opacity, transform: [{ translateY }] }]}
      >
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <Pressable
              style={[
                MD.row,
                item.disabled && { opacity: 0.35 },
                i === 0 && {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                },
                i === items.length - 1 && {
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                },
              ]}
              onPress={() => {
                if (item.disabled) return;
                onClose();
                item.action();
              }}
            >
              <View style={[MD.iconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[MD.label, { color: item.color }]}>
                  {item.label}
                </Text>
                <Text style={MD.sub}>{item.sub}</Text>
              </View>
              {!item.disabled && (
                <Ionicons name="chevron-forward" size={13} color={C.muted} />
              )}
            </Pressable>
            {i < items.length - 1 && <View style={MD.sep} />}
          </React.Fragment>
        ))}
      </Animated.View>
    </>
  );
}

// ─── Kick participant sheet ───────────────────────────────────────────────────

interface KickSheetProps {
  visible: boolean;
  participants: Participant[];
  onClose: () => void;
  onKick: (username: string) => void;
}

function KickSheet({ visible, participants, onClose, onKick }: KickSheetProps) {
  const anim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 0 : 500,
      useNativeDriver: true,
      friction: 10,
      tension: 85,
    }).start();
  }, [visible]);

  const handleKick = (p: Participant) => {
    Alert.alert(
      "Kick Participant",
      `Remove @${p.username} from this event? They will be notified.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Kick",
          style: "destructive",
          onPress: () => {
            onKick(p.username);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={sharedS.backdrop} onPress={onClose} />
      <Animated.View
        style={[AS.subSheet, { transform: [{ translateY: anim }] }]}
      >
        <View style={sharedS.handleRow}>
          <View style={sharedS.handle} />
        </View>
        <View style={AS.sheetHeader}>
          <View>
            <Text style={AS.sheetBigTitle}>KICK PARTICIPANT</Text>
            <Text style={AS.sheetSubtitle}>Select who to remove</Text>
          </View>
          <View style={[AS.sheetIconBadge, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="person-remove" size={18} color={C.red} />
          </View>
        </View>
        <Divider heavy />

        <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.45 }}>
          {participants.length === 0 ? (
            <View style={{ padding: H_PAD, alignItems: "center" }}>
              <Text style={{ color: C.muted, fontWeight: "700" }}>
                No participants to remove
              </Text>
            </View>
          ) : (
            participants.map((p, i) => (
              <React.Fragment key={p.username}>
                <Pressable style={AS.kickRow} onPress={() => handleKick(p)}>
                  <Avatar participant={p} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={AS.kickName}>{p.displayName}</Text>
                    <Text style={AS.kickUsername}>@{p.username}</Text>
                  </View>
                  <View style={AS.kickBtn}>
                    <Ionicons name="close" size={16} color={C.red} />
                  </View>
                </Pressable>
                {i < participants.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: H_PAD,
            paddingTop: 16,
            paddingBottom: Platform.OS === "ios" ? 36 : 24,
          }}
        >
          <Pressable style={AS.dismissBtn} onPress={onClose}>
            <Text style={AS.dismissText}>CLOSE</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Author bottom bar ────────────────────────────────────────────────────────

function AuthorBottomBar({
  eventStatus,
  onEditPress,
  onManagePress,
  dropdownVisible,
  onDropdownClose,
  onStart,
  onKick,
  onCancel,
  onDelete,
}: {
  eventStatus?: EventData["status"];
  onEditPress: () => void;
  onManagePress: () => void;
  dropdownVisible: boolean;
  onDropdownClose: () => void;
  onStart: () => void;
  onKick: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const isStarted = eventStatus === "started";
  const isCancelled = eventStatus === "cancelled";
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(chevronAnim, {
      toValue: dropdownVisible ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [dropdownVisible]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={{ position: "relative" }}>
      {/* Dropdown renders ABOVE the bar */}
      <ManageDropdown
        visible={dropdownVisible}
        eventStatus={eventStatus}
        onClose={onDropdownClose}
        onEdit={onEditPress}
        onStart={onStart}
        onKick={onKick}
        onCancel={onCancel}
        onDelete={onDelete}
      />

      <View style={sharedS.bottomInner}>
        {/* EDIT quick button */}
        <Pressable
          style={[
            AS.editQuickBtn,
            isCancelled && { opacity: 0.4, borderColor: C.muted },
          ]}
          onPress={isCancelled ? undefined : onEditPress}
        >
          <Ionicons
            name="pencil-outline"
            size={17}
            color={isCancelled ? C.muted : C.ink}
          />
          <Text style={[AS.editQuickText, isCancelled && { color: C.muted }]}>
            EDIT
          </Text>
        </Pressable>

        {/* LIVE pill */}
        {isStarted && (
          <View style={AS.livePill}>
            <View style={AS.liveDot} />
            <Text style={AS.liveText}>LIVE</Text>
          </View>
        )}

        {/* MANAGE EVENT dropdown trigger */}
        <Pressable
          style={[
            AS.manageCTA,
            { flex: 1 },
            dropdownVisible && { backgroundColor: "#1E293B" },
          ]}
          onPress={onManagePress}
        >
          <Ionicons name="settings-outline" size={16} color="#FFF" />
          <Text style={AS.manageCTAText}>MANAGE EVENT</Text>
          <View style={AS.manageCTAArrow}>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Ionicons name="chevron-up" size={16} color={C.accent} />
            </Animated.View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuthorEventModal({
  visible,
  event,
  onClose,
  isLoading = false,
  accessToken = "",
  onEventUpdated,
  onDeleteEvent,
  isSaved,
  onToggleSave,
}: AuthorEventModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpac = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const startY = useRef(0);

  const [showParticipants, setShowParticipants] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showKick, setShowKick] = useState(false);
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

  // ── Action hooks (own the API calls directly) ──────────────────────────────
  const { startEvent, isStarting } = useStartEvent(accessToken || null);
  const { cancelEvent, isCancelling } = useCancelEvent(accessToken || null);
  const { deleteEvent, isDeleting } = useDeleteEvent(accessToken || null);
  const { kickParticipant, isKicking } = useKickParticipant(
    accessToken || null,
  );

  const isActionLoading = isStarting || isCancelling || isDeleting || isKicking;

  // Sync edit fields
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

  // Open / close animation
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

  // Drag-to-dismiss
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
    setShowDropdown(false);
    setTimeout(() => setIsEditing(true), 300);
  };

  const handleStart = () => {
    setShowDropdown(false);
    setTimeout(() => {
      Alert.alert(
        "Start Event",
        "Start the event now? Attendees will be notified that check-in is open.",
        [
          { text: "Not Yet", style: "cancel" },
          {
            text: "Start Now",
            onPress: async () => {
              if (!event) return;
              const result = await startEvent(event.id);
              if (result) {
                onEventUpdated?.();
              } else {
                Alert.alert(
                  "Error",
                  "Could not start the event. Please try again.",
                );
              }
            },
          },
        ],
      );
    }, 300);
  };

  const handleCancel = () => {
    setShowDropdown(false);
    setTimeout(() => {
      Alert.alert(
        "Cancel Event",
        "Attendees will be notified. This cannot be reversed.",
        [
          { text: "Keep Event", style: "cancel" },
          {
            text: "Cancel Event",
            style: "destructive",
            onPress: async () => {
              if (!event) return;
              const result = await cancelEvent(event.id);
              if (result) {
                onEventUpdated?.();
              } else {
                Alert.alert(
                  "Error",
                  "Could not cancel the event. Please try again.",
                );
              }
            },
          },
        ],
      );
    }, 300);
  };

  const handleDelete = () => {
    setShowDropdown(false);
    setTimeout(() => {
      Alert.alert(
        "Delete Event",
        "This will permanently remove the event. This cannot be undone.",
        [
          { text: "Keep Event", style: "cancel" },
          {
            text: "Delete Forever",
            style: "destructive",
            onPress: async () => {
              if (!event) return;
              if (onDeleteEvent) {
                await onDeleteEvent(event.id);
              } else {
                const ok = await deleteEvent(event.id);
                if (ok) {
                  onEventUpdated?.();
                  onClose();
                } else {
                  Alert.alert(
                    "Error",
                    "Could not delete the event. Please try again.",
                  );
                }
              }
            },
          },
        ],
      );
    }, 300);
  };

  const handleKickAction = () => {
    setShowDropdown(false);
    setTimeout(() => setShowKick(true), 300);
  };

  const handleKickUser = async (username: string) => {
    if (!event) return;
    const ok = await kickParticipant(event.id, username);
    if (ok) {
      onEventUpdated?.();
    } else {
      Alert.alert("Error", "Failed to remove participant. Please try again.");
    }
  };

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

  // Interpolations
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

  // Safe time computation — event may still be null while isLoading=true
  const eventTime = event
    ? typeof event.time === "string"
      ? Math.floor(Date.parse(event.time) / 1000)
      : (event.time as any)
    : 0;
  const timeLabel = event ? getTimeLabel(eventTime) : "";
  const timeFormat = event ? formatEventTime(eventTime) : "";

  const isCancelled = event?.status === "cancelled";
  const isStarted = event?.status === "started";

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
              borderTopColor: C.accent,
              borderTopWidth: 3,
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
              {/* Author badge */}
              <View style={AS.authorBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#FFF" />
                <Text style={AS.authorBadgeText}>HOST</Text>
              </View>

              {/* Status badge */}
              {isStarted && (
                <View style={AS.livePillSmall}>
                  <View style={AS.liveDot} />
                  <Text style={AS.liveText}>LIVE</Text>
                </View>
              )}
              {isCancelled && (
                <View style={[AS.authorBadge, { backgroundColor: C.red }]}>
                  <Text style={AS.authorBadgeText}>CANCELLED</Text>
                </View>
              )}

              <Pressable style={sharedS.chromeBtn} onPress={handleShare}>
                <Ionicons name="arrow-redo-outline" size={24} color={C.ink} />
              </Pressable>
            </View>
          </View>

          {isLoading || isActionLoading ? (
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
                    {/* Cancelled overlay */}
                    {isCancelled && (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: "rgba(239,68,68,0.25)",
                            justifyContent: "center",
                            alignItems: "center",
                          },
                        ]}
                      >
                        <View style={AS.cancelledStamp}>
                          <Text style={AS.cancelledStampText}>CANCELLED</Text>
                        </View>
                      </View>
                    )}
                    <View style={sharedS.heroTagRow}>
                      <Pill
                        label={event!.category}
                        bg="rgba(255,107,88,0.92)"
                        color="#FFF"
                      />
                      {!!event!.distance && (
                        <View
                          style={[
                            sharedS.pill,
                            {
                              backgroundColor: "rgba(16,185,129,0.88)",
                              marginLeft: 6,
                            },
                          ]}
                        >
                          <Text style={[sharedS.pillText, { color: "#FFF" }]}>
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
                    <View
                      style={[sharedS.block, { paddingTop: imageUri ? 8 : 60 }]}
                    >
                      <Text style={AS.editPageTitle}>EDIT EVENT</Text>
                    </View>
                    <Divider heavy />

                    <View style={sharedS.block}>
                      <EyebrowLabel>TITLE</EyebrowLabel>
                      <TextInput
                        style={AS.lineInput}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Event title"
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <Divider />

                    <View style={sharedS.block}>
                      <EyebrowLabel>DESCRIPTION</EyebrowLabel>
                      <TextInput
                        style={[
                          AS.lineInput,
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

                    <View style={sharedS.block}>
                      <EyebrowLabel>LOCATION</EyebrowLabel>
                      <TextInput
                        style={AS.lineInput}
                        value={editLocationName}
                        onChangeText={setEditLocationName}
                        placeholder="Venue or address"
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <Divider />

                    {editCoords && mapRegion && (
                      <>
                        <View style={sharedS.block}>
                          <EyebrowLabel>DRAG PIN TO REPOSITION</EyebrowLabel>
                        </View>
                        <View style={sharedS.edgeMap}>
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
                          <View style={sharedS.mapPillOverlay}>
                            <Ionicons name="move" size={12} color="#FFF" />
                            <Text style={sharedS.mapPillText}>
                              Drag to reposition
                            </Text>
                          </View>
                        </View>
                        <Divider />
                      </>
                    )}

                    <View
                      style={[AS.editActions, { paddingHorizontal: H_PAD }]}
                    >
                      <Pressable
                        style={AS.editCancelBtn}
                        onPress={() => setIsEditing(false)}
                      >
                        <Text style={AS.editCancelText}>CANCEL</Text>
                      </Pressable>
                      <Pressable
                        style={AS.editSaveBtn}
                        onPress={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={AS.editSaveText}>SAVE CHANGES</Text>
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
                        sharedS.block,
                        { paddingTop: imageUri ? 6 : 60, paddingBottom: 16 },
                      ]}
                    >
                      {!imageUri && (
                        <>
                          <Pill
                            label={event!.category}
                            bg={ACCENT_BG}
                            color={C.accent}
                          />
                          <View style={{ height: 10 }} />
                        </>
                      )}
                      <Text style={sharedS.bigTitle}>{event!.title}</Text>

                      <View style={sharedS.timeRow}>
                        <View
                          style={[
                            sharedS.timeBadgeInline,
                            { backgroundColor: ACCENT_BG },
                          ]}
                        >
                          <Ionicons name="flash" size={13} color={C.accent} />
                          <Text
                            style={[
                              sharedS.timeBadgeInlineText,
                              { color: C.accent },
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

                       {/* ── Stats bar (author-only) ── */}
                    <View style={AS.statsBar}>
                      <View style={AS.statItem}>
                        <Text style={AS.statValue}>{event!.attendees}</Text>
                        <Text style={AS.statLabel}>GOING</Text>
                      </View>
                      <View style={AS.statDivider} />
                      <View style={AS.statItem}>
                        <Text style={AS.statValue}>
                          {event!.maxParticipants ?? "10"}
                        </Text>
                        <Text style={AS.statLabel}>CAPACITY</Text>
                      </View>
                      <View style={AS.statDivider} />
                      <View style={AS.statItem}>
                        <Text
                          style={[
                            AS.statValue,
                            {
                              color: isStarted
                                ? C.joined
                                : isCancelled
                                  ? C.red
                                  : C.amber,
                            },
                          ]}
                        >
                          {isStarted ? "LIVE" : isCancelled ? "OFF" : "SOON"}
                        </Text>
                        <Text style={AS.statLabel}>STATUS</Text>
                      </View>
                    </View>
                    <Divider />
                    {/* ABOUT */}
                    {!!event!.description && (
                      <>
                        <View style={sharedS.block}>
                          <EyebrowLabel>ABOUT</EyebrowLabel>
                          <Text style={sharedS.bodyText}>
                            {event!.description}
                          </Text>
                        </View>
                        <Divider />
                      </>
                    )}
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
                      {!!event!.distance && (
                        <View style={{ marginBottom: 14 }}>
                          <View
                            style={[
                              sharedS.distanceBadge,
                              { backgroundColor: GREEN_BG },
                            ]}
                          >
                            <Ionicons
                              name="navigate-outline"
                              size={12}
                              color={C.green}
                            />
                            <Text style={sharedS.distanceText}>
                              {event!.distance} away
                            </Text>
                          </View>
                        </View>
                      )}
                      {coords && (
                        <View style={sharedS.edgeMap}>
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
                          style={sharedS.mapsLinkBtn}
                          onPress={() =>
                            openMaps(
                              coords.latitude,
                              coords.longitude,
                              event!.locationName ?? event!.title,
                            )
                          }
                        >
                          <LinearGradient
                            colors={[C.accent, C.accentLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={sharedS.mapsLinkGrad}
                          >
                            <Ionicons name="navigate" size={14} color="#FFF" />
                            <Text style={sharedS.mapsLinkText}>
                              OPEN IN MAPS
                            </Text>
                          </LinearGradient>
                        </Pressable>
                      )}
                    </View>

                    <Divider />

                    {/* ATTENDING with kick shortcut */}
                    <Pressable
                      style={AS.attendeeBlock}
                      onPress={() => {
                        if ((event!.participantsPreview?.length ?? 0) > 0)
                          setShowParticipants(true);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <EyebrowLabel>ATTENDING</EyebrowLabel>
                        </View>
                        <View style={AS.avatarCluster}>
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
                                  onPress={() => setShowParticipants(true)}
                                />
                              </View>
                            ))}
                          {(event!.attendees ?? 0) > 5 && (
                            <View
                              style={[AS.overflowAvatar, { marginLeft: -14 }]}
                            >
                              <Text style={AS.overflowText}>
                                +{event!.attendees - 5}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={AS.attendeeInfo}>
                          <Text style={AS.attendeeCountText}>
                            <Text style={{ color: C.accent }}>
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
                                AS.spotsBadge,
                                { backgroundColor: AMBER_BG },
                              ]}
                            >
                              <Ionicons
                                name="ticket-outline"
                                size={11}
                                color={C.amber}
                              />
                              <Text style={[AS.spotsText, { color: C.amber }]}>
                                {event!.spotsLeft} SPOTS LEFT
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {(event!.participantsPreview?.length ?? 0) > 0 && (
                        <View style={AS.seeAllChip}>
                          <Text style={AS.seeAllText}>SEE ALL</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={C.accent}
                          />
                        </View>
                      )}
                    </Pressable>

                    <Divider />

                    {/* YOU (HOST) */}
                    <View style={AS.hostCard}>
                      <View
                        style={[
                          AS.hostStamp,
                          { borderColor: C.accent, backgroundColor: ACCENT_BG },
                        ]}
                      >
                        <Text style={[AS.hostStampText, { color: C.accent }]}>
                          {event!.author?.username
                            ?.substring(0, 2)
                            .toUpperCase() ?? "??"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={AS.hostLabel}>YOU (HOST)</Text>
                        <Text style={AS.hostUsername}>
                          @{event!.author?.username ?? "unknown"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ height: 120 }} />
                  </>
                )}
              </ScrollView>

              {/* Bottom bar */}
              {!isEditing && (
                <View
                  style={[
                    sharedS.bottomBar,
                    { borderTopColor: C.accent },
                    isActionLoading && { opacity: 0.6 },
                  ]}
                >
                  <AuthorBottomBar
                    eventStatus={event?.status}
                    onEditPress={() => setIsEditing(true)}
                    onManagePress={() => setShowDropdown((v) => !v)}
                    dropdownVisible={showDropdown}
                    onDropdownClose={() => setShowDropdown(false)}
                    onStart={handleStart}
                    onKick={handleKickAction}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                  />
                </View>
              )}
            </>
          )}
        </Animated.View>
      </Modal>

      {/* Participant list */}
      <UserListModal
        visible={showParticipants}
        participants={event?.participantsPreview ?? []}
        total={event?.attendees ?? 0}
        onClose={() => setShowParticipants(false)}
        accentColor={C.accent}
        accentBg={ACCENT_BG}
        onSelectUser={handleSelectUser}
      />

      {/* Kick sheet */}
      <KickSheet
        visible={showKick}
        participants={event?.participantsPreview ?? []}
        onClose={() => setShowKick(false)}
        onKick={handleKickUser}
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

const AS = StyleSheet.create({
  // Author badge (chrome)
  authorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  authorBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.8,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.joined,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  livePillSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.joined,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFF" },
  liveText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
  },

  // Stats bar
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

  // Cancelled stamp overlay
  cancelledStamp: {
    borderWidth: 3,
    borderColor: C.red,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    transform: [{ rotate: "-12deg" }],
  },
  cancelledStampText: {
    fontSize: 28,
    fontWeight: "900",
    color: C.red,
    letterSpacing: 3,
  },

  // Bottom bar buttons
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

  manageCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.ink,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  manageCTAText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  manageCTAArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  // Manage sheet
  subSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
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
  sheetIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: H_PAD,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { fontSize: 16, fontWeight: "900", letterSpacing: -0.1 },
  actionSub: { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  dismissBtn: {
    backgroundColor: C.divider,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  dismissText: { fontSize: 14, fontWeight: "800", color: C.mid },

  // Kick sheet
  kickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: H_PAD,
  },
  kickName: { fontSize: 15, fontWeight: "800", color: C.ink },
  kickUsername: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
    marginTop: 1,
  },
  kickBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${C.red}60`,
    backgroundColor: RED_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  // Kick quick access on attending section
  kickQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: `${C.red}50`,
    backgroundColor: RED_BG,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 6,
  },
  kickQuickText: {
    fontSize: 10,
    fontWeight: "900",
    color: C.red,
    letterSpacing: 1,
  },

  // Attendees
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

  // Host card
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
});

// ─── Dropdown styles ──────────────────────────────────────────────────────────

const MD = StyleSheet.create({
  dropdown: {
    position: "absolute",
    bottom: "100%",
    left: H_PAD,
    right: H_PAD,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.divider,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
    overflow: "hidden",
    zIndex: 999,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: C.card,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  sub: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "500",
    marginTop: 1,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginHorizontal: 14,
  },
});
