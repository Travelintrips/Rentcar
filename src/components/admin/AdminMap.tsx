import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Map } from "lucide-react";

interface UserLocation {
  id: string;
  user_id: string;
  user_email: string;
  full_name: string;
  latitude: number;
  longitude: number;
  device_id: string;
  updated_at: string;
}

const AdminMap = () => {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: -6.2,
    lng: 106.8,
  }); // Default to Jakarta, Indonesia

  // Define libraries array outside component to prevent recreation on each render
  const libraries: (
    | "places"
    | "drawing"
    | "geometry"
    | "localContext"
    | "visualization"
  )[] = [];

  // Only load Google Maps script when map is open
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Use environment variable
    libraries,
    // Don't load the script until the map is opened
    loadScriptAttempt: isMapOpen ? undefined : false,
  });

  const fetchUserLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("users_locations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      setUserLocations(data || []);

      // Set center to the first user's location if available
      if (data && data.length > 0 && data[0].latitude && data[0].longitude) {
        setCenter({
          lat: data[0].latitude,
          lng: data[0].longitude,
        });
      }
    } catch (err: any) {
      console.error("Error fetching user locations:", err);
      setError(err.message || "Failed to fetch user locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let subscription: any;

    if (isMapOpen) {
      // Only fetch locations when map is open
      fetchUserLocations();

      // Set up interval to refresh data every 15 seconds
      interval = setInterval(fetchUserLocations, 15000); // 15 detik

      // Set up realtime subscription
      subscription = supabase
        .channel("users_locations_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "users_locations" },
          (payload) => {
            console.log("Realtime update:", payload);
            fetchUserLocations();
          },
        )
        .subscribe();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (subscription) subscription.unsubscribe();
    };
  }, [isMapOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleUserSelect = (location: UserLocation) => {
    if (location.latitude && location.longitude) {
      setCenter({ lat: location.latitude, lng: location.longitude });
    }
  };

  if (loadError) {
    return (
      <div className="text-destructive">
        Error loading Google Maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        Loading Maps...
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Locations Map</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={isMapOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsMapOpen(!isMapOpen)}
          >
            {isMapOpen ? (
              <>
                <Map className="h-4 w-4 mr-2" />
                Tutup Peta
              </>
            ) : (
              <>
                <Map className="h-4 w-4 mr-2" />
                Lihat Lokasi Pengguna
              </>
            )}
          </Button>
          {isMapOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserLocations}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-destructive mb-4">{error}</p>}

        {!isMapOpen ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Map className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">
              Map is currently closed
            </h3>
            <p className="max-w-md">
              Click the "Open Map" button to view user locations on the map.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {userLocations.map((location) => (
                <Button
                  key={location.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleUserSelect(location)}
                >
                  {location.full_name || location.user_email || "Unknown User"}
                </Button>
              ))}
            </div>

            <div
              className="rounded-md border overflow-hidden"
              style={{ height: "500px" }}
            >
              {isLoaded && isMapOpen ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={center}
                  zoom={14}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  {userLocations.map((location) =>
                    location.latitude && location.longitude ? (
                      <Marker
                        key={location.id}
                        position={{
                          lat: location.latitude,
                          lng: location.longitude,
                        }}
                        title={`${location.full_name || location.user_email || "Unknown User"} (${formatDate(location.updated_at)})`}
                      />
                    ) : null,
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p>Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminMap;
