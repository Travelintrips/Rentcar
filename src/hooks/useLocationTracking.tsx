import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface LocationTrackingOptions {
  onPermissionDenied?: () => void;
  onLocationError?: (error: GeolocationPositionError | Error) => void;
  onLocationSuccess?: (position: GeolocationPosition) => void;
}

// Export as a named function declaration for Fast Refresh compatibility
export const useLocationTracking = () => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState | null>(null);
  const [currentPosition, setCurrentPosition] =
    useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<
    Error | GeolocationPositionError | null
  >(null);

  // Function to get or create device ID
  const getOrCreateDeviceId = (): string => {
    const storedDeviceId = localStorage.getItem("deviceId");
    if (storedDeviceId) {
      return storedDeviceId;
    }

    const newDeviceId = uuidv4();
    localStorage.setItem("deviceId", newDeviceId);
    console.log("Created new device ID:", newDeviceId);
    return newDeviceId;
  };

  // Function to get user's current location
  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 60000, // 60 seconds - increased from 30 seconds to handle very slow connections
        maximumAge: 0,
      });
    });
  };

  // Helper function to get a user-friendly error message for geolocation errors
  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Please check your browser permissions.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please try again later.";
      case error.TIMEOUT:
        return "Location request timed out. This may be due to poor GPS signal or network connectivity.";
      default:
        return `Location error: ${error.message}`;
    }
  };

  // Function to request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });

      setPermissionStatus(result.state);

      if (result.state === "granted") {
        return true;
      } else if (result.state === "prompt") {
        // This will trigger the permission prompt
        try {
          await getUserLocation();
          setPermissionStatus("granted");
          return true;
        } catch (error) {
          if (
            error instanceof GeolocationPositionError &&
            error.code === error.PERMISSION_DENIED
          ) {
            setPermissionStatus("denied");
          }
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      // Fall back to trying to get location directly
      try {
        await getUserLocation();
        setPermissionStatus("granted");
        return true;
      } catch (e) {
        if (
          e instanceof GeolocationPositionError &&
          e.code === e.PERMISSION_DENIED
        ) {
          setPermissionStatus("denied");
        }
        return false;
      }
    }
  };

  // Helper function to store user location in the database
  const storeUserLocation = async (
    userId: string,
    userEmail: string,
    fullName: string,
    deviceId: string,
    latitude: number,
    longitude: number,
  ) => {
    try {
      console.log("Storing location for user:", {
        userId,
        latitude,
        longitude,
      });

      // Store in users_locations table
      const { error } = await supabase.from("users_locations").upsert(
        {
          user_id: userId,
          user_email: userEmail,
          full_name: fullName,
          latitude,
          longitude,
          device_id: deviceId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("Error storing location:", error);
        return false;
      } else {
        console.log("Location tracked and stored successfully");
        // Store location in local storage as backup
        localStorage.setItem("userLatitude", latitude.toString());
        localStorage.setItem("userLongitude", longitude.toString());
        return true;
      }
    } catch (err) {
      console.error("Exception storing location:", err);
      return false;
    }
  };

  // Function to start tracking user location
  const startTracking = async (
    userId: string,
    userEmail: string,
    fullName: string,
    options?: LocationTrackingOptions,
  ): Promise<boolean> => {
    if (isTracking) {
      return true; // Already tracking
    }

    // Clear any existing watch
    stopTracking();

    // Get device ID
    const deviceId = getOrCreateDeviceId();

    if ("geolocation" in navigator) {
      // First check if we have permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.warn("Location permission denied");
        toast({
          title: "Location Access Denied",
          description: "Some features may not work without location access.",
          variant: "destructive",
        });

        if (options?.onPermissionDenied) {
          options.onPermissionDenied();
        }

        return false;
      }

      // Immediately get current position and store it
      try {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            console.log("Initial position obtained:", { latitude, longitude });
            setCurrentPosition(pos);

            // Store initial position in users_locations table
            await storeUserLocation(
              userId,
              userEmail,
              fullName,
              deviceId,
              latitude,
              longitude,
            );

            if (options?.onLocationSuccess) {
              options.onLocationSuccess(pos);
            }
          },
          (error) => {
            console.error("Error getting initial position:", error);
            setLocationError(error);

            const errorMessage = getLocationErrorMessage(error);
            toast({
              title: "Location Error",
              description: errorMessage,
              variant: "destructive",
            });

            if (options?.onLocationError) {
              options.onLocationError(error);
            }
          },
          { enableHighAccuracy: true, timeout: 90000, maximumAge: 0 }, // 90 seconds - increased from 45 seconds
        );
      } catch (initialPosError) {
        console.error("Exception getting initial position:", initialPosError);
        setLocationError(
          initialPosError instanceof Error
            ? initialPosError
            : new Error(String(initialPosError)),
        );
      }

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentPosition(pos);
          setLocationError(null);

          await storeUserLocation(
            userId,
            userEmail,
            fullName,
            deviceId,
            latitude,
            longitude,
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error);

          const errorMessage = getLocationErrorMessage(error);
          toast({
            title:
              error.code === error.PERMISSION_DENIED
                ? "Location Access Denied"
                : "Location Error",
            description: errorMessage,
            variant: "destructive",
          });

          if (options?.onLocationError) {
            options.onLocationError(error);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 60000, // 60 seconds - increased from 30 seconds
        },
      );

      // Store the watch ID in localStorage so we can clear it if needed
      localStorage.setItem("locationWatchId", watchId.toString());
      setIsTracking(true);
      return true;
    } else {
      console.warn("Geolocation is not supported by this browser");
      toast({
        title: "Location Not Supported",
        description: "Your browser does not support location tracking.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to stop tracking user location
  const stopTracking = () => {
    const storedWatchId = localStorage.getItem("locationWatchId");
    if (storedWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(parseInt(storedWatchId));
      localStorage.removeItem("locationWatchId");
      setIsTracking(false);
      console.log("Location tracking stopped");
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    startTracking,
    stopTracking,
    requestLocationPermission,
    getUserLocation,
    isTracking,
    permissionStatus,
    currentPosition,
    locationError,
    getOrCreateDeviceId,
  };
};

// Hook is exported as a named const function expression for Fast Refresh compatibility
