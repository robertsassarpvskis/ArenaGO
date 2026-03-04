// components/profile/FollowStats.tsx
//
// Pixel-identical to the statsSection in UserProfileScreen.tsx.
// EVENTS card is static; FOLLOWERS and FOLLOWING cards are pressable
// and open UserListModal with live API data.
//
// Props:
//   username        — the profile being viewed (not necessarily the logged-in user)
//   token           — JWT access token from useAuth()
//   eventsCount     — participatedEventsCount from profile API
//   followersCount  — followerCount from profile API
//   followingCount  — followingCount from profile API
//   onSelectUser    — called with a username when user taps a row in the sheet;
//                     parent opens UserProfileScreen for that username

import UserListModal, {
    UserListParticipant,
} from "@/app/modal/UserListModal"; // ← adjust to your path
import { useCallback, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowStatsProps {
  username: string;
  token: string;
  eventsCount?: number;
  followersCount?: number;
  followingCount?: number;
  onSelectUser: (username: string) => void;
}

type Sheet = "followers" | "following" | null;

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE = "http://217.182.74.113:30080";

async function apiFetchFollowers(
  username: string,
  token: string,
): Promise<UserListParticipant[]> {
  const res = await fetch(
    `${BASE}/api/Users/${encodeURIComponent(username)}/followers`,
    { headers: { accept: "text/plain", Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.followers ?? []).map((f: any) => ({
    username: f.sourceUser.username,
    displayName: f.sourceUser.displayName,
    profilePhoto: f.sourceUser.profilePhoto ?? null,
    bio: null,
  }));
}

async function apiFetchFollowing(
  username: string,
  token: string,
): Promise<UserListParticipant[]> {
  const res = await fetch(
    `${BASE}/api/Users/${encodeURIComponent(username)}/following`,
    { headers: { accept: "text/plain", Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.followings ?? []).map((f: any) => ({
    username: f.targetUser.username,
    displayName: f.targetUser.displayName,
    profilePhoto: f.targetUser.profilePhoto ?? null,
    bio: null,
  }));
}

// ─── Single stat card ─────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  offsetTop = 0,
  onPress,
}: {
  value?: number;
  label: string;
  offsetTop?: number;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();

  const card = (
    <Animated.View
      style={[
        styles.statCard,
        { marginTop: offsetTop },
        { transform: [{ scale }] },
      ]}
    >
      <Text style={styles.statNumber}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statAccent} />
      {/* Subtle pulsing underline so tappable cards feel interactive */}
      {!!onPress && <View style={styles.tapHint} />}
    </Animated.View>
  );

  if (!onPress) return card;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      {card}
    </TouchableOpacity>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function FollowStats({
  username,
  token,
  eventsCount,
  followersCount,
  followingCount,
  onSelectUser,
}: FollowStatsProps) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [list, setList] = useState<UserListParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openSheet = useCallback(
    async (kind: "followers" | "following") => {
      setList([]);
      setIsLoading(true);
      setSheet(kind); // open immediately so skeleton shows at once
      try {
        const data =
          kind === "followers"
            ? await apiFetchFollowers(username, token)
            : await apiFetchFollowing(username, token);
        setList(data);
      } catch (e) {
        console.error("[FollowStats] fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [username, token],
  );

  const closeSheet = useCallback(() => {
    setSheet(null);
    setList([]);
  }, []);

  const handleSelectUser = useCallback(
    (u: string) => {
      closeSheet();
      onSelectUser(u);
    },
    [closeSheet, onSelectUser],
  );

  const sheetTotal =
    sheet === "followers" ? (followersCount ?? 0) : (followingCount ?? 0);

  const sheetSubtitle =
    sheet === "followers"
      ? `${followersCount ?? 0} ${followersCount === 1 ? "follower" : "followers"}`
      : `${followingCount ?? 0} people followed`;

  return (
    <>
      {/* ── Stats row ── */}
      <View style={styles.statsSection}>
        {/* EVENTS — static, no press */}
        <StatCard value={eventsCount} label="EVENTS" />

        {/* FOLLOWERS — tappable, staggered up (matches original layout) */}
        <StatCard
          value={followersCount}
          label="FOLLOWERS"
          offsetTop={30}
          onPress={() => openSheet("followers")}
        />

        {/* FOLLOWING — tappable */}
        <StatCard
          value={followingCount}
          label="FOLLOWING"
          onPress={() => openSheet("following")}
        />
      </View>

      {/* ── Followers sheet ── */}
      <UserListModal
        visible={sheet === "followers"}
        onClose={closeSheet}
        participants={list}
        total={sheetTotal}
        isLoading={isLoading}
        title="FOLLOWERS"
        subtitle={sheetSubtitle}
        onSelectUser={handleSelectUser}
      />

      {/* ── Following sheet ── */}
      <UserListModal
        visible={sheet === "following"}
        onClose={closeSheet}
        participants={list}
        total={sheetTotal}
        isLoading={isLoading}
        title="FOLLOWING"
        subtitle={sheetSubtitle}
        onSelectUser={handleSelectUser}
      />
    </>
  );
}

// ─── Styles — copied exactly from UserProfileScreen.tsx ──────────────────────

const styles = StyleSheet.create({
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 50,
    paddingHorizontal: 8,
  },
  statCard: {
    alignItems: "center",
    position: "relative",
  },
  // UserProfileScreen uses #666666 for statNumber (not #FF6B58 like ProfileScreen)
  statNumber: {
    fontSize: 52,
    fontWeight: "900",
    color: "#666666",
    letterSpacing: -2,
    textShadowColor: "rgba(255,107,88,0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#999999",
    marginTop: 4,
  },
  statAccent: {
    width: 30,
    height: 4,
    backgroundColor: "#FF6B58",
    marginTop: 8,
    borderRadius: 2,
  },
  // Extra visual affordance for pressable cards — sits below the accent bar
  tapHint: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,107,88,0.15)",
    marginTop: 4,
  },
});