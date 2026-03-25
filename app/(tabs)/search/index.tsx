// app/(tabs)/UserSearchScreen.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserProfileModal from "../../modal/UserProfileModal";

/* ===================== TYPES ===================== */

interface ApiUser {
  userName: string;
  firstName: string;
  lastName: string;
  preferredLanguages: string[];
}

interface User {
  id: string;
  fullName: string;
  username: string;
  interests: string[];
}

/* ===================== SCREEN ===================== */

export default function UserSearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Text>
          </View>

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
          <Ionicons name="chevron-forward" size={18} color="#C7C7C7" />
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Search Title */}
        <View style={styles.searchFieldGroup}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={28} color="#D0D0D0" />

            <TextInput
              style={styles.searchInput}
              placeholder="Find people..."
              placeholderTextColor="#D0D0D0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              maxLength={64}
            />

            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#FF6B58" />
              </Pressable>
            )}
          </View>

          <View style={styles.searchBorder} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FF6B58" />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
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
                colors={["#ff6b58"]}
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
    // flex: 1,
    backgroundColor: "FFFFFF",
    paddingHorizontal: 16,
  },

  searchFieldGroup: {
    position: "relative",
  },

  searchInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    paddingVertical: 10,
  },
  searchBorder: {
    display: "none",
  },
  searchRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    height: 48,
  },

  clearButton: {
    position: "absolute",
    right: 0,
    top: 12,
    padding: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    paddingBottom: 80,
  },

  separator: {
    height: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },

  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B58",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#555",
    letterSpacing: 1,
  },

  userInfo: {
    flex: 1,
    gap: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  username: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },

  interestsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },

  interestTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F2F2F2",
    borderWidth: 0,
    borderColor: "#FF6B58",
  },

  interestText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  error: {
    textAlign: "center",
    color: "#EF4444",
    marginTop: 40,
    fontWeight: "700",
    fontSize: 16,
  },
});
