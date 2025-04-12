import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SelfieCapture from "./SelfieCapture";

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
} from "@/components/ui/form";

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
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

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
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "Customer",
      selfieImage: "",
    },
  });

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
      // Register the user with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              role: data.role,
              phone_number: data.phone,
              has_selfie: !!data.selfieImage,
            },
          },
        },
      );

      if (signUpError) {
        setRegisterError(signUpError.message);
        return;
      }

      if (authData.user) {
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

        // Get role ID from the role name (case insensitive match)
        const { data: roleData, error: roleError } = await supabase
          .from("roles")
          .select("id")
          .ilike("role_name", data.role)
          .single();

        if (roleError) {
          console.error("Error fetching role ID:", roleError);
        }

        const roleId = roleData?.id || null;

        // Update the user record with selfie URL - the trigger will handle creation
        const { error: updateError } = await supabase
          .from("users")
          .update({
            selfie_url: selfieUrl,
            role_id: roleId,
          })
          .eq("id", authData.user.id);

        if (updateError) {
          console.error("Error updating user record:", updateError);
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
        }

        // Store user role in local storage regardless of insert/update result
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userId", authData.user.id);

        // Log success message
        console.log(
          `User registered successfully with role: ${data.role} (ID: ${roleId})`,
        );
      }

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
    <Card className="w-full max-w-md mx-auto bg-card">
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Customer">Customer</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="HRD">HRD</SelectItem>
                          <SelectItem value="Driver">Driver</SelectItem>
                          <SelectItem value="Mechanic">Mechanic</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
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
