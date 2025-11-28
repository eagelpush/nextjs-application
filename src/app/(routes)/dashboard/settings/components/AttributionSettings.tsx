"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getUserSettings, updateUserSettings } from "@/actions/user-account";
import { type UserSettings } from "@/types/dashboard/settings";

const attributionSchema = z.object({
  attributionModel: z.enum(["impression", "click"]),
});

type AttributionFormData = z.infer<typeof attributionSchema>;

export default function AttributionSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setUserSettings] = useState<UserSettings | null>(null);

  const form = useForm<AttributionFormData>({
    resolver: zodResolver(attributionSchema),
    defaultValues: {
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
            attributionModel: result.data.attributionModel as
              | "impression"
              | "click",
          });
        }
      } catch {
        toast.error("Failed to load attribution settings");
      }
    };

    fetchUserSettings();
  }, [form]);

  const onSubmit = async (data: AttributionFormData) => {
    try {
      setIsLoading(true);
      const result = await updateUserSettings(data);

      if (result.error) {
        throw new Error(result.error);
      }

      setUserSettings(result.data as UserSettings);
      toast.success("Attribution settings updated successfully!");
    } catch {
      toast.error("Failed to update attribution settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Attribution Settings
        </h2>
        <p className="text-muted-foreground">
          Configure how conversions are attributed to your marketing campaigns.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Attribution Model */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attribution Model
              </CardTitle>
              <CardDescription>
                Choose how conversions are attributed to your marketing
                touchpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="attributionModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribution Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attribution model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="impression">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            By Impressions
                          </div>
                        </SelectItem>
                        <SelectItem value="click">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            By Clicks
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg border p-3">
                          <h4 className="mb-2 text-sm font-medium">
                            By Impressions
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            Attributes conversions to the first impression that
                            led to the conversion. This model is useful for
                            brand awareness campaigns and top-of-funnel
                            marketing.
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <h4 className="mb-2 text-sm font-medium">
                            By Clicks
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            Attributes conversions to the last click that led to
                            the conversion. This model is useful for performance
                            marketing and bottom-of-funnel campaigns.
                          </p>
                        </div>
                      </div>
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Attribution Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
