// screens/UserProfileScreen.tsx
//
// Viewed profile — another user's wall.
// mode="other" — Follow + Message buttons.

import UserListModal from "@/app/modal/UserListModal";
import ProfileBase, {
  C,
  Interest,
  ProfileEvent,
  SocialLink,
} from "@/components/layout/ProfileBase";
import { useAuth } from "@/hooks/context/AuthContext";
import { useFollowers } from "@/hooks/profile/useFollowers";
import { useFollowersFollowing } from "@/hooks/profile/useFollowersFollowing";
import { useProfileToFollow } from "@/hooks/profile/useProfileToFollow";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfileData {
  userName: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  bio?: string;
  gender?: boolean;
  profilePhoto?: { url: string };
  photos?: string[]; // carousel images
  lastKnownLocation?: { latitude: number; longitude: number } | string;
  preferredLanguages?: string[];
  interests?: string[]; // e.g. ["basketball", "yoga"]
  socialLinks?: { platform: string; handle: string }[];
  memberSince?: string;
  responseRate?: number;
  participatedEventsCount: number;
  followerCount: number;
  followingCount: number;
}

interface UserProfileScreenProps {
  username: string;
  onBack: () => void;
  onNavigateToUser?: (username: string) => void;
}

// ─── Mock data (replace with real API fields when available) ──────────────────

const MOCK_RECENT_EVENTS: ProfileEvent[] = [
  {
    id: 1,
    icon: "🏀",
    name: "Morning Basketball",
    date: "JAN 18",
    time: "09:00",
    participants: 12,
    maxParticipants: 16,
    category: "sport",
  },
  {
    id: 2,
    icon: "🧘",
    name: "Sunset Yoga",
    date: "JAN 15",
    time: "18:30",
    participants: 8,
    maxParticipants: 10,
    category: "sport",
  },
  {
    id: 3,
    icon: "🏃",
    name: "5K Run Challenge",
    date: "JAN 12",
    time: "07:00",
    participants: 24,
    maxParticipants: 30,
    category: "sport",
  },
  {
    id: 4,
    icon: "☕",
    name: "Coffee Meetup",
    date: "JAN 10",
    time: "10:00",
    participants: 6,
    maxParticipants: 8,
    category: "social",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function locationToLabel(
  loc?: UserProfileData["lastKnownLocation"],
): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === "string") return loc;
  return `${loc.latitude.toFixed(2)}° N, ${loc.longitude.toFixed(2)}° E`;
}

/** Map raw interest strings from API to typed Interest objects. */
function mapInterests(raw?: string[]): Interest[] {
  if (!raw || raw.length === 0) return [];
  return raw.map((id) => ({
    id: id.toLowerCase(),
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));
}

/** Map raw social links from API to typed SocialLink objects. */
function mapSocialLinks(
  raw?: { platform: string; handle: string }[],
): SocialLink[] {
  if (!raw || raw.length === 0) return [];
  const allowed = [
    "instagram",
    "twitter",
    "strava",
    "youtube",
    "tiktok",
    "linkedin",
    "spotify",
  ];
  return raw
    .filter((s) => allowed.includes(s.platform.toLowerCase()))
    .map((s) => ({
      platform: s.platform.toLowerCase() as SocialLink["platform"],
      handle: s.handle,
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserProfileScreen({
  username,
  onBack,
}: UserProfileScreenProps) {
  const { user } = useAuth();
  const {
    followUser,
    unfollowUser,
    loading: followLoading,
  } = useProfileToFollow();
  const { followers, setFollowers } = useFollowers(username);
  const {
    followers: listFollowers,
    following: listFollowing,
    followersTotal,
    followingTotal,
    isLoading: isLoadingList,
    fetchFollowers,
    fetchFollowing,
    reset: resetList,
  } = useFollowersFollowing();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal state for followers/following list ───────────────────────────────
  const [listModalVisible, setListModalVisible] = useState(false);
  const [listModalType, setListModalType] = useState<"followers" | "following">(
    "followers",
  );

  // Fetch initial profile data
  useEffect(() => {
    if (username) fetchUserProfile();
  }, [username]);

  // Derive follow state from followers list
  useEffect(() => {
    if (!user || !followers) return;

    const isCurrentUserFollowing = followers.some(
      (f) => f.sourceUser.username === user.userName,
    );
    setIsFollowing(isCurrentUserFollowing);
  }, [followers, user]);

  // Sync follower count from profile
  useEffect(() => {
    if (profile?.followerCount) {
      setFollowerCount(profile.followerCount);
    }
  }, [profile?.followerCount]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      const response = await fetch(
        `http://217.182.74.113:30080/api/Users/${username}`,
      );
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
      setProfile(data);
      setFollowerCount(data.followerCount);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle follow action with real-time stats update
  const handleFollowPress = async () => {
    if (isFollowing) {
      // Unfollow
      setIsFollowing(false);
      setFollowerCount((c) => c - 1);

      const success = await unfollowUser(username);

      if (!success) {
        // Rollback on failure
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      } else {
        // Update followers list after successful unfollow
        setFollowers(
          followers.filter((f) => f.sourceUser.username !== user?.userName),
        );
      }
    } else {
      // Follow
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);

      const success = await followUser(username);

      if (!success) {
        // Rollback on failure
        setIsFollowing(false);
        setFollowerCount((c) => c - 1);
      } else {
        // Refresh followers list after successful follow to get the new entry
        // For now, just trigger a refetch of followers
        fetchUserProfile();
      }
    }
  };

  // ── Handle list modal opens ────────────────────────────────────────────────

  const handleFollowersPress = async () => {
    setListModalType("followers");
    setListModalVisible(true);
    await fetchFollowers(username);
  };

  const handleFollowingPress = async () => {
    setListModalType("following");
    setListModalVisible(true);
    await fetchFollowing(username);
  };

  const handleListModalClose = () => {
    setListModalVisible(false);
    resetList();
  };

  const handleSelectUser = (selectedUsername: string) => {
    // Navigate to the selected user's profile
    // This would typically navigate to another UserProfileScreen instance
    // For now, just a placeholder
    console.log("Selected user:", selectedUsername);
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const photos: string[] = profile?.photos?.length
    ? profile.photos
    : profile?.profilePhoto?.url
      ? [profile.profilePhoto.url]
      : [];

  const interests = mapInterests(profile?.interests);
  const socialLinks = mapSocialLinks(profile?.socialLinks);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal animationType="none" presentationStyle="fullScreen">
      <View style={styles.bg} />

      {/* Back button shown only during load / error states */}
      {(loading || error) && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <ArrowLeft size={28} color={C.text} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.coral} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUserProfile}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : profile ? (
        <>
          <ProfileBase
            mode="other"
            firstName={profile.firstName || "User"}
            lastName={profile.lastName || ""}
            username={profile.userName}
            // Carousel — multi-photo if available, single fallback
            photos={photos.length > 0 ? photos : undefined}
            photoUrl={profile.profilePhoto?.url}
            bio={profile.bio}
            // Interest tiles
            interests={interests}
            // Social badges in hero
            socialLinks={socialLinks}
            preferredLanguages={profile.preferredLanguages ?? []}
            locationLabel={locationToLabel(profile.lastKnownLocation)}
            memberSince={profile.memberSince}
            responseRate={profile.responseRate}
            followingCount={profile.followingCount}
            followerCount={followerCount}
            participatedEventsCount={profile.participatedEventsCount}
            isFollowing={isFollowing}
            recentEvents={MOCK_RECENT_EVENTS}
            refreshing={refreshing}
            onRefresh={fetchUserProfile}
            onFollowPress={handleFollowPress}
            onFollowersPress={handleFollowersPress}
            onFollowingPress={handleFollowingPress}
            onMessagePress={() => {
              /* TODO: navigate to chat */
            }}
            onClosePress={onBack}
            onMorePress={() => {
              /* TODO: show options sheet */
            }}
            onSeeAllActivityPress={() => {
              /* TODO: full activity feed */
            }}
          />

          {/* ── Followers/Following Modal ── */}
          <UserListModal
            visible={listModalVisible}
            onClose={handleListModalClose}
            participants={
              listModalType === "followers" ? listFollowers : listFollowing
            }
            total={
              listModalType === "followers" ? followersTotal : followingTotal
            }
            isLoading={isLoadingList}
            title={listModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
            onSelectUser={handleSelectUser}
          />
        </>
      ) : null}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
  },
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.surfaceAlt, // was C.surface — fixed
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.coral,
    textAlign: "center",
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: C.coral,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
