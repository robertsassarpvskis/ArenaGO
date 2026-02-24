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

interface ChatUser {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  avatarColor: string;
  initials: string;
}

const COLORS = {
  primary: "#FF6B58",
  secondary: "#FF8A73",
  accentGreen: "#10B981",
  accentRed: "#EF4444",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  background: "#fffcf4",
  cardBg: "#FFFFFF",
  darkGray: "#374151",
};

const chatUsers: ChatUser[] = [
  {
    id: 1,
    name: "Sarah Anderson",
    lastMessage: "That sounds perfect! See you there",
    timestamp: "2m",
    unread: 3,
    online: true,
    avatarColor: "#FF6B58",
    initials: "SA",
  },
  {
    id: 2,
    name: "Jordan Lee",
    lastMessage: "I just finished the project",
    timestamp: "15m",
    unread: 0,
    online: true,
    avatarColor: "#FF8A73",
    initials: "JL",
  },
  {
    id: 3,
    name: "Emma Wilson",
    lastMessage: "Thanks for the invite!",
    timestamp: "1h",
    unread: 1,
    online: false,
    avatarColor: "#10B981",
    initials: "EW",
  },
  {
    id: 4,
    name: "Marcus Davis",
    lastMessage: "Let me know when you're free",
    timestamp: "3h",
    unread: 0,
    online: true,
    avatarColor: "#FFA07A",
    initials: "MD",
  },
  {
    id: 5,
    name: "Lisa Chen",
    lastMessage: "Amazing photos from the event!",
    timestamp: "5h",
    unread: 0,
    online: false,
    avatarColor: "#C7B3E5",
    initials: "LC",
  },
  {
    id: 6,
    name: "David Brown",
    lastMessage: "Can't wait for the game tomorrow",
    timestamp: "1d",
    unread: 0,
    online: false,
    avatarColor: "#4ECDC4",
    initials: "DB",
  },
  {
    id: 7,
    name: "Maya Patel",
    lastMessage: "Check out this article!",
    timestamp: "2d",
    unread: 0,
    online: true,
    avatarColor: "#B19CD9",
    initials: "MP",
  },
  {
    id: 8,
    name: "Alex Turner",
    lastMessage: "Lunch tomorrow?",
    timestamp: "2d",
    unread: 10,
    online: true,
    avatarColor: "#FFE66D",
    initials: "AT",
  },
];

export default function ChatTab() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [filteredChats, setFilteredChats] = useState(chatUsers);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterChats(text, activeFilter);
  };

  const filterChats = (searchTerm: string, filter: "all" | "unread") => {
    let result = chatUsers;

    if (filter === "unread") {
      result = result.filter((user) => user.unread > 0);
    }

    if (searchTerm.trim() !== "") {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredChats(result);
  };

  const handleFilterChange = (filter: "all" | "unread") => {
    setActiveFilter(filter);
    filterChats(searchText, filter);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you would fetch updated chat data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    filterChats(searchText, activeFilter);
    setRefreshing(false);
  };

  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/chat/chatOpen",
          params: { id: item.id, name: item.name },
        })
      }
      style={styles.chatCard}
      activeOpacity={0.7}
    >
      {/* Avatar with online indicator */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        {/* {item.online && (
          <View style={styles.onlineIndicator} />
        )} */}
      </View>

      {/* Message Content */}
      <View style={styles.messageContent}>
        <View style={styles.topRow}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread > 99 ? "99+" : item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.cardBg} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.textSecondary}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "all" && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange("all")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "all" && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "unread" && styles.filterTabActive,
          ]}
          onPress={() => handleFilterChange("unread")}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "unread" && styles.filterTabTextActive,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {filteredChats.length > 0 ? (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="chat-outline"
            size={64}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start chatting to see your messages here
          </Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.cardBg,
  },
  chatList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  chatCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.cardBg,
  },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: COLORS.accentGreen,
    position: "absolute",
    bottom: 3,
    right: 3,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.cardBg,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
