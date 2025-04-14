import React, { useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Car,
  CalendarDays,
  DollarSign,
  BarChart3,
  Activity,
  User,
  UserCog,
  CreditCard,
  ClipboardCheck,
  AlertTriangle,
  Menu,
  X,
  ArrowLeft,
  Search,
  FileDown,
  Filter,
  SortAsc,
  SortDesc,
  Wrench,
  CarFront,
  Calendar as CalendarIcon,
  CreditCard as CreditCardIcon,
} from "lucide-react";
import CustomerManagement from "./CustomerManagement";
import DriverManagement from "./DriverManagement";
import CarsManagement from "./CarsManagement";
import Payments from "./Payments";
import BookingManagement from "./BookingManagement";
import StaffPage from "./StaffPage";
import StatCard from "./StatCard";
import DashboardCharts from "./DashboardCharts";
import DashboardStats from "./DashboardStats";
import LocationTracker from "./LocationTracker";

interface DashboardStats {
  totalVehicles: number;
  bookedVehicles: number;
  onRideVehicles: number;
  maintenanceVehicles: number;
  availableVehicles: number;
  activeBookingsCount?: number;
  totalPayments: {
    count: number;
    amount: number;
    monthlyAmount: number;
  };
  totalUnpaid: {
    count: number;
    amount: number;
  };
}

interface ChartData {
  vehicleStatusData: { name: string; value: number }[];
  paymentData: { name: string; paid: number; unpaid: number }[];
  bookingTrendData: { date: string; bookings: number }[];
  paymentMethodData: { name: string; value: number }[];
}

interface BookingData {
  id: string;
  vehicleType: string;
  bookingStatus: "Booked" | "On Ride" | "Completed" | "Cancelled";
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  nominalPaid: number;
  nominalUnpaid: number;
  customer: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface FilterOptions {
  date: string;
  vehicleType: string;
  bookingStatus: string;
  paymentType: string;
}

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalVehicles: 0,
    bookedVehicles: 0,
    onRideVehicles: 0,
    maintenanceVehicles: 0,
    availableVehicles: 0,
    activeBookingsCount: 0,
    totalPayments: {
      count: 0,
      amount: 0,
      monthlyAmount: 0,
    },
    totalUnpaid: {
      count: 0,
      amount: 0,
    },
  });

  const [chartData, setChartData] = useState<ChartData>({
    vehicleStatusData: [],
    paymentData: [],
    bookingTrendData: [],
    paymentMethodData: [],
  });

  const [bookingData, setBookingData] = useState<BookingData[]>([]);
  const [filteredBookingData, setFilteredBookingData] = useState<BookingData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    date: "",
    vehicleType: "",
    bookingStatus: "",
    paymentType: "",
  });

  // Date range filter states
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Active period filter
  const [activePeriod, setActivePeriod] = useState<
    "day" | "week" | "month" | "year" | null
  >(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BookingData | "";
    direction: "asc" | "desc";
  }>({
    key: "",
    direction: "desc",
  });

  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange.from, dateRange.to]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch vehicles data
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*");

      if (vehiclesError) throw vehiclesError;

      console.log("Vehicles data:", vehicles); // Debug log to check vehicles data

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*");

      if (bookingsError) throw bookingsError;

      // Count active bookings (not completed)
      const activeBookingsCount =
        bookings?.filter(
          (booking) => booking.status.toLowerCase() !== "completed",
        ).length || 0;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*");

      if (paymentsError) throw paymentsError;

      // Get current month payments
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).toISOString();

      const { data: monthlyPayments, error: monthlyPaymentsError } =
        await supabase
          .from("payments")
          .select("*")
          .gte("created_at", startOfMonth)
          .lte("created_at", endOfMonth);

      if (monthlyPaymentsError) throw monthlyPaymentsError;

      // Calculate dashboard statistics from real data
      const totalVehicles = vehicles?.length || 0;

      // Get all vehicles that don't have 'available' status
      const bookedVehicles =
        vehicles?.filter(
          (vehicle) =>
            vehicle.status !== "available" && vehicle.status !== "Available",
        ).length || 0;

      const onRideVehicles =
        bookings?.filter((booking) => booking.status.toLowerCase() === "onride")
          .length || 0;

      const maintenanceVehicles =
        vehicles?.filter((vehicle) => vehicle.status === "Maintenance")
          .length || 0;

      // Only count vehicles where is_available is true
      const availableVehiclesCount =
        vehicles?.filter(
          (vehicle) =>
            vehicle.is_available === true || vehicle.is_available === "true",
        ).length || 0;

      console.log("Available vehicles count:", availableVehiclesCount);
      console.log(
        "Vehicles with status=true:",
        vehicles?.filter((vehicle) => vehicle.status === true).length || 0,
      );
      console.log(
        "Vehicles with is_available=true:",
        vehicles?.filter((vehicle) => vehicle.is_available === true).length ||
          0,
      );
      console.log(
        "Vehicles with available=true:",
        vehicles?.filter((vehicle) => vehicle.available === true).length || 0,
      );

      const paidPayments =
        payments?.filter(
          (payment) =>
            payment.status === "Paid" || payment.status === "Completed",
        ) || [];

      const unpaidPayments =
        payments?.filter(
          (payment) =>
            payment.status === "Unpaid" || payment.status === "Partial",
        ) || [];

      const totalPaidAmount = paidPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );

      const totalUnpaidAmount = unpaidPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );

      // Calculate monthly payments total
      const monthlyPaidPayments =
        monthlyPayments?.filter(
          (payment) =>
            payment.status === "Paid" || payment.status === "Completed",
        ) || [];

      const monthlyTotalAmount = monthlyPaidPayments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );

      // Prepare chart data
      // 1. Vehicle Status Pie Chart
      const vehicleStatusData = [
        { name: "Booked", value: bookedVehicles },
        { name: "On Ride", value: onRideVehicles },
        { name: "Available", value: availableVehiclesCount },
        { name: "Maintenance", value: maintenanceVehicles },
      ];

      // 2. Payment Data for Bar Chart
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const paymentData = [];

      // Group payments by month
      const paidByMonth = {};
      const unpaidByMonth = {};

      // Initialize all months with zero
      months.forEach((month) => {
        paidByMonth[month] = 0;
        unpaidByMonth[month] = 0;
      });

      // Aggregate paid payments by month
      paidPayments.forEach((payment) => {
        if (payment.created_at) {
          const date = new Date(payment.created_at);
          const month = months[date.getMonth()];
          paidByMonth[month] += payment.amount || 0;
        }
      });

      // Aggregate unpaid payments by month
      unpaidPayments.forEach((payment) => {
        if (payment.created_at) {
          const date = new Date(payment.created_at);
          const month = months[date.getMonth()];
          unpaidByMonth[month] += payment.amount || 0;
        }
      });

      // Create payment data array for chart
      months.forEach((month) => {
        paymentData.push({
          name: month,
          paid: paidByMonth[month],
          unpaid: unpaidByMonth[month],
        });
      });

      // 3. Booking Trend Line Chart
      const bookingsByDate = {};
      const last30Days = [];

      // Generate last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        bookingsByDate[dateStr] = 0;
        last30Days.push(dateStr);
      }

      // Count bookings by date
      bookings?.forEach((booking) => {
        if (booking.created_at) {
          const dateStr = new Date(booking.created_at)
            .toISOString()
            .split("T")[0];
          if (bookingsByDate[dateStr] !== undefined) {
            bookingsByDate[dateStr] += 1;
          }
        }
      });

      const bookingTrendData = last30Days.map((date) => ({
        date: date,
        bookings: bookingsByDate[date],
      }));

      // 4. Payment Method Doughnut Chart
      const paymentMethodCounts = {
        Cash: 0,
        "Bank Transfer": 0,
        "Credit Card": 0,
        "Debit Card": 0,
        Other: 0,
      };

      payments?.forEach((payment) => {
        const method = payment.payment_method || "Other";
        if (paymentMethodCounts[method] !== undefined) {
          paymentMethodCounts[method] += 1;
        } else {
          paymentMethodCounts["Other"] += 1;
        }
      });

      const paymentMethodData = Object.entries(paymentMethodCounts).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );

      // Set dashboard stats with real data
      setDashboardStats({
        totalVehicles,
        bookedVehicles,
        onRideVehicles,
        maintenanceVehicles,
        availableVehicles: availableVehiclesCount,
        activeBookingsCount,
        totalPayments: {
          count: paidPayments.length,
          amount: totalPaidAmount,
          monthlyAmount: monthlyTotalAmount,
        },
        totalUnpaid: {
          count: unpaidPayments.length,
          amount: totalUnpaidAmount,
        },
      });

      // Set chart data
      setChartData({
        vehicleStatusData,
        paymentData,
        bookingTrendData,
        paymentMethodData,
      });

      // Transform bookings data for the table
      const bookingTableData: BookingData[] =
        bookings?.map((booking) => ({
          id: booking.id,
          vehicleType: booking.vehicle_type || "",
          bookingStatus: (booking.status as any) || "Booked",
          paymentStatus: (booking.payment_status as any) || "Unpaid",
          nominalPaid: booking.amount_paid || 0,
          nominalUnpaid: booking.amount_due - (booking.amount_paid || 0),
          customer: booking.customer_name || "",
          startDate: booking.start_date || "",
          endDate: booking.end_date || "",
          createdAt: booking.created_at || "",
        })) || [];

      setBookingData(bookingTableData);
      setFilteredBookingData(bookingTableData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);

      // Initialize with empty data if there's an error
      setDashboardStats({
        totalVehicles: 0,
        bookedVehicles: 0,
        onRideVehicles: 0,
        maintenanceVehicles: 0,
        availableVehicles: 0,
        totalPayments: {
          count: 0,
          amount: 0,
          monthlyAmount: 0,
        },
        totalUnpaid: {
          count: 0,
          amount: 0,
        },
      });

      setBookingData([]);
      setFilteredBookingData([]);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Apply search and filters to booking data
  useEffect(() => {
    let filtered = [...bookingData];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customer.toLowerCase().includes(query) ||
          booking.id.toLowerCase().includes(query),
      );
    }

    // Apply date filter
    if (filterOptions.date) {
      filtered = filtered.filter((booking) => {
        return (
          booking.startDate.includes(filterOptions.date) ||
          booking.endDate.includes(filterOptions.date) ||
          booking.createdAt.includes(filterOptions.date)
        );
      });
    }

    // Apply vehicle type filter
    if (filterOptions.vehicleType) {
      filtered = filtered.filter(
        (booking) => booking.vehicleType === filterOptions.vehicleType,
      );
    }

    // Apply booking status filter
    if (filterOptions.bookingStatus) {
      filtered = filtered.filter(
        (booking) => booking.bookingStatus === filterOptions.bookingStatus,
      );
    }

    // Apply payment status filter
    if (filterOptions.paymentType) {
      filtered = filtered.filter(
        (booking) => booking.paymentStatus === filterOptions.paymentType,
      );
    }

    setFilteredBookingData(filtered);
  }, [searchQuery, filterOptions, bookingData]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-primary-tosca to-primary-dark backdrop-blur-sm border-r border-white/10 transition-all duration-300 h-screen overflow-y-auto fixed left-0 top-0 z-10 shadow-lg`}
      >
        <div className="p-5 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-primary-dark to-primary-tosca">
          <div
            className={`flex items-center ${!sidebarOpen ? "justify-center w-full" : ""}`}
          >
            <Car className="h-6 w-6 text-white" />
            {sidebarOpen && (
              <span className="ml-2 font-bold text-lg tracking-tight text-white">
                Admin Panel
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={!sidebarOpen ? "hidden" : ""}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4 text-white" />
            ) : (
              <Menu className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>

        {/* Sidebar Menu */}
        <div className="p-4 mt-2">
          <nav className="space-y-2">
            <Link
              to=""
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname === "/admin" || location.pathname === "/admin/" ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <BarChart3 className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Dashboard</span>}
            </Link>
            <Link
              to="customers"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/customers") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <User className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Customers</span>}
            </Link>
            <Link
              to="drivers"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/drivers") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <UserCog className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Drivers</span>}
            </Link>
            <Link
              to="bookings"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/bookings") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <CalendarDays className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Bookings</span>}
            </Link>
            <Link
              to="cars"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/cars") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <Car className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Cars</span>}
            </Link>
            <Link
              to="staff"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/staff") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <Users className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Staff Admin</span>}
            </Link>
            <Link
              to="payments"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/payments") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <CreditCard className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Payments</span>}
            </Link>
            <Link
              to="inspections"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/inspections") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <ClipboardCheck className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Inspection</span>}
            </Link>
            <Link
              to="damages"
              className={`flex items-center p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 ${location.pathname.includes("/admin/damages") ? "bg-white/20 font-medium text-white" : "text-white/80"} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <AlertTriangle className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Damage</span>}
            </Link>
          </nav>

          {/* Sign Out Button */}
          <div className="mt-8 border-t border-white/20 pt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 text-white"
            >
              <X className="h-5 w-5 text-white" />
              {sidebarOpen && <span className="ml-3">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}
      >
        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-gray-800 h-32 animate-pulse border-0 shadow-lg overflow-hidden"
                  style={{
                    borderRadius: "16px",
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Date Range Filter */}
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-10"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP")} -{" "}
                              {format(dateRange.to, "PPP")}
                            </>
                          ) : (
                            format(dateRange.from, "PPP")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={setDateRange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={activePeriod === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setDateRange({
                        from: startOfDay(today),
                        to: endOfDay(today),
                      });
                      setActivePeriod("day");
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant={activePeriod === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setDateRange({
                        from: startOfWeek(today, { weekStartsOn: 1 }),
                        to: endOfWeek(today, { weekStartsOn: 1 }),
                      });
                      setActivePeriod("week");
                    }}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={activePeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setDateRange({
                        from: startOfMonth(today),
                        to: endOfMonth(today),
                      });
                      setActivePeriod("month");
                    }}
                  >
                    This Month
                  </Button>
                  <Button
                    variant={activePeriod === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setDateRange({
                        from: startOfYear(today),
                        to: endOfYear(today),
                      });
                      setActivePeriod("year");
                    }}
                  >
                    This Year
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setActivePeriod(null);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Dashboard Stats Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  Dashboard Overview
                </h2>
                <DashboardStats
                  totalVehicles={dashboardStats.totalVehicles}
                  bookedVehicles={dashboardStats.bookedVehicles}
                  onRideVehicles={dashboardStats.onRideVehicles}
                  maintenanceVehicles={dashboardStats.maintenanceVehicles}
                  availableVehicles={dashboardStats.availableVehicles}
                  activeBookingsCount={dashboardStats.activeBookingsCount || 0}
                  totalPayments={dashboardStats.totalPayments}
                  totalUnpaid={dashboardStats.totalUnpaid}
                  isLoading={loading}
                />
              </div>

              {/* Charts Section */}
              <DashboardCharts
                vehicleStatusData={chartData.vehicleStatusData}
                paymentData={chartData.paymentData}
                bookingTrendData={chartData.bookingTrendData}
                paymentMethodData={chartData.paymentMethodData}
                isLoading={loading}
              />

              {/* Location Tracker Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  User Location Tracking
                </h2>
                <LocationTracker />
              </div>

              {/* Detailed Data Table Section */}
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Booking Data</CardTitle>
                    <CardDescription>
                      Comprehensive view of all bookings with filtering and
                      sorting options
                    </CardDescription>

                    {/* Filtering Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Date Filter
                        </label>
                        <Input
                          type="date"
                          value={filterOptions.date}
                          onChange={(e) =>
                            setFilterOptions({
                              ...filterOptions,
                              date: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Vehicle Type
                        </label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={filterOptions.vehicleType}
                          onChange={(e) =>
                            setFilterOptions({
                              ...filterOptions,
                              vehicleType: e.target.value,
                            })
                          }
                        >
                          <option value="">All Types</option>
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="MPV">MPV</option>
                          <option value="Hatchback">Hatchback</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Booking Status
                        </label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={filterOptions.bookingStatus}
                          onChange={(e) =>
                            setFilterOptions({
                              ...filterOptions,
                              bookingStatus: e.target.value,
                            })
                          }
                        >
                          <option value="">All Statuses</option>
                          <option value="Booked">Booked</option>
                          <option value="On Ride">On Ride</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Payment Status
                        </label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={filterOptions.paymentType}
                          onChange={(e) =>
                            setFilterOptions({
                              ...filterOptions,
                              paymentType: e.target.value,
                            })
                          }
                        >
                          <option value="">All Statuses</option>
                          <option value="Paid">Paid</option>
                          <option value="Partial">Partial</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>
                      </div>
                    </div>

                    {/* Search and Reset Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by customer name..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterOptions({
                            date: "",
                            vehicleType: "",
                            bookingStatus: "",
                            paymentType: "",
                          });
                          setSearchQuery("");
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="rounded-md border">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50 font-medium">
                              <th className="py-3 px-4 text-left">
                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    if (sortConfig.key === "vehicleType") {
                                      setSortConfig({
                                        key: "vehicleType",
                                        direction:
                                          sortConfig.direction === "asc"
                                            ? "desc"
                                            : "asc",
                                      });
                                    } else {
                                      setSortConfig({
                                        key: "vehicleType",
                                        direction: "asc",
                                      });
                                    }
                                  }}
                                >
                                  Vehicle Type
                                  {sortConfig.key === "vehicleType" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="h-4 w-4" />
                                    ) : (
                                      <SortDesc className="h-4 w-4" />
                                    ))}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-left">
                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    if (sortConfig.key === "bookingStatus") {
                                      setSortConfig({
                                        key: "bookingStatus",
                                        direction:
                                          sortConfig.direction === "asc"
                                            ? "desc"
                                            : "asc",
                                      });
                                    } else {
                                      setSortConfig({
                                        key: "bookingStatus",
                                        direction: "asc",
                                      });
                                    }
                                  }}
                                >
                                  Booking Status
                                  {sortConfig.key === "bookingStatus" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="h-4 w-4" />
                                    ) : (
                                      <SortDesc className="h-4 w-4" />
                                    ))}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-left">
                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    if (sortConfig.key === "paymentStatus") {
                                      setSortConfig({
                                        key: "paymentStatus",
                                        direction:
                                          sortConfig.direction === "asc"
                                            ? "desc"
                                            : "asc",
                                      });
                                    } else {
                                      setSortConfig({
                                        key: "paymentStatus",
                                        direction: "asc",
                                      });
                                    }
                                  }}
                                >
                                  Payment Status
                                  {sortConfig.key === "paymentStatus" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="h-4 w-4" />
                                    ) : (
                                      <SortDesc className="h-4 w-4" />
                                    ))}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-left">
                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    if (sortConfig.key === "nominalPaid") {
                                      setSortConfig({
                                        key: "nominalPaid",
                                        direction:
                                          sortConfig.direction === "asc"
                                            ? "desc"
                                            : "asc",
                                      });
                                    } else {
                                      setSortConfig({
                                        key: "nominalPaid",
                                        direction: "asc",
                                      });
                                    }
                                  }}
                                >
                                  Nominal Paid
                                  {sortConfig.key === "nominalPaid" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="h-4 w-4" />
                                    ) : (
                                      <SortDesc className="h-4 w-4" />
                                    ))}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-left">
                                <div
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    if (sortConfig.key === "nominalUnpaid") {
                                      setSortConfig({
                                        key: "nominalUnpaid",
                                        direction:
                                          sortConfig.direction === "asc"
                                            ? "desc"
                                            : "asc",
                                      });
                                    } else {
                                      setSortConfig({
                                        key: "nominalUnpaid",
                                        direction: "asc",
                                      });
                                    }
                                  }}
                                >
                                  Nominal Unpaid
                                  {sortConfig.key === "nominalUnpaid" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="h-4 w-4" />
                                    ) : (
                                      <SortDesc className="h-4 w-4" />
                                    ))}
                                </div>
                              </th>
                              <th className="py-3 px-4 text-left">Customer</th>
                              <th className="py-3 px-4 text-left">Dates</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBookingData.length > 0 ? (
                              // Sort the data based on the sort configuration
                              [...filteredBookingData]
                                .sort((a, b) => {
                                  if (!sortConfig.key) return 0;

                                  const aValue = a[sortConfig.key];
                                  const bValue = b[sortConfig.key];

                                  if (aValue < bValue) {
                                    return sortConfig.direction === "asc"
                                      ? -1
                                      : 1;
                                  }
                                  if (aValue > bValue) {
                                    return sortConfig.direction === "asc"
                                      ? 1
                                      : -1;
                                  }
                                  return 0;
                                })
                                .map((booking) => (
                                  <tr
                                    key={booking.id}
                                    className="border-b hover:bg-muted/50 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      {booking.vehicleType}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                          booking.bookingStatus === "Completed"
                                            ? "bg-green-100 text-green-800"
                                            : booking.bookingStatus ===
                                                "On Ride"
                                              ? "bg-blue-100 text-blue-800"
                                              : booking.bookingStatus ===
                                                  "Booked"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {booking.bookingStatus}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                          booking.paymentStatus === "Paid"
                                            ? "bg-green-100 text-green-800"
                                            : booking.paymentStatus ===
                                                "Partial"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {booking.paymentStatus}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        minimumFractionDigits: 0,
                                      }).format(booking.nominalPaid)}
                                    </td>
                                    <td className="py-3 px-4">
                                      {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        minimumFractionDigits: 0,
                                      }).format(booking.nominalUnpaid)}
                                    </td>
                                    <td className="py-3 px-4">
                                      {booking.customer}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="text-xs">
                                        <div>
                                          Start:{" "}
                                          {new Date(
                                            booking.startDate,
                                          ).toLocaleDateString()}
                                        </div>
                                        <div>
                                          End:{" "}
                                          {new Date(
                                            booking.endDate,
                                          ).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="py-6 text-center text-muted-foreground"
                                >
                                  No bookings found matching the current
                                  filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
