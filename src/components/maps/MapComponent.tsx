import React, { useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    info?: React.ReactNode;
  }>;
  height?: string | number;
  width?: string | number;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: true,
  fullscreenControl: true,
};

const MapComponent: React.FC<MapComponentProps> = ({
  center = { lat: -6.2, lng: 106.8 }, // Default to Jakarta, Indonesia
  zoom = 12,
  markers = [],
  height = "400px",
  width = "100%",
  onMapClick,
  onMarkerClick,
  className = "",
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyD9AVq8U8EAQqulOKi_PygoAsVS90OoHSI",
  });

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(markerId);
    if (onMarkerClick) {
      onMarkerClick(markerId);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
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
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Maps...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ height, width }} className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={defaultOptions}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            onClick={() => handleMarkerClick(marker.id)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={
              markers.find((m) => m.id === selectedMarker)?.position || center
            }
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              {markers.find((m) => m.id === selectedMarker)?.info || (
                <div>
                  <h3 className="font-medium">
                    {markers.find((m) => m.id === selectedMarker)?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Lat:{" "}
                    {markers
                      .find((m) => m.id === selectedMarker)
                      ?.position.lat.toFixed(6)}
                    , Lng:{" "}
                    {markers
                      .find((m) => m.id === selectedMarker)
                      ?.position.lng.toFixed(6)}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const position = markers.find(
                        (m) => m.id === selectedMarker,
                      )?.position;
                      if (position) {
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`,
                          "_blank",
                        );
                      }
                    }}
                  >
                    Open in Google Maps
                  </Button>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
