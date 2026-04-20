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
export const MODAL_HEIGHT = SCREEN_HEIGHT * 0.88;
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

// ─── Category pill palette ────────────────────────────────────────────────────
// Each category gets a warm filled pill (Bolt Food style).
// Falls back to amber for unknown categories.

const CATEGORY_PILL_PALETTE: Record<string, { bg: string; text: string }> = {
  popular: { bg: "#FFC107", text: "#7A5000" },
  sport: { bg: "#DCFCE7", text: "#166534" },
  sports: { bg: "#DCFCE7", text: "#166534" },
  music: { bg: "#EDE9FE", text: "#5B21B6" },
  art: { bg: "#FCE7F3", text: "#9D174D" },
  food: { bg: "#FEF3C7", text: "#92400E" },
  social: { bg: "#DBEAFE", text: "#1E3A8A" },
  tech: { bg: "#E0F2FE", text: "#0C4A6E" },
  outdoor: { bg: "#D1FAE5", text: "#064E3B" },
  gaming: { bg: "#EDE9FE", text: "#4C1D95" },
  fitness: { bg: "#D1FAE5", text: "#065F46" },
  education: { bg: "#E0F2FE", text: "#0369A1" },
  business: { bg: "#F0FDF4", text: "#14532D" },
  culture: { bg: "#FDF4FF", text: "#701A75" },
};

function getCategoryPillStyle(label: string): { bg: string; text: string } {
  const key = label.toLowerCase().trim();
  return CATEGORY_PILL_PALETTE[key] ?? { bg: "#FFC107", text: "#7A5000" };
}

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
  interest?: {
    name: string;
    id?: string;
    icon?: { url?: string };
    color?: { r: number; g: number; b: number; a: number };
  };
  time: string;
  location: string | { latitude: number; longitude: number };
  locationName?: string;
  distance?: string;
  attendees: number;
  spotsLeft?: number;
  maxParticipants?: number | null;
  author: { username: string } | null;
  participantsPreview?: Participant[] | null;
  participantsSummary?: {
    maxCount: number;
    currentCount: number;
    participantsPreview: Participant[];
  };
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

export const Divider = () => (
  <View
    style={{
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.divider,
      marginHorizontal: H_PAD,
    }}
  />
);

export const SectionLabel = ({
  children,
  color = C.muted,
}: {
  children: string;
  color?: string;
}) => <Text style={[sharedS.sectionLabel, { color }]}>{children}</Text>;

// ─── CategoryPill ─────────────────────────────────────────────────────────────
// Bolt Food-style warm filled rounded pill.
// Replaces the old ink-block Tag chip.

export function CategoryPill({ label }: { label: string }) {
  const { bg, text } = getCategoryPillStyle(label);
  return (
    <View style={[pillS.pill, { backgroundColor: bg }]}>
      <Text style={[pillS.text, { color: text }]}>
        {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
      </Text>
    </View>
  );
}

const pillS = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});

// Keep the old Tag export for any other places it may still be used
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
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },

  // ─── Handle row: rendered ON TOP of the hero image ───────────────────────
  // Position absolute so the image fills the full hero region uninterrupted.
  handleRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
    zIndex: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  block: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 8,
    color: C.muted,
  },
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
  bodyText: {
    fontSize: 15,
    color: C.mid,
    lineHeight: 24,
    fontWeight: "400",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  edgeMap: {
    height: 200,
    marginHorizontal: H_PAD,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
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
