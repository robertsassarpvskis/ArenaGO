import { useAuth } from "@/hooks/context/AuthContext";
import { useParticipatedEvents } from "@/hooks/state/UserParticipatedEvents";
import React, { createContext, useContext } from "react";

interface ParticipatedEventsContextValue {
  participatedEventIds: Set<string>;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
  markJoined: (eventId: string) => void;
  markLeft: (eventId: string) => void;
  isJoined: (eventId: string) => boolean;
}

const ParticipatedEventsContext = createContext<ParticipatedEventsContextValue>(
  {
    participatedEventIds: new Set(),
    loading: false,
    error: null,
    refetch: async () => {},
    markJoined: () => {},
    markLeft: () => {},
    isJoined: () => false,
  },
);

export function ParticipatedEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // user.username and user.accessToken — adjust field names to match your AuthContext shape
  const {
    participatedEventIds,
    loading,
    error,
    refetch,
    markJoined,
    markLeft,
  } = useParticipatedEvents(user?.userName ?? null, user?.accessToken ?? null);

  const isJoined = (eventId: string) => participatedEventIds.has(eventId);

  return (
    <ParticipatedEventsContext.Provider
      value={{
        participatedEventIds,
        loading,
        error,
        refetch,
        markJoined,
        markLeft,
        isJoined,
      }}
    >
      {children}
    </ParticipatedEventsContext.Provider>
  );
}

export function useParticipatedEventsContext() {
  return useContext(ParticipatedEventsContext);
}
