// components/profile/FollowStats.tsx
import UserListModal, { UserListParticipant } from "@/app/modal/UserListModal";
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

// ─── StatItem ─────────────────────────────────────────────────────────────────

interface StatItemProps {
  value?: number;
  label: string;
  onPress?: () => void;
}

function StatItem({ value, label, onPress }: StatItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();

  const inner = (
    <Animated.View style={[styles.statItem, { transform: [{ scale }] }]}>
      <Text style={[styles.statNum, onPress && styles.statNumAccent]}>
        {value ?? "—"}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {onPress && <View style={styles.statUnderline} />}
    </Animated.View>
  );

  if (!onPress) return inner;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {inner}
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
  const [isLoading, setLoading] = useState(false);

  const openSheet = useCallback(
    async (kind: "followers" | "following") => {
      setList([]);
      setLoading(true);
      setSheet(kind);
      try {
        const data =
          kind === "followers"
            ? await apiFetchFollowers(username, token)
            : await apiFetchFollowing(username, token);
        setList(data);
      } catch (e) {
        console.error("[FollowStats]", e);
      } finally {
        setLoading(false);
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
      <View style={styles.statsRow}>
        <StatItem value={eventsCount} label="EVENTS" />

        <View style={styles.divider} />

        <StatItem
          value={followersCount}
          label="FOLLOWERS"
          onPress={() => openSheet("followers")}
        />

        <View style={styles.divider} />

        <StatItem
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  text: "#1A1A1A",
  sub: "#999999",
  muted: "#C8C5BE",
  border: "#E0DDD6",
  accent: "#FF6B58",
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 24,
  },

  divider: {
    width: 1,
    height: 32,
    backgroundColor: C.border,
  },

  statItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 72,
  },

  // Default (events) — dark number
  statNum: {
    fontSize: 38,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -2,
    lineHeight: 42,
  },

  // Tappable (followers / following) — accent
  statNumAccent: {
    color: C.accent,
  },

  statLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 2,
  },

  // Thin underline affordance on tappable stats
  statUnderline: {
    width: 20,
    height: 1.5,
    backgroundColor: C.accent,
    borderRadius: 1,
    marginTop: 2,
    opacity: 0.5,
  },
});
