// app/index.tsx  (EventScreen)

import { Container } from "@/components/common/Container";
import { useAuth } from "@/hooks/context/AuthContext";
import { useJoinEvent } from "@/hooks/events/useEventJoin";
import { LikedEventItem, useEventSave } from "@/hooks/events/useEventSave";
import {
  getUserParticipatedEvents,
  Participation,
} from "@/hooks/events/useParticipatedEvents";
import { useLocation } from "@/hooks/useLocation";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CreatedEventCard from "../../components/common/event/CreatedEventCard";
import EventCard from "../../components/common/event/EventCard";
import ParticipatedEventCard from "../../components/common/event/ParticipatedEventCard";
import ModernHeader from "../../components/layout/ModernHeader";
import {
  Event as ApiEvent,
  getEventById,
  getRecommendedEvents,
  getUserCreatedEvents,
} from "../../hooks/events/getEvents";
import {
  useCancelEvent,
  useDeleteEvent,
  useKickParticipant,
  useLeaveEvent,
  useStartEvent,
} from "../../hooks/events/useEventActions";
import AuthorEventModal from "../modal/AuthorEventModal";
import EventModal from "../modal/EventModal";

const BASE_URL = "http://217.182.74.113:30080";

// ── Types ─────────────────────────────────────────────────────────────────────

type CardKind = "created" | "participated" | "recommended";

interface ListItem {
  kind: CardKind;
  event: ApiEvent;
  joinedAt?: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function getUserLikedEvents(
  username: string,
  token: string,
): Promise<LikedEventItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/Users/${encodeURIComponent(username)}/liked-events`,
      { headers: { accept: "text/plain", Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return [];
    const text = await res.text().catch(() => "");
    if (!text) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return [];
    }
    if (Array.isArray(parsed)) return parsed as LikedEventItem[];
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      for (const key of ["eventLikes", "items", "data", "likes", "results"]) {
        if (Array.isArray(p[key])) return p[key] as LikedEventItem[];
      }
    }
    return [];
  } catch {
    return [];
  }
}

// ── Mapper ────────────────────────────────────────────────────────────────────

const mapEventToCardProps = (event: ApiEvent) => ({
  id: event.eventId,
  title: event.title,
  image: event.thumbnail ?? undefined,
  category: event.interest?.name ?? "General",
  categoryIconUrl: event.interest?.icon?.url,
  time: event.startScheduledTo
    ? Math.floor(new Date(event.startScheduledTo).getTime() / 1000)
    : undefined,
  attendees: event.participantsSummary?.currentCount ?? 0,
  location: event.locationName ?? "Location TBA",
});

// ── Shared event shape builder ────────────────────────────────────────────────

const buildEventShape = (event: ApiEvent) => ({
  id: event.eventId,
  description: event.description,
  image: event.thumbnail ?? undefined,
  title: event.title,
  category: event.interest?.name ?? "General",
  time: event.startScheduledTo,
  location: event.location ?? "Location TBA",
  locationName: event.locationName ?? "Location TBA",
  distance: "—",
  author: event.author ? { username: event.author.username } : null,
  attendees: event.participantsSummary.currentCount,
  spotsLeft: event.participantsSummary.maxCount ?? 0,
  maxParticipants: event.participantsSummary.maxCount ?? null,
  participantsPreview: event.participantsSummary.participantsPreview,
  status: (event as any).status ?? "active",
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function EventScreen() {
  const { user } = useAuth();
  const {
    location,
    loading: locationLoading,
    errorMsg: locationError,
  } = useLocation();

  const { joinEvent } = useJoinEvent(user?.accessToken || null);
  const { startEvent, isStarting } = useStartEvent(user?.accessToken || null);
  const { cancelEvent, isCancelling } = useCancelEvent(
    user?.accessToken || null,
  );
  const { deleteEvent, isDeleting } = useDeleteEvent(user?.accessToken || null);
  const { kickParticipant, isKicking } = useKickParticipant(
    user?.accessToken || null,
  );
  const { leaveEvent, isLeaving } = useLeaveEvent(user?.accessToken || null);
  const { savedCount, isEventSaved, saveEvent, unsaveEvent, hydrateFromData } =
    useEventSave();

  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [allParticipations, setAllParticipations] = useState<Participation[]>(
    [],
  );
  const [allCreatedIds, setAllCreatedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const scrollY = new Animated.Value(0);

  const filterOptions = [
    { id: "all", label: "All", icon: "apps" as keyof typeof Ionicons.glyphMap },
    {
      id: "music",
      label: "Music",
      icon: "musical-notes" as keyof typeof Ionicons.glyphMap,
    },
    {
      id: "sports",
      label: "Sports",
      icon: "basketball" as keyof typeof Ionicons.glyphMap,
    },
    {
      id: "art",
      label: "Art",
      icon: "color-palette" as keyof typeof Ionicons.glyphMap,
    },
    {
      id: "food",
      label: "Food",
      icon: "restaurant" as keyof typeof Ionicons.glyphMap,
    },
  ];

  useEffect(() => {
    if (!user?.accessToken) return;
    fetchEvents();
  }, [user?.accessToken]);

  // ── Build list ─────────────────────────────────────────────────────────────

  const buildList = (
    recommended: ApiEvent[],
    createdIds: Set<string>,
    participations: Participation[],
    filter: string,
  ): ListItem[] => {
    const participationMap = new Map<string, string>(
      participations.map((p) => [
        p.resourceSummary.eventId,
        p.participationPeriod.joinedAt,
      ]),
    );

    const placed = new Set<string>();
    const result: ListItem[] = [];

    for (const event of recommended) {
      if (createdIds.has(event.eventId) && !placed.has(event.eventId)) {
        result.push({ kind: "created", event });
        placed.add(event.eventId);
      }
    }
    for (const event of recommended) {
      if (
        participationMap.has(event.eventId) &&
        !createdIds.has(event.eventId) &&
        !placed.has(event.eventId)
      ) {
        result.push({
          kind: "participated",
          event,
          joinedAt: participationMap.get(event.eventId),
        });
        placed.add(event.eventId);
      }
    }
    for (const event of recommended) {
      if (!placed.has(event.eventId)) {
        result.push({ kind: "recommended", event });
        placed.add(event.eventId);
      }
    }

    if (filter === "all") return result;
    return result.filter(
      (item) =>
        item.kind !== "recommended" ||
        item.event.interest?.name.toLowerCase() === filter.toLowerCase(),
    );
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [createdEvents, recommended, participations, likedEvents] =
        await Promise.all([
          getUserCreatedEvents(user?.userName || "", user?.accessToken || ""),
          getRecommendedEvents(user?.accessToken || "", 20),
          getUserParticipatedEvents(
            user?.userName || "",
            user?.accessToken || "",
          ),
          getUserLikedEvents(user?.userName || "", user?.accessToken || ""),
        ]);

      hydrateFromData(likedEvents);

      const createdIds = new Set(createdEvents.map((e) => e.eventId));
      setAllEvents(recommended);
      setAllCreatedIds(createdIds);
      setAllParticipations(participations);
      setListItems(
        buildList(recommended, createdIds, participations, activeFilter),
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load events");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setListItems(
      buildList(allEvents, allCreatedIds, allParticipations, filterId),
    );
  };

  const handleEventPress = async (eventId: string) => {
    try {
      setModalLoading(true);
      setModalVisible(true);
      const fullEvent = await getEventById(eventId, user?.accessToken || "");
      setSelectedEvent(fullEvent);
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setError("Failed to load event details");
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const handleToggleSave = () => {
    if (!selectedEvent) return;
    if (isEventSaved(selectedEvent.eventId)) {
      unsaveEvent(selectedEvent.eventId);
    } else {
      saveEvent(
        selectedEvent.eventId,
        selectedEvent.title,
        user?.accessToken || "",
      );
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await joinEvent(eventId);
      handleCloseModal();
      fetchEvents();
    } catch (err: any) {
      console.error("Failed to join event:", err);
      Alert.alert("Error", "Could not join event. Please try again.");
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    const ok = await leaveEvent(eventId);
    if (ok) {
      handleCloseModal();
      fetchEvents();
    } else {
      Alert.alert("Error", "Could not leave event. Please try again.");
    }
  };

  const handleStartEvent = async (eventId: string) => {
    const result = await startEvent(eventId);
    if (result) {
      // Re-fetch full event so modal reflects "started" status immediately
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {
        /* non-critical */
      }
      fetchEvents();
    } else {
      Alert.alert("Error", "Could not start event. Please try again.");
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    const result = await cancelEvent(eventId);
    if (result) {
      // Update modal in-place so user sees "CANCELLED" stamp without closing
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {
        /* non-critical */
      }
      fetchEvents();
    } else {
      Alert.alert("Error", "Could not cancel event. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const ok = await deleteEvent(eventId);
    if (ok) {
      handleCloseModal();
      fetchEvents();
    } else {
      Alert.alert("Error", "Could not delete event. Please try again.");
    }
  };

  const handleKickParticipant = async (eventId: string, username: string) => {
    const ok = await kickParticipant(eventId, username);
    if (ok) {
      // Refresh modal participants list in-place
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {
        /* non-critical */
      }
      fetchEvents();
    } else {
      Alert.alert("Error", "Could not remove participant. Please try again.");
    }
  };

  // ── View mode ──────────────────────────────────────────────────────────────

  const viewMode = selectedEvent
    ? selectedEvent.author?.username === user?.userName
      ? "author"
      : allParticipations.some(
            (p) => p.resourceSummary.eventId === selectedEvent.eventId,
          )
        ? "participant"
        : "basic"
    : "basic";

  // ── Render item ───────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: ListItem }) => {
    const props = mapEventToCardProps(item.event);

    if (item.kind === "created") {
      return (
        <CreatedEventCard
          {...props}
          onPress={() => handleEventPress(item.event.eventId)}
        />
      );
    }
    if (item.kind === "participated") {
      return (
        <ParticipatedEventCard
          {...props}
          joinedAt={item.joinedAt}
          onPress={() => handleEventPress(item.event.eventId)}
          onLeave={() => handleLeaveEvent(item.event.eventId)}
        />
      );
    }
    return (
      <EventCard
        {...props}
        onPress={() => handleEventPress(item.event.eventId)}
        onJoin={() => handleJoinEvent(item.event.eventId)}
      />
    );
  };

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container>
        <ModernHeader
          activeFilter={activeFilter}
          filters={filterOptions}
          onFilterChange={setActiveFilter}
          savedCount={savedCount}
          scrollY={scrollY}
        />
        <ActivityIndicator size="large" color="#FF6B58" />
      </Container>
    );
  }

  if (error && !modalVisible) {
    return (
      <Container>
        <View style={styles.centered}>
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        </View>
      </Container>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ModernHeader
        activeFilter={activeFilter}
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        savedCount={savedCount}
        scrollY={scrollY}
      />

      <Animated.FlatList
        data={listItems}
        keyExtractor={(item) => `${item.kind}-${item.event.eventId}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={fetchEvents}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      />

      {/* ── Modals ── */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="light" style={styles.blurBackground} />

          {/*
           * While the event is still loading (selectedEvent not yet set),
           * render a single lightweight loading modal so we never pass
           * event=null to a modal that tries to read event.time etc.
           */}
          {(!selectedEvent || modalLoading) && (
            <EventModal
              visible={modalVisible}
              viewMode="basic"
              event={null}
              isLoading={true}
              isSaved={false}
              onToggleSave={() => {}}
              onClose={handleCloseModal}
              onJoin={() => {}}
            />
          )}

          {/* Author modal — only rendered once selectedEvent is populated */}
          {selectedEvent && !modalLoading && viewMode === "author" && (
            <AuthorEventModal
              visible={modalVisible}
              event={buildEventShape(selectedEvent)}
              accessToken={user?.accessToken || ""}
              isLoading={false}
              isSaved={isEventSaved(selectedEvent.eventId)}
              onToggleSave={handleToggleSave}
              onClose={handleCloseModal}
              onEventUpdated={fetchEvents}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {/* Participant / basic modal — only rendered once selectedEvent is populated */}
          {selectedEvent &&
            !modalLoading &&
            (viewMode === "participant" || viewMode === "basic") && (
              <EventModal
                visible={modalVisible}
                viewMode={viewMode}
                event={buildEventShape(selectedEvent)}
                accessToken={user?.accessToken || ""}
                isLoading={isLeaving}
                isSaved={isEventSaved(selectedEvent.eventId)}
                onToggleSave={handleToggleSave}
                onClose={handleCloseModal}
                onJoin={() => handleJoinEvent(selectedEvent.eventId)}
                onLeave={() => handleLeaveEvent(selectedEvent.eventId)}
                onEventUpdated={fetchEvents}
              />
            )}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffcf4" },
  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  blurBackground: { ...StyleSheet.absoluteFillObject },
});
