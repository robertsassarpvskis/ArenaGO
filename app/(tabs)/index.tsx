// app/(tabs)/index.tsx — EventScreen (urban street minimal)

import { Container } from "@/components/common/Container";
import { useAuth } from "@/hooks/context/AuthContext";
import { useJoinEvent } from "@/hooks/events/useEventJoin";
import { LikedEventItem, useEventSave } from "@/hooks/events/useEventSave";
import {
  getUserParticipatedEvents,
  Participation,
} from "@/hooks/events/useParticipatedEvents";
import { useLocation } from "@/hooks/useLocation";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EventCard from "../../components/common/event/EventCard";
import FeedHeader from "../../components/layout/ModernHeader";
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  joined: "#059669",
  joinedLight: "#10B981",
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
} as const;

const ACCENT_BG = "rgba(255,107,88,0.12)";
const JOINED_BG = "rgba(5,150,105,0.12)";

const DS = {
  coral: "#FF5A45",
  ink: "#0D0D0D",
  ink60: "#5C5C5C",
  ink40: "#A0A0A0",
  inkHair: "rgba(0,0,0,0.08)",
  white: "#FFFFFF",
  fontBold: "700" as const,
  fontSemi: "600" as const,
  fontMed: "500" as const,
  fontReg: "400" as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────
type CardKind = "created" | "participated" | "recommended";

interface ListItem {
  kind: CardKind;
  event: ApiEvent;
  joinedAt?: string;
}

// ─── DEMO: Hardcoded paid event card ─────────────────────────────────────────
// Remove this once real price data flows from the API.
// Renders Variant D (ticket stub) to showcase the paid card design.
const DEMO_PAID_CARD = (
  <EventCard
    id="demo-paid-001"
    title="Rooftop Techno Night"
    category="Nightlife"
    price="€18"
    attendees={134}
    location="Tallinn Old Town"
    time={Math.floor(Date.now() / 1000) + 60 * 60 * 48} // 48 h from now
    isSaved={false}
    onPress={() => {}}
    onJoin={() => {}}
  />
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function formatEventTime(dateStr?: string): string {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0)
    return `Today · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)
    return `Tomorrow · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── My Event Card ────────────────────────────────────────────────────────────
interface MyEventCardProps {
  item: ListItem;
  onPress: () => void;
  index: number;
}

function MyEventCard({ item, onPress }: MyEventCardProps) {
  const isCreated = item.kind === "created";
  const accentColor = isCreated ? C.accent : C.joined;
  const badgeBg = isCreated ? ACCENT_BG : JOINED_BG;

  const pressAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 20,
      stiffness: 400,
    }).start();
  const handlePressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 300,
    }).start();

  const current = item.event.participantsSummary?.currentCount ?? 0;
  const max = item.event.participantsSummary?.maxCount ?? 0;
  const countLabel = isCreated
    ? `${current}${max > 0 ? ` / ${max}` : ""} GOING`
    : `${current} GOING`;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[s.myCard, { transform: [{ scale: pressAnim }] }]}>
        <View style={s.myCardBody}>
          <View style={[s.kindBadge, { backgroundColor: badgeBg }]}>
            <View style={[s.badgeDot, { backgroundColor: accentColor }]} />
            <Text style={[s.kindBadgeText, { color: accentColor }]}>
              {isCreated ? "HOSTING" : "GOING"}
            </Text>
          </View>
          <Text style={s.myCardTitle} numberOfLines={1}>
            {item.event.title}
          </Text>
          <Text style={s.myCardDate} numberOfLines={1}>
            {formatEventTime(item.event.startScheduledTo)}
          </Text>
          <View
            style={[s.myCardRule, { backgroundColor: accentColor + "30" }]}
          />
          <View style={s.myCardFoot}>
            <Text style={s.myCardCount}>{countLabel}</Text>
            <View style={[s.myCardArrow, { borderColor: accentColor + "40" }]}>
              <Text
                style={[
                  { fontSize: 10, color: C.ink + "80", fontWeight: "900" },
                ]}
              >
                →
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── My Events Strip ──────────────────────────────────────────────────────────
interface MyEventsStripProps {
  items: ListItem[];
  onPress: (id: string) => void;
  onLeave: (id: string) => void;
}

function MyEventsStrip({ items, onPress }: MyEventsStripProps) {
  if (items.length === 0) return null;
  return (
    <View style={s.stripSection}>
      <Text style={s.stripLabel}>MY EVENTS</Text>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.stripRow}
        decelerationRate={0.88}
        snapToInterval={230 + 8}
        snapToAlignment="start"
      >
        {items.map((item, idx) => (
          <MyEventCard
            key={item.event.eventId}
            item={item}
            index={idx}
            onPress={() => onPress(item.event.eventId)}
          />
        ))}
        <View style={{ width: 16 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyNearby() {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyGlyph}>—</Text>
      <Text style={s.emptyTitle}>Nothing around here</Text>
      <Text style={s.emptySubtitle}>Check back later or adjust filters</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function EventScreen() {
  const { user } = useAuth();
  const { location } = useLocation();
  const insets = useSafeAreaInsets();

  const { joinEvent } = useJoinEvent(user?.accessToken || null);
  const { startEvent } = useStartEvent(user?.accessToken || null);
  const { cancelEvent } = useCancelEvent(user?.accessToken || null);
  const { deleteEvent } = useDeleteEvent(user?.accessToken || null);
  const { kickParticipant } = useKickParticipant(user?.accessToken || null);
  const { leaveEvent, isLeaving } = useLeaveEvent(user?.accessToken || null);
  const { savedCount, isEventSaved, saveEvent, unsaveEvent, hydrateFromData } =
    useEventSave();

  const [myItems, setMyItems] = useState<ListItem[]>([]);
  const [nearbyItems, setNearbyItems] = useState<ListItem[]>([]);
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

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.accessToken) return;
    fetchEvents();
  }, [user?.accessToken]);

  const splitList = useCallback(
    (
      recommended: ApiEvent[],
      createdIds: Set<string>,
      participations: Participation[],
      filter: string,
    ) => {
      const participationMap = new Map<string, string>(
        participations.map((p) => [
          p.resourceSummary.eventId,
          p.participationPeriod.joinedAt,
        ]),
      );
      const mine: ListItem[] = [];
      const nearby: ListItem[] = [];
      const placed = new Set<string>();

      for (const event of recommended) {
        if (createdIds.has(event.eventId) && !placed.has(event.eventId)) {
          mine.push({ kind: "created", event });
          placed.add(event.eventId);
        }
      }
      for (const event of recommended) {
        if (
          participationMap.has(event.eventId) &&
          !createdIds.has(event.eventId) &&
          !placed.has(event.eventId)
        ) {
          mine.push({
            kind: "participated",
            event,
            joinedAt: participationMap.get(event.eventId),
          });
          placed.add(event.eventId);
        }
      }
      for (const event of recommended) {
        if (!placed.has(event.eventId)) {
          nearby.push({ kind: "recommended", event });
          placed.add(event.eventId);
        }
      }

      const filtered =
        filter === "all"
          ? nearby
          : nearby.filter((item) =>
              item.event.interest?.name.toLowerCase().includes(filter),
            );

      return { mine, nearby: filtered };
    },
    [],
  );

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
      const { mine, nearby } = splitList(
        recommended,
        createdIds,
        participations,
        activeFilter,
      );
      setMyItems(mine);
      setNearbyItems(nearby);
    } catch (err) {
      console.error(err);
      setError("Failed to load events");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      const { mine, nearby } = splitList(
        allEvents,
        allCreatedIds,
        allParticipations,
        filterId,
      );
      setMyItems(mine);
      setNearbyItems(nearby);
    },
    [allEvents, allCreatedIds, allParticipations, splitList],
  );

  const handleEventPress = async (eventId: string) => {
    try {
      setModalLoading(true);
      setModalVisible(true);
      const fullEvent = await getEventById(eventId, user?.accessToken || "");
      setSelectedEvent(fullEvent);
    } catch {
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
    if (isEventSaved(selectedEvent.eventId)) unsaveEvent(selectedEvent.eventId);
    else
      saveEvent(
        selectedEvent.eventId,
        selectedEvent.title,
        user?.accessToken || "",
      );
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await joinEvent(eventId);
      handleCloseModal();
      fetchEvents();
    } catch {
      Alert.alert("Error", "Could not join event. Please try again.");
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    const ok = await leaveEvent(eventId);
    if (ok) {
      handleCloseModal();
      fetchEvents();
    }
  };

  const handleStartEvent = async (eventId: string) => {
    const result = await startEvent(eventId);
    if (result) {
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {}
      fetchEvents();
    } else Alert.alert("Error", "Could not start event. Please try again.");
  };

  const handleCancelEvent = async (eventId: string) => {
    const result = await cancelEvent(eventId);
    if (result) {
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {}
      fetchEvents();
    } else Alert.alert("Error", "Could not cancel event. Please try again.");
  };

  const handleDeleteEvent = async (eventId: string) => {
    const ok = await deleteEvent(eventId);
    if (ok) {
      handleCloseModal();
      fetchEvents();
    } else Alert.alert("Error", "Could not delete event. Please try again.");
  };

  const handleKickParticipant = async (eventId: string, username: string) => {
    const ok = await kickParticipant(eventId, username);
    if (ok) {
      try {
        const updated = await getEventById(eventId, user?.accessToken || "");
        setSelectedEvent(updated);
      } catch {}
      fetchEvents();
    } else
      Alert.alert("Error", "Could not remove participant. Please try again.");
  };

  const viewMode = selectedEvent
    ? selectedEvent.author?.username === user?.userName
      ? "author"
      : allParticipations.some(
            (p) => p.resourceSummary.eventId === selectedEvent.eventId,
          )
        ? "participant"
        : "basic"
    : "basic";

  const renderNearbyItem = ({ item }: { item: ListItem }) => (
    <EventCard
      {...mapEventToCardProps(item.event)}
      onPress={() => handleEventPress(item.event.eventId)}
      onJoin={() => handleJoinEvent(item.event.eventId)}
    />
  );

  if (loading) {
    return (
      <Container>
        <FeedHeader
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          scrollY={scrollY}
        />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.coral} />
          <Text style={s.loadingText}>Finding events near you…</Text>
        </View>
      </Container>
    );
  }

  if (error && !modalVisible) {
    return (
      <Container>
        <View style={s.centered}>
          <Text style={s.errorGlyph}>×</Text>
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchEvents}>
            <Text style={s.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <View style={s.screen}>
      <FeedHeader
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        notificationCount={savedCount}
        scrollY={scrollY}
      />

      <Animated.SectionList
        sections={
          [
            { type: "myEvents", title: "", data: [myItems] },
            { type: "nearby", title: "Near you", data: nearbyItems },
          ] as any
        }
        keyExtractor={(item: any, index: number) =>
          Array.isArray(item)
            ? `strip-${index}`
            : `nearby-${item.event.eventId}`
        }
        renderSectionHeader={({ section }: any) => {
          if (section.type === "nearby" && nearbyItems.length > 0) {
            return (
              <View style={s.nearbyHeader}>
                <Text style={s.nearbyLabel}>NEAR YOU</Text>
                <View style={s.nearbyRule} />
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item, section }: any) => {
          if (section.type === "myEvents") {
            return (
              <>
                {/* My events horizontal strip */}
                <MyEventsStrip
                  items={item as ListItem[]}
                  onPress={handleEventPress}
                  onLeave={handleLeaveEvent}
                />

                {/* ── DEMO: Paid ticket card ────────────────────────────────
                    Shows Variant D (ticket stub) with a hardcoded paid event.
                    Remove this block once real price data flows from the API.
                ─────────────────────────────────────────────────────────── */}
                <View style={s.demoPaidSection}>
                  <View style={s.nearbyHeader}>
                    <Text style={s.nearbyLabel}>FEATURED</Text>
                    <View style={s.nearbyRule} />
                  </View>
                  {DEMO_PAID_CARD}
                </View>
              </>
            );
          }
          return renderNearbyItem({ item });
        }}
        ListEmptyComponent={
          nearbyItems.length === 0 && myItems.length === 0 ? (
            <EmptyNearby />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshing={refreshing}
        onRefresh={fetchEvents}
        stickySectionHeadersEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      />

      {modalVisible && (
        <View style={s.modalOverlay}>
          <BlurView
            intensity={50}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DS.white,
  },

  listContent: {
    paddingTop: 4,
    paddingHorizontal: 16,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: DS.ink40,
    fontWeight: DS.fontReg,
    letterSpacing: 0.2,
  },

  // ── Error ──────────────────────────────────────────────────────────────────
  errorGlyph: {
    fontSize: 48,
    color: DS.ink40,
    fontWeight: DS.fontBold,
    lineHeight: 52,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: DS.fontBold,
    color: DS.ink,
    letterSpacing: -0.3,
  },
  errorSub: {
    fontSize: 13,
    color: DS.ink60,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: DS.ink,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: DS.fontSemi,
    color: DS.ink,
    letterSpacing: 0.5,
  },

  // ── Strip ──────────────────────────────────────────────────────────────────
  stripSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: DS.fontBold,
    color: DS.ink60,
    letterSpacing: -0.5,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  stripRow: {
    gap: 8,
    paddingRight: 16,
  },

  myCard: {
    width: 270,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: C.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  myCardBar: { width: 3, height: "100%" },
  myCardBody: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 5 },

  kindBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  kindBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },

  myCardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
    lineHeight: 20,
    textTransform: "uppercase",
  },
  myCardDate: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  myCardRule: {
    height: 1,
    marginVertical: 2,
  },
  myCardFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  myCardCount: {
    fontSize: 10,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: 0.4,
  },
  myCardArrow: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Demo paid section ──────────────────────────────────────────────────────
  // Wraps the FEATURED header + DEMO_PAID_CARD.
  // Safe to delete alongside the DEMO_PAID_CARD constant above.
  demoPaidSection: {
    marginTop: 4,
  },

  // ── Nearby header ──────────────────────────────────────────────────────────
  nearbyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 24,
    paddingBottom: 12,
  },
  nearbyLabel: {
    fontSize: 10,
    fontWeight: DS.fontBold,
    color: DS.ink40,
    letterSpacing: 1.5,
  },
  nearbyRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: DS.inkHair,
  },

  // ── Empty ──────────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingTop: 72,
    paddingHorizontal: 40,
    gap: 6,
  },
  emptyGlyph: {
    fontSize: 32,
    color: DS.ink40,
    fontWeight: DS.fontBold,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: DS.fontBold,
    color: DS.ink,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: DS.ink40,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Modal overlay ──────────────────────────────────────────────────────────
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
