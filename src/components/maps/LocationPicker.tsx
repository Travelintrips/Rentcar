import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin } from "lucide-react";
import GoogleMapsService from "@/lib/googleMapsService";

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  className?: string;
  title?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  className = "",
  title = "Select Location",
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyDOo3ApDY4KkEkq8opDCNd6N_-SDmbR1Bs",
    libraries: ["places"],
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialLocation || null);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    } else {
      // Try to get user's current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Jakarta if geolocation fails
          setSelectedLocation({ lat: -6.2, lng: 106.8 });
        },
      );
    }
  }, [initialLocation]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setSelectedLocation(newLocation);
      if (onLocationSelect) {
        onLocationSelect(newLocation);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;

    setSearchLoading(true);
    setError(null);

    try {
      const coordinates =
        await GoogleMapsService.getCoordinatesFromAddress(searchAddress);
      setSelectedLocation(coordinates);
      if (onLocationSelect) {
        onLocationSelect(coordinates);
      }
    } catch (err: any) {
      setError(err.message || "Error searching for location");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(currentLocation);
        if (onLocationSelect) {
          onLocationSelect(currentLocation);
        }
      },
      (err) => {
        setError(`Error getting current location: ${err.message}`);
      },
    );
  };

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-destructive">
            Error loading Google Maps: {loadError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Maps...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for an address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={searchLoading}>
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
          <Button variant="outline" onClick={handleUseCurrentLocation}>
            <MapPin className="h-4 w-4 mr-2" />
            Current
          </Button>
        </div>

        {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

        <div className="h-[300px] rounded-md overflow-hidden border">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={selectedLocation || { lat: -6.2, lng: 106.8 }}
            zoom={14}
            onClick={handleMapClick}
          >
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    const newLocation = {
                      lat: e.latLng.lat(),
                      lng: e.latLng.lng(),
                    };
                    setSelectedLocation(newLocation);
                    if (onLocationSelect) {
                      onLocationSelect(newLocation);
                    }
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>

        {selectedLocation && (
          <div className="mt-4 text-sm">
            <p>
              <span className="font-medium">Selected Location:</span>{" "}
              {selectedLocation.lat.toFixed(6)},{" "}
              {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
