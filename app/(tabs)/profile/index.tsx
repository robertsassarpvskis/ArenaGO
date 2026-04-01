// app/(tabs)/MyProfileScreen.tsx
//
// The logged-in user's own profile wall.
// mode="own" — Edit + Share buttons, Sign Out footer, no Follow/Message.

import ProfileBase, { C, ProfileEvent } from "@/components/layout/ProfileBase";
import { useAuth } from "@/hooks/context/AuthContext";
import { useProfile } from "@/hooks/profile/useProfile";
import { LogOut } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Derived
  const firstName = profile?.firstName ?? "Alex";
  const lastName = profile?.lastName ?? "Rivers";
  const username = user?.userName ?? "alex_rivers";
  const locationLabel = "Riga, LV";

  const MOCK_EVENTS: ProfileEvent[] = [
    {
      id: 1,
      icon: "🏀",
      name: "Morning Basketball",
      date: "JAN 18",
      time: "09:00",
      participants: 12,
    },
    {
      id: 2,
      icon: "🧘",
      name: "Sunset Yoga",
      date: "JAN 15",
      time: "18:30",
      participants: 8,
    },
    {
      id: 3,
      icon: "🏃",
      name: "5K Run Challenge",
      date: "JAN 12",
      time: "07:00",
      participants: 24,
    },
    {
      id: 4,
      icon: "🎾",
      name: "Tennis Doubles",
      date: "JAN 10",
      time: "10:00",
      participants: 4,
    },
  ];

  const signOutFooter = (
    <View style={footer.wrap}>
      <TouchableOpacity
        style={footer.btn}
        onPress={handleLogout}
        activeOpacity={0.6}
      >
        <LogOut size={12} color={C.textMuted} strokeWidth={2} />
        <Text style={footer.text}>Sign out</Text>
      </TouchableOpacity>
      <Text style={footer.version}>v1.0.0</Text>
    </View>
  );

  return (
    <ProfileBase
      mode="own"
      firstName={firstName}
      lastName={lastName}
      username={username}
      photoUrl={profile?.profilePhoto?.url}
      bio={profile?.bio}
      preferredLanguages={profile?.preferredLanguages ?? ["EN", "LV"]}
      locationLabel={locationLabel}
      followingCount={profile?.followingCount}
      followerCount={profile?.followerCount}
      participatedEventsCount={profile?.participatedEventsCount}
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
        /* Own wall: no-op or navigate back */
      }}
      onSeeAllActivityPress={() => {
        /* TODO: navigate to full activity feed */
      }}
      footer={signOutFooter}
    />
  );
}

// ─── Footer styles ────────────────────────────────────────────────────────────

const footer = StyleSheet.create({
  wrap: {
    marginTop: 56,
    alignItems: "center",
    gap: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textMuted,
    letterSpacing: 0.2,
  },
  version: {
    fontSize: 10,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 1.5,
    opacity: 0.5,
  },
});
