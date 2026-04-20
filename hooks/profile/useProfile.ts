import { getEventById } from "@/hooks/events/getEvents";
import { useCallback, useEffect, useState } from "react";

/* ===================== TYPES ===================== */

export interface UserInterest {
  id: string;
  label: string;
  icon?: string;
}

export interface Profile {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  profilePhoto?: {
    id: string;
    url: string;
    contentType: string;
  };

  birthDate: string;
  gender: boolean;
  preferredLanguages: string[];
  preferredTimeZone: string;
  lastKnownLocation?: { latitude: number; longitude: number };
  socialCredit: number;
  lastLoginAt: string;
  interests?: UserInterest[];

  followerCount?: number;
  followingCount?: number;
  createdEventsCount?: number;
  participatedEventsCount?: number;
}

// ── Participated events ────────────────────────────────────────────────────────

/** Lightweight stub returned by /participated-events */
export interface ParticipationStub {
  resourceSummary: {
    eventId: string;
    eventName: string;
  };
  participationPeriod: {
    joinedAt: string;
    leftAt: string | null;
    isKicked: boolean | null;
  };
}

/** Full event card data for displaying in the profile activity section */
export interface ParticipatedEventCard {
  eventId: string;
  title: string;
  /** ISO date string */
  startScheduledTo?: string;
  locationName?: string;
  currentCount: number;
  maxCount?: number;
  categoryName?: string;
  joinedAt: string;
}

/* ===================== CONFIG ===================== */

const API_URL = "http://217.182.74.113:30080/api";

/* ===================== HOOK ===================== */

export function useProfile(userName: string, token?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- FETCH PROFILE ---------- */

  const fetchProfile = useCallback(async () => {
    if (!userName) return;

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(`${API_URL}/Users/${userName}`, { headers });

      if (!res.ok) {
        throw new Error(`Profile load failed: ${res.status}`);
      }

      const data: Profile = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userName, token]);

  /* ---------- INITIAL LOAD ---------- */

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ---------- OPTIMISTIC HELPERS ---------- */

  const incrementFollowerCount = useCallback(() => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followerCount: (prev.followerCount ?? 0) + 1,
          }
        : prev,
    );
  }, []);

  /* ===================== RETURN ===================== */

  return {
    profile,
    loading,
    error,

    // actions
    refetch: fetchProfile,
    incrementFollowerCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useParticipatedEventsFull
//
// 1. Fetches the participation stubs from /api/Users/{username}/participated-events
// 2. Enriches each stub with the full event detail via getEventById
// 3. Returns a ParticipatedEventCard[] ready for MyEventCard / ProfileBase
// ─────────────────────────────────────────────────────────────────────────────

export function useParticipatedEventsFull(
  userName: string,
  token?: string,
  limit = 6,
) {
  const [events, setEvents] = useState<ParticipatedEventCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!userName || !token) return;

    try {
      setLoading(true);
      setError(null);

      // Step 1 — get participation stubs
      const res = await fetch(
        `${API_URL}/Users/${encodeURIComponent(userName)}/participated-events`,
        {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error(`Participations fetch failed: ${res.status}`);

      const body = await res.json();
      const stubs: ParticipationStub[] = body?.participations ?? [];

      if (stubs.length === 0) {
        setEvents([]);
        return;
      }

      // Step 2 — enrich up to `limit` stubs with full event data in parallel
      const sliced = stubs.slice(0, limit);

      const enriched = await Promise.allSettled(
        sliced.map(async (stub): Promise<ParticipatedEventCard> => {
          try {
            const full = await getEventById(
              stub.resourceSummary.eventId,
              token,
            );
            return {
              eventId: full.eventId,
              title: full.title,
              startScheduledTo: full.startScheduledTo ?? undefined,
              locationName: full.locationName ?? undefined,
              currentCount: full.participantsSummary?.currentCount ?? 0,
              maxCount: full.participantsSummary?.maxCount ?? undefined,
              categoryName: full.interest?.name ?? undefined,
              joinedAt: stub.participationPeriod.joinedAt,
            };
          } catch {
            // Graceful degradation: use stub data if detail fetch fails
            return {
              eventId: stub.resourceSummary.eventId,
              title: stub.resourceSummary.eventName,
              currentCount: 0,
              joinedAt: stub.participationPeriod.joinedAt,
            };
          }
        }),
      );

      const cards: ParticipatedEventCard[] = enriched
        .filter(
          (r): r is PromiseFulfilledResult<ParticipatedEventCard> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);

      // Most recent joined first
      cards.sort(
        (a, b) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
      );

      setEvents(cards);
    } catch (err: any) {
      console.error("Participated events fetch error:", err);
      setError(err.message ?? "Failed to load participated events");
    } finally {
      setLoading(false);
    }
  }, [userName, token, limit]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { events, loading, error, refetch: fetch_ };
}