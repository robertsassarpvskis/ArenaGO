import { useAuth } from "@/hooks/context/AuthContext";
import { useParticipatedEventsContext } from "@/hooks/context/ParticipatedEventsContext";
import { useJoinEvent } from "@/hooks/events/useEventJoin";
import { useLeaveEvent } from "@/hooks/events/useEventLeave";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  eventId: string;
  variant?: "card" | "modal";
  onJoinedChange?: (joined: boolean) => void;
};

export default function JoinEventButton({
  eventId,
  variant = "card",
  onJoinedChange,
}: Props) {
  const { user } = useAuth();
  const { isJoined, markJoined, markLeft } = useParticipatedEventsContext();
  const { joinEvent, loading: joinLoading } = useJoinEvent(
    user?.accessToken || null,
  );
  const { leaveEvent, loading: leaveLoading } = useLeaveEvent(
    user?.accessToken || null,
  );
  const [isPending, setIsPending] = useState(false);

  const joined = isJoined(eventId);
  const loading = joinLoading || leaveLoading;
  const isBusy = isPending || loading;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    try {
      setIsPending(true);
      markJoined(eventId); // optimistic update
      const response = await joinEvent(eventId);
      onJoinedChange?.(true);
      Alert.alert("Success", `Joined ${response.resourceSummary.eventName}`);
    } catch {
      markLeft(eventId); // rollback
      Alert.alert("Error", "Failed to join event. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const handleLeave = () => {
    Alert.alert("Leave Event", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setIsPending(true);
            markLeft(eventId); // optimistic
            await leaveEvent(eventId);
            onJoinedChange?.(false);
          } catch {
            markJoined(eventId); // rollback
            Alert.alert("Error", "Failed to leave event. Please try again.");
          } finally {
            setIsPending(false);
          }
        },
      },
    ]);
  };

  const onPress = () => {
    if (isBusy) return;
    if (joined) handleLeave();
    else handleJoin();
  };

  // ── Determine colors & icon ───────────────────────────────────────────────
  const accentColor = joined ? "#6B7280" : "#FF6B58";
  const buttonIcon = joined ? "exit-outline" : "arrow-forward";
  const buttonText = joined
    ? variant === "card"
      ? "LEAVE"
      : "Leave Event"
    : variant === "card"
      ? "JOIN"
      : "Join Event";

  // ── CARD VARIANT ──────────────────────────────────────────────────────────
  if (variant === "card") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isBusy}
        style={({ pressed }) => [
          styles.joinButton,
          { backgroundColor: accentColor },
          pressed && { opacity: 0.85 },
          isBusy && { opacity: 0.7 },
        ]}
      >
        {isBusy ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Text style={styles.joinButtonText}>{buttonText}</Text>
            <Ionicons name={buttonIcon} size={16} color="#FFF" />
          </>
        )}
      </Pressable>
    );
  }

  // ── MODAL VARIANT ─────────────────────────────────────────────────────────
  const gradientColors: [string, string] = joined
    ? ["#6B7280", "#4B5563"]
    : ["#FF6B58", "#EF4444"];

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onPress} disabled={isBusy}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.modalButton, isBusy && styles.buttonDisabled]}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.modalText}>{buttonText}</Text>
              <Ionicons name={buttonIcon} size={20} color="#FFF" />
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── CARD & MODAL SHARED ───────────────────────────────────────────────────
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },

  // ── MODAL SPECIFIC ───────────────────────────────────────────────────────
  wrapper: {
    flex: 1,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  modalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },

  // ── SHARED ───────────────────────────────────────────────────────────────
  buttonDisabled: {
    opacity: 0.7,
  },
});
