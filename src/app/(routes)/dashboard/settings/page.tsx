"use client";

import { useEffect, useState } from "react";

import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Camera, Eye, EyeOff, Loader2, Mail, Shield, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getMerchantData, updateMerchantData } from "@/actions/user-account";
import { ImageUpload } from "@/components/image-upload";

import DeleteAccount from "./components/DeleteAccount";
import { formSchema, passwordFormSchema } from "./constants";
import { type MerchantData } from "@/types/settings";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const nameForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      storeName: "",
    },
  });

  // Fetch merchant data from database
  useEffect(() => {
    if (isLoaded && user) {
      const fetchMerchantData = async () => {
        setIsLoadingUserData(true);
        try {
          const result = await getMerchantData();
          if (result.data) {
            setMerchantData(result.data as unknown as MerchantData);
            nameForm.reset({
              firstname: result.data.firstName || "",
              lastname: result.data.lastName || "",
              storeName: result.data.storeName || "",
            });
          } else {
            toast.error("Failed to load merchant data");
          }
        } catch {
          toast.error("Failed to load merchant data");
        } finally {
          setIsLoadingUserData(false);
        }
      };

      fetchMerchantData();
    }
  }, [isLoaded, user, nameForm]);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const handleNamesSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      const updateData = {
        firstName: values.firstname.trim(),
        lastName: values.lastname.trim(),
        storeName: values.storeName.trim(),
      };

      const result = await updateMerchantData(updateData);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setMerchantData(result.data);
      }

      // Reload user data from Clerk to get updated info
      // Note: Database update already syncs with Clerk via server action
      if (user) {
        try {
          await user.reload();
        } catch {
          // Don't show error to user since database update succeeded
        }
      }

      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message?.includes("Unauthorized")) {
          toast.error("You are not authorized to perform this action.");
        } else if (error.message?.includes("No valid fields")) {
          toast.error("Please provide valid data.");
        } else {
          toast.error("Failed to update profile. Please try again.");
        }
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    try {
      setIsPasswordLoading(true);

      if (!user) {
        throw new Error("User not found");
      }

      await user.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch (error: unknown) {
      const err = error as { errors?: Array<{ code?: string }> };
      if (err.errors && err.errors[0]?.code === "form_password_incorrect") {
        toast.error("Current password is incorrect.");
      } else if (err.errors && err.errors[0]?.code === "form_password_pwned") {
        toast.error(
          "This password has been found in a data breach. Please choose a different password."
        );
      } else if (err.errors && err.errors[0]?.code === "form_password_validation_failed") {
        toast.error("New password does not meet security requirements.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle image upload via Uploadcare
  const handleImageChange = async (imageUrl: string) => {
    if (!user || !imageUrl) return;

    try {
      setIsImageUploading(true);

      // Update in database first
      const result = await updateMerchantData({
        storeImageUrl: imageUrl,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Sync with Clerk using setProfileImage
      // Note: Clerk's user.update() doesn't accept imageUrl directly
      // We'll store the URL in unsafeMetadata for reference
      try {
        await user.update({
          unsafeMetadata: {
            profileImageUrl: imageUrl,
          },
        });
        await user.reload();
      } catch (clerkError) {
        // Log but don't fail - database update succeeded
        console.warn("Failed to sync image with Clerk:", clerkError);
      }

      if (result.data) {
        setMerchantData(result.data);
      }

      toast.success("Profile image updated successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update profile image");
      } else {
        toast.error("Failed to update profile image");
      }
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!user) return;

    try {
      setIsImageUploading(true);

      // Remove from database
      const result = await updateMerchantData({
        storeImageUrl: null,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove from Clerk metadata
      try {
        await user.update({
          unsafeMetadata: {
            profileImageUrl: null,
          },
        });
        await user.reload();
      } catch (clerkError) {
        console.warn("Failed to sync image removal with Clerk:", clerkError);
      }

      if (result.data) {
        setMerchantData(result.data);
      }

      toast.success("Profile image removed successfully!");
    } catch {
      toast.error("Failed to remove profile image");
    } finally {
      setIsImageUploading(false);
    }
  };

  if (!isLoaded || isLoadingUserData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground">
          Manage your account information and security settings.
        </p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>Your account information and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  {merchantData?.email || user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Member Since</Label>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">
                  {merchantData?.createdAt
                    ? new Date(merchantData.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Image
          </CardTitle>
          <CardDescription>Upload a profile image to personalize your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            value={merchantData?.storeImageUrl || undefined}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
            disabled={isImageUploading}
            aspectRatio="square"
          />
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(handleNamesSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={nameForm.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={nameForm.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={nameForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your store name" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={merchantData?.email || user?.primaryEmailAddress?.emailAddress || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-muted-foreground text-xs">
                  Email address cannot be changed here. Please contact support if needed.
                </p>
              </div>
            </CardContent>
            <CardFooter className="mt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security and password</CardDescription>
        </CardHeader>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                          disabled={isPasswordLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          disabled={isPasswordLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-muted-foreground text-xs">
                      Password must be at least 8 characters long and include uppercase, lowercase,
                      and numbers.
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="mt-2">
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
            <div className="space-y-2">
              <h4 className="text-destructive font-medium">Delete Account</h4>
              <p className="text-muted-foreground text-sm">
                Permanently remove your account and all associated data. This action cannot be
                undone.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <DeleteAccount />
        </CardFooter>
      </Card>
    </div>
  );
}
