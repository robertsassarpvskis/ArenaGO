// ─── InterestBadge.tsx ────────────────────────────────────────────────────────

import React, { useMemo } from "react";
import { Image, Text, TextStyle, View, ViewStyle } from "react-native";
import { SvgUri } from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InterestData {
  id: string;
  name: string;
  label?: string;
  icon?: {
    id?: string;
    url?: string;
  } | null;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  } | null;
}

export type InterestBadgeSize = "xs" | "sm" | "md" | "lg";
export type InterestBadgeVariant = "pill" | "chip" | "outlined";
export type InterestBadgeSurface = "image" | "light" | "dark";

export interface InterestBadgeProps {
  interest: InterestData;
  size?: InterestBadgeSize;
  variant?: InterestBadgeVariant;
  surface?: InterestBadgeSurface;
  showLabel?: boolean;
  showIcon?: boolean;
  onPress?: () => void;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (val: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, val))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getInterestColor(interest: InterestData): string {
  if (interest.color) {
    return rgbaToHex(interest.color.r, interest.color.g, interest.color.b);
  }

  const name = (interest.name || interest.label || "").toLowerCase();

  const COLOR_MAP: Record<string, string> = {
    gym: "#10B981",
    fitness: "#10B981",
    cycling: "#0EA5E9",
    music: "#FF6B58",
    sports: "#10B981",
    art: "#EC4899",
    food: "#F59E0B",
    dance: "#EC4899",
    photography: "#FF6B58",
    tech: "#6366F1",
    outdoor: "#10B981",
    gaming: "#8B5CF6",
    education: "#475569",
    business: "#475569",
    travel: "#0EA5E9",
    health: "#10B981",
    fashion: "#F43F5E",
    film: "#EF4444",
    coding: "#6366F1",
    workshop: "#10B981",
    conference: "#475569",
    party: "#FF6B58",
    meetup: "#6366F1",
    charity: "#10B981",
    nightlife: "#8B5CF6",
    concert: "#EF4444",
    exhibition: "#475569",
    webinar: "#475569",
    yoga: "#EC4899",
    pickleball: "#0EA5E9",
  };

  return COLOR_MAP[name] || "#FF6B58";
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<
  InterestBadgeSize,
  {
    height: number;
    paddingHorizontal: number;
    paddingVertical: number;
    letterSpacing?: number;
    fontSize: number;
    iconSize: number;
    gap: number;
    borderRadius: number;
  }
> = {
  xs: {
    height: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 8,
    iconSize: 10,
    gap: 3,
    borderRadius: 6,
  },
  sm: {
    height: 28,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 9,
    letterSpacing: -0.5,
    iconSize: 12,
    gap: 4,
    borderRadius: 8,
  },
  md: {
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    iconSize: 16,
    gap: 7,
    borderRadius: 10,
  },
  lg: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    iconSize: 20,
    gap: 6,
    borderRadius: 12,
  },
};

// ─── Variant styles ───────────────────────────────────────────────────────────

type StyleVariant = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  iconColor: string;
};

function getVariantStyle(
  variant: InterestBadgeVariant,
  surface: InterestBadgeSurface,
  accentColor: string,
): StyleVariant {
  if (variant === "chip") {
    return {
      backgroundColor: accentColor,
      borderColor: accentColor,
      borderWidth: 0,
      textColor: "#fff",
      iconColor: "#fff",
    };
  }

  if (variant === "outlined") {
    return {
      backgroundColor: "transparent",
      borderColor: accentColor,
      borderWidth: 1.5,
      textColor: accentColor,
      iconColor: accentColor,
    };
  }

  // pill
  if (surface === "image") {
    return {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderColor: "rgba(255,255,255,0.28)",
      borderWidth: 0.8,
      textColor: "#fff",
      iconColor: "#fff",
    };
  }

  if (surface === "dark") {
    return {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderColor: "rgba(255,255,255,0.14)",
      borderWidth: 0.8,
      textColor: "rgba(255,255,255,0.85)",
      iconColor: "rgba(255,255,255,0.85)",
    };
  }

  return {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderColor: "rgba(0,0,0,0.06)",
    borderWidth: 0.8,
    textColor: "#0D0D0D",
    iconColor: "#0D0D0D",
  };
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

interface InterestIconProps {
  icon?: { url?: string } | null;
  color: string;
  size: number;
}

function InterestIcon({ icon, color, size }: InterestIconProps) {
  if (!icon?.url) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
    );
  }

  if (icon.url.endsWith(".svg")) {
    return <SvgUri uri={icon.url} width={size} height={size} color={color} />;
  }

  return (
    <Image
      source={{ uri: icon.url }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        tintColor: color,
      }}
      resizeMode="contain"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterestBadge({
  interest,
  size = "md",
  variant = "pill",
  surface = "light",
  showLabel = true,
  showIcon = true,
  onPress,
}: InterestBadgeProps) {
  const accentColor = useMemo(() => getInterestColor(interest), [interest]);

  const sizeConfig = SIZE_CONFIG[size];
  const variantStyle = getVariantStyle(variant, surface, accentColor);

  const label = (interest.label || interest.name).toUpperCase();

  // ✅ FIXED typing here
  const fontWeight: TextStyle["fontWeight"] =
    variant === "chip" ? "800" : "700";

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    backgroundColor: variantStyle.backgroundColor,
    borderColor: variantStyle.borderColor,
    borderWidth: variantStyle.borderWidth,
    borderRadius: sizeConfig.borderRadius,
    gap: sizeConfig.gap,
  };

  const labelStyle: TextStyle = {
    textAlignVertical: "center",
    includeFontPadding: false,
    fontSize: sizeConfig.fontSize,
    color: variantStyle.textColor,
    fontWeight,
    letterSpacing: sizeConfig.fontSize > 10 ? 0.5 : 1,
  };

  return (
    <View
      style={containerStyle}
      onTouchEnd={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} category`}
    >
      {showIcon && (
        <InterestIcon
          icon={interest.icon}
          color={variantStyle.iconColor}
          size={sizeConfig.iconSize}
        />
      )}

      {showLabel && (
        <Text style={labelStyle} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
}
