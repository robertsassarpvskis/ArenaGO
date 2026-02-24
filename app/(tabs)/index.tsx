// app/index.tsx  (EventScreen) — fetches liked-events and seeds useEventSave

import { Container } from "@/components/common/Container";
import { useAuth } from "@/hooks/context/AuthContext";
import { useJoinEvent } from "@/hooks/events/useEventJoin";
import { LikedEventItem, useEventSave } from "@/hooks/events/useEventSave";
import {
  getUserParticipatedEvents,
  Participation,
} from "@/hooks/events/useParticipatedEvents";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import EventModal from "../modal/EventModal";

const BASE_URL = "http://217.182.74.113:30080";

// ── Types ─────────────────────────────────────────────────────────────────────
type CardKind = "created" | "participated" | "recommended";

interface ListItem {
  kind: CardKind;
  event: ApiEvent;
  joinedAt?: string;
}

// ── API: fetch liked events ───────────────────────────────────────────────────
async function getUserLikedEvents(
  username: string,
  token: string,
): Promise<LikedEventItem[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/Users/${encodeURIComponent(username)}/liked-events`,
      {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      console.warn("[EventScreen] liked-events fetch failed:", res.status);
      return [];
    }

    const text = await res.text().catch(() => "");
    if (!text) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[EventScreen] liked-events JSON parse failed");
      return [];
    }

    // Normalise: accept array or object with known wrapper keys
    if (Array.isArray(parsed)) return parsed as LikedEventItem[];
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      for (const key of ["eventLikes", "items", "data", "likes", "results"]) {
        if (Array.isArray(p[key])) return p[key] as LikedEventItem[];
      }
    }

    return [];
  } catch (err) {
    console.error("[EventScreen] getUserLikedEvents error:", err);
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function EventScreen() {
  const { user } = useAuth();
  const { joinEvent } = useJoinEvent(user?.accessToken || null);

  // Single source of truth for saved/liked state
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

  // ── Fetch — now includes liked-events ─────────────────────────────────────
  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [createdEvents, recommended, participations, likedEvents] =
        await Promise.all([
          getUserCreatedEvents(user?.userName || "", user?.accessToken || ""),
          getRecommendedEvents(user?.accessToken || "", 10),
          getUserParticipatedEvents(
            user?.userName || "",
            user?.accessToken || "",
          ),
          getUserLikedEvents(user?.userName || "", user?.accessToken || ""),
        ]);

      // Seed useEventSave store with fresh server data (persists to AsyncStorage)
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

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setListItems(
      buildList(allEvents, allCreatedIds, allParticipations, filterId),
    );
  };

  const handleEventPress = async (eventId: string) => {
    try {
      setModalLoading(true);
      const fullEvent = await getEventById(eventId, user?.accessToken || "");
      setSelectedEvent(fullEvent);
      setModalVisible(true);
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setError("Failed to load event details");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  // ── Modal save toggle ─────────────────────────────────────────────────────
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
      setModalVisible(false);
      fetchEvents();
    } catch (err: any) {
      console.error("Failed to join event:", err);
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      console.log("Leave event:", eventId);
      fetchEvents();
    } catch (err) {
      console.error("Failed to leave event:", err);
    }
  };

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

    // UrbanBookmark inside EventCard reads isEventSaved from the store directly
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

  if (error) {
    return (
      <Container>
        <View style={styles.centered}>
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        </View>
      </Container>
    );
  }

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

      {modalVisible && selectedEvent && (
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="light" style={styles.blurBackground} />
          <EventModal
            visible={modalVisible}
            viewMode={
              selectedEvent.author?.username === user?.userName
                ? "author"
                : allParticipations.some(
                      (p) =>
                        p.resourceSummary.eventId === selectedEvent.eventId,
                    )
                  ? "participant"
                  : "basic"
            }
            event={{
              id: selectedEvent.eventId,
              description: selectedEvent.description,
              image: selectedEvent.thumbnail ?? undefined,
              title: selectedEvent.title,
              category: selectedEvent.interest?.name ?? "General",
              time: selectedEvent.startScheduledTo,
              location: selectedEvent.location ?? "Location TBA",
              locationName: selectedEvent.locationName ?? "Location TBA",
              distance: "—",
              author: selectedEvent.author
                ? { username: selectedEvent.author.username }
                : null,
              attendees: selectedEvent.participantsSummary.currentCount,
              spotsLeft: selectedEvent.participantsSummary.maxCount ?? 0,
              participantsPreview:
                selectedEvent.participantsSummary.participantsPreview,
            }}
            accessToken={user?.accessToken || ""}
            onClose={handleCloseModal}
            onJoin={() => {
              setModalVisible(false);
              fetchEvents();
            }}
            onLeave={() => handleLeaveEvent(selectedEvent.eventId)}
            isSaved={isEventSaved(selectedEvent.eventId)}
            onToggleSave={handleToggleSave}
            isLoading={modalLoading}
            onEventUpdated={fetchEvents}
          />
        </View>
      )}
    </View>
  );
}

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
