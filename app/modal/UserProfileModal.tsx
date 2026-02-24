// screens/UserProfileScreen.tsx
import { FollowButton } from "@/components/common/buttons/FollowButton";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Calendar, Globe, MapPin, Users } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface UserProfileData {
  userName: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  lastKnownLocation?: string;
  participatedEventsCount: number;
  followerCount: number;
  followingCount: number;
}

interface UserProfileScreenProps {
  username: string;
  onBack: () => void;
}

export default function UserProfileScreen({
  username,
  onBack,
}: UserProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch(
        `http://217.182.74.113:30080/api/Users/${username}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      // Safely extract error message
      const errorMessage =
        typeof err === "string"
          ? err
          : err?.message
            ? String(err.message)
            : "An error occurred";
      setError(errorMessage);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleFollowerCountChange = useCallback((newCount: number) => {
    setProfile((prev) => (prev ? { ...prev, followerCount: newCount } : null));
  }, []);

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

  // Mock data for interests and events (you can fetch this from API later)
  const mockData = {
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

  return (
    <Modal
      style={styles.container}
      animationType="none"
      presentationStyle="fullScreen"
    >
      {/* Textured Background */}
      <LinearGradient
        colors={["#FAF6EE", "#F5EFE0", "#FAF6EE"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2.5} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B58" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : profile ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchUserProfile}
              tintColor="#FF6B58" // iOS
              colors={["#FF6B58"]} // Android
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
                  {profile.firstName?.[0] ?? "?"}
                  {profile.lastName?.[0] ?? "?"}
                </Text>
              </LinearGradient>

              {/* Username & Name */}
              <View style={styles.nameColumn}>
                <Text style={styles.username}>@{profile.userName}</Text>
                <Text style={styles.fullName}>
                  {profile.firstName} {profile.lastName}
                </Text>
                {calculateAge(profile.birthDate) && (
                  <Text style={styles.ageText}>
                    {calculateAge(profile.birthDate)} years old
                  </Text>
                )}
                {/* Meta Info */}
                <View style={styles.metaInfo}>
                  <View style={styles.metaRow}>
                    <MapPin size={16} color="#FF6B58" strokeWidth={2.5} />
                    <Text style={styles.metaText}>
                      {profile.lastKnownLocation || "Location unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <FollowButton
              username={profile.userName}
              initialFollowerCount={profile.followerCount}
              onFollowerCountChange={handleFollowerCountChange}
            />

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Globe size={18} color="#FF6B58" strokeWidth={2.5} />
              <Text style={styles.secondaryButtonText}>MESSAGE</Text>
            </TouchableOpacity>
          </View>
          {/* Stats - Urban Style */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {profile.participatedEventsCount}
              </Text>
              <Text style={styles.statLabel}>EVENTS</Text>
              <View style={styles.statAccent} />
            </View>

            <View style={[styles.statCard, { marginTop: 30 }]}>
              <Text style={styles.statNumber}>{profile.followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
              <View style={styles.statAccent} />
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile.followingCount}</Text>
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
              {mockData.interests.map((interest, index) => (
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
              {mockData.recentEvents.map((event, index) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventCard,
                    {
                      marginLeft: event.offset,
                      zIndex: mockData.recentEvents.length - index,
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
        </ScrollView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6EE",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B58",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#FF6B58",
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 100,
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
  identitySection: {
    marginBottom: 16,
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
  fullName: {
    fontSize: 18,
    color: "#666666",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ageText: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "600",
    marginTop: 2,
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
    color: "#666666",
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
  interestCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  interestGradient: {
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
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
});
