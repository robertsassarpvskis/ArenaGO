// hooks/events/useEventsCreate.ts
import axios from "axios";
import { useState } from "react";

const API_URL = "http://217.182.74.113:30080/api/Events";

export interface CreateEventPayload {
  title: string;
  description: string;
  interestId: string;
  maxParticipants: number;
  thumbnailUploadRequest?: {
    uri: string;
    type: string;
    name: string;
  } | null;
  locationName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  startScheduledTo: string; // ISO string
  endScheduledTo?: string; // ISO string optional
}

export function useCreateEvent(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createEvent = async (payload: CreateEventPayload) => {
    if (!token) throw new Error("User not authenticated yet");

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();

      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("interestId", payload.interestId);
      formData.append("maxParticipants", payload.maxParticipants.toString());
      formData.append("locationName", payload.locationName);
      formData.append("startScheduledTo", payload.startScheduledTo);

      if (payload.endScheduledTo) {
        formData.append("endScheduledTo", payload.endScheduledTo);
      }

      // ✅ Send as flat dot-notation fields — ASP.NET Core model binding
      // does NOT parse JSON strings inside FormData, it needs flat fields
      formData.append(
        "location.latitude",
        payload.location.latitude.toString(),
      );
      formData.append(
        "location.longitude",
        payload.location.longitude.toString(),
      );

      if (payload.thumbnailUploadRequest) {
        formData.append("thumbnailUploadRequest", {
          uri: payload.thumbnailUploadRequest.uri,
          type: payload.thumbnailUploadRequest.type || "image/jpeg",
          name: payload.thumbnailUploadRequest.name || "event-image.jpg",
        } as any);
      }

      console.log("FormData being sent:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      console.log("Create event response:", response.data);
      return response.data;
    } catch (err: any) {
      console.error(
        "Axios create event error:",
        err.response?.data || err.message,
      );
      console.error("Error status:", err.response?.status);
      console.error("Error headers:", err.response?.headers);

      setError(err.response?.data ?? err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createEvent, loading, error };
}
