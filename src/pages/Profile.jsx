import { useState, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  Upload,
  Loader2,
  Camera,
  X,
  Bell,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotificationManager } from "../contexts/NotificationManager";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = () => {
  const { user, checkAuth, updateUser } = useAuth();
  const {
    soundEnabled,
    setSoundEnabled,
    soundPreset,
    setSoundPreset,
    soundPresets,
    previewSound,
  } = useNotificationManager();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("picture", file);

      const response = await userService.uploadProfilePicture(
        user._id,
        formData,
      );

      console.log("[DEBUG] Upload response:", response);

      if (response?.status === "success") {
        setSuccess("Profile picture updated successfully!");
        console.log("[DEBUG] response.data:", response.data);

        if (response.data) {
          const updatedUser = response.data;
          console.log(
            "[DEBUG] updatedUser.profilePicture:",
            updatedUser.profilePicture,
          );

          if (updatedUser.profilePicture) {
            updatedUser.profilePicture = `${updatedUser.profilePicture}?t=${Date.now()}`;
          }
          updateUser(updatedUser);
          console.log("[DEBUG] Called updateUser");
        }

        checkAuth().catch(console.error);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError(response?.message || "Failed to upload profile picture");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload profile picture",
      );
      console.error("Error uploading profile picture:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const response = await userService.update(user._id, {
        profilePicture: null,
        profilePictureCloudinaryId: null,
      });

      if (response?.status === "success") {
        setSuccess("Profile picture removed successfully!");

        // IMMEDIATE LOCAL UPDATE: Clear profile picture locally
        updateUser({ profilePicture: null });

        // Background refresh
        checkAuth().catch(console.error);
      } else {
        setError(response?.message || "Failed to remove profile picture");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to remove profile picture",
      );
      console.error("Error removing profile picture:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="">
        <div className="max-w-4xl px-6 sm:px-8 lg:px-12 py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-foreground mb-2">
              Profile Settings
            </h1>
            <p className="text-base text-muted-foreground dark:text-muted-foreground">
              Manage your account information and profile picture
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Picture Card */}
          <Card className="border border-border dark:border-border rounded-xl bg-card mb-6">
            <CardHeader className="border-b border-border dark:border-border px-6 py-5">
              <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
                Profile Picture
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                Upload or update your profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#00B4D8]/40 dark:border-[#00B4D8]/50 shadow-lg ring-2 ring-[#00B4D8]/20 dark:ring-[#00B4D8]/30">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user?.name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#00B4D8]/20 to-[#00B4D8]/10 dark:from-[#00B4D8]/30 dark:to-[#00B4D8]/20 flex items-center justify-center">
                        <User className="h-12 w-12 text-[#00B4D8]" />
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="profile-picture-upload"
                      disabled={uploading}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Picture"}
                    </Button>
                    {user?.profilePicture && (
                      <Button
                        variant="outline"
                        onClick={handleRemovePicture}
                        disabled={uploading}
                        className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    JPG, PNG or WEBP. Max size 5MB. Recommended: 400x400px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings Card */}
          <Card className="border border-border dark:border-border rounded-xl bg-card mb-6">
            <CardHeader className="border-b border-border dark:border-border px-6 py-5">
              <CardTitle className="text-base font-semibold text-foreground dark:text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-sm font-medium text-foreground cursor-pointer">
                      Notification Sound
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Play sound when receiving notifications
                    </p>
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  aria-label="Toggle notification sound"
                />
              </div>

              {soundEnabled && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Sound Type
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={soundPreset}
                        onValueChange={async (value) => {
                          setSoundPreset(value);
                          // Play preview sound when user selects a new sound
                          // Use requestAnimationFrame to ensure browser has processed the click
                          requestAnimationFrame(async () => {
                            if (previewSound) {
                              console.log("[Profile] Previewing sound:", value);
                              try {
                                await previewSound(value);
                              } catch (error) {
                                console.error(
                                  "[Profile] Error previewing sound:",
                                  error,
                                );
                                // Show user-friendly error
                                setError(
                                  "Could not play sound preview. Please check your browser's audio settings.",
                                );
                                setTimeout(() => setError(""), 3000);
                              }
                            } else {
                              console.warn(
                                "[Profile] previewSound function not available",
                              );
                            }
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select sound" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(soundPresets || {}).map(
                            ([key, preset]) => (
                              <SelectItem key={key} value={key}>
                                {preset.name}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Test the current sound
                          if (previewSound) {
                            console.log(
                              "[Profile] Testing current sound:",
                              soundPreset,
                            );
                            try {
                              await previewSound(soundPreset);
                            } catch (error) {
                              console.error(
                                "[Profile] Error testing sound:",
                                error,
                              );
                            }
                          } else {
                            console.warn(
                              "[Profile] previewSound function not available",
                            );
                          }
                        }}
                        className="flex-shrink-0"
                        title="Test current sound"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred notification sound. The sound will
                      play automatically when you select it. Click the speaker
                      icon to replay.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card className="border border-border dark:border-border rounded-xl bg-card">
            <CardHeader className="border-b border-border dark:border-border px-6 py-5">
              <CardTitle className="text-base font-semibold text-foreground dark:text-foreground">
                Account Information
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                Your profile details and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    value={user?.name || ""}
                    disabled
                    className="h-10 border-border dark:border-border rounded-lg bg-background dark:bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="h-10 border-border dark:border-border rounded-lg bg-background dark:bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Role
                  </Label>
                  <Input
                    value={
                      user?.role === "super_admin"
                        ? "Super Administrator"
                        : user?.role === "admin"
                          ? "Administrator"
                          : "User"
                    }
                    disabled
                    className="h-10 border-border dark:border-border rounded-lg bg-background dark:bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Account Status
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={user?.isActive !== false ? "Active" : "Inactive"}
                      disabled
                      className="h-10 border-border dark:border-border rounded-lg bg-background dark:bg-background"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                      Online
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
