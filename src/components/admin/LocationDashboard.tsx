import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";

const LocationDashboard = () => {
  const [locations, setLocations] = useState([]);
  const [center, setCenter] = useState({ lat: -6.2, lng: 106.8 });
  const [isMapOpen, setIsMapOpen] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDOo3ApDY4KkEkq8opDCNd6N_-SDmbR1Bs", // Ganti dengan API key kamu
  });

  useEffect(() => {
    let interval: any;

    if (isMapOpen) {
      const fetchLocations = async () => {
        const { data } = await supabase.from("users_locations").select("*");
        setLocations(data || []);
        if (data && data.length > 0) {
          setCenter({ lat: data[0].latitude, lng: data[0].longitude });
        }
      };

      fetchLocations();
      interval = setInterval(fetchLocations, 15000); // Update tiap 15 detik
    }

    return () => clearInterval(interval);
  }, [isMapOpen]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Live Tracking Lokasi User</h2>
      <Button onClick={() => setIsMapOpen(!isMapOpen)} className="mb-4">
        {isMapOpen ? "Tutup Peta" : "Lihat Peta"}
      </Button>

      {isMapOpen && (
        <>
          <div className="flex gap-2 overflow-x-auto mb-4">
            {locations.map((loc) => (
              <Button
                key={loc.user_id}
                variant="outline"
                onClick={() =>
                  setCenter({ lat: loc.latitude, lng: loc.longitude })
                }
              >
                {loc.full_name || loc.user_email}
              </Button>
            ))}
          </div>

          <GoogleMap
            center={center}
            zoom={13}
            mapContainerStyle={{ width: "100%", height: "500px" }}
          >
            {locations.map((loc) => (
              <Marker
                key={loc.user_id}
                position={{ lat: loc.latitude, lng: loc.longitude }}
                title={`${loc.full_name} (${loc.device_id})`}
              />
            ))}
          </GoogleMap>
        </>
      )}
    </div>
  );
};

export default LocationDashboard;
