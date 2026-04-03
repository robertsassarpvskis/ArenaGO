// app/(tabs)/UserSearchScreen.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserProfileModal from "../../modal/UserProfileModal";

/* ===================== DESIGN TOKENS ===================== */

const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  borderMid: "#D8D8D8",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.10)",
  coralBorder: "rgba(255,107,88,0.30)",
  success: "#1A9E6A",
  successLight: "rgba(26,158,106,0.08)",
  successBorder: "rgba(26,158,106,0.25)",
  ink: "#1A1A1A",
  chalk: "#F0EEE9",
  overlay: "rgba(17,17,17,0.6)",
} as const;

/* ===================== TYPES ===================== */

interface ProfilePhoto {
  id: string;
  url: string;
  contentType: string;
}

interface ApiUser {
  userName: string;
  firstName: string;
  lastName: string;
  preferredLanguages: string[];
  profilePhoto?: ProfilePhoto;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  avatar?: string;
  interests: string[];
}

/* ===================== SCREEN ===================== */

export default function UserSearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchFocusAnim = useRef(new Animated.Value(0)).current;

  // Modal state
  const [selectedUsername, setSelectedUsername] = useState("");

  /* ===================== API ===================== */

  const fetchUsers = async (userName?: string, lastName?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userName) params.append("UserName", userName);
      if (lastName) params.append("LastName", lastName);

      const query = params.toString();
      const url = `http://217.182.74.113:30080/api/Users/search${
        query ? `?${query}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          accept: "text/plain",
          Authorization: "Bearer YOUR_TOKEN_HERE",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data: ApiUser[] = await response.json();

      setUsers(
        data.map((u) => ({
          id: u.userName,
          fullName: `${u.firstName} ${u.lastName}`,
          username: u.userName,
          avatar: u.profilePhoto?.url,
          interests: u.preferredLanguages.slice(0, 3),
        })),
      );
    } catch (e) {
      setError("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!searchQuery.trim()) {
      await fetchUsers();
    } else {
      const [userName, ...rest] = searchQuery.trim().split(" ");
      await fetchUsers(userName, rest.join(" ") || undefined);
    }
    setRefreshing(false);
  };

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    fetchUsers(); // fetch all users once
  }, []);
  /* ===================== ACTIONS ===================== */

  const openUserProfile = (username: string) => {
    setSelectedUsername(username);
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();

    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.interests.some((lang) => lang.toLowerCase().includes(query))
    );
  });
  /* ===================== RENDER ===================== */

  const renderUser = ({ item, index }: { item: User; index: number }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => openUserProfile(item.username)}
      >
        <View style={styles.cardBody}>
          {/* Avatar with Image or Initials */}
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {item.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.interests.length > 0 && (
              <View style={styles.interestsRow}>
                {item.interests.map((lang, i) => (
                  <View key={i} style={styles.interestTag}>
                    <Text style={styles.interestText}>{lang}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Arrow Icon */}
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find People</Text>
          <Text style={styles.headerSubtitle}>Connect with the community</Text>
        </View>

        {/* Modern Search Input */}
        <View style={styles.searchFieldGroup}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color={C.textMuted} />

            <TextInput
              style={styles.searchInput}
              placeholder="Find people..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              maxLength={64}
              onFocus={() =>
                Animated.timing(searchFocusAnim, {
                  toValue: 1,
                  duration: 180,
                  useNativeDriver: false,
                }).start()
              }
              onBlur={() =>
                Animated.timing(searchFocusAnim, {
                  toValue: 0,
                  duration: 180,
                  useNativeDriver: false,
                }).start()
              }
            />

            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={C.coral} />
              </Pressable>
            )}
          </View>

          <Animated.View
            style={[
              styles.searchUnderline,
              {
                backgroundColor: searchFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [C.border, C.coral],
                }),
                height: searchFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ]}
          />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.coral} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={C.textMuted}
            />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery.trim().length > 0
                ? "No users found"
                : "Search to discover people"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(i) => i.id}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[C.coral]}
              />
            }
          />
        )}
      </SafeAreaView>

      {/* User Profile Modal */}
      {selectedUsername !== "" && (
        <UserProfileModal
          username={selectedUsername}
          onBack={() => setSelectedUsername("")}
        />
      )}
    </>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
  },

  header: {
    marginBottom: 24,
    marginTop: 8,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 0.5,
  },

  searchFieldGroup: {
    position: "relative",
    marginBottom: 24,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: C.text,
    paddingVertical: 12,
  },

  searchUnderline: {
    marginTop: 8,
    borderRadius: 1,
  },

  searchRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "transparent",
    borderRadius: 0,
    height: 44,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textMuted,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 80,
  },

  separator: {
    height: 10,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },

  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
  },

  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: C.coralLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.coralBorder,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: C.coral,
    letterSpacing: 0.5,
  },

  userInfo: {
    flex: 1,
    gap: 2,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },

  username: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  interestsRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
    flexWrap: "wrap",
  },

  interestTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: C.surfaceAlt,
    borderWidth: 0.5,
    borderColor: C.border,
  },

  interestText: {
    color: C.textSub,
    fontWeight: "600",
    fontSize: 10,
    letterSpacing: 0.3,
  },

  error: {
    textAlign: "center",
    color: C.text,
    marginTop: 20,
    fontWeight: "600",
    fontSize: 16,
  },
});
