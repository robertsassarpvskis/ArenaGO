import axios from "axios";
import { useState } from "react";

const API_BASE = "http://217.182.74.113:30080/api/Events";

export function useLeaveEvent(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const leaveEvent = async (eventId: string): Promise<void> => {
    if (!token) throw new Error("User not authenticated yet");

    try {
      setLoading(true);
      setError(null);

      await axios.post(`${API_BASE}/${eventId}/leave`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      });

      console.log("Successfully left event:", eventId);
    } catch (err: any) {
      console.error("Axios leave event error:", err.response?.data || err);
      setError(err.response?.data ?? err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { leaveEvent, loading, error };
}
