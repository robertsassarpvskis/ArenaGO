import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://217.182.74.113:30080/api";

export interface ParticipatedEvent {
  eventId: string;
  eventName: string;
  // extend with whatever fields the API returns
  [key: string]: any;
}

export function useParticipatedEvents(
  username: string | null,
  token: string | null,
) {
  const [participatedEventIds, setParticipatedEventIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchParticipatedEvents = useCallback(async () => {
    if (!username || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE}/Users/${username}/participated-events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/plain",
          },
        },
      );

      // Log so we can see the real shape
      console.log(
        "Participated events raw response:",
        JSON.stringify(response.data, null, 2),
      );

      // Handle both a plain array and common wrapper shapes
      let events: ParticipatedEvent[] = [];
      if (Array.isArray(response.data)) {
        events = response.data;
      } else if (Array.isArray(response.data?.items)) {
        events = response.data.items;
      } else if (Array.isArray(response.data?.data)) {
        events = response.data.data;
      } else if (Array.isArray(response.data?.events)) {
        events = response.data.events;
      } else {
        console.warn(
          "Unexpected participated-events response shape:",
          response.data,
        );
      }

      const ids = new Set(events.map((e) => e.eventId));
      setParticipatedEventIds(ids);
    } catch (err: any) {
      console.error(
        "Failed to fetch participated events:",
        err.response?.data || err,
      );
      setError(err.response?.data ?? err.message);
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  // Fetch on mount and whenever username/token changes
  useEffect(() => {
    fetchParticipatedEvents();
  }, [fetchParticipatedEvents]);

  // Optimistically add/remove without re-fetching
  const markJoined = useCallback((eventId: string) => {
    setParticipatedEventIds((prev) => new Set(prev).add(eventId));
  }, []);

  const markLeft = useCallback((eventId: string) => {
    setParticipatedEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }, []);

  return {
    participatedEventIds,
    loading,
    error,
    refetch: fetchParticipatedEvents,
    markJoined,
    markLeft,
  };
}
