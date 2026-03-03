// ─── EventLocationMap.tsx ─────────────────────────────────────────────────────
// Standalone map + "Open in Maps" button for an event location.
// When userCoords is provided, shows both the user's location and the event
// location with a Google Maps-style curved route line. The map is fully
// interactive — the user can pan and zoom. The camera is fitted to show the
// full route on mount.

import { openMaps } from "@/app/modal/EventModalBase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventCoords {
  latitude: number;
  longitude: number;
}

export interface EventLocationMapProps {
  coords: EventCoords | null | undefined;
  userCoords?: EventCoords | null;
  locationName?: string;
  gradientColors?: [string, string];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function regionForTwoPoints(a: EventCoords, b: EventCoords, padding = 1.6) {
  const minLat = Math.min(a.latitude, b.latitude);
  const maxLat = Math.max(a.latitude, b.latitude);
  const minLng = Math.min(a.longitude, b.longitude);
  const maxLng = Math.max(a.longitude, b.longitude);

  const latDelta = Math.max((maxLat - minLat) * padding, 0.015);
  const lngDelta = Math.max((maxLng - minLng) * padding, 0.015);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

// Calculate a curved path between two points (like Google Maps)
function calculateCurvedPath(
  start: EventCoords,
  end: EventCoords,
  numPoints: number = 50,
): EventCoords[] {
  const points: EventCoords[] = [];

  // Calculate the midpoint with an offset for the curve
  const midLat = (start.latitude + end.latitude) / 2;
  const midLng = (start.longitude + end.longitude) / 2;

  // Calculate the distance between points
  const dLat = end.latitude - start.latitude;
  const dLng = end.longitude - start.longitude;
  const distance = Math.sqrt(dLat * dLat + dLng * dLng);

  // Create a perpendicular offset for the curve
  // The offset magnitude is proportional to the distance
  const offset = distance * 0.25;

  // For the perpendicular direction, rotate the vector 90 degrees
  // Perpendicular vector: (-dLng, dLat) normalized and scaled
  const perpLat = (-dLng / distance) * offset;
  const perpLng = (dLat / distance) * offset;

  // Generate points along a quadratic bezier curve
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Quadratic bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    // Where P₀ is start, P₂ is end, and P₁ is the control point (midpoint + offset)
    const controlLat = midLat + perpLat;
    const controlLng = midLng + perpLng;

    const lat =
      Math.pow(1 - t, 2) * start.latitude +
      2 * (1 - t) * t * controlLat +
      Math.pow(t, 2) * end.latitude;

    const lng =
      Math.pow(1 - t, 2) * start.longitude +
      2 * (1 - t) * t * controlLng +
      Math.pow(t, 2) * end.longitude;

    points.push({ latitude: lat, longitude: lng });
  }

  return points;
}

// Calculate approximate distance using Haversine formula
function calculateDistance(point1: EventCoords, point2: EventCoords): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Animated user dot marker ─────────────────────────────────────────────────

function AnimatedUserDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1.8,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={U.container}>
      <Animated.View
        style={[
          U.ring,
          {
            transform: [{ scale: ringAnim }],
            opacity: ringAnim.interpolate({
              inputRange: [1, 1.8],
              outputRange: [0.4, 0],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          U.outer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={U.inner} />
      </Animated.View>
    </View>
  );
}

const U = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    opacity: 0.3,
  },
  outer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
});

// ─── Event pin marker ─────────────────────────────────────────────────────────

function EventPin({ color = "#FF6B58" }: { color?: string }) {
  return (
    <View style={[P.container, { shadowColor: color }]}>
      <View style={[P.pin, { backgroundColor: color }]}>
        <Ionicons name="location" size={18} color="#FFF" />
      </View>
      <View style={[P.dot, { backgroundColor: color }]} />
    </View>
  );
}

const P = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B58",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF6B58",
    marginTop: 2,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventLocationMap({
  coords,
  userCoords,
  locationName,
  gradientColors = ["#FF6B58", "#FF8C75"],
}: EventLocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [curvedPath, setCurvedPath] = useState<EventCoords[]>([]);
  const [mapReady, setMapReady] = useState(false);

  if (!coords) return null;

  const hasRoute = !!userCoords;

  // Calculate curved path when coordinates change
  useEffect(() => {
    if (hasRoute) {
      const path = calculateCurvedPath(userCoords!, coords, 60);
      setCurvedPath(path);

      // Log to verify points are generated
      console.log("Generated path with", path.length, "points");
      console.log("Start:", path[0]);
      console.log("End:", path[path.length - 1]);
    }
  }, [
    coords?.latitude,
    coords?.longitude,
    userCoords?.latitude,
    userCoords?.longitude,
  ]);

  const initialRegion = hasRoute
    ? regionForTwoPoints(userCoords!, coords, 1.8)
    : { ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 };

  // After mount, use fitToCoordinates so MapView natively calculates the
  // tightest bounding box including both markers with edge padding.
  useEffect(() => {
    if (!hasRoute || !mapRef.current || !mapReady) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates([userCoords!, coords], {
        edgePadding: { top: 100, right: 80, bottom: 100, left: 80 },
        animated: true,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    coords?.latitude,
    coords?.longitude,
    userCoords?.latitude,
    userCoords?.longitude,
    mapReady,
  ]);

  return (
    <View style={S.container}>
      {/* ── Interactive map ── */}
      <MapView
        ref={mapRef}
        style={S.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        // Fully interactive — user can pan, zoom, and explore
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Google Maps-style curved route line user → event */}
        {hasRoute && curvedPath.length > 0 && (
          <>
            {/* Background white line for contrast */}
            <Polyline
              coordinates={curvedPath}
              strokeColor="#FFFFFF"
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
              zIndex={1}
            />
            {/* Main gradient-like colored line */}
            <Polyline
              coordinates={curvedPath}
              strokeColor="#4285F4" // Google Maps blue
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              zIndex={2}
            />
          </>
        )}

        {/* User position with Google Maps-style pulsing dot */}
        {hasRoute && (
          <Marker
            coordinate={userCoords!}
            title="Your location"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            flat
            zIndex={3}
          >
            <AnimatedUserDot />
          </Marker>
        )}

        {/* Event pin with Google Maps-style marker */}
        <Marker
          coordinate={coords}
          title={locationName}
          description="Event location"
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          zIndex={4}
        >
          <EventPin color={gradientColors[0]} />
        </Marker>
      </MapView>

      {/* ── Distance and time estimate ── */}
      {/* {hasRoute && (
        <View style={S.infoContainer}>
          <View style={S.infoCard}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={S.infoText}>
              {calculateDistance(userCoords!, coords).toFixed(1)} km
            </Text>
          </View>
          <View style={S.infoCard}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={S.infoText}>
              {Math.round(calculateDistance(userCoords!, coords) * 12)} min walk
            </Text>
          </View>
        </View>
      )} */}

      {/* ── "Open in Maps" button ── */}
      <Pressable
        style={S.mapsBtn}
        onPress={() =>
          openMaps(coords.latitude, coords.longitude, locationName ?? "")
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={S.mapsGrad}
        >
          <Ionicons name="navigate" size={18} color="#FFF" />
          <Text style={S.mapsBtnText}>OPEN IN MAPS</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 6,
    marginBottom: 4,
  },
  map: {
    width: "100%",
    height: 350,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  mapsBtn: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapsGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  mapsBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
});
