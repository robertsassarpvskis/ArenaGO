import { useCallback, useEffect, useState } from "react";

/* ===================== TYPES ===================== */

export interface UserInterest {
  id: string;
  label: string;
  icon?: string;
}

export interface Profile {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  profilePhoto?: {
    id: string;
    url: string;
    contentType: string;
  };

  birthDate: string;
  gender: boolean;
  preferredLanguages: string[];
  preferredTimeZone: string;
  lastKnownLocation?: { latitude: number; longitude: number };
  socialCredit: number;
  lastLoginAt: string;
  interests?: UserInterest[];

  followerCount?: number;
  followingCount?: number;
  createdEventsCount?: number;
  participatedEventsCount?: number;
}

/* ===================== CONFIG ===================== */

const API_URL = "http://217.182.74.113:30080/api";

/* ===================== HOOK ===================== */

export function useProfile(userName: string, token?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- FETCH ---------- */

  const fetchProfile = useCallback(async () => {
    if (!userName) return;

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(`${API_URL}/Users/${userName}`, { headers });

      if (!res.ok) {
        throw new Error(`Profile load failed: ${res.status}`);
      }

      const data: Profile = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userName, token]);

  /* ---------- INITIAL LOAD ---------- */

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ---------- OPTIMISTIC HELPERS ---------- */

  const incrementFollowerCount = useCallback(() => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followerCount: (prev.followerCount ?? 0) + 1,
          }
        : prev,
    );
  }, []);

  /* ===================== RETURN ===================== */

  return {
    profile,
    loading,
    error,

    // actions
    refetch: fetchProfile,
    incrementFollowerCount,
  };
}
