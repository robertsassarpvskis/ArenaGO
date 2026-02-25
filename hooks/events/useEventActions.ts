// ─── hooks/events/useEventActions.ts ─────────────────────────────────────────
// Hooks for author event lifecycle actions: start, cancel, delete, kick.

import { useState } from "react";

const BASE_URL = "http://217.182.74.113:30080";

// ─── Response type (shared shape for start / cancel) ──────────────────────────

export interface EventActionResponse {
  eventId: string;
  title: string;
  description: string;
  thumbnail: { id: string; url: string; contentType: string } | null;
  interest: {
    name: string;
    id: string;
    description: string;
    icon: { id: string; url: string; contentType: string } | null;
    color: { r: number; g: number; b: number; a: number };
  } | null;
  author: {
    username: string;
    displayName: string;
    profilePhoto: { id: string; url: string; contentType: string } | null;
  } | null;
  participantsSummary: {
    maxCount: number;
    currentCount: number;
    participantsPreview: Array<{
      username: string;
      displayName: string;
      profilePhoto: { id: string; url: string; contentType: string } | null;
    }>;
  };
  locationName: string;
  location: { latitude: number; longitude: number } | null;
  createdAt: string;
  startScheduledTo: string;
  endScheduledTo: string | null;
  startedAt: string | null;
  endedAt: string | null;
  canceledAt: string | null;
  deletedAt: string | null;
}

// ─── Shared fetcher ───────────────────────────────────────────────────────────

async function postEventAction(
  eventId: string,
  action: "start" | "cancel",
  token: string,
): Promise<EventActionResponse> {
  const res = await fetch(`${BASE_URL}/api/Events/${eventId}/${action}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `[useEventActions] ${action} failed (${res.status}): ${body}`,
    );
  }

  const text = await res.text();
  if (!text) throw new Error(`[useEventActions] ${action} returned empty body`);
  return JSON.parse(text) as EventActionResponse;
}

// ─── useStartEvent ────────────────────────────────────────────────────────────

export function useStartEvent(token: string | null) {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const startEvent = async (
    eventId: string,
  ): Promise<EventActionResponse | null> => {
    if (!token) {
      setStartError("Not authenticated");
      return null;
    }
    try {
      setIsStarting(true);
      setStartError(null);
      const result = await postEventAction(eventId, "start", token);
      return result;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to start event";
      setStartError(msg);
      console.error("[useStartEvent]", msg);
      return null;
    } finally {
      setIsStarting(false);
    }
  };

  return { startEvent, isStarting, startError };
}

// ─── useCancelEvent ───────────────────────────────────────────────────────────

export function useCancelEvent(token: string | null) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const cancelEvent = async (
    eventId: string,
  ): Promise<EventActionResponse | null> => {
    if (!token) {
      setCancelError("Not authenticated");
      return null;
    }
    try {
      setIsCancelling(true);
      setCancelError(null);
      const result = await postEventAction(eventId, "cancel", token);
      return result;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to cancel event";
      setCancelError(msg);
      console.error("[useCancelEvent]", msg);
      return null;
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancelEvent, isCancelling, cancelError };
}

// ─── useDeleteEvent ───────────────────────────────────────────────────────────

export function useDeleteEvent(token: string | null) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    if (!token) {
      setDeleteError("Not authenticated");
      return false;
    }
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await fetch(`${BASE_URL}/api/Events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Delete failed (${res.status})`);
      }
      return true;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to delete event";
      setDeleteError(msg);
      console.error("[useDeleteEvent]", msg);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteEvent, isDeleting, deleteError };
}

// ─── useKickParticipant ───────────────────────────────────────────────────────

export function useKickParticipant(token: string | null) {
  const [isKicking, setIsKicking] = useState(false);
  const [kickError, setKickError] = useState<string | null>(null);

  const kickParticipant = async (
    eventId: string,
    username: string,
  ): Promise<boolean> => {
    if (!token) {
      setKickError("Not authenticated");
      return false;
    }
    try {
      setIsKicking(true);
      setKickError(null);
      const res = await fetch(
        `${BASE_URL}/api/Events/${eventId}/participants/${encodeURIComponent(username)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Kick failed (${res.status})`);
      }
      return true;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to kick participant";
      setKickError(msg);
      console.error("[useKickParticipant]", msg);
      return false;
    } finally {
      setIsKicking(false);
    }
  };

  return { kickParticipant, isKicking, kickError };
}

// ─── useLeaveEvent ────────────────────────────────────────────────────────────
// For participants (not authors) leaving an event they joined.

export function useLeaveEvent(token: string | null) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const leaveEvent = async (eventId: string): Promise<boolean> => {
    if (!token) {
      setLeaveError("Not authenticated");
      return false;
    }
    try {
      setIsLeaving(true);
      setLeaveError(null);
      const res = await fetch(`${BASE_URL}/api/Events/${eventId}/leave`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Leave failed (${res.status})`);
      }
      return true;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to leave event";
      setLeaveError(msg);
      console.error("[useLeaveEvent]", msg);
      return false;
    } finally {
      setIsLeaving(false);
    }
  };

  return { leaveEvent, isLeaving, leaveError };
}
