// components/UserListModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const C = {
  accent: "#FF6B58",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#FFFFFF",
  overlay: "rgba(15,23,42,0.55)",
} as const;

const H_PAD = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserListParticipant {
  username: string;
  displayName: string;
  profilePhoto?: { id: string; url: string; contentType: string } | null;
  bio?: string | null;
}

export interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  participants: UserListParticipant[];
  total: number;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  onSelectUser: (username: string) => void;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const PALETTES: Array<[string, string]> = [
  ["#FF6B58", "#FF8A73"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
  ["#F59E0B", "#FCD34D"],
  ["#EF4444", "#F87171"],
];

const palette = (seed: string): [string, string] =>
  PALETTES[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length
  ];

const initials = (name: string) => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ participant }: { participant: UserListParticipant }) {
  const SIZE = 44;
  const [g1, g2] = palette(participant.username);
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE * 0.28,
        overflow: "hidden",
        flexShrink: 0,
        shadowColor: g1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {participant.profilePhoto?.url ? (
        <Image
          source={{ uri: participant.profilePhoto.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[g1, g2]}
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "900" }}>
            {initials(participant.displayName)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[S.row, { opacity: pulse }]}>
      <View style={[S.skelAvatar, { backgroundColor: C.divider }]} />
      <View style={S.skelTextBlock}>
        <View style={[S.skelLine, { width: "46%", backgroundColor: C.divider }]} />
        <View style={[S.skelLine, { width: "28%", backgroundColor: C.divider }]} />
      </View>
    </Animated.View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  participant: UserListParticipant;
  accentColor: string;
  onPress: () => void;
}

function UserRow({ participant, accentColor, onPress }: UserRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      style={S.row}
    >
      <Avatar participant={participant} />

      <View style={S.textBlock}>
        <Text style={S.displayName} numberOfLines={1}>
          {participant.displayName}
        </Text>
        <Text style={S.username} numberOfLines={1}>
          @{participant.username}
        </Text>
      </View>

      <View style={[S.chip, { backgroundColor: accentColor + "15" }]}>
        <Ionicons name="chevron-forward" size={13} color={accentColor} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UserListModal({
  visible,
  onClose,
  participants,
  total,
  isLoading = false,
  title = "FOLLOWERS",
  accentColor = C.accent,
  onSelectUser,
}: UserListModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.93)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setSearch("");
      Keyboard.dismiss();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 9,
          tension: 100,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.93,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const filtered =
    search.trim().length > 0
      ? participants.filter(
          (p) =>
            p.displayName.toLowerCase().includes(search.toLowerCase()) ||
            p.username.toLowerCase().includes(search.toLowerCase())
        )
      : participants;

  const handlePress = (username: string) => {
    onClose();
    setTimeout(() => onSelectUser(username), 60);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[S.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Centered card */}
      <View style={S.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            S.card,
            { borderTopColor: accentColor },
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* ── Header ── */}
          <View style={S.header}>
            <View style={S.titleBlock}>
              <Text style={[S.title, { color: accentColor }]}>{title}</Text>
              <View style={[S.titleUnderline, { backgroundColor: accentColor }]} />
            </View>

            <View style={S.headerRight}>
              <View style={[S.countPill, { backgroundColor: accentColor + "15" }]}>
                <Text style={[S.countText, { color: accentColor }]}>
                  {isLoading ? "—" : total}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={S.closeBtn}
              >
                <Ionicons name="close" size={16} color={C.mid} />
              </Pressable>
            </View>
          </View>

          {/* Bold divider */}
          <View style={S.boldDivider} />

          {/* ── Search ── */}
          {!isLoading && participants.length > 5 && (
            <View style={S.searchWrap}>
              <View style={[S.searchInner, { borderColor: accentColor + "35" }]}>
                <Ionicons name="search-outline" size={14} color={C.muted} />
                <TextInput
                  style={S.searchInput}
                  placeholder="Search…"
                  placeholderTextColor={C.muted}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <Pressable
                    onPress={() => setSearch("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={15} color={C.muted} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ── List ── */}
          <ScrollView
            style={S.list}
            contentContainerStyle={[S.listContent, { paddingHorizontal: H_PAD }]}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Skeletons */}
            {isLoading &&
              [...Array(5)].map((_, i) => (
                <React.Fragment key={`sk-${i}`}>
                  <SkeletonRow />
                  {i < 4 && <View style={S.rowDivider} />}
                </React.Fragment>
              ))}

            {/* Empty */}
            {!isLoading && filtered.length === 0 && (
              <View style={S.empty}>
                <View style={[S.emptyIconWrap, { backgroundColor: accentColor + "12" }]}>
                  <Ionicons name="people-outline" size={26} color={accentColor} />
                </View>
                <Text style={S.emptyTitle}>Nobody here yet</Text>
                {search.length > 0 && (
                  <Text style={S.emptyHint}>Try a different name</Text>
                )}
              </View>
            )}

            {/* Rows */}
            {!isLoading &&
              filtered.map((p, i) => (
                <React.Fragment key={p.username}>
                  <UserRow
                    participant={p}
                    accentColor={accentColor}
                    onPress={() => handlePress(p.username)}
                  />
                  {i < filtered.length - 1 && <View style={S.rowDivider} />}
                </React.Fragment>
              ))}
          </ScrollView>

          <View style={{ height: Platform.OS === "ios" ? 10 : 6 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_WIDTH = width * 0.88;

const S = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    maxHeight: height * 0.68,
    backgroundColor: C.bg,
    borderRadius: 22,
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 22,
    overflow: "hidden",
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 18,
    paddingBottom: 14,
  },
  titleBlock: {
    gap: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  titleUnderline: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 13,
    fontWeight: "800",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  boldDivider: {
    height: 2,
    backgroundColor: C.ink,
  },

  // ── Search
  searchWrap: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 9 : 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.ink,
    padding: 0,
  },

  // ── List
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  // ── Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: C.divider,
  },

  // ── Text inside row
  textBlock: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 12,
    gap: 3,
  },
  displayName: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.1,
  },
  username: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },

  // ── Arrow chip
  chip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 10,
  },

  // ── Empty
  empty: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: H_PAD,
    gap: 8,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
  },
  emptyHint: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
  },

  // ── Skeleton
  skelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 44 * 0.28,
    flexShrink: 0,
  },
  skelTextBlock: {
    flex: 1,
    flexShrink: 1,
    marginLeft: 12,
    gap: 7,
  },
  skelLine: {
    height: 10,
    borderRadius: 5,
  },
});