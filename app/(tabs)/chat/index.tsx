import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Container } from "../../../components/common/Container";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatUser {
  id: number;
  name: string;
  username: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  initials: string;
  languages: string[];
  accentColor: string;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  joined: "#059669",
  joinedLight: "#10B981",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F8F7F2",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.65)",
} as const;

const LANG_FLAGS: Record<string, string> = {
  EN: "🇬🇧",
  ES: "🇪🇸",
  FR: "🇫🇷",
  DE: "🇩🇪",
  ZH: "🇨🇳",
  JA: "🇯🇵",
  PT: "🇧🇷",
  RU: "🇷🇺",
  LV: "🇱🇻",
  LT: "🇱🇹",
  EE: "🇪🇪",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const chatUsers: ChatUser[] = [
  {
    id: 1,
    name: "Sarah Anderson",
    username: "@sarah.cre8",
    lastMessage: "That sounds perfect! See you there",
    timestamp: "2m",
    unread: 3,
    online: true,
    initials: "SA",
    languages: ["EN", "FR"],
    accentColor: "#FF6B58",
  },
  {
    id: 2,
    name: "Jordan Lee",
    username: "@jord_lee",
    lastMessage: "I just finished the project",
    timestamp: "15m",
    unread: 0,
    online: true,
    initials: "JL",
    languages: ["EN", "ZH"],
    accentColor: "#3B82F6",
  },
  {
    id: 3,
    name: "Emma Wilson",
    username: "@em.wilsn",
    lastMessage: "Thanks for the invite!",
    timestamp: "1h",
    unread: 1,
    online: false,
    initials: "EW",
    languages: ["EN", "DE"],
    accentColor: "#8B5CF6",
  },
  {
    id: 4,
    name: "Marcus Davis",
    username: "@marc_d",
    lastMessage: "Let me know when you're free",
    timestamp: "3h",
    unread: 0,
    online: true,
    initials: "MD",
    languages: ["EN", "ES"],
    accentColor: "#F59E0B",
  },
  {
    id: 5,
    name: "Lisa Chen",
    username: "@lisa.lens",
    lastMessage: "Amazing photos from the event!",
    timestamp: "5h",
    unread: 0,
    online: false,
    initials: "LC",
    languages: ["EN", "ZH", "JA"],
    accentColor: "#10B981",
  },
  {
    id: 6,
    name: "David Brown",
    username: "@dav.bwn",
    lastMessage: "Can't wait for the game tomorrow",
    timestamp: "1d",
    unread: 0,
    online: false,
    initials: "DB",
    languages: ["EN"],
    accentColor: "#3B82F6",
  },
  {
    id: 7,
    name: "Maya Patel",
    username: "@maya.pxl",
    lastMessage: "Check out this article!",
    timestamp: "2d",
    unread: 0,
    online: true,
    initials: "MP",
    languages: ["EN", "LV"],
    accentColor: "#8B5CF6",
  },
  {
    id: 8,
    name: "Alex Turner",
    username: "@alex_trn",
    lastMessage: "Lunch tomorrow?",
    timestamp: "2d",
    unread: 10,
    online: true,
    initials: "AT",
    languages: ["EN", "ES"],
    accentColor: "#FF6B58",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatTab() {
  const router = useRouter();
  const { impact, notification } = useHapticFeedback();
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [filteredChats, setFilteredChats] = useState(chatUsers);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterChats(text, activeFilter);
  };

  const filterChats = (term: string, filter: "all" | "unread") => {
    let result = chatUsers;
    if (filter === "unread") result = result.filter((u) => u.unread > 0);
    if (term.trim())
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(term.toLowerCase()) ||
          u.username.toLowerCase().includes(term.toLowerCase()),
      );
    setFilteredChats(result);
  };

  const handleFilterChange = (f: "all" | "unread") => {
    setActiveFilter(f);
    filterChats(searchText, f);
  };

  const handleRefresh = async () => {
    await impact("medium");
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 900));
    filterChats(searchText, activeFilter);
    setRefreshing(false);
    await notification("success");
  };

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const Avatar = ({ item }: { item: ChatUser }) => (
    <View style={styles.avatarWrapper}>
      <View
        style={[
          styles.avatarCircle,
          { backgroundColor: item.accentColor + "18" },
        ]}
      >
        <Text style={[styles.avatarInitials, { color: item.accentColor }]}>
          {item.initials}
        </Text>
      </View>
      {item.online && <View style={styles.onlinePip} />}
    </View>
  );

  // ── Row ─────────────────────────────────────────────────────────────────────
  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/chat/chatOpen",
          params: { id: item.id, name: item.name },
        })
      }
      style={styles.row}
      activeOpacity={0.6}
    >
      <Avatar item={item} />

      <View style={styles.chatBody}>
        <View style={styles.rowBetween}>
          <View style={styles.nameLine}>
            <Text
              style={[styles.name, item.unread > 0 && styles.nameBold]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.flagRow}>
              {item.languages.slice(0, 2).map((l) => (
                <Text key={l} style={styles.flag}>
                  {LANG_FLAGS[l] ?? "🌐"}
                </Text>
              ))}
            </View>
          </View>
          <Text style={[styles.time, item.unread > 0 && { color: C.accent }]}>
            {item.timestamp}
          </Text>
        </View>

        <View style={[styles.rowBetween, { marginTop: 4 }]}>
          <Text
            style={[styles.lastMsg, item.unread > 0 && styles.lastMsgActive]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread > 99 ? "99+" : item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const Divider = () => <View style={styles.divider} />;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.composeBtn} activeOpacity={0.65}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color={C.mid}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={16} color={C.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor={C.muted}
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch("")}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={15}
              color={C.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(["all", "unread"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => handleFilterChange(f)}
            style={[
              styles.filterChip,
              activeFilter === f && styles.filterChipActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "All" : "Unread"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(i) => i.id.toString()}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
        />
      ) : (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="message-outline"
            size={40}
            color={C.muted}
          />
          <Text style={styles.emptyTitle}>No conversations</Text>
          <Text style={styles.emptySub}>Start a chat to see messages here</Text>
        </View>
      )}
    </Container>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.5,
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.divider,
    justifyContent: "center",
    alignItems: "center",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.divider,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.ink,
  },

  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.card,
  },
  filterChipActive: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.mid,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },

  list: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: C.divider,
    marginLeft: 76,
    marginRight: 20,
  },

  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 15,
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
    width: 52,
    height: 52,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  onlinePip: {
    width: 13,
    height: 13,
    borderRadius: 6,
    backgroundColor: C.green,
    position: "absolute",
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: C.bg,
  },

  chatBody: {
    flex: 1,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  nameBold: {
    fontWeight: "700",
  },
  flagRow: {
    flexDirection: "row",
    gap: 2,
  },
  flag: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "400",
  },
  lastMsg: {
    fontSize: 13,
    color: C.mid,
    flex: 1,
    marginRight: 8,
    marginTop: 2,
  },
  lastMsgActive: {
    color: C.ink,
    fontWeight: "600",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: C.ink,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    color: C.mid,
    textAlign: "center",
    lineHeight: 20,
  },
});
