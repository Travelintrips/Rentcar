import React from "react";
import StatCard from "@/components/admin/StatCard";
import { Users, Car, CreditCard, Calendar } from "lucide-react";

export default function StatCardStoryboard() {
  return (
    <div className="bg-white p-6 space-y-6">
      <h2 className="text-xl font-bold">Stat Cards</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="1,234"
          icon={<Users className="h-4 w-4" />}
          trend="up"
          trendValue="12% from last month"
        />

        <StatCard
          title="Total Vehicles"
          value="42"
          icon={<Car className="h-4 w-4" />}
          trend="neutral"
          trendValue="Same as last month"
        />

        <StatCard
          title="Total Bookings"
          value="256"
          icon={<Calendar className="h-4 w-4" />}
          trend="up"
          trendValue="8% from last month"
        />

        <StatCard
          title="Total Revenue"
          value="45,678,000"
          icon={<CreditCard className="h-4 w-4" />}
          trend="up"
          trendValue="15% from last month"
          valuePrefix="Rp "
        />
      </div>

      <h2 className="text-xl font-bold mt-8">Stat Card Variants</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Custom Background"
          value="Special"
          icon={<Users className="h-4 w-4" />}
          bgColor="linear-gradient(to right, #4facfe 0%, #00f2fe 100%)"
          iconClassName="from-blue-500 to-cyan-500"
          className="text-white"
        />

        <StatCard
          title="With Link"
          value="Click Me"
          icon={<Car className="h-4 w-4" />}
          to="#"
        />
      </div>
    </div>
  );
}
