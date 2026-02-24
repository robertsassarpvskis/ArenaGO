// components/EventLocationPicker.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { MapPressEvent, Marker, MarkerDragStartEndEvent } from "react-native-maps";

const { height } = Dimensions.get("window");
const MAP_HEIGHT = Math.round(height * 0.35);

type Location = {
  latitude: number;
  longitude: number;
};

type EventLocationPickerProps = {
  initialLocation?: Location;
  initialLocationName?: string;
  onLocationChange?: (location: Location, locationName: string) => void;
};

export const EventLocationPicker: React.FC<EventLocationPickerProps> = ({
  initialLocation,
  initialLocationName = "",
  onLocationChange,
}) => {
  const [location, setLocation] = useState<Location | null>(
    initialLocation || null,
  );
  const [locationName, setLocationName] = useState(initialLocationName);
  const [fetchingLocationName, setFetchingLocationName] = useState(false);

  const handleMapPress = async (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setLocation(coords);
    setFetchingLocationName(true);

    try {
      // Reverse geocoding using OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
      );
      const data = await res.json();
      const address = data.address;

      let name = "";

      if (address?.building || address?.amenity || address?.leisure) {
        name = address.building || address.amenity || address.leisure;
      } else if (address?.road) {
        const houseNumber = address.house_number || "";
        name = `${houseNumber} ${address.road}`.trim();
      } else if (address?.neighbourhood || address?.suburb) {
        name = address.neighbourhood || address.suburb;
      } else if (address?.city || address?.town || address?.village) {
        name = address.city || address.town || address.village;
      } else {
        name = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      }

      setLocationName(name);
      onLocationChange && onLocationChange(coords, name);
    } catch (err) {
      console.error("Reverse geocode failed:", err);
      const fallbackName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      setLocationName(fallbackName);
      onLocationChange && onLocationChange(coords, fallbackName);
    } finally {
      setFetchingLocationName(false);
    }
  };

  const handleMarkerDragEnd = async (e: MarkerDragStartEndEvent) => {
    const coords = e.nativeEvent.coordinate; // <-- correct type
    await handleMapPress({ nativeEvent: { coordinate: coords } } as any);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 56.9496,
          longitude: location?.longitude || 24.1052,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {location && (
          <Marker
            coordinate={location}
            draggable
            onDragEnd={handleMarkerDragEnd}
            title={locationName || "Event Location"}
          />
        )}
      </MapView>

      {fetchingLocationName && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF4500" />
          <Text style={styles.loadingText}>Finding location name...</Text>
        </View>
      )}

      {locationName && !fetchingLocationName && (
        <View style={styles.locationNameContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.locationNameText}>{locationName}</Text>
          {location && (
            <Text style={styles.coordsText}>
              ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  map: {
    width: "100%",
    height: MAP_HEIGHT,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    gap: 8,
  },
  loadingText: { fontSize: 13, color: "#D97706", fontWeight: "700" },
  locationNameContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  locationNameText: { fontSize: 14, color: "#059669", fontWeight: "700" },
  coordsText: { fontSize: 12, color: "#065F46", fontWeight: "500" },
});
