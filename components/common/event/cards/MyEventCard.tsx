// components/common/event/MyEventCard.tsx
//
// Used in two contexts:
//   1. My Events horizontal strip (index.tsx)  — default, width: 270
//   2. Profile recent activity list            — fullWidth prop, fills container
//
// Design is identical to the original index.tsx card.
// Uses dateUtils for all time formatting.
// ─────────────────────────────────────────────────────────────────────────────

import { formatEventTime, getTimeLabel } from "@/scripts/timeUtils";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Design tokens — identical to originals in index.tsx ─────────────────────
const C = {
  accent: "#FF6B58",
  joined: "#059669",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  bg: "#F8F7F2",
} as const;

const ACCENT_BG = "rgba(255,107,88,0.12)";
const JOINED_BG = "rgba(5,150,105,0.12)";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MyEventCardKind = "created" | "participated";

export interface MyEventCardProps {
  eventId: string;
  title: string;
  /** ISO date string from the API (e.g. event.startScheduledTo) */
  startScheduledTo?: string;
  kind: MyEventCardKind;
  currentCount?: number;
  maxCount?: number;
  /** Optional location label shown in full-width mode */
  locationName?: string;
  /** Optional category label shown in full-width mode */
  categoryName?: string;
  /**
   * When true the card fills its parent width (for profile activity lists).
   * When false (default) the card is 270 px wide (for horizontal strips).
   */
  fullWidth?: boolean;
  onPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyEventCard({
  title,
  startScheduledTo,
  kind,
  currentCount = 0,
  maxCount = 0,
  locationName,
  categoryName,
  fullWidth = false,
  onPress,
}: MyEventCardProps) {
  const isCreated = kind === "created";
  const accentColor = isCreated ? C.accent : C.joined;
  const badgeBg = isCreated ? ACCENT_BG : JOINED_BG;

  // ── Date labels from shared utils ─────────────────────────────────────────
  const timestamp = startScheduledTo
    ? Math.floor(new Date(startScheduledTo).getTime() / 1000)
    : undefined;
  const dayLabel = getTimeLabel(timestamp);
  const clockLabel = formatEventTime(timestamp);
  const dateDisplay = timestamp
    ? clockLabel
      ? `${dayLabel} · ${clockLabel}`
      : dayLabel
    : "TBD";

  // ── Count label ────────────────────────────────────────────────────────────
  const countLabel = isCreated
    ? `${currentCount}${maxCount > 0 ? ` / ${maxCount}` : ""} GOING`
    : `${currentCount} GOING`;

  // ── Fill bar (full-width mode only) ────────────────────────────────────────
  const fillRatio =
    fullWidth && maxCount > 0
      ? Math.min(currentCount / maxCount, 1)
      : null;

  // ── Press spring animation ─────────────────────────────────────────────────
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 20,
      stiffness: 400,
    }).start();

  const handlePressOut = () =>
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 300,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${isCreated ? "Hosting" : "Going to"}: ${title}, ${dateDisplay}`}
    >
      <Animated.View
        style={[
          s.myCard,
          fullWidth && s.myCardFull,
          { transform: [{ scale: pressAnim }] },
        ]}
      >
        <View style={s.myCardBody}>

          {/* Top row: badge + optional category (full-width only) */}
          <View style={s.topRow}>
            <View style={[s.kindBadge, { backgroundColor: badgeBg }]}>
              <View style={[s.badgeDot, { backgroundColor: accentColor }]} />
              <Text style={[s.kindBadgeText, { color: accentColor }]}>
                {isCreated ? "HOSTING" : "GOING"}
              </Text>
            </View>

            {fullWidth && categoryName && (
              <View style={s.catBadge}>
                <Text style={s.catBadgeText}>{categoryName.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={[s.myCardTitle, fullWidth && s.myCardTitleFull]}
            numberOfLines={fullWidth ? 2 : 1}
          >
            {title}
          </Text>

          {/* Location (full-width only) */}
          {fullWidth && locationName ? (
            <Text style={s.locationText} numberOfLines={1}>
              📍 {locationName}
            </Text>
          ) : null}

          {/* Date */}
          <Text style={s.myCardDate} numberOfLines={1}>
            {dateDisplay}
          </Text>

          {/* Rule */}
          <View style={[s.myCardRule, { backgroundColor: accentColor + "30" }]} />

          {/* Footer */}
          <View style={s.myCardFoot}>
            <Text style={s.myCardCount}>{countLabel}</Text>

            {/* Fill track (full-width only, when maxCount is known) */}
            {fillRatio !== null && (
              <View style={s.fillTrack}>
                <View
                  style={[
                    s.fillFill,
                    {
                      width: `${fillRatio * 100}%` as any,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              </View>
            )}

            <View style={[s.myCardArrow, { borderColor: accentColor + "40" }]}>
              <Text style={[s.myCardArrowText, { color: accentColor }]}>→</Text>
            </View>
          </View>

        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Strip card (default, 270 px) ──────────────────────────────────────────
  myCard: {
    width: 270,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: C.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Full-width override ───────────────────────────────────────────────────
  myCardFull: {
    width: "100%",
    borderRadius: 13,
  },

  myCardBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 5,
  },

  // ── Top row (badge + optional category) ───────────────────────────────────
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  kindBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  kindBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  catBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.mid,
    letterSpacing: 0.8,
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  myCardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -0.3,
    lineHeight: 20,
    textTransform: "uppercase",
  },
  myCardTitleFull: {
    fontSize: 16,
    lineHeight: 19,
  },

  // ── Location (full-width only) ────────────────────────────────────────────
  locationText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.mid,
    letterSpacing: 0.2,
  },

  // ── Date ──────────────────────────────────────────────────────────────────
  myCardDate: {
    fontSize: 10,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // ── Rule ──────────────────────────────────────────────────────────────────
  myCardRule: {
    height: 1,
    marginVertical: 2,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  myCardFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  myCardCount: {
    fontSize: 10,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: 0.4,
  },

  // Fill track (full-width mode, only when maxCount is known)
  fillTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  fillFill: {
    height: 3,
    borderRadius: 2,
  },

  myCardArrow: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  myCardArrowText: {
    fontSize: 10,
    fontWeight: "900",
  },
});