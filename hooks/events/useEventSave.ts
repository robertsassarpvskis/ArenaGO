// hooks/events/useEventSave.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const BASE_URL = "http://217.182.74.113:30080";
const STORAGE_KEY = "saved_events_v1";

// ── API Types ─────────────────────────────────────────────────────────────────
export interface LikeResponse {
  eventSummary: {
    eventId: string;
    eventName: string;
  };
  like: {
    userSummary: {
      username: string;
      displayName: string;
      profilePhoto: string | null;
    };
    likedAt: string;
  };
}

export interface LikedEventItem {
  eventSummary: {
    eventId: string;
    eventName: string;
  };
  likedAt: string;
}

export interface SavedEvent {
  eventId: string;
  eventName: string;
  savedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// ── AsyncStorage persistence ──────────────────────────────────────────────────
async function persistStore(events: Map<string, SavedEvent>) {
  try {
    const arr = Array.from(events.values());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn("[useEventSave] Failed to persist to AsyncStorage:", err);
  }
}

async function loadPersistedStore(): Promise<SavedEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseJson<SavedEvent[]>(raw, []);
  } catch (err) {
    console.warn("[useEventSave] Failed to load from AsyncStorage:", err);
    return [];
  }
}

// ── Module-level store ────────────────────────────────────────────────────────
const store = {
  events: new Map<string, SavedEvent>(),
  /** True once AsyncStorage has been read on app boot */
  localLoaded: false,
  listeners: new Set<() => void>(),

  notify() {
    this.listeners.forEach((l) => l());
  },
  set(eventId: string, data: SavedEvent) {
    this.events.set(eventId, data);
    persistStore(this.events);
    this.notify();
  },
  delete(eventId: string) {
    this.events.delete(eventId);
    persistStore(this.events);
    this.notify();
  },
  has(eventId: string) {
    return this.events.has(eventId);
  },
  get size() {
    return this.events.size;
  },
  /** Seed the store from an array of liked events fetched by EventScreen */
  hydrateFromData(items: LikedEventItem[]) {
    // Merge server data — server is authoritative, but keep any locally saved
    // items that the server doesn't know about yet (optimistic saves in flight).
    const serverIds = new Set(items.map((i) => i.eventSummary.eventId));

    // Remove items that are no longer liked according to the server
    for (const id of this.events.keys()) {
      if (!serverIds.has(id)) this.events.delete(id);
    }

    // Add / update from server
    for (const item of items) {
      if (!item?.eventSummary?.eventId) continue;
      this.events.set(item.eventSummary.eventId, {
        eventId: item.eventSummary.eventId,
        eventName: item.eventSummary.eventName ?? "",
        savedAt: item.likedAt ?? new Date().toISOString(),
      });
    }

    persistStore(this.events);
    this.notify();
  },
  reset() {
    this.events.clear();
    this.localLoaded = false;
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    this.notify();
  },
};

// ── Boot: load AsyncStorage once on first hook mount ─────────────────────────
let bootPromise: Promise<void> | null = null;

function bootFromStorage() {
  if (store.localLoaded || bootPromise) return bootPromise;
  bootPromise = loadPersistedStore().then((items) => {
    for (const item of items) {
      // Only seed if not already overwritten by a hydrateFromData call
      if (!store.events.has(item.eventId)) {
        store.events.set(item.eventId, item);
      }
    }
    store.localLoaded = true;
    store.notify();
    bootPromise = null;
  });
  return bootPromise;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useEventSave() {
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const listener = () => {
      if (mountedRef.current) forceUpdate((n) => n + 1);
    };
    store.listeners.add(listener);

    // Load persisted data from AsyncStorage on first mount
    bootFromStorage();

    return () => {
      mountedRef.current = false;
      store.listeners.delete(listener);
    };
  }, []);

  // ── hydrateFromData — called by EventScreen after fetching liked-events ───
  const hydrateFromData = useCallback((items: LikedEventItem[]) => {
    store.hydrateFromData(items);
  }, []);

  // ── isEventSaved ──────────────────────────────────────────────────────────
  const isEventSaved = useCallback(
    (eventId: string) => store.has(eventId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.size],
  );

  // ── getSavedEvents ────────────────────────────────────────────────────────
  const getSavedEvents = useCallback(
    (): SavedEvent[] => Array.from(store.events.values()),
    [],
  );

  // ── saveEvent ─────────────────────────────────────────────────────────────
  const saveEvent = useCallback(
    async (
      eventId: string,
      eventName: string,
      accessToken: string,
    ): Promise<{ success: boolean; data?: LikeResponse; error?: unknown }> => {
      if (!accessToken) return { success: false, error: "No access token" };

      // Optimistic insert
      store.set(eventId, {
        eventId,
        eventName,
        savedAt: new Date().toISOString(),
      });

      try {
        const res = await fetch(
          `${BASE_URL}/api/Events/${encodeURIComponent(eventId)}/like`,
          {
            method: "POST",
            headers: {
              accept: "text/plain",
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const text = await res.text().catch(() => "");
        const body = parseJson<LikeResponse | null>(text, null);

        if (!res.ok) {
          store.delete(eventId); // rollback
          console.error("[useEventSave] like failed", res.status, body ?? text);
          return {
            success: false,
            error: { status: res.status, body: body ?? text },
          };
        }

        if (!body?.eventSummary) {
          console.warn("[useEventSave] 2xx but unexpected body shape", text);
          return { success: true };
        }

        // Reconcile with confirmed server data
        store.set(eventId, {
          eventId: body.eventSummary.eventId,
          eventName: body.eventSummary.eventName,
          savedAt: body.like.likedAt,
        });

        return { success: true, data: body };
      } catch (err) {
        store.delete(eventId); // rollback
        console.error("[useEventSave] network error", err);
        return { success: false, error: err };
      }
    },
    [],
  );

  // ── unsaveEvent ───────────────────────────────────────────────────────────
  const unsaveEvent = useCallback((eventId: string): void => {
    store.delete(eventId);
  }, []);

  return {
    saveEvent,
    unsaveEvent,
    isEventSaved,
    getSavedEvents,
    hydrateFromData,
    savedCount: store.size,
    isHydrated: store.localLoaded,
  };
}
