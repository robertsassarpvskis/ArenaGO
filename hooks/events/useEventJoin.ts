import axios from "axios";
import { useState } from "react";

const API_BASE = "http://217.182.74.113:30080/api/Events";

export interface JoinEventResponse {
  resourceSummary: {
    eventId: string;
    eventName: string;
  };
  participation: {
    userSummary: {
      username: string;
      displayName: string;
      profilePhoto: string | null;
    };
    joinedAt: string;
    leftAt: string | null;
    isKicked: boolean | null;
  };
}

export function useJoinEvent(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const joinEvent = async (eventId: string): Promise<JoinEventResponse> => {
    if (!token) throw new Error("User not authenticated yet");

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post<JoinEventResponse>(
        `${API_BASE}/${eventId}/join`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      console.log("Join event response:", response.data);
      return response.data;
    } catch (err: any) {
      console.error("Axios join event error:", err.response?.data || err);
      setError(err.response?.data ?? err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { joinEvent, loading, error };
}
