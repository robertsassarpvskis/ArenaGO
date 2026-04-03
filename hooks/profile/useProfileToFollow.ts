// hooks/profile/useProfileToFollow.ts
import { useAuth } from "@/hooks/context/AuthContext";
import { useState } from "react";

export interface FollowResponse {
  targetUser: {
    username: string;
    displayName: string;
    profilePhoto?: { id: string; url: string };
  };
  follow: {
    sourceUser: {
      username: string;
      displayName: string;
      profilePhoto?: any;
    };
    createdAt: string;
  };
}

export const useProfileToFollow = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const followUser = async (username: string) => {
    if (!user?.accessToken) return false;

    setLoading(true);
    try {
      const res = await fetch(
        `http://217.182.74.113:30080/api/Users/${username}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            Accept: "text/plain",
          },
        },
      );

      if (!res.ok) return false;

      const data: FollowResponse = await res.json();
      return true;
    } catch (error) {
      console.error("Follow error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (username: string) => {
    if (!user?.accessToken) return false;

    setLoading(true);
    try {
      const res = await fetch(
        `http://217.182.74.113:30080/api/Users/${username}/follow`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            Accept: "text/plain",
          },
        },
      );

      return res.ok;
    } catch (error) {
      console.error("Unfollow error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { followUser, unfollowUser, loading };
};
