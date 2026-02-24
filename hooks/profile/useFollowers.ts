// hooks/profile/useFollowers.ts
import { useAuth } from "@/hooks/context/AuthContext";
import { useEffect, useState } from "react";

export interface Follower {
  sourceUser: {
    username: string;
    displayName: string;
    profilePhoto?: any;
  };
  createdAt: string;
}

export const useFollowers = (username: string) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.accessToken) return;

    const fetchFollowers = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://217.182.74.113:30080/api/Users/${username}/followers`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              Accept: "text/plain",
            },
          },
        );

        const data = await res.json();
        setFollowers(data.followers);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [username, user?.accessToken]);

  return { followers, setFollowers, loading };
};
