// app/(tabs)/MyProfileScreen.tsx

import ProfileBase, {
  C,
  Interest,
  ProfileEvent,
  SocialLink,
} from "@/components/layout/ProfileBase";
import { useAuth } from "@/hooks/context/AuthContext";
import { useProfile } from "@/hooks/profile/useProfile";
import { LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MyProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, refetch } = useProfile(
    user?.userName ?? "",
    user?.accessToken,
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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

  const firstName = profile?.firstName ?? "Alex";
  const lastName = profile?.lastName ?? "Rivers";
  const username = user?.userName ?? "alex_rivers";

  // ── Mock data — replace with real API data ─────────────────────────────────

  const MOCK_PHOTOS: string[] = [
    profile?.profilePhoto?.url ?? "",
    // Add more photo URLs here — e.g. from a photos[] field in profile
    // "https://example.com/photo2.jpg",
    // "https://example.com/photo3.jpg",
  ].filter(Boolean);

  const MOCK_INTERESTS: Interest[] = [
    { id: "basketball", label: "Basketball" },
    { id: "yoga", label: "Yoga" },
    { id: "running", label: "Running" },
    { id: "tennis", label: "Tennis" },
    { id: "cycling", label: "Cycling" },
    { id: "coffee", label: "Coffee" },
  ];

  const MOCK_SOCIAL: SocialLink[] = [
    { platform: "instagram", handle: "alex.rivers" },
    { platform: "strava", handle: "alexrivers" },
    { platform: "twitter", handle: "alex_rivers" },
  ];

  const MOCK_EVENTS: ProfileEvent[] = [
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
    <ProfileBase
      mode="own"
      firstName={firstName}
      lastName={lastName}
      username={username}
      // Photo carousel — pass array; falls back to single photoUrl if only 1
      photos={MOCK_PHOTOS.length > 0 ? MOCK_PHOTOS : undefined}
      photoUrl={profile?.profilePhoto?.url}
      bio={profile?.bio}
      // Interests with icons
      interests={MOCK_INTERESTS}
      // Social badges shown in hero
      socialLinks={MOCK_SOCIAL}
      preferredLanguages={profile?.preferredLanguages ?? ["EN", "LV"]}
      locationLabel="Riga, LV"
      memberSince="MAR 2024"
      responseRate={92}
      followingCount={profile?.followingCount ?? 148}
      followerCount={profile?.followerCount ?? 312}
      participatedEventsCount={profile?.participatedEventsCount ?? 47}
      recentEvents={MOCK_EVENTS}
      refreshing={refreshing}
      onRefresh={handleRefresh}
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
