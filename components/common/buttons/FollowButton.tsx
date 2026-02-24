import { useAuth } from "@/hooks/context/AuthContext";
import { useFollowers } from "@/hooks/profile/useFollowers";
import { useProfileToFollow } from "@/hooks/profile/useProfileToFollow";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export const FollowButton = ({
  username,
  initialFollowerCount,
  onFollowerCountChange,
}: {
  username: string;
  initialFollowerCount: number;
  onFollowerCountChange?: (count: number) => void;
}) => {
  const { user } = useAuth();
  const { followers } = useFollowers(username);
  const { followUser, unfollowUser, loading } = useProfileToFollow();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowerCount);
  const previousCountRef = useRef(initialFollowerCount);

  // derive follow state from followers list
  useEffect(() => {
    if (!user) return;

    setIsFollowing(
      followers.some((f) => f.sourceUser.username === user.userName),
    );
  }, [followers, user]);

  // Notify parent when follower count changes (only when it actually changes)
  useEffect(() => {
    if (followersCount !== previousCountRef.current) {
      previousCountRef.current = followersCount;
      onFollowerCountChange?.(followersCount);
    }
  }, [followersCount]);

  // hide on own profile
  if (user?.userName === username) return null;

  const onFollow = async () => {
    if (isFollowing) return;

    setIsFollowing(true);
    setFollowersCount((c) => c + 1);

    const success = await followUser(username);

    if (!success) {
      // rollback
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
    }
  };

  const onUnfollow = async () => {
    if (!isFollowing) return;

    setIsFollowing(false);
    setFollowersCount((c) => c - 1);

    const success = await unfollowUser(username);

    if (!success) {
      // rollback
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
  };

  if (isFollowing) {
    return (
      <Pressable
        onPress={onUnfollow}
        disabled={loading}
        style={[styles.followingButton, loading && styles.disabledButton]}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.followingButtonText}>Unfollow</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onFollow}
      disabled={loading}
      style={[styles.primaryButton, loading && styles.disabledButton]}
    >
      <LinearGradient
        colors={["#FF6B58", "#FF8A7A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryButtonGradient}
      >
        <Text style={styles.primaryButtonText}>FOLLOW</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  followingButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#666666",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  followingButtonText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "#CCCCCC",
  },
  dividerPrimary: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});
