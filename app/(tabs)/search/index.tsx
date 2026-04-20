// app/(tabs)/UserSearchScreen.tsx
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
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
  bg: "#F5F3EF",
  surface: "#FFFFFF",
  surfaceAlt: "#EFEDE8",
  surfaceSunken: "#E9E7E2",
  border: "#E4E1DB",
  borderMid: "#CEC9C1",
  text: "#1C1916",
  textSub: "#6B6560",
  textMuted: "#A8A09A",
  coral: "#E8543A",
  coralLight: "rgba(232,84,58,0.07)",
  coralBorder: "rgba(232,84,58,0.16)",
  coralMid: "rgba(232,84,58,0.55)",
} as const;

/* ===================== LANGUAGE → FLAG ===================== */

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  lv: "🇱🇻",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  ru: "🇷🇺",
  it: "🇮🇹",
  pl: "🇵🇱",
  nl: "🇳🇱",
  pt: "🇵🇹",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  sv: "🇸🇪",
  fi: "🇫🇮",
  uk: "🇺🇦",
  tr: "🇹🇷",
  ar: "🇸🇦",
};

const langToFlag = (code: string): string =>
  LANG_FLAGS[code.toLowerCase()] ?? code.toUpperCase();

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

/* ===================== AVATAR COLORS ===================== */

const AVATAR_PALETTES = [
  { bg: "rgba(232,84,58,0.08)", border: "rgba(232,84,58,0.18)", text: C.coral },
  {
    bg: "rgba(59,139,212,0.08)",
    border: "rgba(59,139,212,0.18)",
    text: "#3B8BD4",
  },
  {
    bg: "rgba(83,74,183,0.08)",
    border: "rgba(83,74,183,0.18)",
    text: "#534AB7",
  },
  {
    bg: "rgba(29,158,117,0.08)",
    border: "rgba(29,158,117,0.18)",
    text: "#1D9E75",
  },
  {
    bg: "rgba(186,117,23,0.08)",
    border: "rgba(186,117,23,0.18)",
    text: "#BA7517",
  },
];

const avatarPalette = (username: string) =>
  AVATAR_PALETTES[username.charCodeAt(0) % AVATAR_PALETTES.length];

/* ===================== SCREEN ===================== */

export default function UserSearchScreen() {
  const { impact, notification } = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState("");
  const borderAnim = useRef(new Animated.Value(0)).current;

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
          interests: u.preferredLanguages.slice(0, 4),
        })),
      );
    } catch {
      setError("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await impact("medium");
    setRefreshing(true);
    if (!searchQuery.trim()) {
      await fetchUsers();
    } else {
      const [userName, ...rest] = searchQuery.trim().split(" ");
      await fetchUsers(userName, rest.join(" ") || undefined);
    }
    setRefreshing(false);
    await notification("success");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  /* ===================== DERIVED ===================== */

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.interests.some((lang) => lang.toLowerCase().includes(query))
    );
  });

  /* ===================== RENDER ITEM ===================== */

  const renderUser = useCallback(({ item }: { item: User }) => {
    const palette = avatarPalette(item.username);
    const initials = item.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setSelectedUsername(item.username)}
      >
        <View style={styles.cardBody}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: palette.text }]}>
                  {initials}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{item.username}
            </Text>
            {item.interests.length > 0 && (
              <View style={styles.flagsRow}>
                {item.interests.map((lang, i) => (
                  <Text key={i} style={styles.flag}>
                    {langToFlag(lang)}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={14} color={C.borderMid} />
        </View>
      </Pressable>
    );
  }, []);

  /* ===================== STATES ===================== */

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
          <Ionicons name="alert-circle-outline" size={36} color={C.textMuted} />
          <Text style={styles.stateText}>{error}</Text>
        </View>
      );
    }
    if (filteredUsers.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="people-outline" size={36} color={C.textMuted} />
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

  /* ===================== ANIMATED BORDER ===================== */

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.coral],
  });

  /* ===================== RENDER ===================== */

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header + Search — lives outside FlatList so keyboard never collapses */}
        <View style={styles.topSection}>
          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Find people</Text>
          </View>

          {/* Search bar */}
          <Animated.View
            style={[styles.searchBar, { borderColor: animatedBorderColor }]}
          >
            <Ionicons
              name="search"
              size={16}
              color={focused ? C.coral : C.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Name, username, language…"
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              maxLength={64}
              onFocus={onFocus}
              onBlur={onBlur}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* List */}
        <FlatList
          data={loading || error ? [] : filteredUsers}
          keyExtractor={(i) => i.id}
          renderItem={renderUser}
          ListFooterComponent={renderFooter()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
    paddingTop: 18,
    paddingBottom: 6,
  },

  header: {
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -1,
    lineHeight: 36,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 0.75,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: C.text,
  },

  resultCount: {
    fontSize: 11,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 2,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 100,
  },

  separator: {
    height: 6,
  },

  stateContainer: {
    paddingTop: 72,
    alignItems: "center",
    gap: 12,
  },

  stateText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textMuted,
    textAlign: "center",
  },

  /* Card */
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 0.75,
    borderColor: C.border,
  },

  cardPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.988 }],
  },

  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },

  /* Avatar */
  avatarWrap: {
    flexShrink: 0,
  },

  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 13,
    backgroundColor: C.surfaceAlt,
  },

  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.75,
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  /* User info */
  userInfo: {
    flex: 1,
    gap: 1,
  },

  name: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSub,
    letterSpacing: -0.1,
  },

  handle: {
    fontSize: 12,
    fontWeight: "900",
    color: C.text,
    letterSpacing: 0.1,
  },

  /* Flags */
  flagsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
  },

  flag: {
    fontSize: 13,
    lineHeight: 13,
  },
});
