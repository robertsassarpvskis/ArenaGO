// ─── EventModalBase.tsx ───────────────────────────────────────────────────────
// Shared tokens, types, helpers, and micro-components used by all event modals.

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Dimensions ───────────────────────────────────────────────────────────────

export const { height: SCREEN_HEIGHT } = Dimensions.get("window");
export const MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;
export const DISMISS_THRESHOLD = 140;
export const H_PAD = 22;

// ─── Colour tokens ────────────────────────────────────────────────────────────

export const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F8F7F2",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.65)",
  joined: "#059669",
  joinedLight: "#10B981",
} as const;

export const ACCENT_BG   = "rgba(255,107,88,0.12)";
export const GREEN_BG    = "rgba(16,185,129,0.12)";
export const AMBER_BG    = "rgba(245,158,11,0.12)";
export const JOINED_BG   = "rgba(5,150,105,0.12)";
export const RED_BG      = "rgba(239,68,68,0.12)";
export const BLUE_BG     = "rgba(59,130,246,0.12)";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventModalViewMode = "basic" | "participant" | "author";

export interface Participant {
  username: string;
  displayName: string;
  profilePhoto?: { id: string; url: string; contentType: string } | null;
}

export interface EventData {
  id: string;
  title: string;
  description?: string | null;
  image?: string | { url?: string } | null;
  category: string;
  time: string;
  location: string | { latitude: number; longitude: number };
  locationName?: string;
  distance?: string;
  attendees: number;
  spotsLeft?: number;
  maxParticipants?: number | null;
  author: { username: string } | null;
  participantsPreview?: Participant[] | null;
  status?: "active" | "started" | "cancelled" | "ended";
}

export interface BaseEventModalProps {
  visible: boolean;
  event: EventData | null;
  onClose: () => void;
  isLoading?: boolean;
  accessToken?: string;
  onEventUpdated?: () => void;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES: Array<[string, string]> = [
  ["#FF6B58", "#FF8A73"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
  ["#F59E0B", "#FCD34D"],
  ["#EF4444", "#F87171"],
];

export const avatarGradient = (seed: string): [string, string] =>
  AVATAR_PALETTES[
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
      AVATAR_PALETTES.length
  ];

export const ini = (name: string) => {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export const openMaps = (lat: number, lng: number, label?: string) => {
  const { Linking } = require("react-native");
  const n = encodeURIComponent(label || "Event");
  const ios = `maps:0,0?q=${n}@${lat},${lng}`;
  const android = `geo:0,0?q=${lat},${lng}(${n})`;
  const web = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(Platform.OS === "ios" ? ios : android).catch(() =>
    Linking.openURL(web),
  );
};

// ─── Shared micro-components ──────────────────────────────────────────────────

export const Divider = ({ heavy }: { heavy?: boolean }) => (
  <View
    style={{
      height: heavy ? 2 : StyleSheet.hairlineWidth * 2,
      backgroundColor: heavy ? C.ink : C.divider,
      marginHorizontal: heavy ? 0 : H_PAD,
    }}
  />
);

export const EyebrowLabel = ({
  children,
  color = C.muted,
}: {
  children: string;
  color?: string;
}) => <Text style={[sharedS.eyebrow, { color }]}>{children}</Text>;

export function Pill({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[sharedS.pill, { backgroundColor: bg }]}>
      <Text style={[sharedS.pillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function Avatar({
  participant,
  size = 46,
  borderColor = C.bg,
  onPress,
}: {
  participant: Participant;
  size?: number;
  borderColor?: string;
  onPress?: () => void;
}) {
  const [g1, g2] = avatarGradient(participant.username);
  const radius = size * 0.28;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: 2.5,
        borderColor,
        overflow: "hidden",
        backgroundColor: C.bg,
        shadowColor: g1,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      {participant.profilePhoto ? (
        <Image
          source={{ uri: participant.profilePhoto.url }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={[g1, g2]}
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text
            style={{ color: "#FFF", fontSize: size * 0.3, fontWeight: "900" }}
          >
            {ini(participant.displayName)}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

export const sharedS = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 24,
  },

  handleRow: { paddingVertical: 10, alignItems: "center", zIndex: 10 },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },

  topChrome: {
    position: "absolute",
    top: 35,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    zIndex: 50,
  },

  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,244,239,0.95)",
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeBtnAccent: { backgroundColor: C.accent, borderColor: C.accent },
  chromeBtnSaved: { backgroundColor: C.accent, borderColor: C.accent },

  hero: { height: 380, width: "100%", position: "relative" },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroTagRow: {
    position: "absolute",
    bottom: 18,
    left: H_PAD,
    flexDirection: "row",
    flexWrap: "wrap",
  },

  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  pillText: { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },

  block: { paddingHorizontal: H_PAD, paddingVertical: 20 },

  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
    color: C.muted,
  },

  bigTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: -1,
    lineHeight: 38,
    textTransform: "uppercase",
    marginTop: 6,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  timeBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timeBadgeInlineText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timeSep: {
    width: 4,
    height: 14,
    backgroundColor: "#bbbebf",
    borderRadius: 2,
  },
  timeFormatText: {
    fontSize: 21,
    fontWeight: "900",
    color: C.mid,
    letterSpacing: -0.2,
  },

  locationText: {
    fontSize: 20,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: -0.4,
    marginTop: 2,
    marginBottom: 10,
  },
  edgeMap: {
    height: 260,
    marginHorizontal: -H_PAD,
    position: "relative",
    marginBottom: 12,
  },
  mapPillOverlay: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapPillText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  mapsLinkBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  mapsLinkGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  mapsLinkText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 1.5,
  },

  bodyText: {
    fontSize: 15,
    color: C.mid,
    lineHeight: 25,
    fontWeight: "500",
    marginTop: 4,
  },

  distanceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.green,
    letterSpacing: 0.3,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: "900",
    color: C.ink,
    letterSpacing: 3,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.accent,
    zIndex: 40,
  },
  bottomInner: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 38 : 22,
  },
});
