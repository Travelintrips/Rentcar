import React from "react";
import AdminMap from "./AdminMap";

export default function AdminMapStoryboard() {
  return (
    <div className="container mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        User Location Tracking Dashboard
      </h1>
      <p className="text-muted-foreground mb-6">
        Track and monitor user locations in real-time
      </p>
      <AdminMap />
    </div>
  );
}
