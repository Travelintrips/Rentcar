import React, { useState, useEffect } from "react";
import PickupCustomer from "./PickupCustomer";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  CreditCard,
  Banknote,
  Building2,
  Check,
  ChevronRight,
  User,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  staffId: z.string().optional(),
  tenantType: z.enum(["customer", "driver"]).optional(),
  tenantId: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  pickupTime: z.string().min(1, "Pickup time is required"),
  returnTime: z.string().min(1, "Return time is required"),
  driverOption: z.enum(["self", "provided"], {
    required_error: "Please select a driver option",
  }),
  paymentMethod: z.enum(["cash", "bank", "card"], {
    required_error: "Please select a payment method",
  }),
  paymentType: z.enum(["full", "partial"], {
    required_error: "Please select a payment type",
  }),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  type?: "sedan" | "suv" | "truck" | "luxury";
  category?: string;
  price: number;
  image?: string;
  license_plate?: string;
  seats?: number;
  transmission?: "automatic" | "manual";
  fuel_type?: "petrol" | "diesel" | "electric" | "hybrid";
  available?: boolean;
  features?: string[];
}

interface Staff {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Driver {
  id: string;
  name: string;
  license_number?: string;
  phone?: string;
  status?: "available" | "busy" | "inactive";
}

interface BookingFormProps {
  selectedVehicle?: Vehicle | null;
  onBookingComplete?: (bookingData: any) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedVehicle = null,
  onBookingComplete = () => {},
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");
  const [showInspection, setShowInspection] = useState(false);
  const [showPickupCustomer, setShowPickupCustomer] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Driver login states (replacing staff)
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [tenantType, setTenantType] = useState<"customer" | "driver" | "">("");
  const [tenantList, setTenantList] = useState<(Customer | Driver)[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<
    (Customer | Driver) | null
  >(null);

  // Default vehicle if none is selected
  const defaultVehicle = {
    id: "1",
    make: "Toyota",
    model: "Avanza",
    year: 2022,
    category: "MPV",
    price: 350000,
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
  };

  // Use selected vehicle or default
  const vehicleToUse = selectedVehicle || defaultVehicle;

  // Format currency to IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    // Fetch vehicles from Supabase
    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("available", true);

        if (error) throw error;

        if (data && data.length > 0) {
          setVehicles(
            data.map((vehicle) => ({
              ...vehicle,
              name: `${vehicle.make} ${vehicle.model} (${vehicle.year})`, // For backward compatibility
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    // Fetch drivers list (replacing staff)
    const fetchDrivers = async () => {
      setIsLoadingDrivers(true);
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id, name");

        if (error) throw error;

        if (data && data.length > 0) {
          setDriversList(data);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    fetchVehicles();
    fetchDrivers();
  }, []);

  // Fetch tenants (customers or drivers) when tenant type changes
  useEffect(() => {
    if (!tenantType) return;

    const fetchTenants = async () => {
      setIsLoadingTenants(true);
      try {
        const { data, error } = await supabase
          .from(tenantType === "customer" ? "customers" : "drivers")
          .select("id, name");

        if (error) throw error;

        if (data && data.length > 0) {
          setTenantList(data);
        } else {
          setTenantList([]);
        }
      } catch (error) {
        console.error(`Error fetching ${tenantType}s:`, error);
        setTenantList([]);
      } finally {
        setIsLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [tenantType]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staffId: "",
      tenantType: undefined,
      tenantId: "",
      startDate: new Date(),
      endDate: new Date(),
      pickupTime: "10:00",
      returnTime: "10:00",
      driverOption: "self",
      paymentMethod: "cash",
      paymentType: "full",
      additionalNotes: "",
    },
  });

  const calculateTotalDays = () => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    if (!startDate || !endDate) return 1;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    const days = calculateTotalDays();
    const basePrice = vehicleToUse.price * days;
    const driverFee =
      form.watch("driverOption") === "provided" ? 150000 * days : 0;
    return basePrice + driverFee;
  };

  const calculateDeposit = () => {
    return calculateTotal() * 0.3;
  };

  // Function to validate UUID format
  function isValidUUID(uuid: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      uuid,
    );
  }

  // Function to get driver name from driver ID
  const getDriverName = (driverId: string) => {
    const driver = driversList.find((d) => d.id === driverId);
    return driver ? driver.name : "";
  };

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return; // Mencegah double submit
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!sessionData.session?.user?.id) {
        throw new Error("You must be logged in to create a booking");
      }

      const userId = sessionData.session.user.id;

      // Validate user ID is a valid UUID
      if (!isValidUUID(userId)) {
        throw new Error("Invalid user ID format");
      }

      // Create booking in Supabase
      const bookingData = {
        user_id: userId,
        vehicle_id: vehicleToUse.id,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        total_amount: calculateTotal(),
        payment_status: data.paymentType === "partial" ? "partial" : "unpaid",
        status: "pending",
        created_at: new Date().toISOString(),
        driver_name: data.staffId ? getDriverName(data.staffId) : "",
        tenant_type: data.tenantType || null,
      };

      // Add tenant information if driver has selected a tenant
      if (data.staffId && data.tenantType && data.tenantId) {
        if (data.tenantType === "customer") {
          bookingData.user_id = data.tenantId;
          // Add customer_id field if it exists in your schema
          bookingData.customer_id = data.tenantId;
        } else if (data.tenantType === "driver") {
          // Add driver_id field to the booking data
          bookingData.driver_id = data.tenantId;
        }

        // Add driver_id to the booking data (using staffId field which now contains driver id)
        bookingData.driver_id = data.staffId;
      }

      const { data: insertedBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update vehicle status to 'booked'
      const { error: vehicleUpdateError } = await supabase
        .from("vehicles")
        .update({ status: "booked" })
        .eq("id", vehicleToUse.id);

      if (vehicleUpdateError) {
        console.error("Error updating vehicle status:", vehicleUpdateError);
        // Continue with booking process even if vehicle status update fails
      }

      // Validate booking ID before setting it
      if (!insertedBooking.id) {
        throw new Error("No booking ID returned from server");
      }

      // Set the booking ID from the inserted record
      setBookingId(insertedBooking.id.toString());

      // Call the onBookingComplete callback with the booking data
      onBookingComplete({
        ...data,
        bookingId: insertedBooking.id,
        vehicleId: vehicleToUse.id,
        totalAmount: calculateTotal(),
        depositAmount: data.paymentType === "partial" ? calculateDeposit() : 0,
      });

      // Redirect ke halaman pembayaran
      navigate(`/payment/form/${insertedBooking.id}`);
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert(`There was an error processing your booking: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate first step fields
      const startDateValid = form.trigger("startDate");
      const endDateValid = form.trigger("endDate");
      const pickupTimeValid = form.trigger("pickupTime");
      const returnTimeValid = form.trigger("returnTime");
      const driverOptionValid = form.trigger("driverOption");

      if (
        startDateValid &&
        endDateValid &&
        pickupTimeValid &&
        returnTimeValid &&
        driverOptionValid
      ) {
        setStep(2);
      }
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  // If showPickupCustomer is true, show the pickup customer form
  if (showPickupCustomer) {
    return (
      <PickupCustomer
        bookingId={bookingId}
        vehicleId={vehicleToUse.id.toString()}
        customerName="Customer Name" // This would be fetched from the user profile in a real app
        vehicleDetails={vehicleToUse}
        onComplete={(data) => {
          // After pickup is confirmed, proceed to inspection
          setShowInspection(true);
          setShowPickupCustomer(false);
        }}
        onCancel={() => {
          // Go back to booking form
          setShowPickupCustomer(false);
        }}
      />
    );
  }

  // If showInspection is true, we should redirect to the inspection form
  if (showInspection) {
    // In a real app, this would be a navigation to the inspection page
    // For now, we'll just show a message
    return (
      <Card className="w-full max-w-3xl mx-auto bg-background border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Proceed to Inspection
          </CardTitle>
          <CardDescription>
            Your booking has been completed successfully. Please proceed to the
            pre-rental inspection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Booking Details</h3>
              <p>
                <strong>Booking ID:</strong> {bookingId}
              </p>
              <p>
                <strong>Vehicle:</strong> {vehicleToUse.make}{" "}
                {vehicleToUse.model}{" "}
                {vehicleToUse.year && `(${vehicleToUse.year})`}
              </p>
              <p>
                <strong>Pickup Date:</strong>{" "}
                {format(form.getValues("startDate"), "PPP")}
              </p>
              <p>
                <strong>Return Date:</strong>{" "}
                {format(form.getValues("endDate"), "PPP")}
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                className="w-full max-w-md"
                onClick={() => {
                  // In a real app, this would navigate to the inspection page
                  window.location.href = `/inspection?vehicleId=${vehicleToUse.id}&bookingId=${bookingId}`;
                }}
              >
                Start Pre-Rental Inspection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-background border shadow-md overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl font-bold">
          Book Your Rental
        </CardTitle>
        <CardDescription>
          {selectedVehicle ? (
            <>
              Complete the form below to book{" "}
              <strong>
                {vehicleToUse.make} {vehicleToUse.model}{" "}
                {vehicleToUse.year && `(${vehicleToUse.year})`}
              </strong>{" "}
              for your trip.
            </>
          ) : (
            <>
              Please select a vehicle first or complete the form below to book
              the default vehicle.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        {selectedVehicle && (
          <div className="mb-6 p-3 sm:p-4 bg-muted rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-20 h-32 sm:h-20 overflow-hidden rounded-md">
              <img
                src={vehicleToUse.image}
                alt={vehicleToUse.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {vehicleToUse.make} {vehicleToUse.model}{" "}
                {vehicleToUse.year && `(${vehicleToUse.year})`}
              </h3>
              <p className="text-muted-foreground">
                {vehicleToUse.type || vehicleToUse.category} •{" "}
                {formatCurrency(vehicleToUse.price)}/day
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                {/* Staff Login Section */}
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-4 flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    Driver Login (Traffic)
                  </h3>

                  <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Select Driver</FormLabel>
                        <Select
                          disabled={isLoadingDrivers}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedDriver(value);
                          }}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDrivers ? (
                              <div className="flex items-center justify-center p-2">
                                <span className="text-sm text-muted-foreground">
                                  Loading...
                                </span>
                              </div>
                            ) : driversList.length === 0 ? (
                              <div className="flex items-center justify-center p-2">
                                <span className="text-sm text-muted-foreground">
                                  No drivers found
                                </span>
                              </div>
                            ) : (
                              driversList.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name}{" "}
                                  {driver.status && `(${driver.status})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Driver creating this booking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedDriver && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="tenantType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenant Type</FormLabel>
                            <Select
                              onValueChange={(value: "customer" | "driver") => {
                                field.onChange(value);
                                setTenantType(value);
                                setSelectedTenant(null);
                                form.setValue("tenantId", "");
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tenant type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="customer">
                                  Customer
                                </SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {tenantType && (
                        <FormField
                          control={form.control}
                          name="tenantId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {tenantType === "customer"
                                  ? "Customer"
                                  : "Driver"}
                              </FormLabel>
                              <Select
                                disabled={isLoadingTenants}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const selected = tenantList.find(
                                    (t) => t.id === value,
                                  );
                                  setSelectedTenant(selected || null);
                                }}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={`Select ${tenantType}`}
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingTenants ? (
                                    <div className="flex items-center justify-center p-2">
                                      <span className="text-sm text-muted-foreground">
                                        Loading...
                                      </span>
                                    </div>
                                  ) : tenantList.length === 0 ? (
                                    <div className="flex items-center justify-center p-2">
                                      <span className="text-sm text-muted-foreground">
                                        No {tenantType}s found
                                      </span>
                                    </div>
                                  ) : (
                                    tenantList.map((tenant) => (
                                      <SelectItem
                                        key={tenant.id}
                                        value={tenant.id}
                                      >
                                        {tenant.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                {tenantType === "customer"
                                  ? "Customer who will rent the vehicle"
                                  : "Driver who will operate the vehicle"}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedTenant && (
                        <div className="flex items-center p-3 bg-primary/10 rounded-md mt-2">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">
                              {tenantType === "customer"
                                ? "Customer"
                                : "Driver"}
                              : {selectedTenant.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ID: {selectedTenant.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Pickup Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Return Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < form.watch("startDate")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="pickupTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Pickup Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="returnTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Return Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="driverOption"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Driver Option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="self" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Self-drive
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="provided" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              With driver (+Rp 150.000/day)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cash" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <Banknote className="mr-2 h-4 w-4" />
                              Cash
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bank" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <Building2 className="mr-2 h-4 w-4" />
                              Bank Transfer
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="card" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Credit/Debit Card
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="full" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Full Payment ({formatCurrency(calculateTotal())})
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="partial" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Partial Payment (30% Deposit:{" "}
                              {formatCurrency(calculateDeposit())})
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or information we should know"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Booking Summary</h3>

                  {selectedTenant && (
                    <div className="mb-3 p-2 bg-primary/5 rounded border border-primary/20">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">
                          {tenantType === "customer" ? "Customer" : "Driver"}:{" "}
                          {selectedTenant.name}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vehicle:</span>
                      <span className="font-medium">
                        {vehicleToUse.make} {vehicleToUse.model}{" "}
                        {vehicleToUse.year && `(${vehicleToUse.year})`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {calculateTotalDays()} day(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          vehicleToUse.price * calculateTotalDays(),
                        )}
                      </span>
                    </div>
                    {form.watch("driverOption") === "provided" && (
                      <div className="flex justify-between">
                        <span>Driver Fee:</span>
                        <span className="font-medium">
                          {formatCurrency(150000 * calculateTotalDays())}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                    {form.watch("paymentType") === "partial" && (
                      <div className="flex justify-between text-primary font-medium">
                        <span>Deposit Due Now:</span>
                        <span>{formatCurrency(calculateDeposit())}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {step === 2 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              )}

              {step === 1 ? (
                <Button type="button" className="ml-auto" onClick={nextStep}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Complete Booking"}
                  {!isSubmitting && <Check className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
