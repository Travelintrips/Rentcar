import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Pencil,
  Trash2,
  Plus,
  Search,
  Loader2,
  Upload,
  X,
  Tag,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface VehicleType {
  id: number;
  name: string;
  created_at?: string;
}

interface CarData {
  id: string;
  created_at: string;
  model: string;
  make: string;
  year: number;
  license_plate: string | null;
  color: string | null;
  status: string | null;
  daily_rate: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  category: string | null;
  seats: number | null;
  image_url: string | null;
  stnk_url: string | null;
  stnk_expiry: string | null;
  tax_expiry: string | null;
  is_active: boolean;
  available?: boolean | null; // Add available field to track separately
  vehicle_type_id?: number | null;
  vehicle_type_name?: string;
}

const CarsManagement = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<
    number | null
  >(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>(
    {},
  );

  // Vehicle Type Management States
  const [isVehicleTypeDialogOpen, setIsVehicleTypeDialogOpen] = useState(false);
  const [isAddVehicleTypeDialogOpen, setIsAddVehicleTypeDialogOpen] =
    useState(false);
  const [isEditVehicleTypeDialogOpen, setIsEditVehicleTypeDialogOpen] =
    useState(false);
  const [isDeleteVehicleTypeDialogOpen, setIsDeleteVehicleTypeDialogOpen] =
    useState(false);
  const [selectedVehicleType, setSelectedVehicleType] =
    useState<VehicleType | null>(null);
  const [vehicleTypeFormData, setVehicleTypeFormData] = useState({
    name: "",
  });
  const [formData, setFormData] = useState({
    model: "",
    make: "",
    year: "",
    license_plate: "",
    color: "",
    status: "available",
    daily_rate: "",
    mileage: "",
    fuel_type: "",
    transmission: "",
    category: "",
    seats: "",
    image_url: "",
    stnk_url: "",
    stnk_expiry: "",
    tax_expiry: "",
    is_active: true,
    vehicle_type_id: "",
  });

  const [uploadLoading, setUploadLoading] = useState({
    image: false,
    stnk: false,
  });

  useEffect(() => {
    fetchCars();
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_types")
        .select("*")
        .order("name");

      if (error) throw error;

      setVehicleTypes(data || []);
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
    }
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      console.log("Fetching cars from Supabase...");

      // Reset filters when fetching new data
      setSearchTerm("");
      setSelectedCategory(null);
      setSelectedVehicleTypeId(null);

      const { data, error } = await supabase
        .from("vehicles")
        .select(
          `
          *,
          vehicle_types(id, name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }

      console.log("Raw data from Supabase:", data);

      // Map the data to match the expected CarData structure
      const mappedData =
        data?.map((car) => {
          // Extract vehicle type data if available
          const vehicleTypeData = car.vehicle_types as {
            id: number;
            name: string;
          } | null;

          // Ensure boolean values are properly set - handle all possible formats
          const isActive =
            car.is_active === true ||
            car.is_active === "true" ||
            (car.is_active !== false &&
              car.is_active !== "false" &&
              car.is_active !== null);

          const isAvailable =
            car.available === true ||
            car.available === "true" ||
            (car.available !== false &&
              car.available !== "false" &&
              car.available !== null);

          return {
            id: car.id.toString(),
            created_at: car.created_at,
            model: car.model || "",
            make: car.make || "",
            year: car.year || new Date().getFullYear(),
            license_plate: car.license_plate,
            color: car.color,
            status: car.status,
            daily_rate: car.price || car.daily_rate,
            mileage: car.mileage,
            fuel_type: car.fuel_type,
            transmission: car.transmission,
            category: car.category || car.type,
            seats: car.seats,
            image_url: car.image || car.image_url,
            stnk_url: car.stnk_url,
            stnk_expiry: car.stnk_expiry,
            tax_expiry: car.tax_expiry,
            is_active: isActive, // Ensure proper boolean conversion
            available: isAvailable, // Ensure proper boolean conversion
            vehicle_type_id: car.vehicle_type_id,
            vehicle_type_name: vehicleTypeData
              ? vehicleTypeData.name
              : undefined,
          };
        }) || [];

      setCars(mappedData);
      setLoading(false);

      console.log("Processed cars data:", mappedData);
    } catch (error) {
      console.error("Error fetching cars:", error);
      setLoading(false);
      alert(`Failed to fetch cars: ${error.message}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddCar = async () => {
    try {
      console.log("Adding car with data:", formData);

      // Validate required fields
      if (!formData.make || !formData.model) {
        alert("Make and Model are required fields");
        return;
      }

      // Convert numeric fields
      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: formData.year
          ? parseInt(formData.year)
          : new Date().getFullYear(),
        license_plate: formData.license_plate,
        color: formData.color,
        status: formData.status || "available",
        price: formData.daily_rate ? parseFloat(formData.daily_rate) : 0,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        category: formData.category,
        seats: formData.seats ? parseInt(formData.seats) : 4,
        image: formData.image_url,
        stnk_url: formData.stnk_url,
        stnk_expiry: formData.stnk_expiry,
        tax_expiry: formData.tax_expiry,
        available: formData.is_active,
        type: formData.category,
        vehicle_type_id: formData.vehicle_type_id
          ? parseInt(formData.vehicle_type_id)
          : null,
      };

      const { data, error } = await supabase
        .from("vehicles")
        .insert([vehicleData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        alert(`Error adding car: ${error.message}`);
        throw error;
      }

      console.log("Add car response:", data);

      if (data && data.length > 0) {
        // Map the new car to match CarData structure
        const newCar = {
          id: data[0].id.toString(),
          created_at: data[0].created_at,
          model: data[0].model || "",
          make: data[0].make || "",
          year: data[0].year || new Date().getFullYear(),
          license_plate: data[0].license_plate,
          color: data[0].color,
          status: data[0].status,
          daily_rate: data[0].price || data[0].daily_rate,
          mileage: data[0].mileage,
          fuel_type: data[0].fuel_type,
          transmission: data[0].transmission,
          category: data[0].category || data[0].type,
          seats: data[0].seats,
          image_url: data[0].image || data[0].image_url,
          stnk_url: data[0].stnk_url,
          stnk_expiry: data[0].stnk_expiry,
          tax_expiry: data[0].tax_expiry,
          is_active: data[0].available !== false,
          vehicle_type_id: data[0].vehicle_type_id,
          vehicle_type_name: vehicleTypes.find(
            (vt) => vt.id === data[0].vehicle_type_id,
          )?.name,
        };

        setCars([newCar, ...cars]);
        alert("Car added successfully!");
      }

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding car:", error);
      alert(`Failed to add car: ${error.message}`);
    }
  };

  const handleEditCar = async () => {
    if (!selectedCar) return;

    try {
      // Convert numeric fields
      const numericFormData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        daily_rate: formData.daily_rate
          ? parseFloat(formData.daily_rate)
          : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        seats: formData.seats ? parseInt(formData.seats) : null,
        vehicle_type_id: formData.vehicle_type_id
          ? parseInt(formData.vehicle_type_id)
          : null,
        // Explicitly convert boolean fields
        is_active: formData.is_active === true,
        available: formData.status === "available",
      };

      const { data, error } = await supabase
        .from("vehicles")
        .update(numericFormData)
        .eq("id", selectedCar.id)
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedCars = cars.map((car) =>
          car.id === selectedCar.id ? data[0] : car,
        );
        setCars(updatedCars);
      } else {
        // Fallback to local update if no data returned
        const updatedCars = cars.map((car) =>
          car.id === selectedCar.id ? { ...car, ...numericFormData } : car,
        );
        setCars(updatedCars);
      }

      setIsEditDialogOpen(false);
      setSelectedCar(null);
      resetForm();
    } catch (error) {
      console.error("Error updating car:", error);
    }
  };

  const handleDeleteCar = async () => {
    if (!selectedCar) return;

    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", selectedCar.id);

      if (error) throw error;

      const filteredCars = cars.filter((car) => car.id !== selectedCar.id);

      setCars(filteredCars);
      setIsDeleteDialogOpen(false);
      setSelectedCar(null);
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  const openEditDialog = (car: CarData) => {
    setSelectedCar(car);
    setFormData({
      model: car.model,
      make: car.make,
      year: car.year?.toString() || "",
      license_plate: car.license_plate || "",
      color: car.color || "",
      status: car.status || "available",
      daily_rate: car.daily_rate?.toString() || "",
      mileage: car.mileage?.toString() || "",
      fuel_type: car.fuel_type || "",
      transmission: car.transmission || "",
      category: car.category || "",
      seats: car.seats?.toString() || "",
      image_url: car.image_url || "",
      stnk_url: car.stnk_url || "",
      stnk_expiry: car.stnk_expiry || "",
      tax_expiry: car.tax_expiry || "",
      is_active: car.is_active !== false,
      vehicle_type_id: car.vehicle_type_id?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (car: CarData) => {
    setSelectedCar(car);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      model: "",
      make: "",
      year: "",
      license_plate: "",
      color: "",
      status: "available",
      daily_rate: "",
      mileage: "",
      fuel_type: "",
      transmission: "",
      category: "",
      seats: "",
      image_url: "",
      stnk_url: "",
      stnk_expiry: "",
      tax_expiry: "",
      is_active: true,
      vehicle_type_id: "",
    });
  };

  const filteredCars = cars.filter(
    (car) =>
      (searchTerm === "" ||
        car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.color?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === null || car.category === selectedCategory) &&
      (selectedVehicleTypeId === null ||
        car.vehicle_type_id === selectedVehicleTypeId),
  );

  console.log("Total cars:", cars.length);
  console.log("Filtered cars:", filteredCars.length);

  // Group cars by model
  const groupedByModel = filteredCars.reduce(
    (acc, car) => {
      // Handle null or undefined model
      const modelKey = car.model?.toLowerCase() || "unknown";
      if (!acc[modelKey]) {
        acc[modelKey] = [];
      }
      acc[modelKey].push(car);
      return acc;
    },
    {} as Record<string, CarData[]>,
  );

  // Toggle expanded state for a model
  const toggleModelExpanded = (modelKey: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelKey]: !prev[modelKey],
    }));
  };

  const categories = [
    "Sedan",
    "SUV",
    "Truck",
    "Luxury",
    "Hatchback",
    "MPV",
    "Convertible",
    "Coupe",
    "Van",
    "Minivan",
  ];
  const uniqueCategories = Array.from(
    new Set(cars.map((car) => car.category).filter(Boolean)),
  );

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "image" | "stnk",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Set loading state for specific file type
      setUploadLoading((prev) => ({ ...prev, [fileType]: true }));

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${fileType}_${Date.now()}.${fileExt}`;
      const filePath = `cars/${fileType}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("cars")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cars")
        .getPublicUrl(filePath);

      // Update form data with the file URL
      setFormData({
        ...formData,
        [`${fileType}_url`]: urlData.publicUrl,
      });
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
    } finally {
      setUploadLoading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const handleToggleActive = async (car: CarData) => {
    try {
      // If car is already suspended (is_active is false), we want to make it available
      // If car is active, we want to suspend it
      const newIsActive = !car.is_active;
      // When suspending a car, update its status to "suspended"
      // When activating a car, set status back to "available"
      const newStatus = newIsActive ? "available" : "suspended";

      console.log(
        `Toggling car ${car.id} active status to ${newIsActive} and status to ${newStatus}`,
      );

      // Make sure we're using the correct table name and field names
      const { data, error } = await supabase
        .from("vehicles")
        .update({
          is_active: newIsActive,
          status: newStatus,
          available: newIsActive, // Update the available field too
        })
        .eq("id", car.id)
        .select("*");

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log(`Successfully toggled car active status, response:`, data);

      // Show success message
      alert(`Car ${newIsActive ? "activated" : "suspended"} successfully`);

      // Immediately refresh data from server to ensure UI is in sync
      await fetchCars();
    } catch (error) {
      console.error("Error toggling car active status:", error);
      alert(`Failed to update car status: ${error.message}`);
    }
  };

  const handleStatusChange = async (car: CarData, newStatus: string) => {
    try {
      console.log(`Updating car ${car.id} status to ${newStatus}`);

      // Make sure we're using the correct table name and field names
      const { data, error } = await supabase
        .from("vehicles")
        .update({
          status: newStatus,
          // If there's an 'available' field that needs to be updated based on status
          available: newStatus === "available" ? true : false,
          // Also update is_active if status is suspended
          is_active: newStatus === "suspended" ? false : car.is_active,
        })
        .eq("id", car.id)
        .select("*");

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log(`Successfully updated car status, response:`, data);

      // Show success message
      alert(`Car status updated to ${newStatus}`);

      // Immediately refresh data from server to ensure UI is in sync
      await fetchCars();
    } catch (error) {
      console.error("Error changing car status:", error);
      alert(`Failed to update car status: ${error.message}`);
    }
  };

  const FileUploadField = ({
    label,
    id,
    fileType,
    accept = "image/*",
  }: {
    label: string;
    id: string;
    fileType: "image" | "stnk";
    accept?: string;
  }) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">
        {label}
      </Label>
      <div className="col-span-3 flex items-center gap-2">
        <Input
          id={id}
          name={`${fileType}_url`}
          value={formData[`${fileType}_url` as keyof typeof formData] as string}
          onChange={handleInputChange}
          className="flex-1"
          placeholder={`Enter ${label} URL or upload`}
        />
        <div className="relative">
          <Input
            type="file"
            accept={accept}
            id={`${id}-upload`}
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
            onChange={(e) => handleFileUpload(e, fileType)}
            disabled={uploadLoading[fileType]}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={uploadLoading[fileType]}
          >
            {uploadLoading[fileType] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
        {formData[`${fileType}_url` as keyof typeof formData] && (
          <a
            href={
              formData[`${fileType}_url` as keyof typeof formData] as string
            }
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2"
          >
            <Button type="button" variant="ghost" size="icon">
              <img
                src={
                  formData[`${fileType}_url` as keyof typeof formData] as string
                }
                alt={label}
                className="h-8 w-8 object-cover rounded"
              />
            </Button>
          </a>
        )}
      </div>
    </div>
  );

  // Vehicle Type Management Functions
  const handleVehicleTypeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setVehicleTypeFormData({
      ...vehicleTypeFormData,
      [name]: value,
    });
  };

  const handleAddVehicleType = async () => {
    try {
      if (!vehicleTypeFormData.name.trim()) {
        alert("Vehicle type name is required");
        return;
      }

      const { data, error } = await supabase
        .from("vehicle_types")
        .insert([{ name: vehicleTypeFormData.name.trim() }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setVehicleTypes([...vehicleTypes, data[0]]);
        setIsAddVehicleTypeDialogOpen(false);
        setVehicleTypeFormData({ name: "" });
      }
    } catch (error) {
      console.error("Error adding vehicle type:", error);
      alert(`Failed to add vehicle type: ${error.message}`);
    }
  };

  const handleEditVehicleType = async () => {
    try {
      if (!selectedVehicleType) return;
      if (!vehicleTypeFormData.name.trim()) {
        alert("Vehicle type name is required");
        return;
      }

      const { data, error } = await supabase
        .from("vehicle_types")
        .update({ name: vehicleTypeFormData.name.trim() })
        .eq("id", selectedVehicleType.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setVehicleTypes(
          vehicleTypes.map((vt) =>
            vt.id === selectedVehicleType.id ? data[0] : vt,
          ),
        );
        setIsEditVehicleTypeDialogOpen(false);
        setSelectedVehicleType(null);
        setVehicleTypeFormData({ name: "" });
      }
    } catch (error) {
      console.error("Error updating vehicle type:", error);
      alert(`Failed to update vehicle type: ${error.message}`);
    }
  };

  const handleDeleteVehicleType = async () => {
    try {
      if (!selectedVehicleType) return;

      // Check if any cars are using this vehicle type
      const { data: carsWithType, error: checkError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("vehicle_type_id", selectedVehicleType.id);

      if (checkError) throw checkError;

      if (carsWithType && carsWithType.length > 0) {
        alert(
          `Cannot delete this vehicle type because it is used by ${carsWithType.length} car(s). Please reassign those cars to another type first.`,
        );
        return;
      }

      const { error } = await supabase
        .from("vehicle_types")
        .delete()
        .eq("id", selectedVehicleType.id);

      if (error) throw error;

      setVehicleTypes(
        vehicleTypes.filter((vt) => vt.id !== selectedVehicleType.id),
      );
      setIsDeleteVehicleTypeDialogOpen(false);
      setSelectedVehicleType(null);
    } catch (error) {
      console.error("Error deleting vehicle type:", error);
      alert(`Failed to delete vehicle type: ${error.message}`);
    }
  };

  const openEditVehicleTypeDialog = (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    setVehicleTypeFormData({ name: vehicleType.name });
    setIsEditVehicleTypeDialogOpen(true);
  };

  const openDeleteVehicleTypeDialog = (vehicleType: VehicleType) => {
    setSelectedVehicleType(vehicleType);
    setIsDeleteVehicleTypeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Car Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsVehicleTypeDialogOpen(true)}
            className="flex items-center"
          >
            <Tag className="h-4 w-4 mr-2" /> Manage Vehicle Types
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Car
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/30 p-2 rounded-lg flex gap-2 overflow-x-auto">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            All Categories
          </Button>
          {uniqueCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="bg-muted/30 p-2 rounded-lg flex gap-2 overflow-x-auto">
          <Button
            variant={selectedVehicleTypeId === null ? "default" : "outline"}
            onClick={() => setSelectedVehicleTypeId(null)}
            className="whitespace-nowrap"
          >
            All Vehicle Types
          </Button>
          {vehicleTypes.map((type) => (
            <Button
              key={type.id}
              variant={
                selectedVehicleTypeId === type.id ? "default" : "outline"
              }
              onClick={() => setSelectedVehicleTypeId(type.id)}
              className="whitespace-nowrap"
            >
              {type.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                cars.filter(
                  (car) =>
                    (car.status === "available" || !car.status) &&
                    car.is_active !== false,
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rented Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                cars.filter(
                  (car) =>
                    (car.status === "rented" ||
                      car.status === "booked" ||
                      car.status === "onride") &&
                    car.is_active !== false,
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                cars.filter(
                  (car) =>
                    car.status === "Maintenance" && car.is_active !== false,
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Cars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cars.filter((car) => car.is_active === false).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cars</CardTitle>
              <CardDescription>Manage your car fleet</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Search results for:{" "}
              <span className="font-medium">"{searchTerm}"</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading cars...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Make/Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>STNK Expiry</TableHead>
                  <TableHead>Tax Expiry</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedByModel).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      {searchTerm ? (
                        <div>
                          <p>No cars found matching "{searchTerm}"</p>
                          <Button
                            variant="link"
                            onClick={() => setSearchTerm("")}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        "No cars found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedByModel).map(
                    ([modelKey, carsInModel]) => {
                      const isExpanded = expandedModels[modelKey] || false;
                      const availableCarsCount = carsInModel.filter(
                        (car) =>
                          (car.status === "available" || !car.status) &&
                          car.is_active !== false,
                      ).length;

                      return (
                        <div key={modelKey}>
                          {/* Model Group Header */}
                          <TableRow
                            className="bg-muted/50 cursor-pointer hover:bg-muted"
                            onClick={() => toggleModelExpanded(modelKey)}
                          >
                            <TableCell colSpan={10} className="py-2">
                              <div className="flex items-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                <span className="font-medium uppercase">
                                  {carsInModel[0].model}
                                </span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  ({carsInModel.length} total,{" "}
                                  {availableCarsCount} available)
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Individual Cars (shown when expanded) */}
                          {isExpanded &&
                            carsInModel.map((car) => (
                              <TableRow
                                key={car.id}
                                className={
                                  car.is_active === false ? "opacity-60" : ""
                                }
                              >
                                <TableCell>
                                  {car.image_url ? (
                                    <img
                                      src={car.image_url}
                                      alt={`${car.make} ${car.model}`}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                      <Car className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{car.make}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {car.model}
                                  </div>
                                </TableCell>
                                <TableCell>{car.year}</TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {car.license_plate}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Color: {car.color || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {car.vehicle_type_name || car.category || "-"}
                                </TableCell>
                                <TableCell>
                                  {car.is_active === false ? (
                                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                      Suspended
                                    </span>
                                  ) : (
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${car.status === "available" || !car.status ? "bg-green-100 text-green-800" : car.status === "rented" || car.status === "booked" || car.status === "onride" ? "bg-blue-100 text-blue-800" : car.status === "Maintenance" ? "bg-yellow-100 text-yellow-800" : car.status === "suspended" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"}`}
                                    >
                                      {car.status || "available"}
                                    </span>
                                  )}
                                  {/* Status debug info */}
                                  <div className="text-xs text-gray-500 mt-1">
                                    DB: is_active={String(car.is_active)},
                                    available=
                                    {String(car.available)}
                                  </div>
                                </TableCell>
                                <TableCell>{car.stnk_expiry || "-"}</TableCell>
                                <TableCell>{car.tax_expiry || "-"}</TableCell>
                                <TableCell>
                                  {car.daily_rate
                                    ? `Rp ${car.daily_rate.toLocaleString("id-ID")}`
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => openEditDialog(car)}
                                      title="Edit"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={
                                        car.status === "Maintenance"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : ""
                                      }
                                      onClick={() => {
                                        const newStatus =
                                          car.status === "Maintenance"
                                            ? "available"
                                            : "Maintenance";
                                        handleStatusChange(car, newStatus);
                                      }}
                                      title={
                                        car.status === "Maintenance"
                                          ? "Set as Available"
                                          : "Set as Maintenance"
                                      }
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant={
                                        car.is_active === false
                                          ? "default"
                                          : "outline"
                                      }
                                      size="icon"
                                      className={
                                        car.is_active === false
                                          ? "bg-amber-500 hover:bg-amber-600"
                                          : "bg-slate-200 hover:bg-slate-300"
                                      }
                                      onClick={() => handleToggleActive(car)}
                                      title={
                                        car.is_active === false
                                          ? "Activate"
                                          : "Suspend"
                                      }
                                    >
                                      {car.is_active === false ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="h-4 w-4"
                                        >
                                          <path d="M5 12h14" />
                                          <path d="M12 5v14" />
                                        </svg>
                                      ) : (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="h-4 w-4"
                                        >
                                          <path d="M5 12h14" />
                                        </svg>
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </div>
                      );
                    },
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredCars.length} of {cars.length} cars in{" "}
            {Object.keys(groupedByModel).length} model groups
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>
          <Button variant="outline" onClick={fetchCars}>
            Refresh
          </Button>
        </CardFooter>
      </Card>

      {/* Add Car Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Car</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new car to the fleet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="make" className="text-right">
                Make
              </Label>
              <Input
                id="make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="license_plate" className="text-right">
                License Plate
              </Label>
              <Input
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Input
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Input
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="daily_rate" className="text-right">
                Daily Rate ($)
              </Label>
              <Input
                id="daily_rate"
                name="daily_rate"
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mileage" className="text-right">
                Mileage
              </Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fuel_type" className="text-right">
                Fuel Type
              </Label>
              <Input
                id="fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transmission" className="text-right">
                Transmission
              </Label>
              <Input
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle_type_id" className="text-right">
                Vehicle Type
              </Label>
              <select
                id="vehicle_type_id"
                name="vehicle_type_id"
                value={formData.vehicle_type_id}
                onChange={handleSelectChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a vehicle type</option>
                {vehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seats" className="text-right">
                Seats
              </Label>
              <Input
                id="seats"
                name="seats"
                type="number"
                value={formData.seats}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <FileUploadField
              label="Car Image"
              id="image_url"
              fileType="image"
            />
            <FileUploadField label="STNK Image" id="stnk_url" fileType="stnk" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stnk_expiry" className="text-right">
                STNK Expiry
              </Label>
              <Input
                id="stnk_expiry"
                name="stnk_expiry"
                type="date"
                value={formData.stnk_expiry}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax_expiry" className="text-right">
                Tax Expiry
              </Label>
              <Input
                id="tax_expiry"
                name="tax_expiry"
                type="date"
                value={formData.tax_expiry}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {formData.is_active
                    ? "Car is active and available for rental"
                    : "Car is suspended and not available for rental"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCar}>Add Car</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Car</DialogTitle>
            <DialogDescription>Update the car's information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-make" className="text-right">
                Make
              </Label>
              <Input
                id="edit-make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-model" className="text-right">
                Model
              </Label>
              <Input
                id="edit-model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-year" className="text-right">
                Year
              </Label>
              <Input
                id="edit-year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-license_plate" className="text-right">
                License Plate
              </Label>
              <Input
                id="edit-license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <Input
                id="edit-color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Input
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-daily_rate" className="text-right">
                Daily Rate ($)
              </Label>
              <Input
                id="edit-daily_rate"
                name="daily_rate"
                type="number"
                step="0.01"
                value={formData.daily_rate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-mileage" className="text-right">
                Mileage
              </Label>
              <Input
                id="edit-mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-fuel_type" className="text-right">
                Fuel Type
              </Label>
              <Input
                id="edit-fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-transmission" className="text-right">
                Transmission
              </Label>
              <Input
                id="edit-transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Input
                id="edit-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-vehicle_type_id" className="text-right">
                Vehicle Type
              </Label>
              <select
                id="edit-vehicle_type_id"
                name="vehicle_type_id"
                value={formData.vehicle_type_id}
                onChange={handleSelectChange}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a vehicle type</option>
                {vehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-seats" className="text-right">
                Seats
              </Label>
              <Input
                id="edit-seats"
                name="seats"
                type="number"
                value={formData.seats}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <FileUploadField
              label="Car Image"
              id="edit-image_url"
              fileType="image"
            />
            <FileUploadField
              label="STNK Image"
              id="edit-stnk_url"
              fileType="stnk"
            />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-stnk_expiry" className="text-right">
                STNK Expiry
              </Label>
              <Input
                id="edit-stnk_expiry"
                name="stnk_expiry"
                type="date"
                value={formData.stnk_expiry}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tax_expiry" className="text-right">
                Tax Expiry
              </Label>
              <Input
                id="edit-tax_expiry"
                name="tax_expiry"
                type="date"
                value={formData.tax_expiry}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">
                Active
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="edit-is_active"
                  name="is_active"
                  checked={formData.is_active === true}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {formData.is_active
                    ? "Car is active and available for rental"
                    : "Car is suspended and not available for rental"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCar}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Car Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the car
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Types Management Dialog */}
      <Dialog
        open={isVehicleTypeDialogOpen}
        onOpenChange={setIsVehicleTypeDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Vehicle Types</DialogTitle>
            <DialogDescription>
              Add, edit, or delete vehicle types that can be assigned to cars.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Vehicle Types</h3>
              <Button onClick={() => setIsAddVehicleTypeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Type
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      No vehicle types found. Add your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicleTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditVehicleTypeDialog(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => openDeleteVehicleTypeDialog(type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVehicleTypeDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Type Dialog */}
      <Dialog
        open={isAddVehicleTypeDialogOpen}
        onOpenChange={setIsAddVehicleTypeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vehicle Type</DialogTitle>
            <DialogDescription>
              Create a new vehicle type that can be assigned to cars.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type-name" className="text-right">
                Name
              </Label>
              <Input
                id="type-name"
                name="name"
                value={vehicleTypeFormData.name}
                onChange={handleVehicleTypeInputChange}
                className="col-span-3"
                placeholder="e.g., SUV, Sedan, Truck"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddVehicleTypeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddVehicleType}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Type Dialog */}
      <Dialog
        open={isEditVehicleTypeDialogOpen}
        onOpenChange={setIsEditVehicleTypeDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vehicle Type</DialogTitle>
            <DialogDescription>Update the vehicle type name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-type-name"
                name="name"
                value={vehicleTypeFormData.name}
                onChange={handleVehicleTypeInputChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditVehicleTypeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditVehicleType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Type Dialog */}
      <AlertDialog
        open={isDeleteVehicleTypeDialogOpen}
        onOpenChange={setIsDeleteVehicleTypeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              vehicle type. Note that you cannot delete a type that is currently
              assigned to any cars.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsDeleteVehicleTypeDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicleType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CarsManagement;
