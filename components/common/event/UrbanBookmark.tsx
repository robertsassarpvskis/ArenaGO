// components/common/event/UrbanBookmark.tsx

import { useAuth } from "@/hooks/context/AuthContext";
import { useEventSave } from "@/hooks/events/useEventSave";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface UrbanBookmarkProps {
  eventId: string;
  eventName: string;
  variant?: "light" | "dark";
  accentColor: string;
}

export function UrbanBookmark({
  eventId,
  eventName,
  variant = "light",
  accentColor,
}: UrbanBookmarkProps) {
  const { user } = useAuth();
  const { saveEvent, unsaveEvent, isEventSaved } = useEventSave();
  const isSaved = isEventSaved(eventId);
  const isLight = variant === "light";

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // ── Bounce animation ───────────────────────────────────────────────────────
  const animateBounce = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.78,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.08,
        useNativeDriver: true,
        speed: 25,
        bounciness: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();
  };

  // ── Floating feedback toast ────────────────────────────────────────────────
  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    feedbackOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setFeedbackMsg(null));
  };

  // ── Handle press ───────────────────────────────────────────────────────────
  const handlePress = async () => {
    if (loading) return;

    animateBounce();

    // ── UNSAVE ─────────────────────────────────────────────────────────────
    if (isSaved) {
      unsaveEvent(eventId);
      showFeedback("Removed");
      return;
    }

    // ── SAVE ───────────────────────────────────────────────────────────────
    setLoading(true);
    try {
      const result = await saveEvent(
        eventId,
        eventName,
        user?.accessToken || "",
      );

      if (result.success && result.data) {
        const { eventSummary, like } = result.data;
        console.log(
          `[UrbanBookmark] ✅ Saved "${eventSummary.eventName}" ` +
            `by ${like.userSummary.displayName} at ${like.likedAt}`,
        );
        showFeedback("Saved!");
      } else {
        console.warn("[UrbanBookmark] ❌ Save failed:", result.error);
        showFeedback("Failed ✕");
      }
    } catch (err) {
      console.error("[UrbanBookmark] Unexpected error:", err);
      showFeedback("Error ✕");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {feedbackMsg !== null && (
        <Animated.Text
          style={[
            styles.feedbackToast,
            { opacity: feedbackOpacity, color: accentColor },
          ]}
          pointerEvents="none"
        >
          {feedbackMsg}
        </Animated.Text>
      )}

      <Pressable
        onPress={handlePress}
        accessibilityLabel={isSaved ? "Unsave event" : "Save event"}
        hitSlop={10}
        disabled={loading}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: isSaved
                ? accentColor
                : isLight
                  ? "#fff"
                  : "#000",
              borderColor: isSaved
                ? accentColor
                : isLight
                  ? "#ccc"
                  : "#ffffff40",
              transform: [{ scale: scaleAnim }],
              opacity: loading ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={isSaved ? "#fff" : isLight ? "#000" : "#fff"}
          />
          {isSaved && <Text style={styles.savedLabel}>SAVED</Text>}
        </Animated.View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  savedLabel: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  feedbackToast: {
    position: "absolute",
    top: -24,
    right: 0,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
