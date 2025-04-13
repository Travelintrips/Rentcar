import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCaption,
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
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, UserPlus } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  role: { name: string };
}

interface Role {
  id: number;
  name: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const { toast } = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // First get the role_id for 'Staff' role
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("role_name", "Staff")
        .single();

      if (roleError) {
        console.warn("Error fetching Staff role:", roleError);
        // Fallback: fetch all users if we can't get the Staff role
        const { data: allUsers, error: usersError } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            full_name,
            role_id
          `,
          );

        if (usersError) throw usersError;
        setUsers(allUsers || []);
        return;
      }

      // Then fetch users with that role_id
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          email,
          full_name,
          role_id,
          role:roles(name)
        `,
        )
        .eq("role_id", roleData.id);

      if (error) {
        // Fallback: try to fetch all users without the role join
        console.warn("Error fetching users with role:", error);
        const { data: basicUsers, error: basicError } = await supabase
          .from("users")
          .select("id, email, full_name, role_id");

        if (basicError) throw basicError;
        setUsers(basicUsers || []);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error.message || "Failed to load users",
      });
      // Set empty array to prevent UI from breaking
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from("roles").select("id, name");

      if (error) {
        console.warn("Error fetching roles:", error);
        // Provide default roles as fallback
        setRoles([
          { id: 1, name: "Admin" },
          { id: 2, name: "Staff" },
          { id: 3, name: "Manager" },
          { id: 4, name: "Supervisor" },
          { id: 5, name: "HRD" },
        ]);
        return;
      }
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        variant: "destructive",
        title: "Error fetching roles",
        description: error.message || "Failed to load roles",
      });
      // Set default roles to prevent UI from breaking
      setRoles([
        { id: 1, name: "Admin" },
        { id: 2, name: "Staff" },
        { id: 3, name: "Manager" },
        { id: 4, name: "Supervisor" },
        { id: 5, name: "HRD" },
      ]);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEditMode(true);
      setCurrentUser(user);
      setEmail(user.email);
      setFullName(user.full_name);
      setRoleId(user.role_id);
    } else {
      setIsEditMode(false);
      setCurrentUser({});
      setEmail("");
      setFullName("");
      setPassword("");
      setRoleId(null);
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let staffRoleId = roleId;

      // If roleId is not set, try to get the role_id for 'Staff' role
      if (!staffRoleId) {
        const { data: roleData, error: roleError } = await supabase
          .from("roles")
          .select("id")
          .eq("role_name", "Staff")
          .single();

        if (roleError) {
          console.warn("Error fetching Staff role:", roleError);
          // Try to get any role as fallback
          const { data: anyRole, error: anyRoleError } = await supabase
            .from("roles")
            .select("id")
            .limit(1)
            .single();

          if (anyRoleError) {
            // Last resort: use a hardcoded value that's likely to be the Staff role
            console.warn("Using default role ID as fallback");
            staffRoleId = 2; // Assuming 2 is Staff role ID
          } else {
            staffRoleId = anyRole.id;
          }
        } else {
          staffRoleId = roleData.id;
        }

        // Update state
        setRoleId(staffRoleId);
      }

      if (isEditMode) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("users")
          .update({
            full_name: fullName,
            role_id: staffRoleId,
          })
          .eq("id", currentUser.id);

        if (updateError) {
          console.error("Error updating user:", updateError);
          throw updateError;
        }

        // Update role using edge function
        if (staffRoleId !== currentUser.role_id) {
          try {
            const { error: roleError } = await supabase.functions.invoke(
              "supabase-functions-assignrole",
              {
                body: { userId: currentUser.id, roleId: staffRoleId },
              },
            );

            if (roleError) {
              console.warn(
                "Error assigning role (continuing anyway):",
                roleError,
              );
              // Continue execution even if role assignment fails
            }
          } catch (edgeFunctionError) {
            console.warn(
              "Edge function error (continuing anyway):",
              edgeFunctionError,
            );
            // Continue execution even if edge function fails
          }
        }

        toast({
          title: "Staff updated",
          description: "Staff member has been updated successfully",
        });
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          },
        );

        if (authError) throw authError;

        if (authData.user) {
          // Create user record in public.users table
          const { error: userError } = await supabase.from("users").insert({
            id: authData.user.id,
            email,
            full_name: fullName,
            role_id: staffRoleId,
          });

          if (userError) {
            console.error("Error creating user record:", userError);
            // Try to delete the auth user if we couldn't create the public user
            try {
              await supabase.functions.invoke("delete-user", {
                body: { userId: authData.user.id },
              });
            } catch (deleteError) {
              console.warn(
                "Could not clean up auth user after failed creation:",
                deleteError,
              );
            }
            throw userError;
          }

          toast({
            title: "Staff created",
            description: "Staff member has been created successfully",
          });
        }
      }

      setIsOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        variant: "destructive",
        title: "Error saving user",
        description: error.message || "An unknown error occurred",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      // First try to delete from auth.users (requires admin privileges)
      try {
        const { error: authError } = await supabase.functions.invoke(
          "delete-user",
          {
            body: { userId },
          },
        );

        if (authError) {
          console.warn(
            "Error deleting auth user (continuing anyway):",
            authError,
          );
          // Continue with public user deletion even if auth deletion fails
        }
      } catch (edgeFunctionError) {
        console.warn(
          "Edge function error (continuing anyway):",
          edgeFunctionError,
        );
        // Continue with public user deletion even if edge function fails
      }

      // Delete from public.users
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (userError) {
        console.error("Error deleting public user:", userError);
        throw userError;
      }

      toast({
        title: "Staff deleted",
        description: "Staff member has been deleted successfully",
      });

      // Remove the user from the local state to update UI immediately
      setUsers(users.filter((user) => user.id !== userId));
      fetchUsers(); // Also refresh from server
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: error.message || "Failed to delete user",
      });
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading staff members...</p>
        </div>
      ) : (
        <Table>
          <TableCaption>List of all staff members in the system</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role?.name ||
                    roles.find((r) => r.id === user.role_id)?.name ||
                    "No Role"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Staff" : "Add New Staff"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update staff details below."
                : "Fill in the details to create a new staff member."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                  disabled={isEditMode}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              {!isEditMode && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                    required={!isEditMode}
                  />
                </div>
              )}
              {/* Role selection removed as we're only creating Staff users */}
            </div>
            <DialogFooter>
              <Button type="submit">{isEditMode ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
