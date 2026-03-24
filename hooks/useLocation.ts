import * as Location from "expo-location";
import { useEffect, useState } from "react";

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          city: address?.city || address?.region || "Unknown",
        });
      } catch (error) {
        setErrorMsg("Failed to get location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, loading };
}
