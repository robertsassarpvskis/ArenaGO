// app/(tabs)/UserSearchScreen.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  bg: "#F7F6F3",
  surface: "#FFFFFF",
  surfaceAlt: "#F0EEE9",
  border: "#E8E6E1",
  borderMid: "#D4D1CB",
  text: "#1A1814",
  textSub: "#5C5850",
  textMuted: "#A09990",
  coral: "#E8543A",
  coralLight: "rgba(232,84,58,0.08)",
  coralBorder: "rgba(232,84,58,0.20)",
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

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ===================== DERIVED ===================== */

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.interests.some((lang) => lang.toLowerCase().includes(query))
    );
  });

  /* ===================== RENDER ITEM ===================== */

  // Stable reference — won't cause FlatList to remount items on each keystroke
  const renderUser = useCallback(
    ({ item }: { item: User }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setSelectedUsername(item.username)}
      >
        <View style={styles.cardBody}>
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

          <Ionicons name="chevron-forward" size={16} color={C.borderMid} />
        </View>
      </Pressable>
    ),
    [],
  );

  /* ===================== FOOTER STATES ===================== */

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={C.coral} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={C.textMuted} />
          <Text style={styles.stateText}>{error}</Text>
        </View>
      );
    }
    if (filteredUsers.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="people-outline" size={40} color={C.textMuted} />
          <Text style={styles.stateText}>
            {searchQuery.trim().length > 0
              ? "No results found"
              : "Search to discover people"}
          </Text>
        </View>
      );
    }
    return null;
  };

  /* ===================== RENDER ===================== */

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>

        {/*
         * KEY FIX: TextInput lives here, OUTSIDE FlatList.
         * When filteredUsers changes, FlatList re-renders but the input
         * is untouched — keyboard stays open.
         */}
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>Community</Text>
            <Text style={styles.headerTitle}>Find People</Text>
          </View>

          <View style={styles.searchFieldGroup}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={C.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or language…"
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                maxLength={64}
                onFocus={() =>
                  Animated.timing(searchFocusAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                  }).start()
                }
                onBlur={() =>
                  Animated.timing(searchFocusAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                  }).start()
                }
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={C.textMuted} />
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

          {!loading && !error && filteredUsers.length > 0 && (
            <Text style={styles.resultCount}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "person" : "people"}
            </Text>
          )}
        </View>

        <FlatList
          data={loading || error ? [] : filteredUsers}
          keyExtractor={(i) => i.id}
          renderItem={renderUser}
          ListFooterComponent={renderFooter()}
          showsVerticalScrollIndicator={false}
          // Tapping a result won't dismiss the keyboard accidentally
          keyboardShouldPersistTaps="handled"
          // Dragging the list will dismiss it naturally
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.coral}
              colors={[C.coral]}
            />
          }
        />
      </SafeAreaView>

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
  },

  topSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },

  header: {
    marginBottom: 24,
  },

  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.coral,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -1,
    lineHeight: 40,
  },

  searchFieldGroup: {
    marginBottom: 16,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    height: 44,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: C.text,
    paddingVertical: 10,
  },

  searchUnderline: {
    marginTop: 6,
    borderRadius: 2,
  },

  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textMuted,
    letterSpacing: 0.3,
    marginLeft: 6,
    marginBottom: 8,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  separator: {
    height: 8,
  },

  stateContainer: {
    paddingTop: 64,
    alignItems: "center",
    gap: 14,
  },

  stateText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.textMuted,
    textAlign: "center",
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  cardPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.985 }],
  },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },

  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.surfaceAlt,
  },

  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.coralLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.coralBorder,
  },

  avatarText: {
    fontSize: 17,
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
    letterSpacing: 0.2,
  },

  interestsRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 7,
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
    letterSpacing: 0.4,
  },
});