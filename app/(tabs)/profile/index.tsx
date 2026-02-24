// app/(tabs)/ProfileScreen.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Globe, LogOut, MapPin, Users } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/context/AuthContext";
import { useProfile } from "../../../hooks/profile/useProfile";

interface Interest {
  id: number;
  name: string;
  icon: string;
  rotation: number;
}

interface ParticipatedEvent {
  id: number;
  name: string;
  category: string;
  date: string;
  time: string;
  participants: number;
  offset: number;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, loading, error, incrementFollowerCount, refetch } =
    useProfile(user?.userName ?? "", user?.accessToken);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const profileData = {
    firstName: "Alex",
    lastName: "Rivers",
    age: 20,
    location: "Latvia · Riga", // vari nākotnē izmantot profile.lastKnownLocation
    languages: "en",
    eventsParticipated: 47,
    followers: 234,
    friends: 89,
    socialCredit: 1200,
    interests: [
      { id: 1, name: "Basketball", icon: "🏀", rotation: -3 },
      { id: 2, name: "Yoga", icon: "🧘", rotation: 2 },
      { id: 3, name: "Running", icon: "🏃", rotation: -2 },
      { id: 4, name: "Tennis", icon: "🎾", rotation: 3 },
      { id: 5, name: "Cycling", icon: "🚴", rotation: -1 },
      { id: 6, name: "Swimming", icon: "🏊", rotation: 2 },
    ],
    recentEvents: [
      {
        id: 1,
        name: "Morning Basketball at Mežaparks",
        category: "🏀",
        date: "Jan 18",
        time: "09:00",
        participants: 12,
        offset: 0,
      },
      {
        id: 2,
        name: "Sunset Yoga Session",
        category: "🧘",
        date: "Jan 15",
        time: "18:30",
        participants: 8,
        offset: 20,
      },
      {
        id: 3,
        name: "5K Run Challenge",
        category: "🏃",
        date: "Jan 12",
        time: "07:00",
        participants: 24,
        offset: -10,
      },
    ],
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Textured Background */}

      <LinearGradient
        colors={["#FAF6EE", "#F5EFE0", "#FAF6EE"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B58"
            colors={["#FF6B58", "#FFB088", "#FF8A73"]}
            progressBackgroundColor="#FFFFFF"
            progressViewOffset={10}
            size={50}
          />
        }
      >
        {/* User Identity - Street Style */}
        <View style={styles.identitySection}>
          <View style={styles.avatarRow}>
            {/* Avatar */}
            <LinearGradient
              colors={["#FF6B58", "#FF8A73", "#FFB088"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {profile?.firstName?.[0] ?? "A"}
                {profile?.lastName?.[0] ?? "R"}
              </Text>
            </LinearGradient>

            {/* Username & Name */}
            <View style={styles.nameColumn}>
              <Text style={styles.username}>
                @{user?.userName || "alex_rivers"}
              </Text>
              <Text style={styles.fullName}>
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Alex Rivers"}
              </Text>
              <Text>{calculateAge(profile?.birthDate)}</Text>
              {/* Meta Info */}
              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <MapPin size={16} color="#FF6B58" strokeWidth={2.5} />
                  <Text style={styles.metaText}>{profileData.location}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Globe size={16} color="#FF6B58" strokeWidth={2.5} />
                  <Text style={styles.metaText}>on</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats - Urban Style */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.participatedEventsCount}
            </Text>
            <Text style={styles.statLabel}>EVENTS</Text>
            <View style={styles.statAccent} />
          </View>

          <View style={[styles.statCard, { marginTop: 30 }]}>
            <Text style={styles.statNumber}>{profile?.followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
            <View style={styles.statAccent} />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
            <View style={styles.statAccent} />
          </View>
        </View>

        {/* Interests - Street Cards with Overflow */}
        <View style={styles.interestsSection}>
          <Text style={styles.sectionTitle}>INTERESTS</Text>
          <View style={styles.sectionTitleAccent} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.interestsScroll}
            style={styles.interestsContainer}
          >
            {profileData.interests.map((interest, index) => (
              <View
                key={interest.id}
                style={[
                  styles.interestCard,
                  {
                    transform: [{ rotate: `${interest.rotation}deg` }],
                    marginLeft: index === 0 ? -10 : 0,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    index % 3 === 0
                      ? ["#FF6B58", "#FF8A73"]
                      : index % 3 === 1
                        ? ["#FF8A73", "#FFB088"]
                        : ["#FF6B58", "#FFB088"]
                  }
                  style={styles.interestGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.interestIcon}>{interest.icon}</Text>
                  <Text style={styles.interestName}>
                    {interest.name.toUpperCase()}
                  </Text>
                  <View style={styles.interestBrush} />
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity - Masonry Style */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <View style={styles.sectionTitleAccent} />

          <View style={styles.eventsContainer}>
            {profileData.recentEvents.map((event, index) => (
              <View
                key={event.id}
                style={[
                  styles.eventCard,
                  {
                    marginLeft: event.offset,
                    zIndex: profileData.recentEvents.length - index,
                  },
                ]}
              >
                <View style={styles.eventCardInner}>
                  {/* Event Icon */}
                  <View style={styles.eventIconContainer}>
                    <Text style={styles.eventIcon}>{event.category}</Text>
                  </View>

                  {/* Event Info */}
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName} numberOfLines={2}>
                      {event.name}
                    </Text>

                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Calendar size={12} color="#666" strokeWidth={2} />
                        <Text style={styles.eventMetaText}>{event.date}</Text>
                      </View>

                      <View style={styles.eventMetaDivider} />

                      <View style={styles.eventMetaItem}>
                        <Text style={styles.eventTime}>{event.time}</Text>
                      </View>

                      <View style={styles.eventMetaDivider} />

                      <View style={styles.eventMetaItem}>
                        <Users size={12} color="#666" strokeWidth={2} />
                        <Text style={styles.eventMetaText}>
                          {event.participants}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Street-style accent line */}
                <View style={styles.eventAccent} />
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#FF6B58" strokeWidth={2.5} />
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAF6EE",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 20,
  },
  nameColumn: {
    flex: 1,
    justifyContent: "center",
  },

  // Identity Section - Street Style
  identitySection: {
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "row",

    justifyContent: "space-between",
    marginBottom: 10,
  },
  nameSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  arBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
  },
  arBadgeGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  arBadgeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  profileInfo: {
    gap: 10,
  },

  username: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -1,
    textTransform: "lowercase",
    textShadowColor: "rgba(255,107,88,0.15)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  usernameUnderline: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#FF6B58",
    opacity: 0.3,
  },
  fullName: {
    fontSize: 18,
    color: "#666666",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metaInfo: {
    gap: 8,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2.5,
    borderColor: "#FF6B58",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    color: "#FF6B58",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Stats - Urban Cards
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
  statNumber: {
    fontSize: 52,
    fontWeight: "900",
    color: "#FF6B58",
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

  // Interests - Street Cards
  interestsSection: {
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionTitleAccent: {
    width: 60,
    height: 5,
    backgroundColor: "#FF6B58",
    marginBottom: 20,
    borderRadius: 2,
  },
  interestsContainer: {
    marginHorizontal: -24,
  },
  interestsScroll: {
    paddingHorizontal: 24,
    paddingRight: 50,
    gap: 16,
  },
  interestCard: {},
  interestGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    position: "relative",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  interestIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  interestName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  interestBrush: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },

  // Events - Masonry
  eventsSection: {
    marginBottom: 40,
  },
  eventsContainer: {
    gap: 20,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  eventCardInner: {
    flexDirection: "row",
    padding: 18,
    gap: 16,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#FAF6EE",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF6B58",
  },
  eventIcon: {
    fontSize: 32,
  },
  eventInfo: {
    flex: 1,
    gap: 10,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eventMetaText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "700",
  },
  eventMetaDivider: {
    width: 3,
    height: 3,
    backgroundColor: "#CCCCCC",
    borderRadius: 2,
  },
  eventAccent: {
    height: 5,
    backgroundColor: "#FF6B58",
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 2.5,
    borderColor: "#FF6B58",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: "#FF6B58",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  version: {
    textAlign: "center",
    color: "#CCCCCC",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
