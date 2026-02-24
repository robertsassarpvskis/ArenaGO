// hooks/events/useParticipatedEvents.ts

const BASE_URL = "http://217.182.74.113:30080";

export interface Participation {
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

export interface ParticipatedEventsResponse {
  userSummary: {
    username: string;
    displayName: string;
    profilePhoto: string | null;
  };
  participations: Participation[];
}

export async function getUserParticipatedEvents(
  username: string,
  accessToken: string,
): Promise<Participation[]> {
  const res = await fetch(
    `${BASE_URL}/api/Users/${encodeURIComponent(username)}/participated-events`,
    {
      headers: {
        accept: "text/plain",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch participated events: ${res.status}`);
  }

  const data: ParticipatedEventsResponse = await res.json();

  // Only return active participations (not left, not kicked)
  return data.participations.filter(
    (p) =>
      p.participationPeriod.leftAt === null && !p.participationPeriod.isKicked,
  );
}
