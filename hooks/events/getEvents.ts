export interface Event {
  eventId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  interest: {
    id: string;
    name: string;
    description: string;
    icon: {
      id: string;
      url: string;
      contentType: string;
    };
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
  author: {
    username: string;
    displayName: string;
    profilePhoto: {
      id: string;
      url: string;
      contentType: string;
    } | null;
  };
  participantsSummary: {
    maxCount: number | null;
    currentCount: number;
    participantsPreview: any[];
  };
  locationName: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  createdAt: string;
  startScheduledTo: string;
  endScheduledTo: string;
}

const API_BASE_URL = "http://217.182.74.113:30080";

export async function getRecommendedEvents(
  token: string,
  numEvents = 5,
): Promise<Event[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/Events/recommended?NumEvents=${numEvents}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const data: Event[] = await res.json();
  return data;
}

export async function getEventById(
  eventId: string,
  token: string,
): Promise<Event> {
  const res = await fetch(`${API_BASE_URL}/api/Events/${eventId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const data: Event = await res.json();
  return data;
}

export interface CreatedEventSummary {
  eventId: string;
  eventName: string;
}

export interface CreatedEventsResponse {
  userSummary: {
    username: string;
    displayName: string;
    profilePhoto: string | null;
  };
  events: CreatedEventSummary[];
}

export async function getUserCreatedEvents(
  username: string,
  token: string,
): Promise<CreatedEventSummary[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/Users/${username}/created-events`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const data: CreatedEventsResponse = await res.json();
  return data.events;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  interestId?: string;
  maxCount?: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  startScheduledTo?: string;
  endScheduledTo?: string;
  thumbnail?: any;
}

export async function updateEvent(
  eventId: string,
  data: UpdateEventData,
  token: string,
): Promise<Event> {
  const formData = new FormData();

  if (data.title) formData.append("Title", data.title);
  if (data.description) formData.append("Description", data.description);
  if (data.interestId) formData.append("InterestId", data.interestId);
  if (data.maxCount)
    formData.append("MaxParticipants", data.maxCount.toString());
  if (data.locationName) formData.append("LocationName", data.locationName);
  if (data.latitude && data.longitude) {
    formData.append("Location.Latitude", data.latitude.toString());
    formData.append("Location.Longitude", data.longitude.toString());
  }
  if (data.startScheduledTo)
    formData.append("StartScheduledTo", data.startScheduledTo);
  if (data.endScheduledTo)
    formData.append("EndScheduledTo", data.endScheduledTo);
  if (data.thumbnail) formData.append("ThumbnailUploadRequest", data.thumbnail);

  const res = await fetch(`${API_BASE_URL}/api/Events/${eventId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const updatedEvent: Event = await res.json();
  return updatedEvent;
}
