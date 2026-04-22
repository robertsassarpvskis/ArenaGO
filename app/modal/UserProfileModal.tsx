// screens/UserProfileScreen.tsx
//
// Viewed profile — another user's wall.
// mode="other" — Follow + Message buttons.
// Now fetches real participated + created events for the viewed user.
// ─────────────────────────────────────────────────────────────────────────────

import UserListModal from "@/app/modal/UserListModal";
import ProfileBase, {
  C,
  Interest,
  ProfileEvent,
  SocialLink,
} from "@/components/layout/ProfileBase";
import { useAuth } from "@/hooks/context/AuthContext";
import { useUserEvents } from "@/hooks/events/useUserEvents";
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
  photos?: string[];
  lastKnownLocation?: { latitude: number; longitude: number } | string;
  preferredLanguages?: string[];
  interests?: string[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function locationToLabel(
  loc?: UserProfileData["lastKnownLocation"],
): string | undefined {
  if (!loc) return undefined;
  if (typeof loc === "string") return loc;
  return `${loc.latitude.toFixed(2)}° N, ${loc.longitude.toFixed(2)}° E`;
}

function mapInterests(raw?: string[]): Interest[] {
  if (!raw || raw.length === 0) return [];
  return raw.map((id) => ({
    id: id.toLowerCase(),
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));
}

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

  const [listModalVisible, setListModalVisible] = useState(false);
  const [listModalType, setListModalType] = useState<"followers" | "following">(
    "followers",
  );

  // ── Fetch events for the viewed user (using the viewer's token) ───────────
  const {
    events: userEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useUserEvents(
    username,
    user?.accessToken,
    Boolean(username && user?.accessToken),
  );

  // ── Profile data ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (username) fetchUserProfile();
  }, [username]);

  useEffect(() => {
    if (!user || !followers) return;
    const isCurrentUserFollowing = followers.some(
      (f) => f.sourceUser.username === user.userName,
    );
    setIsFollowing(isCurrentUserFollowing);
  }, [followers, user]);

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

  const handleRefresh = async () => {
    await Promise.all([fetchUserProfile(), refetchEvents()]);
  };

  // ── Follow / Unfollow ──────────────────────────────────────────────────────

  const handleFollowPress = async () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((c) => c - 1);
      const success = await unfollowUser(username);
      if (!success) {
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      } else {
        setFollowers(
          followers.filter((f) => f.sourceUser.username !== user?.userName),
        );
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      const success = await followUser(username);
      if (!success) {
        setIsFollowing(false);
        setFollowerCount((c) => c - 1);
      } else {
        fetchUserProfile();
      }
    }
  };

  // ── List modal handlers ────────────────────────────────────────────────────

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

  // Map real API events → ProfileEvent shape expected by ProfileBase
  const recentEvents: ProfileEvent[] = userEvents.map((ev) => ({
    id: ev.eventId,
    name: ev.eventName,
    icon: ev.kind === "created" ? "⭐" : "🎟️",
    date: ev.startScheduledTo
      ? new Date(ev.startScheduledTo).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "TBD",
    time: ev.startScheduledTo
      ? new Date(ev.startScheduledTo).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "",
    participants: ev.currentCount ?? 0,
    maxParticipants: ev.maxCount ?? 0,
    category: "sport",
    // ── Real fields consumed directly by MyEventCard ──────────────────────
    _startScheduledTo: ev.startScheduledTo,
    _locationName: ev.locationName,
    _categoryName: ev.categoryName,
    _kind: ev.kind,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal animationType="none" presentationStyle="fullScreen">
      <View style={styles.bg} />

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
            photos={photos.length > 0 ? photos : undefined}
            photoUrl={profile.profilePhoto?.url}
            bio={profile.bio}
            interests={interests}
            socialLinks={socialLinks}
            preferredLanguages={profile.preferredLanguages ?? []}
            locationLabel={locationToLabel(profile.lastKnownLocation)}
            memberSince={profile.memberSince}
            responseRate={profile.responseRate}
            followingCount={profile.followingCount}
            followerCount={followerCount}
            participatedEventsCount={profile.participatedEventsCount}
            isFollowing={isFollowing}
            recentEvents={recentEvents}
            eventsLoading={eventsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
    backgroundColor: C.surfaceAlt,
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
