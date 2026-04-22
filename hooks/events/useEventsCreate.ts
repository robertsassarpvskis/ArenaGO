import axios from "axios";
import { useState } from "react";

const API_URL = "http://217.182.74.113:30080/api/Events";

export interface CreateEventPayload {
  title: string;
  description?: string;
  interestId?: string;
  customInterestName?: string;
  maxParticipants?: number;
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
  startScheduledTo: string;
  endScheduledTo?: string;
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

      // ── Required fields ──────────────────────────────────────────────────────
      formData.append("Title", payload.title);
      formData.append("LocationName", payload.locationName);
      formData.append(
        "Location.Latitude",
        payload.location.latitude.toString(),
      );
      formData.append(
        "Location.Longitude",
        payload.location.longitude.toString(),
      );
      formData.append("StartScheduledTo", payload.startScheduledTo);

      // ── Interest: always send InterestId when provided.
      // For custom category: send the fixed custom InterestId + CustomInterestName together.
      // For preset category: send only the selected InterestId.
      if (payload.interestId?.trim()) {
        formData.append("InterestId", payload.interestId.trim());
      }

      if (payload.customInterestName?.trim()) {
        formData.append(
          "CustomInterestName",
          payload.customInterestName.trim(),
        );
      }

      // ── Optional fields ──────────────────────────────────────────────────────
      if (payload.description?.trim()) {
        formData.append("Description", payload.description.trim());
      }

      if (payload.maxParticipants && payload.maxParticipants > 0) {
        formData.append("MaxParticipants", payload.maxParticipants.toString());
      }

      if (payload.endScheduledTo) {
        formData.append("EndScheduledTo", payload.endScheduledTo);
      }

      if (payload.thumbnailUploadRequest) {
        formData.append("ThumbnailUploadRequest", {
          uri: payload.thumbnailUploadRequest.uri,
          type: payload.thumbnailUploadRequest.type || "image/jpeg",
          name: payload.thumbnailUploadRequest.name || "event-image.jpg",
        } as any);
      }

      // ── Dev logging ──────────────────────────────────────────────────────────
      if (__DEV__) {
        console.log("[useEventsCreate] Sending FormData:");
        for (const [key, value] of (formData as any)._parts ?? []) {
          console.log(" ", key, "→", value);
        }
      }

      const response = await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      return response.data;
    } catch (err: any) {
      const detail = err.response?.data ?? err.message;
      console.error("[useEventsCreate] Error:", detail);
      setError(detail);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createEvent, loading, error };
}
