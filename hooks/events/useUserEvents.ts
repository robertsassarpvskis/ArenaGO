// hooks/events/useUserEvents.ts
//
// Fetches both participated and created events for a given username.
// Returns a unified list sorted by most recent first, tagged with _kind.
//
// Usage:
//   const { events, isLoading, error, refetch } = useUserEvents(username, accessToken);
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

const BASE_URL = "http://217.182.74.113:30080";

// ─── API response types ───────────────────────────────────────────────────────

interface ParticipatedEventsResponse {
  userSummary: {
    username: string;
    displayName: string;
    profilePhoto: string | null;
  };
  participations: Array<{
    resourceSummary: {
      eventId: string;
      eventName: string;
    };
    participationPeriod: {
      joinedAt: string;
      leftAt: string | null;
      isKicked: boolean | null;
    };
  }>;
}

interface CreatedEventsResponse {
  events: CreatedEventSummary[];
}

export interface CreatedEventSummary {
  eventId: string;
  eventName: string;
  startScheduledTo?: string;
  endScheduledTo?: string;
  currentCount?: number;
  maxCount?: number;
  locationName?: string;
  categoryName?: string;
  status?: string;
}

// ─── Unified event shape consumed by ProfileBase / MyEventCard ────────────────

export interface UserEvent {
  /** Unique event id */
  eventId: string;
  /** Display name of the event */
  eventName: string;
  /** ISO date string for when the event starts */
  startScheduledTo?: string;
  /** "created" → user is hosting; "participated" → user joined */
  kind: "created" | "participated";
  /** Current participant count */
  currentCount?: number;
  /** Max participant cap (created events only) */
  maxCount?: number;
  /** Human-readable location name */
  locationName?: string;
  /** Category / interest label */
  categoryName?: string;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchParticipatedEvents(
  username: string,
  accessToken: string,
): Promise<UserEvent[]> {
  const res = await fetch(
    `${BASE_URL}/api/Users/${encodeURIComponent(username)}/participated-events`,
    {
      headers: {
        accept: "text/plain",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) throw new Error(`participated-events: ${res.status}`);

  const data: ParticipatedEventsResponse = await res.json();

  // Only active participations (not left, not kicked)
  return data.participations
    .filter(
      (p) =>
        p.participationPeriod.leftAt === null &&
        !p.participationPeriod.isKicked,
    )
    .map((p) => ({
      eventId: p.resourceSummary.eventId,
      eventName: p.resourceSummary.eventName,
      startScheduledTo: p.participationPeriod.joinedAt, // best approximation until event details endpoint
      kind: "participated" as const,
    }));
}

async function fetchCreatedEvents(
  username: string,
  accessToken: string,
): Promise<UserEvent[]> {
  const res = await fetch(
    `${BASE_URL}/api/Users/${encodeURIComponent(username)}/created-events`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `created-events: ${res.status}`);
  }

  const data: CreatedEventsResponse = await res.json();

  return data.events.map((ev) => ({
    eventId: ev.eventId,
    eventName: ev.eventName,
    startScheduledTo: ev.startScheduledTo,
    kind: "created" as const,
    currentCount: ev.currentCount,
    maxCount: ev.maxCount,
    locationName: ev.locationName,
    categoryName: ev.categoryName,
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseUserEventsResult {
  events: UserEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches and merges created + participated events for `username`.
 * Created events come first, then participated, each sorted by date desc.
 *
 * @param username   The user whose events to load.
 * @param accessToken  JWT bearer token.
 * @param enabled    Pass false to skip fetching (e.g. no token yet).
 */
export function useUserEvents(
  username: string,
  accessToken: string | undefined,
  enabled = true,
): UseUserEventsResult {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchCountRef = useRef(0);

  const fetch = useCallback(async () => {
    if (!username || !accessToken || !enabled) return;

    const id = ++fetchCountRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const [created, participated] = await Promise.allSettled([
        fetchCreatedEvents(username, accessToken),
        fetchParticipatedEvents(username, accessToken),
      ]);

      if (id !== fetchCountRef.current) return; // stale

      const createdList = created.status === "fulfilled" ? created.value : [];
      const participatedList =
        participated.status === "fulfilled" ? participated.value : [];

      if (created.status === "rejected") {
        console.warn("[useUserEvents] created-events failed:", created.reason);
      }
      if (participated.status === "rejected") {
        console.warn(
          "[useUserEvents] participated-events failed:",
          participated.reason,
        );
      }

      // Sort each group newest-first, then merge: created → participated
      const byDate = (a: UserEvent, b: UserEvent) => {
        const ta = a.startScheduledTo
          ? new Date(a.startScheduledTo).getTime()
          : 0;
        const tb = b.startScheduledTo
          ? new Date(b.startScheduledTo).getTime()
          : 0;
        return tb - ta;
      };

      setEvents([
        ...createdList.sort(byDate),
        ...participatedList.sort(byDate),
      ]);
    } catch (err: any) {
      if (id !== fetchCountRef.current) return;
      setError(err?.message ?? "Failed to load events");
    } finally {
      if (id === fetchCountRef.current) setIsLoading(false);
    }
  }, [username, accessToken, enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, isLoading, error, refetch: fetch };
}
