import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Car } from "lucide-react";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string | null;
  color: string | null;
  year: number | null;
  status: string | null;
  is_available: boolean | string | null;
}

interface VehicleGroup {
  model: string;
  make: string;
  vehicles: Vehicle[];
  availableCount: number;
}

const VehicleModels = () => {
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    fetchVehicles();

    // Set up real-time subscription
    const subscription = supabase
      .channel("vehicles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        () => {
          fetchVehicles();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("vehicles").select("*");

      if (error) throw error;

      // Group vehicles by model
      const groupedVehicles: Record<string, VehicleGroup> = {};

      data?.forEach((vehicle: Vehicle) => {
        const modelKey = `${vehicle.make}-${vehicle.model}`;

        if (!groupedVehicles[modelKey]) {
          groupedVehicles[modelKey] = {
            model: vehicle.model,
            make: vehicle.make,
            vehicles: [],
            availableCount: 0,
          };
        }

        groupedVehicles[modelKey].vehicles.push(vehicle);

        // Count available vehicles
        const isAvailable =
          vehicle.is_available === true ||
          vehicle.is_available === "true" ||
          vehicle.status === "Available" ||
          vehicle.status === "available";

        if (isAvailable) {
          groupedVehicles[modelKey].availableCount += 1;
        }
      });

      setVehicleGroups(Object.values(groupedVehicles));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModelExpand = (modelKey: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelKey]: !prev[modelKey],
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicleGroups.map((group) => {
        const modelKey = `${group.make}-${group.model}`;
        const isExpanded = expandedModels[modelKey];

        return (
          <Card
            key={modelKey}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <CardHeader className="pb-2 bg-gradient-to-r from-primary-light to-primary-tosca">
              <CardTitle className="text-white flex items-center">
                <Car className="mr-2 h-5 w-5" />
                {group.make} {group.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Kendaraan</p>
                  <p className="text-2xl font-bold">{group.vehicles.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tersedia</p>
                  <p className="text-2xl font-bold text-green-600">
                    {group.availableCount}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => toggleModelExpand(modelKey)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" /> Sembunyikan Detail
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" /> Lihat Detail
                  </>
                )}
              </Button>

              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-2 max-h-60 overflow-y-auto">
                  {group.vehicles.map((vehicle) => {
                    const isAvailable =
                      vehicle.is_available === true ||
                      vehicle.is_available === "true" ||
                      vehicle.status === "Available" ||
                      vehicle.status === "available";

                    return (
                      <div
                        key={vehicle.id}
                        className="p-2 rounded-md border flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {vehicle.license_plate || "No Plate"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {vehicle.color || "N/A"} • {vehicle.year || "N/A"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isAvailable ? "Tersedia" : "Tidak Tersedia"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VehicleModels;
