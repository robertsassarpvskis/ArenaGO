// app/(tabs)/MyProfileScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Own-user profile screen.
// Now fetches real participated + created events via useUserEvents.
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
import { useFollowersFollowing } from "@/hooks/profile/useFollowersFollowing";
import { useProfile } from "@/hooks/profile/useProfile";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MyProfileScreen() {
  const { user, logout } = useAuth();
  const { impact, notification } = useHapticFeedback();

  const { profile, refetch: refetchProfile } = useProfile(
    user?.userName ?? "",
    user?.accessToken,
  );

  const {
    events: userEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useUserEvents(
    user?.userName ?? "",
    user?.accessToken,
    Boolean(user?.userName && user?.accessToken),
  );

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

  const [refreshing, setRefreshing] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [listModalType, setListModalType] = useState<"followers" | "following">(
    "followers",
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    await impact("medium");
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchEvents()]);
    setRefreshing(false);
    await notification("success");
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => await logout(),
        },
      ],
      { cancelable: true },
    );
  };

  const handleFollowersPress = async () => {
    setListModalType("followers");
    setListModalVisible(true);
    await fetchFollowers(user?.userName ?? "");
  };

  const handleFollowingPress = async () => {
    setListModalType("following");
    setListModalVisible(true);
    await fetchFollowing(user?.userName ?? "");
  };

  const handleListModalClose = () => {
    setListModalVisible(false);
    resetList();
  };

  const handleSelectUser = (selectedUsername: string) => {
    // TODO: navigate to UserProfileScreen with selectedUsername
    console.log("Selected user:", selectedUsername);
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const firstName = profile?.firstName ?? "Alex";
  const lastName = profile?.lastName ?? "Rivers";
  const username = user?.userName ?? "alex_rivers";

  const MOCK_PHOTOS: string[] = [profile?.profilePhoto?.url ?? ""].filter(
    Boolean,
  );

  const userInterests: Interest[] = (profile?.interests ?? []).map(
    (interest) => ({
      id: interest.id,
      label: interest.label,
      icon: interest.icon,
    }),
  );

  const MOCK_SOCIAL: SocialLink[] = [
    { platform: "instagram", handle: "alex.rivers" },
    { platform: "strava", handle: "alexrivers" },
    { platform: "twitter", handle: "alex_rivers" },
  ];

  // ── Map real API events → ProfileEvent shape ───────────────────────────────
  const recentEvents: ProfileEvent[] = userEvents.map((ev) => ({
    id: ev.eventId,
    name: ev.eventName,
    icon: ev.kind === "created" ? "⭐" : "🎟️",
    // date/time are display placeholders — real data comes via _startScheduledTo
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

  // ── Footer ─────────────────────────────────────────────────────────────────

  const signOutFooter = (
    <View style={footer.wrap}>
      <TouchableOpacity
        style={footer.btn}
        onPress={handleLogout}
        activeOpacity={0.6}
      >
        <LogOut size={12} color={C.textMuted} strokeWidth={2} />
        <Text style={footer.text}>SIGN OUT</Text>
      </TouchableOpacity>
      <Text style={footer.version}>V 1.0.0</Text>
    </View>
  );

  return (
    <>
      <ProfileBase
        mode="own"
        firstName={firstName}
        lastName={lastName}
        username={username}
        photos={MOCK_PHOTOS.length > 0 ? MOCK_PHOTOS : undefined}
        photoUrl={profile?.profilePhoto?.url}
        bio={profile?.bio}
        interests={userInterests}
        socialLinks={MOCK_SOCIAL}
        preferredLanguages={profile?.preferredLanguages ?? ["EN", "LV"]}
        locationLabel="Riga, LV"
        memberSince="MAR 2024"
        followingCount={profile?.followingCount ?? 148}
        followerCount={profile?.followerCount ?? 312}
        participatedEventsCount={profile?.participatedEventsCount ?? 47}
        recentEvents={recentEvents}
        eventsLoading={eventsLoading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onFollowersPress={handleFollowersPress}
        onFollowingPress={handleFollowingPress}
        onEditPress={() => {
          /* TODO: navigate to EditProfileScreen */
        }}
        onSharePress={() => {
          /* TODO: share profile link */
        }}
        onClosePress={() => {
          /* own wall — no-op */
        }}
        onSeeAllActivityPress={() => {
          /* TODO: navigate to activity feed */
        }}
        footer={signOutFooter}
      />

      <UserListModal
        visible={listModalVisible}
        onClose={handleListModalClose}
        participants={
          listModalType === "followers" ? listFollowers : listFollowing
        }
        total={listModalType === "followers" ? followersTotal : followingTotal}
        isLoading={isLoadingList}
        title={listModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
        onSelectUser={handleSelectUser}
      />
    </>
  );
}

const footer = StyleSheet.create({
  wrap: {
    marginTop: 36,
    alignItems: "center",
    gap: 10,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  version: {
    fontSize: 9,
    fontWeight: "700",
    color: C.borderMid,
    letterSpacing: 2.2,
  },
});
