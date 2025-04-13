import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Car,
  CreditCard,
  Calendar,
  Wrench,
  CheckCircle,
} from "lucide-react";

interface DashboardData {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: any[];
  bookingsByStatus: any[];
  revenueByMonth: any[];
  vehicleUtilization: any[];
  maintenanceCount: number;
  readyCount: number;
  activeBookingsCount?: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface DashboardStatsProps {
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export default function DashboardStats({
  dateRange,
}: DashboardStatsProps = {}) {
  const [data, setData] = useState<DashboardData>({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    recentBookings: [],
    bookingsByStatus: [],
    revenueByMonth: [],
    vehicleUtilization: [],
    maintenanceCount: 0,
    readyCount: 0,
    activeBookingsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    // Set up an interval to refresh data every 60 seconds instead of continuous updates
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [dateRange?.from, dateRange?.to]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Prepare date filters if date range is provided
      let dateFilter = {};
      if (dateRange?.from) {
        dateFilter = { gte: dateRange.from.toISOString() };

        if (dateRange.to) {
          dateFilter = {
            gte: dateRange.from.toISOString(),
            lte: dateRange.to.toISOString(),
          };
        }
      }

      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (userError) throw userError;

      // Fetch total vehicles (excluding maintenance and suspended)
      const { count: vehicleCount, error: vehicleError } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .or(
          "status.neq.Maintenance,status.neq.maintenance,status.neq.Suspended,status.neq.suspended",
        );

      if (vehicleError) throw vehicleError;

      // Fetch bookings that are not completed
      let activeBookingsQuery = supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .or("status.neq.completed,status.neq.Completed");

      // Apply date filter if provided
      if (dateRange?.from) {
        activeBookingsQuery = activeBookingsQuery.filter(
          "created_at",
          dateRange.to ? "between" : "gte",
          dateRange.from.toISOString(),
          dateRange.to ? dateRange.to.toISOString() : undefined,
        );
      }

      const { count: activeBookingsCount, error: activeBookingsError } =
        await activeBookingsQuery;

      if (activeBookingsError) throw activeBookingsError;

      // Fetch total bookings
      let bookingsQuery = supabase.from("bookings");

      // Apply date filter if provided
      if (dateRange?.from) {
        bookingsQuery = bookingsQuery.filter(
          "created_at",
          dateRange.to ? "between" : "gte",
          dateRange.from.toISOString(),
          dateRange.to ? dateRange.to.toISOString() : undefined,
        );
      }

      const { count: bookingCount, error: bookingError } =
        await bookingsQuery.select("*", { count: "exact", head: true });

      if (bookingError) throw bookingError;

      // Fetch total revenue
      let paymentsQuery = supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");

      // Apply date filter if provided
      if (dateRange?.from) {
        paymentsQuery = paymentsQuery.filter(
          "created_at",
          dateRange.to ? "between" : "gte",
          dateRange.from.toISOString(),
          dateRange.to ? dateRange.to.toISOString() : undefined,
        );
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery;

      if (paymentsError) throw paymentsError;

      const totalRevenue =
        paymentsData?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0,
        ) || 0;

      // Fetch bookings by status
      const { data: statusData, error: statusError } = await supabase
        .from("bookings")
        .select("status");

      if (statusError) throw statusError;

      // Process status data for chart
      const statusCounts: Record<string, number> = {};
      statusData?.forEach((booking) => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
      });

      const bookingsByStatus = Object.entries(statusCounts).map(
        ([name, value]) => ({ name, value }),
      );

      // Fetch revenue by month (real data)
      const { data: monthlyRevenueData, error: monthlyRevenueError } =
        await supabase
          .from("payments")
          .select("amount, created_at")
          .eq("status", "completed");

      if (monthlyRevenueError) throw monthlyRevenueError;

      // Process monthly revenue data
      const monthlyRevenue: Record<string, number> = {};
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

      // Initialize all months with zero
      months.forEach((month) => {
        monthlyRevenue[month] = 0;
      });

      // Aggregate revenue by month
      monthlyRevenueData?.forEach((payment) => {
        if (payment.created_at) {
          const date = new Date(payment.created_at);
          const month = months[date.getMonth()];
          monthlyRevenue[month] += payment.amount || 0;
        }
      });

      const revenueByMonth = Object.entries(monthlyRevenue).map(
        ([name, revenue]) => ({ name, revenue }),
      );

      // Fetch vehicle utilization (real data)
      const { data: vehiclesData, error: vehiclesUtilError } = await supabase
        .from("vehicles")
        .select("status");

      if (vehiclesUtilError) throw vehiclesUtilError;

      // Process vehicle utilization data
      const vehicleStatusCounts: Record<string, number> = {
        "In Use": 0,
        Available: 0,
        Maintenance: 0,
        Ready: 0,
      };

      // Count vehicles by status
      vehiclesData?.forEach((vehicle) => {
        if (vehicle.status === "On Ride") {
          vehicleStatusCounts["In Use"] += 1;
        } else if (vehicle.status === "Available") {
          vehicleStatusCounts["Available"] += 1;
        } else if (
          vehicle.status === "Maintenance" ||
          vehicle.status === "maintenance"
        ) {
          vehicleStatusCounts["Maintenance"] += 1;
        } else if (vehicle.status === "Ready" || vehicle.status === "ready") {
          vehicleStatusCounts["Ready"] += 1;
        }
      });

      // Get maintenance count directly from the vehicles table
      const maintenanceCount =
        vehiclesData?.filter(
          (vehicle) =>
            vehicle.status === "Maintenance" ||
            vehicle.status === "maintenance",
        ).length || 0;

      // Get ready count directly from the vehicles table
      const readyCount =
        vehiclesData?.filter(
          (vehicle) => vehicle.status === "Ready" || vehicle.status === "ready",
        ).length || 0;

      const vehicleUtilization = Object.entries(vehicleStatusCounts).map(
        ([name, value]) => ({ name, value }),
      );

      setData({
        totalUsers: userCount || 0,
        totalVehicles: vehicleCount || 0,
        totalBookings: bookingCount || 0,
        totalRevenue,
        recentBookings: [],
        bookingsByStatus,
        revenueByMonth,
        vehicleUtilization,
        maintenanceCount,
        readyCount,
        activeBookingsCount: activeBookingsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching dashboard data",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      currencyDisplay: "narrowSymbol",
    })
      .format(amount)
      .replace("IDR", "Rp ");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Dashboard Overview
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Vehicles in the fleet (excl. maintenance & suspended)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Bookings processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue from all bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">
              Vehicles under maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ready Vehicles
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.readyCount}</div>
            <p className="text-xs text-muted-foreground">
              Vehicles ready for use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="bookings" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
          <TabsTrigger value="bookings">Booking Status</TabsTrigger>
          <TabsTrigger value="revenue">Monthly Revenue</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicle Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status Distribution</CardTitle>
              <CardDescription>
                Overview of bookings by their current status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.bookingsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.bookingsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} bookings`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>
                Revenue trends over the past year
              </CardDescription>
            </CardHeader>
            <CardContent className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.revenueByMonth}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value as number),
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization</CardTitle>
              <CardDescription>
                Current status of vehicles in the fleet
              </CardDescription>
            </CardHeader>
            <CardContent className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.vehicleUtilization}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.vehicleUtilization.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
