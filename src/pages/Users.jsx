import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Loader2,
  Search,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Users = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, isAdmin, canCreateUsers } = usePermissions();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await userService.getAll();
      if (response?.status === "success") {
        setUsers(response.data || []);
      }
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

    try {
      const response = await userService.create(formData);
      if (response?.status === "success") {
        setSuccess("User created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      const response = await userService.update(selectedUser.id, updateData);
      if (response?.status === "success") {
        setSuccess("User updated successfully!");
        toast({
          title: "Success",
          description: "User updated successfully!",
          variant: "success",
        });
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await userService.toggleStatus(userId);
      if (response?.status === "success") {
        setSuccess("User status updated successfully!");
        toast({
          title: "Success",
          description: "User status updated successfully!",
          variant: "success",
        });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await userService.delete(userId);
      if (response?.status === "success") {
        setSuccess("User deleted successfully!");
        toast({
          title: "Success",
          description: "User deleted successfully!",
          variant: "success",
        });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ id: user._id });
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: (
        <Badge className="bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/30 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      ),
      admin: (
        <Badge className="bg-[#00B4D8]/10 text-[#00B4D8] border-[#00B4D8]/30 dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] dark:border-[#00B4D8]/40">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      ),
      support_lead: (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Support Lead
        </Badge>
      ),
      "support-lead": (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Support Lead
        </Badge>
      ),
      developer: (
        <Badge className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900/50">
          <Shield className="w-3 h-3 mr-1" />
          Developer
        </Badge>
      ),
      user: (
        <Badge className="bg-secondary text-secondary-foreground border-border">
          <UserIcon className="w-3 h-3 mr-1" />
          User
        </Badge>
      ),
    };
    return badges[role] || badges.user;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="">
        <div className=" px-6 sm:px-8 lg:px-12 py-12">
          {/* Header */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground dark:text-foreground mb-2">
                  User Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
                  Manage user accounts, roles, and permissions
                </p>
              </div>
              {isSuperAdmin && canCreateUsers && (
                <Button
                  onClick={() => {
                    setFormData({ name: "", email: "", password: "", role: "user" });
                    setShowCreateModal(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-10 sm:h-11 px-4 sm:px-6 rounded-lg font-medium transition-colors w-full sm:w-auto flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00B4D8]" />
            </div>
          ) : (
            <div className="border border-border dark:border-border rounded-xl bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground dark:text-muted-foreground">
                          No users found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user._id !== currentUser.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(user._id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {user.isActive ? (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  )}
                                </Button>
                                {isSuperAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(user._id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to log in immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              The user will receive a one-time email link to create their password. The link expires in 24 hours.
            </p>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="support_lead">Support Lead</SelectItem>
                  {isSuperAdmin && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={6}
              />
            </div>
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="support_lead">Support Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Users;

