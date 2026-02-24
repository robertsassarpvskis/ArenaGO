import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── Tokens (mirrors EventModal exactly) ─────────────────────────────────────

const { height } = Dimensions.get("window");
const H_PAD = 22;

const C = {
  accent: "#FF6B58",
  green: "#10B981",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F8F7F2",
  overlay: "rgba(15,23,42,0.65)",
  joined: "#059669",
} as const;

const ACCENT_BG = "rgba(255,107,88,0.12)";

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
  title?: string;
  subtitle?: string;
  accentColor?: string;
  accentBg?: string;
  /**
   * Called after the sheet closes. Parent is responsible for opening
   * UserProfileModal with this username.
   */
  onSelectUser: (username: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTES: Array<[string, string]> = [
  ["#FF6B58", "#FF8A73"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
  ["#F59E0B", "#FCD34D"],
  ["#EF4444", "#F87171"],
];

const avatarGradient = (seed: string): [string, string] =>
  AVATAR_PALETTES[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
      AVATAR_PALETTES.length
  ];

const ini = (name: string) => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  participant,
  size = 52,
}: {
  participant: UserListParticipant;
  size?: number;
}) {
  const [g1, g2] = avatarGradient(participant.username);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        overflow: "hidden",
        backgroundColor: C.bg,
        shadowColor: g1,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
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
          <Text
            style={{ color: "#FFF", fontSize: size * 0.3, fontWeight: "900" }}
          >
            {ini(participant.displayName)}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

// ─── Thin divider ─────────────────────────────────────────────────────────────

const Divider = () => (
  <View
    style={{
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: C.divider,
      marginHorizontal: H_PAD,
    }}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserListModal({
  visible,
  onClose,
  participants,
  total,
  title = "WHO'S GOING",
  subtitle,
  accentColor = C.accent,
  accentBg = ACCENT_BG,
  onSelectUser,
}: UserListModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible) {
      setSearch("");
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 10,
          tension: 80,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
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
            p.username.toLowerCase().includes(search.toLowerCase()),
        )
      : participants;

  const handleRowPress = (username: string) => {
    // Close the sheet, then notify parent after a short delay so
    // the close animation has started before the parent re-renders.
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
      <Animated.View
        style={[S.backdrop, { opacity: backdropAnim }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          S.sheet,
          {
            borderTopColor: accentColor,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Drag handle */}
        <View style={S.handleRow}>
          <View style={S.handle} />
        </View>

        {/* Header row */}
        <View style={S.header}>
          <View style={{ flex: 1 }}>
            <Text style={S.bigTitle}>{title}</Text>
            <Text style={S.subtitle}>
              {subtitle ??
                `${total} ${total === 1 ? "person" : "people"} attending`}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Count badge */}
            <View style={[S.countBadge, { backgroundColor: accentBg }]}>
              <Text style={[S.countBadgeText, { color: accentColor }]}>
                {total}
              </Text>
            </View>
            {/* Close */}
            <Pressable
              style={S.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={C.ink} />
            </Pressable>
          </View>
        </View>

        {/* Heavy divider */}
        <View style={S.heavyDivider} />

        {/* Search — appears when > 4 participants */}
        {participants.length > 4 && (
          <View style={[S.searchWrap, { borderColor: accentColor + "50" }]}>
            <Ionicons name="search-outline" size={15} color={C.muted} />
            <TextInput
              style={S.searchInput}
              placeholder="Search attendees…"
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
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>
        )}

        {/* Participant list */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <View style={[S.emptyIcon, { backgroundColor: accentBg }]}>
                <Ionicons name="people-outline" size={28} color={accentColor} />
              </View>
              <Text style={S.emptyTitle}>No results</Text>
              <Text style={S.emptySubtitle}>
                Try a different name or username
              </Text>
            </View>
          ) : (
            filtered.map((p, i) => (
              <React.Fragment key={p.username}>
                <Pressable
                  style={({ pressed }) => [
                    S.row,
                    pressed && { backgroundColor: "rgba(15,23,42,0.04)" },
                  ]}
                  onPress={() => handleRowPress(p.username)}
                >
                  {/* Avatar + online dot */}
                  <View style={S.avatarWrap}>
                    <Avatar participant={p} size={52} />
                    <View style={[S.onlineDot, { borderColor: C.bg }]} />
                  </View>

                  {/* Name / username / optional bio */}
                  <View style={{ flex: 1 }}>
                    <Text style={S.displayName} numberOfLines={1}>
                      {p.displayName}
                    </Text>
                    <Text style={S.username} numberOfLines={1}>
                      @{p.username}
                    </Text>
                    {!!p.bio && (
                      <Text style={S.bio} numberOfLines={1}>
                        {p.bio}
                      </Text>
                    )}
                  </View>

                  {/* Arrow chip */}
                  <View style={[S.arrowChip, { backgroundColor: accentBg }]}>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={accentColor}
                    />
                  </View>
                </Pressable>

                {i < filtered.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}

          <View style={{ height: Platform.OS === "ios" ? 56 : 36 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 3,
    maxHeight: height * 0.86,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },

  handleRow: { paddingVertical: 10, alignItems: "center" },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: H_PAD,
    paddingBottom: 16,
    gap: 12,
  },
  bigTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
    marginTop: 3,
  },
  countBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: { fontSize: 18, fontWeight: "900" },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  heavyDivider: {
    height: 2,
    backgroundColor: C.ink,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: H_PAD,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.ink,
    padding: 0,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: H_PAD,
  },
  avatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
    backgroundColor: C.green,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.2,
  },
  username: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: C.mid,
    fontWeight: "500",
    marginTop: 3,
  },
  arrowChip: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 52,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
  },
});
