"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Eye, MapPin, Mail, User, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { getUserSettings, updateUserSettings } from "@/actions/user-account";
import { userSettingsSchema } from "../constants";
import { type UserSettings } from "@/types/dashboard/settings";

type PrivacyFormData = z.infer<typeof userSettingsSchema>;

export default function PrivacySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setUserSettings] = useState<UserSettings | null>(null);

  const form = useForm<PrivacyFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      allowSupport: true,
      ipAddressOption: "anonymized",
      enableGeo: true,
      enablePreferences: false,
      emailStoreOption: "full-email",
      locationStoreOption: "yes",
      nameStoreOption: "yes",
      attributionModel: "impression",
    },
  });

  // Fetch user settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const result = await getUserSettings();
        if (result.data) {
          setUserSettings(result.data as UserSettings);
          form.reset({
            allowSupport: result.data.allowSupport,
            ipAddressOption: result.data.ipAddressOption as "anonymized" | "no-ip" | undefined,
            enableGeo: result.data.enableGeo,
            enablePreferences: result.data.enablePreferences,
            emailStoreOption: result.data.emailStoreOption as
              | "full-email"
              | "hash-email"
              | "no-email",
            locationStoreOption: result.data.locationStoreOption as "yes" | "no",
            nameStoreOption: result.data.nameStoreOption as "yes" | "no",
            attributionModel: result.data.attributionModel as "impression" | "click",
            notificationPreferences: result.data.notificationPreferences as unknown,
          });
        }
      } catch {
        toast.error("Failed to load privacy settings");
      }
    };

    fetchUserSettings();
  }, [form]);

  const onSubmit = async (data: PrivacyFormData) => {
    try {
      setIsLoading(true);
      const result = await updateUserSettings(data);

      if (result.error) {
        throw new Error(result.error);
      }

      setUserSettings(result.data as UserSettings);
      toast.success("Privacy settings updated successfully!");
    } catch {
      toast.error("Failed to update privacy settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Manage your privacy preferences and data collection settings.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Support Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Support Access
              </CardTitle>
              <CardDescription>
                Control whether support can access your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="allowSupport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Support Access</FormLabel>
                      <FormDescription>
                        Allow our support team to access your account information to help resolve
                        issues
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* IP Address Handling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                IP Address Privacy
              </CardTitle>
              <CardDescription>Choose how your IP address is handled</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="ipAddressOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>IP Address Handling</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="anonymized" id="anonymized" />
                          <Label htmlFor="anonymized">Anonymized (Recommended)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no-ip" id="no-ip" />
                          <Label htmlFor="no-ip">No IP Address Collection</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Anonymized IP addresses help with analytics while protecting your privacy
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Services
              </CardTitle>
              <CardDescription>Control location-based features and data collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableGeo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Geolocation</FormLabel>
                      <FormDescription>Allow location-based features and analytics</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationStoreOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Location Data Storage</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="location-yes" />
                          <Label htmlFor="location-yes">Store location data</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="location-no" />
                          <Label htmlFor="location-no">Don&apos;t store location data</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Privacy
              </CardTitle>
              <CardDescription>Control how your email address is stored and used</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="emailStoreOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Email Storage Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full-email" id="full-email" />
                          <Label htmlFor="full-email">Store full email address</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hash-email" id="hash-email" />
                          <Label htmlFor="hash-email">Store hashed email address</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no-email" id="no-email" />
                          <Label htmlFor="no-email">Don&apos;t store email address</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Hashing provides privacy while still allowing for analytics
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Name Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Name Privacy
              </CardTitle>
              <CardDescription>Control how your name is stored and displayed</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="nameStoreOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Name Storage</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="name-yes" />
                          <Label htmlFor="name-yes">Store and display name</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="name-no" />
                          <Label htmlFor="name-no">Don&apos;t store name</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Control personalized features and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="enablePreferences"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Personalized Features</FormLabel>
                      <FormDescription>
                        Allow personalized recommendations and features based on your usage
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Privacy Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
