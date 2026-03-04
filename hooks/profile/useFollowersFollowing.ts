import { useAuth } from "@/hooks/context/AuthContext";
import { useCallback, useState } from "react";

// ─── API Types ────────────────────────────────────────────────────────────────

interface ApiUser {
  username: string;
  displayName: string;
  profilePhoto: { id: string; url: string; contentType: string } | null;
}

interface FollowersResponse {
  targetUser: ApiUser;
  followers: Array<{
    sourceUser: ApiUser;
    createdAt: string;
  }>;
}

interface FollowingResponse {
  sourceUser: ApiUser;
  followings: Array<{
    targetUser: ApiUser;
    createdAt: string;
  }>;
}

// Matches UserListParticipant from UserListModal
export interface FollowUser {
  username: string;
  displayName: string;
  profilePhoto: { id: string; url: string; contentType: string } | null;
  bio?: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const BASE_URL = "http://217.182.74.113:30080";

export function useFollowersFollowing() {
  const { user } = useAuth(); // swap for however you access your JWT

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch followers for a username ─────────────────────────────────────────
  const fetchFollowers = useCallback(
    async (username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/Users/${encodeURIComponent(username)}/followers`,
          {
            headers: {
              accept: "text/plain",
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: FollowersResponse = await res.json();

        const mapped: FollowUser[] = data.followers.map((f) => ({
          username: f.sourceUser.username,
          displayName: f.sourceUser.displayName,
          profilePhoto: f.sourceUser.profilePhoto,
          bio: null,
        }));

        setFollowers(mapped);
        setFollowersTotal(mapped.length);
      } catch (e: any) {
        setError(e.message ?? "Failed to load followers");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.accessToken]
  );

  // ── Fetch following for a username ─────────────────────────────────────────
  const fetchFollowing = useCallback(
    async (username: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/Users/${encodeURIComponent(username)}/following`,
          {
            headers: {
              accept: "text/plain",
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: FollowingResponse = await res.json();

        const mapped: FollowUser[] = data.followings.map((f) => ({
          username: f.targetUser.username,
          displayName: f.targetUser.displayName,
          profilePhoto: f.targetUser.profilePhoto,
          bio: null,
        }));

        setFollowing(mapped);
        setFollowingTotal(mapped.length);
      } catch (e: any) {
        setError(e.message ?? "Failed to load following");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.accessToken]
  );

  // ── Reset both lists (call on modal close) ─────────────────────────────────
  const reset = useCallback(() => {
    setFollowers([]);
    setFollowing([]);
    setFollowersTotal(0);
    setFollowingTotal(0);
    setError(null);
  }, []);

  return {
    followers,
    following,
    followersTotal,
    followingTotal,
    isLoading,
    error,
    fetchFollowers,
    fetchFollowing,
    reset,
  };
}