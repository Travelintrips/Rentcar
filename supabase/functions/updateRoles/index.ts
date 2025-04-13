import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define the roles from the image
    const roles = [
      { id: 1, name: "Admin", role_name: "Admin" },
      { id: 2, name: "Manager", role_name: "Manager" },
      { id: 3, name: "Supervisor", role_name: "Supervisor" },
      { id: 4, name: "Staff Traffic", role_name: "Staff Traffic" },
      { id: 5, name: "HRD", role_name: "HRD" },
      { id: 6, name: "Customer", role_name: "Customer" },
      { id: 7, name: "user", role_name: "user" },
      { id: 11, name: "Driver", role_name: "Driver" },
      { id: 12, name: "Mechanic", role_name: "Mechanic" },
      { id: 13, name: "Finance", role_name: "Finance" },
      { id: 25, name: "Staff", role_name: "Staff" },
      { id: 30, name: "Driver Mitra", role_name: "Driver Mitra" },
      { id: 31, name: "Driver Perusahaan", role_name: "Driver Perusahaan" },
    ];

    // Clear existing roles and insert new ones
    const { error: deleteError } = await supabase
      .from("roles")
      .delete()
      .neq("id", 0); // Delete all roles

    if (deleteError) {
      console.error("Error deleting existing roles:", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Insert new roles
    const { data, error } = await supabase.from("roles").insert(roles).select();

    if (error) {
      console.error("Error inserting roles:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
