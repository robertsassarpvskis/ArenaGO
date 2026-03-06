// app/(tabs)/ProfileScreen.tsx
import FollowStats from "@/components/common/profile/FollowStats";
import { Edit3, LogOut, Share2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "../../../components/common/profile/Avatar";
import { useAuth } from "../../../hooks/context/AuthContext";
import { useProfile } from "../../../hooks/profile/useProfile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Interest {
  id: number;
  name: string;
  icon: string;
  rotation: number;
}

interface RecentEvent {
  id: number;
  name: string;
  icon: string;
  date: string;
  time: string;
  participants: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERESTS: Interest[] = [
  { id: 1, name: "Basketball", icon: "🏀", rotation: -1.5 },
  { id: 2, name: "Yoga", icon: "🧘", rotation: 1 },
  { id: 3, name: "Running", icon: "🏃", rotation: -2 },
  { id: 4, name: "Tennis", icon: "🎾", rotation: 2 },
  { id: 5, name: "Cycling", icon: "🚴", rotation: -1 },
  { id: 6, name: "Swimming", icon: "🏊", rotation: 1.5 },
];

const RECENT_EVENTS: RecentEvent[] = [
  {
    id: 1,
    name: "Morning Basketball at Mežaparks",
    icon: "🏀",
    date: "JAN 18",
    time: "09:00",
    participants: 12,
  },
  {
    id: 2,
    name: "Sunset Yoga Session",
    icon: "🧘",
    date: "JAN 15",
    time: "18:30",
    participants: 8,
  },
  {
    id: 3,
    name: "5K Run Challenge",
    icon: "🏃",
    date: "JAN 12",
    time: "07:00",
    participants: 24,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
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
      "Are you sure?",
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

  const age = calculateAge(profile?.birthDate);
  const firstName = profile?.firstName ?? "Alex";
  const lastName = profile?.lastName ?? "Rivers";
  const username = user?.userName ?? "alex_rivers";

  const metaParts: string[] = [];
  if (age !== null) metaParts.push(`${age}y`);
  metaParts.push("Riga, LV");
  metaParts.push("EN · LV");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
      >
        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <Text style={styles.wallLabel}>MY WALL</Text>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7}>
              <Share2 size={16} color={C.sub} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.solidBtn} activeOpacity={0.8}>
              <Edit3 size={13} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.solidBtnText}>EDIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── IDENTITY ── */}
        <View style={styles.identity}>
          {/* Square avatar with radius — clipped via overflow */}
          <View style={styles.avatarWrap}>
            <Avatar
              uri={profile?.profilePhoto?.url}
              firstName={firstName}
              lastName={lastName}
              size={140}
            />
          </View>

          <View style={styles.nameCol}>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.realName}>
              {firstName} {lastName}
            </Text>
            {/* Meta as small inline chips */}
            <View style={styles.metaChips}>
              {metaParts.map((part, i) => (
                <View key={i} style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{part}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── STATS ── */}
        <FollowStats
          username={username}
          token={user?.accessToken ?? ""}
          eventsCount={profile?.participatedEventsCount}
          followersCount={profile?.followerCount}
          followingCount={profile?.followingCount}
          onSelectUser={(_u) => {
            // TODO: navigate to UserProfileScreen for _u
          }}
        />

        {/* ── INTERESTS ── */}
        {/* Section title — street style: big bold + accent bar */}
        <Text style={styles.sectionTitle}>INTERESTS</Text>
        <View style={styles.sectionAccentBar} />
        <View style={styles.interestGrid}>
          {INTERESTS.map((item) => (
            <View
              key={item.id}
              style={[
                styles.interestCell,
                { transform: [{ rotate: `${item.rotation}deg` }] },
              ]}
            >
              <Text style={styles.interestEmoji}>{item.icon}</Text>
              <Text style={styles.interestName}>{item.name.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* ── RECENT ACTIVITY ── */}
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        <View style={styles.sectionAccentBar} />
        <View style={styles.eventList}>
          {RECENT_EVENTS.map((ev) => (
            <View key={ev.id} style={styles.eventCard}>
              {/* Inner row */}
              <View style={styles.eventCardInner}>
                <View style={styles.eventIconBox}>
                  <Text style={styles.eventEmoji}>{ev.icon}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName} numberOfLines={2}>
                    {ev.name}
                  </Text>
                  <Text style={styles.eventMeta}>
                    {ev.date} · {ev.time} · {ev.participants} people
                  </Text>
                </View>
              </View>
              {/* Street accent strip at bottom — from Doc 8 */}
              <View style={styles.eventAccentStrip} />
            </View>
          ))}
        </View>

        {/* ── SIGN OUT ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <LogOut size={12} color={C.muted} strokeWidth={2} />
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: "#F5F2EC", // warm wall
  surface: "#EDEAE3", // card / chip surface
  border: "#DDD9D1", // quiet borders
  text: "#1A1A1A", // primary
  sub: "#888888", // secondary
  muted: "#BBBBBB", // very quiet
  accent: "#FF6B58", // coral — single accent
  intBg: "#FFF0EE", // interest cell bg
  intBorder: "#FFCFC9", // interest cell border
  intText: "#CC4433", // interest label
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // ── Top bar — minimal, utility only
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  wallLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    color: C.muted,
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  ghostBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  solidBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  solidBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
  },

  // ── Identity — bigger avatar, accent username
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 36,
  },
  avatarWrap: {
    width: 140,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    flexShrink: 0,
  },
  nameCol: {
    flex: 1,
    gap: 4,
  },
  // Hero element — accent color, biggest text
  username: {
    fontSize: 30,
    fontWeight: "900",
    color: C.accent,
    letterSpacing: -1.5,
    lineHeight: 32,
  },
  realName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 0.3,
  },
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },
  metaChip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: C.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.sub,
    letterSpacing: 0.3,
  },

  // ── Section header — street style from Doc 8
  // Big bold title + short accent bar underneath
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionAccentBar: {
    width: 48,
    height: 4,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 18,
  },

  // ── Interests — 3-col grid, single coral tint, rotated sticker feel
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 36,
  },
  interestCell: {
    // 3 equal columns with gap accounted for
    width: "30.5%",
    backgroundColor: C.intBg,
    borderWidth: 1.5,
    borderColor: C.intBorder,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    gap: 7,
  },
  interestEmoji: {
    fontSize: 28,
  },
  interestName: {
    fontSize: 9,
    fontWeight: "900",
    color: C.intText,
    letterSpacing: 0.8,
    textAlign: "center",
  },

  // ── Events — minimal card with street accent strip bottom
  eventList: {
    gap: 12,
    marginBottom: 44,
  },
  eventCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  eventCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  eventIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: C.intBg,
    borderWidth: 1.5,
    borderColor: C.intBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  eventMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: C.sub,
  },
  // Street accent strip — thin coral bar at base of each card (Doc 8)
  eventAccentStrip: {
    height: 3,
    backgroundColor: C.accent,
  },

  // ── Sign out — whisper quiet
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 9,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 3,
  },

  // ── Version
  version: {
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 3,
  },
});
