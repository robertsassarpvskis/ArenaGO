// ─── EventModalBase.tsx ───────────────────────────────────────────────────────
// Design system: Minimalist × Street/Urban.
// Palette is near-monochrome. Accent (#FF6B58) used sparingly — status only.
// No gradients. No decorative blobs. Every element earns its place.

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
export const DISMISS_THRESHOLD = 120;
export const H_PAD = 20;

// ─── Design Tokens ────────────────────────────────────────────────────────────

export const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  joined: "#059669",
  joinedLight: "#10B981",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F4F4F5",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.65)",
} as const;

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

// Monochrome avatar palette — hues based on the ink/mid/accent family
const AVATAR_PALETTES: Array<[string, string]> = [
  ["#0F172A", "#1E293B"],
  ["#334155", "#475569"],
  ["#FF6B58", "#FF8A73"],
  ["#059669", "#10B981"],
  ["#64748B", "#94A3B8"],
  ["#F59E0B", "#FCD34D"],
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

// ─── Micro-components ─────────────────────────────────────────────────────────

// Thin 1px rule — consistent throughout
export const Divider = () => (
  <View
    style={{
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.divider,
      marginHorizontal: H_PAD,
    }}
  />
);

// Small all-caps label above sections
export const SectionLabel = ({
  children,
  color = C.muted,
}: {
  children: string;
  color?: string;
}) => <Text style={[sharedS.sectionLabel, { color }]}>{children}</Text>;

// Tag chip — used for category
export function Tag({
  label,
  outlined = false,
}: {
  label: string;
  outlined?: boolean;
}) {
  return (
    <View
      style={[
        sharedS.tag,
        outlined
          ? {
              backgroundColor: "transparent",
              borderColor: C.divider,
              borderWidth: 1,
            }
          : { backgroundColor: C.ink },
      ]}
    >
      <Text style={[sharedS.tagText, { color: outlined ? C.mid : "#FFF" }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

// Avatar — square, minimal border, ink-toned fallback
export function Avatar({
  participant,
  size = 40,
  borderColor = C.bg,
  onPress,
}: {
  participant: Participant;
  size?: number;
  borderColor?: string;
  onPress?: () => void;
}) {
  const [bg] = avatarGradient(participant.username);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        borderWidth: 2,
        borderColor,
        overflow: "hidden",
        backgroundColor: bg,
      }}
    >
      {participant.profilePhoto ? (
        <Image
          source={{ uri: participant.profilePhoto.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: bg,
            },
          ]}
        >
          <Text
            style={{ color: "#FFF", fontSize: size * 0.3, fontWeight: "800" }}
          >
            {ini(participant.displayName)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

export const sharedS = StyleSheet.create({
  // Modal chrome
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handleRow: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
    zIndex: 10,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.divider,
  },

  // Section spacing
  block: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // Typography
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 8,
    color: C.muted,
  },

  // Tag / chip
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  // Body copy
  bodyText: {
    fontSize: 15,
    color: C.mid,
    lineHeight: 24,
    fontWeight: "400",
  },

  // Location
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
    marginTop: 4,
  },

  // Map wrapper
  edgeMap: {
    height: 200,
    marginHorizontal: H_PAD,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },

  // Loading
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.ink,
    letterSpacing: 3,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.divider,
    zIndex: 40,
  },
  bottomInner: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
});
