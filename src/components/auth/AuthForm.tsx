import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Camera,
  Calendar,
  Car,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SelfieCapture from "./SelfieCapture";
import ImageUpload from "./ImageUpload";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" }),
  role: z.string().min(1, { message: "Please select a role" }),
  selfieImage: z.string().optional(),
  // Driver Mitra fields (only required when role is "Driver Mitra")
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  ktpAddress: z.string().optional(),
  relativePhone: z.string().optional(),
  ktpNumber: z.string().optional(),
  simNumber: z.string().optional(),
  simExpiry: z.string().optional(),
  simImage: z.string().optional(),
  kkImage: z.string().optional(),
  ktpImage: z.string().optional(),
  skckImage: z.string().optional(),
  // Vehicle fields
  vehicleName: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleBrand: z.string().optional(),
  licensePlate: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleStatus: z.string().optional(),
  vehicleFrontImage: z.string().optional(),
  vehicleBackImage: z.string().optional(),
  vehicleSideImage: z.string().optional(),
  vehicleInteriorImage: z.string().optional(),
  stnkImage: z.string().optional(),
  bpkbImage: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Create a conditional schema that makes fields required based on role
const conditionalRegisterSchema = registerSchema.refine(
  (data) => {
    if (data.role === "Driver Mitra") {
      return (
        !!data.firstName &&
        !!data.lastName &&
        !!data.nickname &&
        !!data.ktpAddress &&
        !!data.relativePhone &&
        !!data.ktpNumber &&
        !!data.simNumber &&
        !!data.simExpiry &&
        !!data.selfieImage &&
        !!data.simImage &&
        !!data.kkImage &&
        !!data.ktpImage &&
        !!data.skckImage &&
        !!data.vehicleName &&
        !!data.vehicleType &&
        !!data.vehicleBrand &&
        !!data.licensePlate &&
        !!data.vehicleYear &&
        !!data.vehicleColor &&
        !!data.vehicleStatus &&
        !!data.vehicleFrontImage &&
        !!data.vehicleBackImage &&
        !!data.vehicleSideImage &&
        !!data.vehicleInteriorImage &&
        !!data.stnkImage &&
        !!data.bpkbImage
      );
    } else if (data.role === "Driver Perusahaan") {
      return (
        !!data.firstName &&
        !!data.lastName &&
        !!data.nickname &&
        !!data.ktpAddress &&
        !!data.relativePhone &&
        !!data.ktpNumber &&
        !!data.simNumber &&
        !!data.simExpiry &&
        !!data.selfieImage &&
        !!data.simImage &&
        !!data.kkImage &&
        !!data.ktpImage &&
        !!data.skckImage
      );
    } else if (data.role === "Staff" || data.role === "Staff Traffic") {
      return (
        !!data.firstName &&
        !!data.lastName &&
        !!data.nickname &&
        !!data.ktpAddress &&
        !!data.relativePhone &&
        !!data.ktpNumber &&
        !!data.simNumber &&
        !!data.selfieImage &&
        !!data.kkImage &&
        !!data.ktpImage &&
        !!data.skckImage
      );
    }
    return true;
  },
  {
    message: "All fields are required for this role",
    path: ["role"],
  },
);

interface AuthFormProps {
  onLogin?: (data: LoginFormValues) => void;
  onRegister?: (data: RegisterFormValues) => void;
  isLoading?: boolean;
  onAuthStateChange?: (state: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  onLogin = () => {},
  onRegister = () => {},
  isLoading = false,
  onAuthStateChange,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<
    { id: number; role_name: string }[]
  >([]);

  // Fetch roles from Supabase when component mounts
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("roles")
          .select("id, role_name")
          .order("id");

        if (error) {
          console.error("Error fetching roles:", error);
          return;
        }

        if (data) {
          setAvailableRoles(data);
        }
      } catch (error) {
        console.error("Exception fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(conditionalRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "", // Empty by default, will be populated from database
      selfieImage: "",
      // Driver Mitra fields
      firstName: "",
      lastName: "",
      nickname: "",
      ktpAddress: "",
      relativePhone: "",
      ktpNumber: "",
      simNumber: "",
      simExpiry: "",
      simImage: "",
      kkImage: "",
      ktpImage: "",
      skckImage: "",
      // Vehicle fields
      vehicleName: "",
      vehicleType: "",
      vehicleBrand: "",
      licensePlate: "",
      vehicleYear: "",
      vehicleColor: "",
      vehicleStatus: "Tersedia",
      vehicleFrontImage: "",
      vehicleBackImage: "",
      vehicleSideImage: "",
      vehicleInteriorImage: "",
      stnkImage: "",
      bpkbImage: "",
    },
  });

  // Set default role when roles are loaded
  useEffect(() => {
    if (availableRoles.length > 0) {
      // Find the Customer role or use the first role as default
      const customerRole = availableRoles.find(
        (role) => role.role_name === "Customer",
      );
      if (customerRole) {
        registerForm.setValue("role", customerRole.role_name);
      } else if (availableRoles[0]) {
        registerForm.setValue("role", availableRoles[0].role_name);
      }
    }
  }, [availableRoles, registerForm]);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [selfieRequired, setSelfieRequired] = useState(true);

  const handleLoginSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      // Get role from user metadata instead of querying the database
      const userRole = authData.user.user_metadata.role || "User";

      // Check if the user is a driver and if they are suspended
      if (userRole === "Driver") {
        const { data: driverData, error: driverError } = await supabase
          .from("drivers")
          .select("status")
          .eq("id", authData.user.id)
          .single();

        if (driverError) {
          console.error("Error fetching driver status:", driverError);
        } else if (driverData && driverData.status === "suspended") {
          // If the driver is suspended, prevent login
          setLoginError(
            "Your account has been suspended. Please contact an administrator.",
          );
          // Sign out the user since they were automatically signed in
          await supabase.auth.signOut();
          return;
        }
      }

      // Store user role in local storage
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userId", authData.user.id);

      console.log("User logged in with role:", userRole);

      onLogin(data);
      // Update authentication state after successful login
      if (onAuthStateChange) {
        onAuthStateChange(true);
      }
    } catch (error) {
      setLoginError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleRegisterSubmit = async (data: RegisterFormValues) => {
    setRegisterError(null);
    setIsSubmitting(true);

    // Check if selfie is required and not provided
    if (selfieRequired && !selfieImage) {
      setRegisterError("Silakan ambil foto selfie terlebih dahulu");
      setIsSubmitting(false);
      return;
    }

    // Add selfie image to form data
    data.selfieImage = selfieImage;

    try {
      // Register the user with Supabase directly
      const userData = {
        full_name: data.name,
        role: data.role,
        phone_number: data.phone,
        has_selfie: !!data.selfieImage,
      };

      // Use direct signup instead of edge function
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            data: userData,
          },
        },
      );

      if (signUpError) {
        console.error("Signup error details:", signUpError);
        setRegisterError(signUpError.message || "Error during signup process");
        setIsSubmitting(false);
        return;
      }

      if (!authData?.user) {
        console.error("No user data returned from signup");
        setRegisterError("Error creating user account");
        setIsSubmitting(false);
        return;
      }

      // Upload selfie image to storage if available
      let selfieUrl = "";
      if (data.selfieImage) {
        try {
          // Use a unique filename with timestamp to avoid conflicts
          const timestamp = new Date().getTime();
          const selfieFileName = `selfie_${authData.user.id}_${timestamp}.jpg`;
          const selfieFile = await fetch(data.selfieImage).then((res) =>
            res.blob(),
          );

          // Try uploading with minimal options
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("selfies")
              .upload(selfieFileName, selfieFile);

          if (uploadError) {
            console.error("Error uploading selfie:", uploadError);
          } else if (uploadData) {
            const { data: urlData } = supabase.storage
              .from("selfies")
              .getPublicUrl(selfieFileName);

            selfieUrl = urlData.publicUrl;
          }
        } catch (error) {
          console.error("Error in selfie upload process:", error);
        }
      }

      // Get role ID from the selected role name
      let roleId = null;
      try {
        // Find the role ID from the availableRoles state
        const selectedRole = availableRoles.find(
          (role) => role.role_name === data.role,
        );
        if (selectedRole) {
          roleId = selectedRole.id;
        } else {
          // Fallback to database query if not found in state
          const { data: roleData, error: roleError } = await supabase
            .from("roles")
            .select("id")
            .ilike("role_name", data.role);

          if (roleError) {
            console.error("Error fetching role ID:", roleError);
          } else if (roleData && roleData.length > 0) {
            roleId = roleData[0].id;
          } else {
            console.warn(`No role found with name: ${data.role}`);
          }
        }
      } catch (roleError) {
        console.error("Exception fetching role ID:", roleError);
      }

      // Create user record in public.users table
      try {
        const { error: insertError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.name,
          role_id: roleId,
          selfie_url: selfieUrl,
          phone: data.phone,
        });

        if (insertError) {
          console.error("Error creating user record:", insertError);
          // Continue with the registration process even if this insert fails
        }
      } catch (insertError) {
        console.error("Exception creating user record:", insertError);
        // Continue with the registration process even if this insert fails
      }

      // If the role is Customer, also create a record in the customers table
      if (data.role === "Customer") {
        // Check if customer record already exists
        const { data: existingCustomer, error: checkCustomerError } =
          await supabase
            .from("customers")
            .select("id")
            .eq("id", authData.user.id)
            .single();

        if (
          checkCustomerError &&
          !checkCustomerError.message.includes("No rows found")
        ) {
          console.error(
            "Error checking existing customer:",
            checkCustomerError,
          );
        }

        if (existingCustomer) {
          // Customer exists, update the record
          const { error: updateCustomerError } = await supabase
            .from("customers")
            .update({
              name: data.name,
              email: data.email,
              phone: data.phone,
              selfie_url: selfieUrl,
            })
            .eq("id", authData.user.id);

          if (updateCustomerError) {
            console.error(
              "Error updating customer record:",
              updateCustomerError,
            );
          }
        } else {
          // Customer doesn't exist, insert new record
          const { error: customerError } = await supabase
            .from("customers")
            .insert({
              id: authData.user.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              selfie_url: selfieUrl,
            });

          if (customerError) {
            console.error("Error creating customer record:", customerError);
          }
        }
      } else if (data.role === "Staff" || data.role === "Staff Traffic") {
        // Process staff-specific data
        let kkImageUrl = "";
        let ktpImageUrl = "";
        let skckImageUrl = "";

        // Upload KK image if available
        if (data.kkImage) {
          try {
            const timestamp = new Date().getTime();
            const kkFileName = `kk_${authData.user.id}_${timestamp}.jpg`;
            const kkFile = await fetch(data.kkImage).then((res) => res.blob());

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("staff")
                .upload(`kk/${kkFileName}`, kkFile);

            if (uploadError) {
              console.error("Error uploading KK image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("staff")
                .getPublicUrl(`kk/${kkFileName}`);

              kkImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in KK image upload process:", error);
          }
        }

        // Upload KTP image if available
        if (data.ktpImage) {
          try {
            const timestamp = new Date().getTime();
            const ktpFileName = `ktp_${authData.user.id}_${timestamp}.jpg`;
            const ktpFile = await fetch(data.ktpImage).then((res) =>
              res.blob(),
            );

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("staff")
                .upload(`ktp/${ktpFileName}`, ktpFile);

            if (uploadError) {
              console.error("Error uploading KTP image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("staff")
                .getPublicUrl(`ktp/${ktpFileName}`);

              ktpImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in KTP image upload process:", error);
          }
        }

        // Upload SKCK image if available
        if (data.skckImage) {
          try {
            const timestamp = new Date().getTime();
            const skckFileName = `skck_${authData.user.id}_${timestamp}.jpg`;
            const skckFile = await fetch(data.skckImage).then((res) =>
              res.blob(),
            );

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("staff")
                .upload(`skck/${skckFileName}`, skckFile);

            if (uploadError) {
              console.error("Error uploading SKCK image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("staff")
                .getPublicUrl(`skck/${skckFileName}`);

              skckImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in SKCK image upload process:", error);
          }
        }

        // Create or update staff record
        const staffData = {
          id: authData.user.id,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          nickname: data.nickname,
          ktp_address: data.ktpAddress,
          relative_phone: data.relativePhone,
          ktp_number: data.ktpNumber,
          sim_number: data.simNumber,
          selfie_url: selfieUrl,
          kk_url: kkImageUrl,
          ktp_url: ktpImageUrl,
          skck_url: skckImageUrl,
        };

        const { error: staffError } = await supabase
          .from("staff")
          .upsert(staffData);

        if (staffError) {
          console.error("Error creating/updating staff record:", staffError);
          setRegisterError(
            "Error creating staff record: " + staffError.message,
          );
        } else {
          toast({
            title: "Registrasi Berhasil",
            description: "Akun staff berhasil dibuat",
            variant: "default",
          });

          // Reset form after successful submission
          registerForm.reset();
          setSelfieImage("");
          setBlinkDetected(false);
        }
      } else if (
        data.role === "Driver" ||
        data.role === "Driver Mitra" ||
        data.role === "Driver Perusahaan"
      ) {
        // Process driver-specific data
        let simImageUrl = "";
        let kkImageUrl = "";
        let ktpImageUrl = "";
        let skckImageUrl = "";

        // Upload SIM image if available
        if (data.simImage) {
          try {
            const timestamp = new Date().getTime();
            const simFileName = `sim_${authData.user.id}_${timestamp}.jpg`;
            const simFile = await fetch(data.simImage).then((res) =>
              res.blob(),
            );

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("drivers")
                .upload(`sim/${simFileName}`, simFile);

            if (uploadError) {
              console.error("Error uploading SIM image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("drivers")
                .getPublicUrl(`sim/${simFileName}`);

              simImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in SIM image upload process:", error);
          }
        }

        // Upload KK image if available
        if (data.kkImage) {
          try {
            const timestamp = new Date().getTime();
            const kkFileName = `kk_${authData.user.id}_${timestamp}.jpg`;
            const kkFile = await fetch(data.kkImage).then((res) => res.blob());

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("drivers")
                .upload(`kk/${kkFileName}`, kkFile);

            if (uploadError) {
              console.error("Error uploading KK image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("drivers")
                .getPublicUrl(`kk/${kkFileName}`);

              kkImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in KK image upload process:", error);
          }
        }

        // Upload KTP image if available
        if (data.ktpImage) {
          try {
            const timestamp = new Date().getTime();
            const ktpFileName = `ktp_${authData.user.id}_${timestamp}.jpg`;
            const ktpFile = await fetch(data.ktpImage).then((res) =>
              res.blob(),
            );

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("drivers")
                .upload(`ktp/${ktpFileName}`, ktpFile);

            if (uploadError) {
              console.error("Error uploading KTP image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("drivers")
                .getPublicUrl(`ktp/${ktpFileName}`);

              ktpImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in KTP image upload process:", error);
          }
        }

        // Upload SKCK image if available
        if (data.skckImage) {
          try {
            const timestamp = new Date().getTime();
            const skckFileName = `skck_${authData.user.id}_${timestamp}.jpg`;
            const skckFile = await fetch(data.skckImage).then((res) =>
              res.blob(),
            );

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("drivers")
                .upload(`skck/${skckFileName}`, skckFile);

            if (uploadError) {
              console.error("Error uploading SKCK image:", uploadError);
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("drivers")
                .getPublicUrl(`skck/${skckFileName}`);

              skckImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error("Error in SKCK image upload process:", error);
          }
        }

        // Create or update driver record
        const driverData = {
          id: authData.user.id,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          selfie_url: selfieUrl,
          sim_url: simImageUrl,
          kk_url: kkImageUrl,
          license_number: data.simNumber,
          license_expiry: data.simExpiry,
          status: "active",
          role: data.role,
        };

        const { error: driverError } = await supabase
          .from("drivers")
          .upsert(driverData);

        if (driverError) {
          console.error("Error creating/updating driver record:", driverError);
          setRegisterError(
            "Error creating driver record: " + driverError.message,
          );
        } else {
          toast({
            title: "Registrasi Berhasil",
            description: "Akun driver berhasil dibuat",
            variant: "default",
          });

          // Reset form after successful submission
          registerForm.reset();
          setSelfieImage("");
          setBlinkDetected(false);
        }
      }

      // Store user role in local storage regardless of insert/update result
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", authData.user.id);

      // Log success message
      console.log(
        `User registered successfully with role: ${data.role} (ID: ${roleId})`,
      );

      onRegister(data);
      // Update authentication state after successful registration
      if (onAuthStateChange) {
        onAuthStateChange(true);
      }
    } catch (error) {
      setRegisterError("An unexpected error occurred");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Car Rental System
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "login" | "register")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="email@example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="******"
                            className="pl-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1"
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginError && (
                  <div className="text-sm text-destructive mb-2">
                    {loginError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register">
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="John Doe"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="email@example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="******"
                            className="pl-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1"
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="+1234567890"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset form values when role changes
                          if (
                            value !== "Driver Mitra" &&
                            value !== "Driver Perusahaan"
                          ) {
                            registerForm.setValue("firstName", "");
                            registerForm.setValue("lastName", "");
                            registerForm.setValue("nickname", "");
                            registerForm.setValue("ktpAddress", "");
                            registerForm.setValue("relativePhone", "");
                            registerForm.setValue("ktpNumber", "");
                            registerForm.setValue("simNumber", "");
                            registerForm.setValue("simExpiry", "");
                            registerForm.setValue("simImage", "");
                            registerForm.setValue("kkImage", "");
                            registerForm.setValue("ktpImage", "");
                            registerForm.setValue("skckImage", "");
                            registerForm.setValue("vehicleName", "");
                            registerForm.setValue("vehicleType", "");
                            registerForm.setValue("vehicleBrand", "");
                            registerForm.setValue("licensePlate", "");
                            registerForm.setValue("vehicleYear", "");
                            registerForm.setValue("vehicleColor", "");
                            registerForm.setValue("vehicleStatus", "Tersedia");
                            registerForm.setValue("vehicleFrontImage", "");
                            registerForm.setValue("vehicleBackImage", "");
                            registerForm.setValue("vehicleSideImage", "");
                            registerForm.setValue("vehicleInteriorImage", "");
                            registerForm.setValue("stnkImage", "");
                            registerForm.setValue("bpkbImage", "");
                          }
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.length > 0 ? (
                            availableRoles.map((role) => (
                              <SelectItem key={role.id} value={role.role_name}>
                                {role.role_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="Customer">Customer</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selfie Capture Component */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Selfie Verification</FormLabel>
                  </div>
                  <SelfieCapture
                    onCapture={(image) => {
                      setSelfieImage(image);
                      registerForm.setValue("selfieImage", image);
                    }}
                    onBlinkDetected={() => setBlinkDetected(true)}
                    blinkDetected={blinkDetected}
                  />
                  {!selfieImage && (
                    <p className="text-xs text-muted-foreground">
                      Silakan ambil atau upload foto selfie untuk verifikasi
                    </p>
                  )}
                </div>

                {/* Staff and Driver specific fields */}
                {(registerForm.watch("role") === "Staff" ||
                  registerForm.watch("role") === "Staff Traffic" ||
                  registerForm.watch("role") === "Driver Mitra" ||
                  registerForm.watch("role") === "Driver Perusahaan") && (
                  <div className="space-y-4 border p-4 rounded-md w-full">
                    <h3 className="font-medium text-lg text-center md:text-left">
                      {registerForm.watch("role") === "Staff" ||
                      registerForm.watch("role") === "Staff Traffic"
                        ? "Staff Information"
                        : "Driver Information"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name (Nama Depan)</FormLabel>
                            <FormControl>
                              <Input placeholder="First Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name (Nama Belakang)</FormLabel>
                            <FormControl>
                              <Input placeholder="Last Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nickname (Nama Panggilan)</FormLabel>
                          <FormControl>
                            <Input placeholder="Nickname" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="ktpAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>KTP Address (Alamat KTP)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Address as shown on KTP"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="relativePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Relative's Phone Number (Nomor Telepon Kerabat)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                              <Input
                                placeholder="+1234567890"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="ktpNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KTP Number (Nomor KTP)</FormLabel>
                            <FormControl>
                              <Input placeholder="KTP Number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="simNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIM Number (Nomor SIM)</FormLabel>
                            <FormControl>
                              <Input placeholder="SIM Number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="simExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            SIM Expiry Date (Masa Berlaku SIM)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                              <Input type="date" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="simImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ImageUpload
                                label="SIM Photo"
                                onImageCapture={(imageData) => {
                                  registerForm.setValue("simImage", imageData);
                                }}
                                value={field.value}
                                bucketName="drivers"
                                folderPath="sim"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="ktpImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ImageUpload
                                label="KTP Photo"
                                onImageCapture={(imageData) => {
                                  registerForm.setValue("ktpImage", imageData);
                                }}
                                value={field.value}
                                bucketName="drivers"
                                folderPath="ktp"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="kkImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ImageUpload
                                label="KK Photo"
                                onImageCapture={(imageData) => {
                                  registerForm.setValue("kkImage", imageData);
                                }}
                                value={field.value}
                                bucketName="drivers"
                                folderPath="kk"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="skckImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ImageUpload
                                label="SKCK Photo"
                                onImageCapture={(imageData) => {
                                  registerForm.setValue("skckImage", imageData);
                                }}
                                value={field.value}
                                bucketName="drivers"
                                folderPath="skck"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Vehicle Information Section - Only show for Driver Mitra */}
                    {registerForm.watch("role") === "Driver Mitra" &&
                      registerForm.watch("role") !== "Staff" && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <h3 className="font-medium text-lg mb-4 text-center md:text-left">
                            Vehicle Information
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="vehicleName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Vehicle Name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="vehicleType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select vehicle type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Sedan">
                                        Sedan
                                      </SelectItem>
                                      <SelectItem value="SUV">SUV</SelectItem>
                                      <SelectItem value="MPV">MPV</SelectItem>
                                      <SelectItem value="Hatchback">
                                        Hatchback
                                      </SelectItem>
                                      <SelectItem value="Pickup">
                                        Pickup
                                      </SelectItem>
                                      <SelectItem value="Van">Van</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={registerForm.control}
                              name="vehicleBrand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brand</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Toyota, Honda, etc."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="licensePlate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>License Plate</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Car className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                      <Input
                                        placeholder="B 1234 ABC"
                                        className="pl-10"
                                        {...field}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            <FormField
                              control={registerForm.control}
                              name="vehicleYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year</FormLabel>
                                  <FormControl>
                                    <Input placeholder="2023" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="vehicleColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Black, White, etc."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="vehicleStatus"
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2 md:col-span-1">
                                  <FormLabel>Status</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Tersedia">
                                        Available
                                      </SelectItem>
                                      <SelectItem value="Tidak Tersedia">
                                        Not Available
                                      </SelectItem>
                                      <SelectItem value="Dalam Perbaikan">
                                        Under Maintenance
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <h4 className="font-medium text-md mt-6 mb-3 text-center md:text-left">
                            Vehicle Photos
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="vehicleFrontImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="Front View"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "vehicleFrontImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="front"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="vehicleBackImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="Back View"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "vehicleBackImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="back"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={registerForm.control}
                              name="vehicleSideImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="Side View"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "vehicleSideImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="side"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="vehicleInteriorImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="Interior View"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "vehicleInteriorImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="interior"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={registerForm.control}
                              name="stnkImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="STNK Photo"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "stnkImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="documents"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="bpkbImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload
                                      label="BPKB Photo"
                                      onImageCapture={(imageData) => {
                                        registerForm.setValue(
                                          "bpkbImage",
                                          imageData,
                                        );
                                      }}
                                      value={field.value}
                                      bucketName="vehicles"
                                      folderPath="documents"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {registerError && (
                  <div className="text-sm text-destructive mb-2">
                    {registerError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    isSubmitting ||
                    (selfieRequired && !selfieImage)
                  }
                >
                  {isLoading || isSubmitting
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          {activeTab === "login" ? (
            <p>
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab("register")}
              >
                Register
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setActiveTab("login")}
              >
                Login
              </Button>
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AuthForm;
