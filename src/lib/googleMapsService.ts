import { useEffect, useState } from "react";
import { useLoadScript } from "@react-google-maps/api";

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyD9AVq8U8EAQqulOKi_PygoAsVS90OoHSI";

// Libraries to load
const libraries: (
  | "places"
  | "drawing"
  | "geometry"
  | "localContext"
  | "visualization"
)[] = ["places", "geometry"];

/**
 * Hook to load Google Maps script
 */
export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  return { isLoaded, loadError };
};

/**
 * Get current user location
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  });
};

/**
 * Hook to get user's current location
 */
export const useCurrentLocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const position = await getCurrentLocation();
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch (err: any) {
        setError(err.message || "Error getting location");
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, error, loading };
};

/**
 * Calculate distance between two points in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Open location in Google Maps
 */
export const openInGoogleMaps = (
  lat: number,
  lng: number,
  label?: string,
): void => {
  const url = label
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, "_blank");
};

/**
 * Get address from coordinates (reverse geocoding)
 */
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number,
): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    throw new Error("No address found");
  } catch (error) {
    console.error("Error getting address:", error);
    throw error;
  }
};

/**
 * Get coordinates from address (geocoding)
 */
export const getCoordinatesFromAddress = async (
  address: string,
): Promise<{ lat: number; lng: number }> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0].geometry.location;
    }
    throw new Error("No coordinates found");
  } catch (error) {
    console.error("Error getting coordinates:", error);
    throw error;
  }
};

/**
 * Start watching user location and send updates to Supabase
 * @param callback Function to call with each location update
 * @returns Function to stop watching location
 */
export const watchUserLocation = (
  callback?: (position: { lat: number; lng: number }) => void,
): (() => void) => {
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by this browser");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Call the callback with the location data
      if (callback) {
        callback(location);
      }
    },
    (error) => {
      console.error("Error watching position:", error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );

  // Return a function to stop watching
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

/**
 * Hook to watch user location
 */
export const useWatchLocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const startWatching = useCallback(() => {
    setIsWatching(true);
    setError(null);

    return watchUserLocation((position) => {
      setLocation(position);
    });
  }, []);

  useEffect(() => {
    let stopWatching: (() => void) | null = null;

    if (isWatching) {
      try {
        stopWatching = startWatching();
      } catch (err: any) {
        setError(err.message || "Error watching location");
        setIsWatching(false);
      }
    }

    return () => {
      if (stopWatching) {
        stopWatching();
      }
    };
  }, [isWatching, startWatching]);

  const stopWatching = useCallback(() => {
    setIsWatching(false);
  }, []);

  return { location, error, isWatching, startWatching, stopWatching };
};

/**
 * Google Maps service object
 */
const GoogleMapsService = {
  apiKey: GOOGLE_MAPS_API_KEY,
  useGoogleMaps,
  useCurrentLocation,
  getCurrentLocation,
  calculateDistance,
  openInGoogleMaps,
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  watchUserLocation,
  useWatchLocation,
};

export default GoogleMapsService;
